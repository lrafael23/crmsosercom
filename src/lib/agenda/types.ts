import type { AppUser, UserRole } from "@/lib/auth/AuthContext";

export const AGENDA_EVENT_TYPES = [
  "audiencia",
  "videollamada",
  "tarea",
  "plazo",
  "cobro",
  "tramite",
  "reunion_interna",
  "recordatorio_cliente",
] as const;

export const AGENDA_EVENT_STATUSES = [
  "pendiente",
  "en_proceso",
  "cumplido",
  "critico",
  "cancelado",
  "reprogramado",
] as const;

export const AGENDA_PRIORITIES = ["baja", "media", "alta", "critica"] as const;

export type AgendaEventType = (typeof AGENDA_EVENT_TYPES)[number];
export type AgendaEventStatus = (typeof AGENDA_EVENT_STATUSES)[number];
export type AgendaPriority = (typeof AGENDA_PRIORITIES)[number];

export interface AgendaEvent {
  id: string;
  tenantId: string | null;
  companyId?: string | null;
  caseId?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  createdBy: string;
  assignedTo: string;
  assignedToName: string;
  assignedToEmail?: string | null;
  title: string;
  description: string;
  type: AgendaEventType;
  status: AgendaEventStatus;
  priority: AgendaPriority;
  day: string;
  date: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  location?: string | null;
  meetingUrl?: string | null;
  notifyClient: boolean;
  notifyAssignee: boolean;
  emailNotificationStatus: "pending" | "queued" | "sent" | "failed" | "skipped";
  reminderAt?: Date | null;
  linkedBillingId?: string | null;
  linkedDeadlineId?: string | null;
  linkedWorkflowStepId?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AgendaEventFormData {
  id?: string;
  tenantId: string | null;
  companyId?: string | null;
  caseId?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  assignedTo: string;
  assignedToName: string;
  assignedToEmail?: string | null;
  title: string;
  description: string;
  type: AgendaEventType;
  status: AgendaEventStatus;
  priority: AgendaPriority;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  location?: string;
  meetingUrl?: string;
  notifyClient: boolean;
  notifyAssignee: boolean;
  reminderAt?: string;
  linkedBillingId?: string;
  linkedDeadlineId?: string;
  linkedWorkflowStepId?: string;
}

export interface AgendaPerson {
  id: string;
  displayName: string;
  email?: string | null;
  role?: UserRole | string;
  tenantId?: string | null;
}

export interface AgendaClient {
  id: string;
  name: string;
  email?: string | null;
  tenantId?: string | null;
}

export interface LawyerAvailability {
  lawyerId: string;
  tenantId: string;
  weeklyAvailability: Record<string, Array<{ start: string; end: string }>>;
  bufferMinutes: number;
  blockedDates: string[];
  meetingQuota: number | null;
  updatedAt?: unknown;
}

export function canManageAgendaEvent(user: AppUser | null, event?: Pick<AgendaEvent, "tenantId" | "assignedTo" | "createdBy" | "clientId">) {
  if (!user) return false;
  if (user.role === "super_admin_global" || user.role === "admin") return true;
  if (user.role === "owner_firm") return !event || event.tenantId === user.tenantId;
  if (["abogado", "contador", "tributario", "staff"].includes(user.role)) {
    if (!event) return true;
    return event.tenantId === user.tenantId && (event.assignedTo === user.uid || event.createdBy === user.uid);
  }
  return false;
}

export function canCreateAgendaEvent(user: AppUser | null) {
  if (!user) return false;
  return ["super_admin_global", "admin", "owner_firm", "abogado", "contador", "tributario", "staff"].includes(user.role);
}

export function canClientCreateAgendaEvent(user: AppUser | null) {
  return !!user && (user.role === "cliente_final" || user.role === "cliente");
}

export function visibleAgendaScope(user: AppUser | null) {
  if (!user) return "none";
  if (user.role === "super_admin_global" || user.role === "admin") return "global";
  if (user.role === "cliente_final" || user.role === "cliente") return "client";
  return "tenant";
}

export const agendaTypeMeta: Record<AgendaEventType, { label: string; pill: string; block: string; dot: string }> = {
  audiencia: { label: "Audiencia", pill: "bg-rose-50 text-rose-700 border-rose-200", block: "bg-rose-50 border-rose-200 text-rose-800", dot: "bg-rose-500" },
  videollamada: { label: "Videollamada", pill: "bg-blue-50 text-blue-700 border-blue-200", block: "bg-blue-50 border-blue-200 text-blue-800", dot: "bg-blue-500" },
  tarea: { label: "Tarea", pill: "bg-slate-100 text-slate-700 border-slate-200", block: "bg-slate-100 border-slate-200 text-slate-800", dot: "bg-slate-500" },
  plazo: { label: "Plazo", pill: "bg-amber-50 text-amber-700 border-amber-200", block: "bg-amber-50 border-amber-200 text-amber-800", dot: "bg-amber-500" },
  cobro: { label: "Cobro", pill: "bg-emerald-50 text-emerald-700 border-emerald-200", block: "bg-emerald-50 border-emerald-200 text-emerald-800", dot: "bg-emerald-500" },
  tramite: { label: "Tramite", pill: "bg-violet-50 text-violet-700 border-violet-200", block: "bg-violet-50 border-violet-200 text-violet-800", dot: "bg-violet-500" },
  reunion_interna: { label: "Reunion interna", pill: "bg-cyan-50 text-cyan-700 border-cyan-200", block: "bg-cyan-50 border-cyan-200 text-cyan-800", dot: "bg-cyan-500" },
  recordatorio_cliente: { label: "Recordatorio cliente", pill: "bg-indigo-50 text-indigo-700 border-indigo-200", block: "bg-indigo-50 border-indigo-200 text-indigo-800", dot: "bg-indigo-500" },
};

export function getNextStatus(status: AgendaEventStatus): AgendaEventStatus {
  if (status === "pendiente") return "en_proceso";
  if (status === "en_proceso") return "cumplido";
  return status;
}
