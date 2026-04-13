import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AppUser } from "@/lib/auth/AuthContext";

export async function logAuditAction(
  user: AppUser | null,
  actionType: "LOGIN" | "CREATE" | "UPDATE" | "DELETE" | "IMPERSONATE",
  entityType: string,
  entityId: string,
  details: Record<string, unknown>
) {
  if (!user) return;

  try {
    await addDoc(collection(db, "audit_logs"), {
      userId: user.uid,
      userRole: user.role,
      companyId: user.companyId || null,
      actionType,
      entityType,
      entityId,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error writing audit log:", error);
  }
}
