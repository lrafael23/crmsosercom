import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase/client";

export type AuditAction = 
  | "LOGIN" 
  | "LOGOUT" 
  | "CREATE_CLIENT" 
  | "UPDATE_CLIENT" 
  | "DELETE_CLIENT" 
  | "UPLOAD_DOCUMENT" 
  | "VIEW_DOCUMENT" 
  | "IMPERSONATION_START" 
  | "IMPERSONATION_STOP"
  | "TICKET_CREATED"
  | "TICKET_RESOLVED";

export interface AuditLog {
  action: AuditAction;
  performedBy: string; // userId
  performedByEmail: string;
  targetId?: string; // e.g. companyId or documentId
  details: string;
  metadata?: Record<string, any>;
  timestamp: any;
}

export async function logAction(
  userId: string, 
  email: string, 
  action: AuditAction, 
  details: string, 
  targetId?: string,
  metadata?: Record<string, any>
) {
  try {
    await addDoc(collection(db, "audit_logs"), {
      action,
      performedBy: userId,
      performedByEmail: email,
      details,
      targetId,
      metadata,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
}
