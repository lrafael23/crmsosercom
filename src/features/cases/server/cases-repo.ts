import { randomUUID } from "crypto";

import type { CaseRecord, TimelineEventRecord } from "@/features/cases/types";
import { createDocument, firestoreFetch, fromFirestoreFields, patchDocument, runQuery } from "@/lib/firebase/rest-server";

const CASES = "cases";
const TIMELINE = "case_timeline_events";
const AUDIT = "audit_logs";
const AGENDA = "agenda_events";

function nowIso() {
  return new Date().toISOString();
}

function asCase(row: Record<string, unknown>): CaseRecord {
  const now = nowIso();
  return {
    id: String(row.id || ""),
    tenantId: String(row.tenantId || ""),
    companyId: typeof row.companyId === "string" ? row.companyId : null,
    clientId: String(row.clientId || ""),
    clientName: String(row.clientName || "Cliente"),
    title: String(row.title || "Causa sin titulo"),
    category: String(row.category || "General"),
    type: String(row.type || row.category || "General"),
    procedure: String(row.procedure || row.type || "Procedimiento general"),
    description: String(row.description || ""),
    status: (row.status as CaseRecord["status"]) || "active",
    stage: (row.stage as CaseRecord["stage"]) || "intake",
    assignedTo: String(row.assignedTo || ""),
    assignedToName: String(row.assignedToName || "Sin asignar"),
    lastAction: typeof row.lastAction === "string" ? row.lastAction : null,
    pendingBalance: typeof row.pendingBalance === "number" ? row.pendingBalance : 0,
    trackedMinutes: typeof row.trackedMinutes === "number" ? row.trackedMinutes : 0,
    priority: (row.priority as CaseRecord["priority"]) || "medium",
    openedAt: String(row.openedAt || row.createdAt || now),
    updatedAt: String(row.updatedAt || now),
    nextDeadline: typeof row.nextDeadline === "string" ? row.nextDeadline : null,
    visibleToClient: row.visibleToClient !== false,
    createdBy: String(row.createdBy || ""),
    createdAt: String(row.createdAt || now),
    updatedBy: typeof row.updatedBy === "string" ? row.updatedBy : null,
    autosaveVersion: typeof row.autosaveVersion === "number" ? row.autosaveVersion : 1,
    lastAutosavedAt: typeof row.lastAutosavedAt === "string" ? row.lastAutosavedAt : null,
  };
}

function asTimeline(row: Record<string, unknown>): TimelineEventRecord {
  const now = nowIso();
  return {
    id: String(row.id || ""),
    caseId: String(row.caseId || ""),
    tenantId: String(row.tenantId || ""),
    clientId: typeof row.clientId === "string" ? row.clientId : null,
    title: String(row.title || "Hito"),
    description: String(row.description || ""),
    type: (row.type as TimelineEventRecord["type"]) || "observacion",
    eventDate: String(row.eventDate || now),
    visibleToClient: Boolean(row.visibleToClient),
    createdBy: String(row.createdBy || ""),
    createdByName: typeof row.createdByName === "string" ? row.createdByName : null,
    assignedTo: typeof row.assignedTo === "string" ? row.assignedTo : null,
    linkedAgendaEventId: typeof row.linkedAgendaEventId === "string" ? row.linkedAgendaEventId : null,
    linkedDocumentId: typeof row.linkedDocumentId === "string" ? row.linkedDocumentId : null,
    linkedBillingId: typeof row.linkedBillingId === "string" ? row.linkedBillingId : null,
    createdAt: String(row.createdAt || now),
    updatedAt: String(row.updatedAt || now),
  };
}

async function audit(token: string, data: Record<string, unknown>) {
  await createDocument(AUDIT, randomUUID(), { id: randomUUID(), timestamp: nowIso(), ...data }, token).catch((error) => {
    console.warn("[cases-repo] audit skipped", error);
  });
}

export async function listCasesByTenant(params: { tenantId: string; assignedTo?: string; status?: string; stage?: string; search?: string; token: string }) {
  const filters: Array<{ field: string; value: unknown }> = [{ field: "tenantId", value: params.tenantId }];
  if (params.assignedTo) filters.push({ field: "assignedTo", value: params.assignedTo });
  if (params.status) filters.push({ field: "status", value: params.status });
  if (params.stage) filters.push({ field: "stage", value: params.stage });

  let rows = (await runQuery(CASES, filters, params.token)).map(asCase);
  if (params.search?.trim()) {
    const q = params.search.toLowerCase();
    rows = rows.filter((r) => [r.title, r.clientName, r.category, r.type, r.procedure, r.assignedToName].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
  }
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listCasesByClient(params: { clientId: string; token: string }) {
  const rows = (await runQuery(CASES, [{ field: "clientId", value: params.clientId }], params.token)).map(asCase);
  return rows.filter((row) => row.visibleToClient).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getCaseDetail(caseId: string, tenantId: string, token: string) {
  const raw = await firestoreFetch(`${CASES}/${encodeURIComponent(caseId)}`, token);
  if (!raw?.fields) return null;
  const data = asCase({ id: caseId, ...fromFirestoreFields(raw.fields) });
  if (data.tenantId !== tenantId) return null;

  const timeline = (await runQuery(TIMELINE, [{ field: "caseId", value: caseId }, { field: "tenantId", value: tenantId }], token))
    .map(asTimeline)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  return { case: data, timeline };
}

export async function createCase(input: Omit<CaseRecord, "id" | "createdAt" | "updatedAt" | "openedAt">, token: string) {
  const id = randomUUID();
  const now = nowIso();
  const record: CaseRecord = { ...input, id, openedAt: now, createdAt: now, updatedAt: now, autosaveVersion: 1, lastAutosavedAt: now };
  const timelineId = randomUUID();
  const initialTimeline: TimelineEventRecord = {
    id: timelineId,
    caseId: id,
    tenantId: record.tenantId,
    clientId: record.clientId,
    title: "Ingreso de causa",
    description: "Se creo la causa y quedo vinculada al cliente y responsable principal.",
    type: "ingreso",
    eventDate: now,
    visibleToClient: true,
    createdBy: record.createdBy,
    createdByName: record.assignedToName,
    assignedTo: record.assignedTo,
    createdAt: now,
    updatedAt: now,
  };

  await createDocument(CASES, id, { ...record }, token);
  await createDocument(TIMELINE, timelineId, { ...initialTimeline }, token);
  await audit(token, { module: "cases", action_type: "create_case", entity_type: "case", entity_id: id, tenantId: record.tenantId, user_id: record.createdBy });
  return { record, initialTimeline };
}

export async function updateCase(caseId: string, tenantId: string, patch: Partial<CaseRecord>, actorId: string, token: string) {
  const current = await getCaseDetail(caseId, tenantId, token);
  if (!current) throw new Error("Case not found");
  const now = nowIso();
  const next: Partial<CaseRecord> = {
    ...patch,
    updatedAt: now,
    updatedBy: actorId,
    autosaveVersion: (current.case.autosaveVersion ?? 0) + 1,
    lastAutosavedAt: now,
  };
  await patchDocument(CASES, caseId, next as Record<string, unknown>, token);
  await audit(token, { module: "cases", action_type: "update_case", entity_type: "case", entity_id: caseId, tenantId, user_id: actorId, old_value: current.case, new_value: next });
  return true;
}

export async function addTimelineEvent(input: Omit<TimelineEventRecord, "id" | "createdAt" | "updatedAt">, token: string) {
  const id = randomUUID();
  const now = nowIso();
  const record: TimelineEventRecord = { ...input, id, createdAt: now, updatedAt: now };
  await createDocument(TIMELINE, id, { ...record }, token);
  await audit(token, { module: "cases", action_type: "create_timeline_event", entity_type: "case_timeline_event", entity_id: id, tenantId: record.tenantId, user_id: record.createdBy });
  return record;
}

export async function createAgendaEventFromCase(params: {
  tenantId: string;
  caseId: string;
  clientId?: string | null;
  clientName?: string | null;
  companyId?: string | null;
  createdBy: string;
  assignedTo: string;
  assignedToName: string;
  title: string;
  description: string;
  type: "audiencia" | "videollamada" | "tarea" | "plazo" | "cobro" | "recordatorio_cliente" | "reunion_interna";
  date: string;
  startAt: string;
  endAt?: string;
  status?: string;
  priority?: string;
  location?: string | null;
  meetingUrl?: string | null;
  notifyClient?: boolean;
  notifyAssignee?: boolean;
  linkedBillingId?: string | null;
  linkedDeadlineId?: string | null;
  token: string;
}) {
  const id = randomUUID();
  const now = nowIso();
  const agendaEvent = {
    id,
    tenantId: params.tenantId,
    companyId: params.companyId ?? null,
    caseId: params.caseId,
    clientId: params.clientId ?? null,
    clientName: params.clientName ?? null,
    clientEmail: null,
    createdBy: params.createdBy,
    assignedTo: params.assignedTo,
    assignedToName: params.assignedToName,
    assignedToEmail: null,
    title: params.title,
    description: params.description,
    type: params.type,
    status: params.status ?? "pendiente",
    priority: params.priority ?? (params.type === "audiencia" || params.type === "plazo" ? "alta" : "media"),
    day: params.date,
    date: params.date,
    startAt: params.startAt,
    endAt: params.endAt ?? params.startAt,
    timezone: "America/Santiago",
    location: params.location ?? null,
    meetingUrl: params.meetingUrl ?? (params.type === "videollamada" || params.type === "reunion_interna" ? process.env.NEXT_PUBLIC_DEFAULT_MEET_LINK || "https://meet.google.com/nyz-vuxh-xmu" : null),
    notifyClient: params.notifyClient ?? true,
    notifyAssignee: params.notifyAssignee ?? true,
    emailNotificationStatus: "pending",
    reminderAt: null,
    linkedBillingId: params.linkedBillingId ?? (params.type === "cobro" ? params.caseId : null),
    linkedDeadlineId: params.linkedDeadlineId ?? (params.type === "plazo" ? params.caseId : null),
    linkedWorkflowStepId: null,
    createdAt: now,
    updatedAt: now,
  };
  await createDocument(AGENDA, id, agendaEvent, params.token);
  return agendaEvent;
}

export async function importCasesBulk(records: Array<Omit<CaseRecord, "id" | "createdAt" | "updatedAt" | "openedAt">>, token: string) {
  let imported = 0;
  for (const item of records) {
    await createCase(item, token);
    imported += 1;
  }
  return imported;
}
