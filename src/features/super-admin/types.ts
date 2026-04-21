export type TenantStatus = "active" | "suspended";
export type UserStatus = "active" | "suspended" | "pending_validation";

export interface TenantRecord {
  id: string;
  name: string;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  plan?: string | null;
  status: TenantStatus;
  clientsCount?: number;
  usersCount?: number;
  casesCount?: number;
  lastActivityAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SupportUserRecord {
  uid: string;
  tenantId?: string | null;
  name?: string | null;
  email: string;
  role: string;
  status: UserStatus;
  validatedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AuditLogRecord {
  id?: string;
  module: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  tenantId?: string | null;
  user_id?: string | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ImpersonationSession {
  id: string;
  superAdminId: string;
  targetUserId: string;
  targetRole: string;
  tenantId?: string | null;
  startedAt: string;
  endedAt?: string | null;
  isActive: boolean;
}

export interface TenantDetailPayload {
  tenant: TenantRecord;
  users: SupportUserRecord[];
  logs: AuditLogRecord[];
}
