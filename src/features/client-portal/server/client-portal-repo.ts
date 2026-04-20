import type { CaseRecord, TimelineEventRecord } from "@/features/cases/types";
import type {
  ClientAgendaEvent,
  ClientCaseDetailPayload,
  ClientDocumentRecord,
  ClientPaymentOrder,
  ClientCaseSummary,
} from "@/features/client-portal/types";
import { firestoreFetch, fromFirestoreFields, runQuery } from "@/lib/firebase/rest-server";

const CASES = "cases";
const TIMELINE = "case_timeline_events";
const AGENDA = "agenda_events";
const DOCUMENTS = "case_documents";
const PAYMENTS = "payment_orders";

function nowIso() {
  return new Date().toISOString();
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asCase(row: Record<string, unknown>): CaseRecord {
  const now = nowIso();
  return {
    id: asString(row.id),
    tenantId: asString(row.tenantId),
    companyId: typeof row.companyId === "string" ? row.companyId : null,
    clientId: asString(row.clientId),
    clientName: asString(row.clientName, "Cliente"),
    title: asString(row.title, "Causa sin titulo"),
    category: asString(row.category, "General"),
    type: asString(row.type, "General"),
    procedure: asString(row.procedure, asString(row.type, "Procedimiento general")),
    description: asString(row.description),
    status: (row.status as CaseRecord["status"]) || "active",
    stage: (row.stage as CaseRecord["stage"]) || "intake",
    assignedTo: asString(row.assignedTo),
    assignedToName: asString(row.assignedToName, "Sin asignar"),
    lastAction: typeof row.lastAction === "string" ? row.lastAction : null,
    pendingBalance: asNumber(row.pendingBalance),
    trackedMinutes: asNumber(row.trackedMinutes),
    priority: (row.priority as CaseRecord["priority"]) || "medium",
    openedAt: asString(row.openedAt, asString(row.createdAt, now)),
    updatedAt: asString(row.updatedAt, now),
    nextDeadline: typeof row.nextDeadline === "string" ? row.nextDeadline : null,
    visibleToClient: row.visibleToClient === true,
    createdBy: asString(row.createdBy),
    createdAt: asString(row.createdAt, now),
    updatedBy: typeof row.updatedBy === "string" ? row.updatedBy : null,
    autosaveVersion: asNumber(row.autosaveVersion, 1),
    lastAutosavedAt: typeof row.lastAutosavedAt === "string" ? row.lastAutosavedAt : null,
  };
}

function asTimeline(row: Record<string, unknown>): TimelineEventRecord {
  const now = nowIso();
  return {
    id: asString(row.id),
    caseId: asString(row.caseId),
    tenantId: asString(row.tenantId),
    clientId: typeof row.clientId === "string" ? row.clientId : null,
    title: asString(row.title, "Hito"),
    description: asString(row.description),
    type: (row.type as TimelineEventRecord["type"]) || "observacion",
    eventDate: asString(row.eventDate, now),
    visibleToClient: row.visibleToClient === true,
    createdBy: asString(row.createdBy),
    createdByName: typeof row.createdByName === "string" ? row.createdByName : null,
    assignedTo: typeof row.assignedTo === "string" ? row.assignedTo : null,
    linkedAgendaEventId: typeof row.linkedAgendaEventId === "string" ? row.linkedAgendaEventId : null,
    linkedDocumentId: typeof row.linkedDocumentId === "string" ? row.linkedDocumentId : null,
    linkedBillingId: typeof row.linkedBillingId === "string" ? row.linkedBillingId : null,
    createdAt: asString(row.createdAt, now),
    updatedAt: asString(row.updatedAt, now),
  };
}

function asAgenda(row: Record<string, unknown>): ClientAgendaEvent {
  return {
    id: asString(row.id),
    tenantId: asString(row.tenantId),
    caseId: typeof row.caseId === "string" ? row.caseId : null,
    clientId: typeof row.clientId === "string" ? row.clientId : null,
    clientName: typeof row.clientName === "string" ? row.clientName : null,
    title: asString(row.title, "Evento"),
    description: asString(row.description),
    type: asString(row.type, "tarea"),
    status: asString(row.status, "pendiente"),
    date: typeof row.date === "string" ? row.date : typeof row.day === "string" ? row.day : undefined,
    startAt: typeof row.startAt === "string" ? row.startAt : undefined,
    endAt: typeof row.endAt === "string" ? row.endAt : null,
    assignedToName: typeof row.assignedToName === "string" ? row.assignedToName : null,
    meetingUrl: typeof row.meetingUrl === "string" ? row.meetingUrl : null,
    location: typeof row.location === "string" ? row.location : null,
    visibleToClient: row.visibleToClient !== false,
    notifyClient: row.notifyClient === true,
  };
}

function asDocument(row: Record<string, unknown>): ClientDocumentRecord {
  return {
    id: asString(row.id),
    tenantId: asString(row.tenantId),
    caseId: typeof row.caseId === "string" ? row.caseId : null,
    clientId: typeof row.clientId === "string" ? row.clientId : null,
    title: asString(row.title, asString(row.name, "Documento")),
    category: typeof row.category === "string" ? row.category : typeof row.type === "string" ? row.type : "Documento",
    visibleToClient: row.visibleToClient !== false,
    fileUrl:
      typeof row.fileUrl === "string"
        ? row.fileUrl
        : typeof row.webViewLink === "string"
          ? row.webViewLink
          : typeof row.webContentLink === "string"
            ? row.webContentLink
            : null,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : undefined,
  };
}

function asPayment(row: Record<string, unknown>): ClientPaymentOrder {
  return {
    id: asString(row.id),
    tenantId: asString(row.tenantId),
    caseId: typeof row.caseId === "string" ? row.caseId : null,
    clientId: typeof row.clientId === "string" ? row.clientId : null,
    title: asString(row.title, "Pago pendiente"),
    amount: asNumber(row.amount, asNumber(row.amountCLP)),
    status: asString(row.status, "pending"),
    dueDate: typeof row.dueDate === "string" ? row.dueDate : null,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : undefined,
  };
}

function matchesSearch(row: CaseRecord, search?: string) {
  if (!search?.trim()) return true;
  const q = search.toLowerCase();
  return [row.title, row.category, row.type, row.procedure, row.description, row.assignedToName]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

function isPendingPayment(payment: ClientPaymentOrder) {
  return !["paid", "approved", "cancelled", "canceled", "cancelado", "pagado"].includes(payment.status.toLowerCase());
}

function sortAgenda(a: ClientAgendaEvent, b: ClientAgendaEvent) {
  return `${a.date ?? ""}${a.startAt ?? ""}`.localeCompare(`${b.date ?? ""}${b.startAt ?? ""}`);
}

export async function listClientCases(params: {
  clientId: string;
  token: string;
  search?: string;
  status?: string;
}) {
  let rows = (await runQuery(CASES, [{ field: "clientId", value: params.clientId }, { field: "visibleToClient", value: true }], params.token))
    .map(asCase)
    .filter((row) => row.visibleToClient);

  if (params.status?.trim()) rows = rows.filter((row) => row.status === params.status);
  rows = rows.filter((row) => matchesSearch(row, params.search));

  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getClientCaseSummary(params: { clientId: string; token: string }): Promise<ClientCaseSummary> {
  const [cases, agendaRows, paymentRows] = await Promise.all([
    listClientCases({ clientId: params.clientId, token: params.token }),
    runQuery(AGENDA, [{ field: "clientId", value: params.clientId }, { field: "notifyClient", value: true }], params.token),
    runQuery(PAYMENTS, [{ field: "clientId", value: params.clientId }], params.token),
  ]);

  const agenda = agendaRows.map(asAgenda).filter((row) => row.visibleToClient !== false && row.notifyClient === true);
  const payments = paymentRows.map(asPayment).filter(isPendingPayment);

  return {
    casesCount: cases.length,
    upcomingEventsCount: agenda.length,
    pendingPaymentsAmount: payments.reduce((acc, payment) => acc + payment.amount, 0),
    pendingPaymentsCount: payments.length,
  };
}

export async function getClientCaseDetail(params: {
  clientId: string;
  caseId: string;
  token: string;
}): Promise<ClientCaseDetailPayload | null> {
  const raw = await firestoreFetch(`${CASES}/${encodeURIComponent(params.caseId)}`, params.token).catch(() => null);
  if (!raw?.fields) return null;

  const caseData = asCase({ id: params.caseId, ...fromFirestoreFields(raw.fields) });
  if (caseData.clientId !== params.clientId || caseData.visibleToClient !== true) return null;

  const [timelineRows, agendaRows, documentRows, paymentRows] = await Promise.all([
    runQuery(TIMELINE, [{ field: "clientId", value: params.clientId }, { field: "visibleToClient", value: true }], params.token),
    runQuery(AGENDA, [{ field: "clientId", value: params.clientId }, { field: "notifyClient", value: true }], params.token),
    runQuery(DOCUMENTS, [{ field: "clientId", value: params.clientId }, { field: "visibleToClient", value: true }], params.token),
    runQuery(PAYMENTS, [{ field: "clientId", value: params.clientId }], params.token),
  ]);

  const timeline = timelineRows
    .map(asTimeline)
    .filter((row) => row.caseId === params.caseId && row.tenantId === caseData.tenantId && row.visibleToClient)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  const agenda = agendaRows
    .map(asAgenda)
    .filter((row) => row.caseId === params.caseId && row.tenantId === caseData.tenantId && row.notifyClient === true && row.visibleToClient !== false)
    .sort(sortAgenda);

  const documents = documentRows
    .map(asDocument)
    .filter((row) => row.caseId === params.caseId && row.tenantId === caseData.tenantId && row.visibleToClient !== false)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const payments = paymentRows
    .map(asPayment)
    .filter((row) => row.caseId === params.caseId && row.tenantId === caseData.tenantId && isPendingPayment(row))
    .sort((a, b) => (a.dueDate ?? a.createdAt ?? "").localeCompare(b.dueDate ?? b.createdAt ?? ""));

  return { case: caseData, timeline, agenda, documents, payments };
}
