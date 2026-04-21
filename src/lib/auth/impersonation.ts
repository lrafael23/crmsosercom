export const IMPERSONATION_COOKIE_NAME = "portal360-impersonation";
export const IMPERSONATION_STORAGE_KEY = "portal360-impersonation";

export interface StoredImpersonationSession {
  sessionId: string;
  targetUserId: string;
  targetRole: string;
  tenantId?: string | null;
}

export function serializeImpersonationSession(value: StoredImpersonationSession) {
  return encodeURIComponent(JSON.stringify(value));
}

export function parseImpersonationSession(raw: string | null | undefined): StoredImpersonationSession | null {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as StoredImpersonationSession;
  } catch {
    return null;
  }
}
