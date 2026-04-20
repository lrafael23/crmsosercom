import type { CaseRecord, TimelineEventRecord } from "@/features/cases/types";

export interface ClientAgendaEvent {
  id: string;
  tenantId: string;
  caseId?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  title: string;
  description?: string;
  type: string;
  status: string;
  date?: string;
  startAt?: string;
  endAt?: string | null;
  assignedToName?: string | null;
  meetingUrl?: string | null;
  location?: string | null;
  visibleToClient?: boolean;
  notifyClient?: boolean;
}

export interface ClientDocumentRecord {
  id: string;
  caseId?: string | null;
  clientId?: string | null;
  tenantId: string;
  title: string;
  category?: string;
  visibleToClient?: boolean;
  fileUrl?: string | null;
  createdAt?: string;
}

export interface ClientPaymentOrder {
  id: string;
  tenantId: string;
  caseId?: string | null;
  clientId?: string | null;
  title: string;
  amount: number;
  status: string;
  dueDate?: string | null;
  createdAt?: string;
}

export interface ClientCaseSummary {
  casesCount: number;
  upcomingEventsCount: number;
  pendingPaymentsAmount: number;
  pendingPaymentsCount: number;
}

export interface ClientCaseDetailPayload {
  case: CaseRecord;
  timeline: TimelineEventRecord[];
  agenda: ClientAgendaEvent[];
  documents: ClientDocumentRecord[];
  payments: ClientPaymentOrder[];
}
