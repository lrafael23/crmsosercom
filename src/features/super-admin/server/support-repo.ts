import { randomUUID } from "crypto";
import type {
  AuditLogRecord,
  ImpersonationSession,
  SupportUserRecord,
  TenantDetailPayload,
  TenantRecord,
  TenantStatus,
  UserStatus,
} from "@/features/super-admin/types";
import { createDocument, firestoreFetch, fromFirestoreFields, patchDocument, runQuery, upsertDocument } from "@/lib/firebase/rest-server";

const TENANTS = "tenants";
const USERS = "users";
const AUDIT = "audit_logs";
const IMPERSONATION = "impersonation_sessions";
const CASES = "cases";
const CLIENTS = "clients";

function nowIso() {
  return new Date().toISOString();
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asTenant(row: Record<string, unknown>): TenantRecord {
  return {
    id: asString(row.id),
    name: asString(row.name, asString(row.nombreEstudio, `Tenant ${asString(row.id, "sin-id")}`)),
    ownerId: typeof row.ownerId === "string" ? row.ownerId : typeof row.ownerUid === "string" ? row.ownerUid : null,
    ownerName: typeof row.ownerName === "string" ? row.ownerName : typeof row.ownerNombre === "string" ? row.ownerNombre : null,
    ownerEmail: typeof row.ownerEmail === "string" ? row.ownerEmail : null,
    plan: typeof row.plan === "string" ? row.plan : typeof row.planId === "string" ? row.planId : null,
    status: row.status === "suspended" ? "suspended" : "active",
    clientsCount: typeof row.clientsCount === "number" ? row.clientsCount : 0,
    usersCount: typeof row.usersCount === "number" ? row.usersCount : 0,
    casesCount: typeof row.casesCount === "number" ? row.casesCount : 0,
    lastActivityAt: typeof row.lastActivityAt === "string" ? row.lastActivityAt : null,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : null,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : null,
  };
}

function asSupportUser(row: Record<string, unknown>): SupportUserRecord {
  return {
    uid: asString(row.id),
    tenantId: typeof row.tenantId === "string" ? row.tenantId : null,
    name: typeof row.displayName === "string" ? row.displayName : typeof row.name === "string" ? row.name : null,
    email: asString(row.email, "sin-email"),
    role: asString(row.role, "staff"),
    status:
      row.status === "suspended" || row.status === "pending_validation"
        ? (row.status as UserStatus)
        : "active",
    validatedBy: typeof row.validatedBy === "string" ? row.validatedBy : null,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : null,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : null,
  };
}

function asAudit(row: Record<string, unknown>): AuditLogRecord {
  return {
    id: asString(row.id),
    module: asString(row.module, "system"),
    action_type: asString(row.action_type, asString(row.actionType, "unknown")),
    entity_type: asString(row.entity_type, asString(row.entityType, "entity")),
    entity_id: asString(row.entity_id, asString(row.entityId, "n/a")),
    tenantId: typeof row.tenantId === "string" ? row.tenantId : null,
    user_id: typeof row.user_id === "string" ? row.user_id : typeof row.userId === "string" ? row.userId : null,
    timestamp: asString(row.timestamp, nowIso()),
    metadata: typeof row.metadata === "object" && row.metadata ? (row.metadata as Record<string, unknown>) : undefined,
  };
}

async function listAll(collectionName: string, token: string) {
  return runQuery(collectionName, [], token).catch(() => []);
}

async function readTenant(tenantId: string, token: string) {
  const raw = await firestoreFetch(`${TENANTS}/${encodeURIComponent(tenantId)}`, token).catch(() => null);
  return raw?.fields ? asTenant({ id: tenantId, ...fromFirestoreFields(raw.fields) }) : null;
}

async function readUser(uid: string, token: string) {
  const raw = await firestoreFetch(`${USERS}/${encodeURIComponent(uid)}`, token).catch(() => null);
  return raw?.fields ? asSupportUser({ id: uid, ...fromFirestoreFields(raw.fields) }) : null;
}

function deriveTenantsFromUsers(userRows: SupportUserRecord[]) {
  const byTenant = new Map<string, TenantRecord>();
  for (const user of userRows) {
    if (!user.tenantId) continue;
    const current = byTenant.get(user.tenantId);
    if (!current) {
      byTenant.set(user.tenantId, {
        id: user.tenantId,
        name: user.tenantId,
        ownerId: user.role === "owner_firm" ? user.uid : null,
        ownerName: user.role === "owner_firm" ? user.name : null,
        ownerEmail: user.role === "owner_firm" ? user.email : null,
        plan: null,
        status: "active",
        clientsCount: 0,
        usersCount: 0,
        casesCount: 0,
        lastActivityAt: null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
      continue;
    }
    if (user.role === "owner_firm" && !current.ownerId) {
      current.ownerId = user.uid;
      current.ownerName = user.name;
      current.ownerEmail = user.email;
    }
  }
  return Array.from(byTenant.values());
}

export async function listTenants(token: string, search?: string, status?: TenantStatus) {
  const [tenantRows, userRowsRaw, clientRows, caseRows, auditRows] = await Promise.all([
    status ? runQuery(TENANTS, [{ field: "status", value: status }], token).catch(() => []) : listAll(TENANTS, token),
    listAll(USERS, token),
    listAll(CLIENTS, token),
    listAll(CASES, token),
    listAll(AUDIT, token),
  ]);

  const users = userRowsRaw.map(asSupportUser);
  const tenants = (tenantRows.length ? tenantRows.map(asTenant) : deriveTenantsFromUsers(users)).map((tenant) => ({ ...tenant }));
  const tenantMap = new Map(tenants.map((tenant) => [tenant.id, tenant]));

  for (const tenant of deriveTenantsFromUsers(users)) {
    if (!tenantMap.has(tenant.id)) tenantMap.set(tenant.id, tenant);
  }

  const audit = auditRows.map(asAudit);
  const clientCountByTenant = new Map<string, number>();
  const caseCountByTenant = new Map<string, number>();
  const userCountByTenant = new Map<string, number>();
  const lastActivityByTenant = new Map<string, string>();

  for (const user of users) {
    if (!user.tenantId) continue;
    userCountByTenant.set(user.tenantId, (userCountByTenant.get(user.tenantId) || 0) + 1);
  }
  for (const row of clientRows) {
    const tenantId = typeof (row as Record<string, unknown>).tenantId === "string" ? String((row as Record<string, unknown>).tenantId) : "";
    if (!tenantId) continue;
    clientCountByTenant.set(tenantId, (clientCountByTenant.get(tenantId) || 0) + 1);
  }
  for (const row of caseRows) {
    const tenantId = typeof (row as Record<string, unknown>).tenantId === "string" ? String((row as Record<string, unknown>).tenantId) : "";
    if (!tenantId) continue;
    caseCountByTenant.set(tenantId, (caseCountByTenant.get(tenantId) || 0) + 1);
  }
  for (const log of audit) {
    if (!log.tenantId) continue;
    const current = lastActivityByTenant.get(log.tenantId);
    if (!current || log.timestamp > current) lastActivityByTenant.set(log.tenantId, log.timestamp);
  }

  let rows = Array.from(tenantMap.values()).map((tenant) => ({
    ...tenant,
    usersCount: userCountByTenant.get(tenant.id) || 0,
    clientsCount: clientCountByTenant.get(tenant.id) || 0,
    casesCount: caseCountByTenant.get(tenant.id) || 0,
    lastActivityAt: lastActivityByTenant.get(tenant.id) || tenant.lastActivityAt || null,
  }));

  if (status) rows = rows.filter((row) => row.status === status);
  if (search?.trim()) {
    const q = search.toLowerCase();
    rows = rows.filter((row) =>
      [row.name, row.ownerName, row.ownerEmail, row.plan]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }

  return rows.sort((a, b) => `${b.lastActivityAt || b.updatedAt || ""}`.localeCompare(`${a.lastActivityAt || a.updatedAt || ""}`));
}

export async function getTenantDetail(token: string, tenantId: string): Promise<TenantDetailPayload | null> {
  const tenant = await readTenant(tenantId, token);
  const [usersRaw, logsRaw, clientsRaw, casesRaw] = await Promise.all([
    runQuery(USERS, [{ field: "tenantId", value: tenantId }], token).catch(() => []),
    runQuery(AUDIT, [{ field: "tenantId", value: tenantId }], token).catch(() => []),
    runQuery(CLIENTS, [{ field: "tenantId", value: tenantId }], token).catch(() => []),
    runQuery(CASES, [{ field: "tenantId", value: tenantId }], token).catch(() => []),
  ]);

  const users = usersRaw.map(asSupportUser).sort((a, b) => `${a.name || a.email}`.localeCompare(`${b.name || b.email}`));
  const logs = logsRaw.map(asAudit).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20);

  const fallbackTenant = tenant || deriveTenantsFromUsers(users)[0];
  if (!fallbackTenant) return null;

  return {
    tenant: {
      ...fallbackTenant,
      usersCount: users.length,
      clientsCount: clientsRaw.length,
      casesCount: casesRaw.length,
      lastActivityAt: logs[0]?.timestamp || fallbackTenant.lastActivityAt || null,
    },
    users,
    logs,
  };
}

async function writeAudit(token: string, data: Omit<AuditLogRecord, "id" | "timestamp"> & { timestamp?: string }) {
  const id = randomUUID();
  await createDocument(AUDIT, id, { id, timestamp: data.timestamp || nowIso(), ...data }, token);
}

export async function updateTenantStatus(token: string, tenantId: string, status: TenantStatus, actorId: string) {
  const current = await readTenant(tenantId, token);
  const now = nowIso();

  await upsertDocument(TENANTS, tenantId, {
    id: tenantId,
    name: current?.name || tenantId,
    ownerId: current?.ownerId || null,
    ownerName: current?.ownerName || null,
    ownerEmail: current?.ownerEmail || null,
    plan: current?.plan || null,
    status,
    createdAt: current?.createdAt || now,
    updatedAt: now,
  }, token);

  await writeAudit(token, {
    module: "super_admin",
    action_type: "update_tenant_status",
    entity_type: "tenant",
    entity_id: tenantId,
    tenantId,
    user_id: actorId,
    metadata: { status },
  });
}

export async function updateUserStatus(token: string, uid: string, status: UserStatus, actorId: string) {
  const current = await readUser(uid, token);
  if (!current) throw new Error("User not found");
  const now = nowIso();

  await patchDocument(USERS, uid, {
    status,
    validatedBy: status === "active" ? actorId : current.validatedBy,
    updatedAt: now,
  }, token);

  await writeAudit(token, {
    module: "super_admin",
    action_type: "update_user_status",
    entity_type: "user",
    entity_id: uid,
    tenantId: current.tenantId || null,
    user_id: actorId,
    metadata: { status, targetRole: current.role },
  });
}

export async function startImpersonation(token: string, params: {
  superAdminId: string;
  targetUserId: string;
}) {
  const targetUser = await readUser(params.targetUserId, token);
  if (!targetUser) throw new Error("Target user not found");

  const now = nowIso();
  const id = randomUUID();
  const session: ImpersonationSession = {
    id,
    superAdminId: params.superAdminId,
    targetUserId: targetUser.uid,
    targetRole: targetUser.role,
    tenantId: targetUser.tenantId || null,
    startedAt: now,
    endedAt: null,
    isActive: true,
  };

  await createDocument(IMPERSONATION, id, session as unknown as Record<string, unknown>, token);
  await writeAudit(token, {
    module: "super_admin",
    action_type: "start_impersonation",
    entity_type: "impersonation_session",
    entity_id: id,
    tenantId: targetUser.tenantId || null,
    user_id: params.superAdminId,
    metadata: { targetUserId: targetUser.uid, targetRole: targetUser.role },
  });

  return { session, targetUser };
}

export async function endImpersonation(token: string, sessionId: string, actorId: string) {
  const now = nowIso();
  await patchDocument(IMPERSONATION, sessionId, { isActive: false, endedAt: now }, token);
  await writeAudit(token, {
    module: "super_admin",
    action_type: "end_impersonation",
    entity_type: "impersonation_session",
    entity_id: sessionId,
    user_id: actorId,
    metadata: {},
  });
}
