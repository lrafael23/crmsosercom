export type AppointmentStatus = "pending_payment" | "confirmed" | "cancelled" | "completed" | "no_show";

export interface TimeRange {
  start: string;
  end: string;
}

export interface DayAvailability {
  enabled: boolean;
  slots: TimeRange[];
}

export type WeeklyAvailability = Record<string, DayAvailability>;

export interface BlockedSlot {
  date: string;
  start: string;
  end?: string | null;
}

export interface LawyerSettingsRecord {
  id: string;
  lawyerId: string;
  lawyerName?: string | null;
  tenantId: string;
  weeklyAvailability: WeeklyAvailability;
  availability?: WeeklyAvailability;
  blockedDates: string[];
  blockedSlots: BlockedSlot[];
  slotDurationMinutes: number;
  bufferMinutes: number;
  monthlyConferenceLimit?: number | null;
  meetingUrl?: string | null;
  updatedAt?: string;
}

export interface AppointmentRecord {
  id: string;
  tenantId: string;
  lawyerId: string;
  lawyerName: string;
  clientId: string;
  clientName: string;
  caseId?: string | null;
  title: string;
  description?: string | null;
  start: string;
  end: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  type: string;
  source: string;
  meetingUrl: string;
  agendaEventId?: string | null;
  createdAt: string;
  updatedAt: string;
  visibleToClient: boolean;
  visibleToFirm: boolean;
}

export interface AppointmentSlot {
  time: string;
  start: string;
  end: string;
  available: boolean;
}
