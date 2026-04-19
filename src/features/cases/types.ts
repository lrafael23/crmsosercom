export type CaseStatus =
  | "active"
  | "pending"
  | "in_progress"
  | "waiting_client"
  | "hearing"
  | "closed"
  | "archived";

export type CaseStage =
  | "intake"
  | "analysis"
  | "documents"
  | "drafting"
  | "filing"
  | "hearing"
  | "resolution"
  | "closed";

export type TimelineType =
  | "ingreso"
  | "documentos"
  | "redaccion"
  | "presentacion"
  | "audiencia"
  | "reunion"
  | "plazo"
  | "cobro"
  | "cierre"
  | "observacion";

export interface CaseRecord {
  id: string;
  tenantId: string;
  companyId?: string | null;
  clientId: string;
  clientName: string;
  title: string;
  category: string;
  type: string;
  description: string;
  status: CaseStatus;
  stage: CaseStage;
  assignedTo: string;
  assignedToName: string;
  priority?: "low" | "medium" | "high" | "critical";
  openedAt: string;
  updatedAt: string;
  nextDeadline?: string | null;
  pendingBalance?: number;
  visibleToClient: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy?: string | null;
  autosaveVersion?: number;
  lastAutosavedAt?: string | null;
}

export interface TimelineEventRecord {
  id: string;
  caseId: string;
  tenantId: string;
  clientId?: string | null;
  title: string;
  description: string;
  type: TimelineType;
  eventDate: string;
  visibleToClient: boolean;
  createdBy: string;
  createdByName?: string | null;
  assignedTo?: string | null;
  linkedAgendaEventId?: string | null;
  linkedDocumentId?: string | null;
  linkedBillingId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaseDraftRecord {
  id: string;
  caseId: string;
  tenantId: string;
  draftType: "case_form";
  payload: Partial<CaseRecord>;
  createdBy: string;
  updatedAt: string;
}

export const CASE_STATUS_OPTIONS: Array<{ value: CaseStatus; label: string }> = [
  { value: "active", label: "Activa" },
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En proceso" },
  { value: "waiting_client", label: "Esperando cliente" },
  { value: "hearing", label: "Audiencia" },
  { value: "closed", label: "Cerrada" },
  { value: "archived", label: "Archivada" },
];

export const CASE_STAGE_OPTIONS: Array<{ value: CaseStage; label: string }> = [
  { value: "intake", label: "Ingreso" },
  { value: "analysis", label: "Analisis" },
  { value: "documents", label: "Documentos" },
  { value: "drafting", label: "Redaccion" },
  { value: "filing", label: "Presentacion" },
  { value: "hearing", label: "Audiencia" },
  { value: "resolution", label: "Resolucion" },
  { value: "closed", label: "Cierre" },
];
