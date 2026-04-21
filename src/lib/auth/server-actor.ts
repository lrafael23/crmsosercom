import { NextRequest } from "next/server";
import { firestoreFetch, fromFirestoreFields, requireFirebaseUser } from "@/lib/firebase/rest-server";
import { IMPERSONATION_COOKIE_NAME, parseImpersonationSession } from "@/lib/auth/impersonation";

export interface RequestActor {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
  status: string;
  tenantId: string | null;
  token: string;
  isImpersonating: boolean;
  realUid: string;
  realRole: string;
  realTenantId: string | null;
  impersonationSessionId: string | null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown, fallback: string | null = null): string | null {
  return typeof value === "string" ? value : fallback;
}

async function readUser(uid: string, token: string) {
  const userDoc = await firestoreFetch(`users/${encodeURIComponent(uid)}`, token).catch(() => null);
  if (!userDoc?.fields) return null;
  const data = fromFirestoreFields(userDoc.fields);
  return {
    uid,
    email: asNullableString(data.email),
    displayName: asNullableString(data.displayName, asString(data.email, uid)),
    role: asString(data.role, ""),
    status: asString(data.status, "pending_validation") || "pending_validation",
    tenantId: asNullableString(data.tenantId),
  };
}

async function readImpersonationSession(sessionId: string, token: string) {
  const sessionDoc = await firestoreFetch(`impersonation_sessions/${encodeURIComponent(sessionId)}`, token).catch(() => null);
  return sessionDoc?.fields ? fromFirestoreFields(sessionDoc.fields) : null;
}

export async function resolveRequestActor(req: NextRequest, options?: { allowImpersonation?: boolean }) {
  const authUser = await requireFirebaseUser(req);
  if (!authUser) return null;

  const realUser = await readUser(authUser.uid, authUser.token);
  if (!realUser) return null;

  const allowImpersonation = options?.allowImpersonation !== false;
  const actor: RequestActor = {
    uid: realUser.uid,
    email: realUser.email,
    displayName: realUser.displayName,
    role: realUser.role,
    status: realUser.status,
    tenantId: realUser.tenantId,
    token: authUser.token,
    isImpersonating: false,
    realUid: realUser.uid,
    realRole: realUser.role,
    realTenantId: realUser.tenantId,
    impersonationSessionId: null,
  };

  if (!allowImpersonation || realUser.role !== "super_admin_global") {
    return actor;
  }

  const raw = req.cookies.get(IMPERSONATION_COOKIE_NAME)?.value;
  const stored = parseImpersonationSession(raw);
  if (!stored?.sessionId || !stored.targetUserId) return actor;

  const session = await readImpersonationSession(stored.sessionId, authUser.token);
  if (
    !session ||
    session.isActive !== true ||
    session.superAdminId !== realUser.uid ||
    session.targetUserId !== stored.targetUserId
  ) {
    return actor;
  }

  const targetUser = await readUser(stored.targetUserId, authUser.token);
  if (!targetUser) return actor;

  return {
    uid: targetUser.uid,
    email: targetUser.email,
    displayName: targetUser.displayName,
    role: targetUser.role,
    status: targetUser.status,
    tenantId: targetUser.tenantId,
    token: authUser.token,
    isImpersonating: true,
    realUid: realUser.uid,
    realRole: realUser.role,
    realTenantId: realUser.tenantId,
    impersonationSessionId: stored.sessionId,
  };
}

export async function requireSuperAdminActor(req: NextRequest) {
  const actor = await resolveRequestActor(req, { allowImpersonation: false });
  if (!actor || actor.role !== "super_admin_global") return null;
  return actor;
}
