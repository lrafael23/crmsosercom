/**
 * Portal 360 — Lógica de Billing y Límites de Plan
 *
 * Centraliza toda la lógica de:
 * - Verificar límites (causas, seats)
 * - Registrar eventos de facturación (billing_events)
 * - Actualizar uso del plan (tenant_plan_usage)
 */

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { canAddCase, canAddSeat, type PlanId, PLANS } from "@/lib/plans";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type SubscriptionStatus =
  | "pending"
  | "authorized"
  | "active"
  | "paused"
  | "cancelled"
  | "past_due"
  | "rejected";

export type PaymentStatus =
  | "pending"
  | "approved"
  | "in_process"
  | "rejected"
  | "refunded"
  | "cancelled";

export type PaymentType =
  | "consulta"
  | "honorario"
  | "cuota"
  | "suscripcion"
  | "seat_extra"
  | "otro";

export interface TenantPlanUsage {
  tenantId: string;
  planId: PlanId;
  activeCases: number;
  activeSeats: number;
  extraSeats: number;
  monthlyConferences: number;
  updatedAt: unknown; // Firestore Timestamp
}

export interface BillingEvent {
  type: "subscription" | "payment" | "refund" | "credit";
  tenantId: string;
  clientId?: string;
  caseId?: string;
  amountCLP: number;
  currency: string;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  mpPaymentId?: string;
  mpSubscriptionId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: unknown; // Firestore Timestamp
}

// ─── Uso del Plan ─────────────────────────────────────────────────────────────

/**
 * Obtiene el uso actual del plan de un tenant.
 */
export async function getTenantPlanUsage(tenantId: string): Promise<TenantPlanUsage | null> {
  const ref = doc(collection(db, "tenant_plan_usage"), tenantId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as TenantPlanUsage;
}

/**
 * Inicializa el uso del plan para un tenant nuevo.
 */
export async function initTenantPlanUsage(tenantId: string, planId: PlanId): Promise<void> {
  const ref = doc(collection(db, "tenant_plan_usage"), tenantId);
  await setDoc(ref, {
    tenantId,
    planId,
    activeCases: 0,
    activeSeats: 1, // El owner_firm cuenta como 1
    extraSeats: 0,
    monthlyConferences: 0,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Verifica si el tenant puede agregar una causa activa más.
 * Lanza un error si no puede.
 */
export async function assertCanAddCase(tenantId: string): Promise<void> {
  const usage = await getTenantPlanUsage(tenantId);
  if (!usage) throw new Error("Tenant sin plan inicializado");

  const allowed = canAddCase(usage.planId, usage.activeCases);
  if (!allowed) {
    throw new Error(
      `Límite del plan ${usage.planId} alcanzado: máximo ${usage.activeCases} causas activas. Sube de plan para continuar.`
    );
  }
}

/**
 * Verifica si el tenant puede agregar un seat más.
 * En Plan Premium, retorna el costo extra si aplica.
 */
export async function assertCanAddSeat(
  tenantId: string
): Promise<{ isExtra: boolean; extraCostCLP: number }> {
  const usage = await getTenantPlanUsage(tenantId);
  if (!usage) throw new Error("Tenant sin plan inicializado");

  const result = canAddSeat(usage.planId, usage.activeSeats);
  if (!result.allowed) {
    throw new Error(
      `Límite de usuarios del plan ${usage.planId} alcanzado. Sube de plan para agregar más miembros.`
    );
  }
  return { isExtra: result.isExtra, extraCostCLP: result.extraCostCLP };
}

/**
 * Verifica si el tenant puede agregar una conferencia mensual más.
 */
export async function assertCanAddConference(tenantId: string): Promise<void> {
  const usage = await getTenantPlanUsage(tenantId);
  if (!usage) throw new Error("Tenant sin plan inicializado");

  const plan = PLANS[usage.planId];
  if (plan.maxMonthlyConferences === null) return; // Ilimitado

  if (usage.monthlyConferences >= plan.maxMonthlyConferences) {
    throw new Error(
      `Límite de conferencias mensuales alcanzado (${plan.maxMonthlyConferences}). Sube de plan para permitir más agendamientos.`
    );
  }
}

/**
 * Incrementa el contador de conferencias mensuales.
 */
export async function incrementMonthlyConferences(tenantId: string): Promise<void> {
  const ref = doc(collection(db, "tenant_plan_usage"), tenantId);
  await updateDoc(ref, {
    monthlyConferences: increment(1),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Incrementa el contador de causas activas.
 */
export async function incrementActiveCases(tenantId: string): Promise<void> {
  const ref = doc(collection(db, "tenant_plan_usage"), tenantId);
  await updateDoc(ref, {
    activeCases: increment(1),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Decrementa el contador de causas activas (cuando se cierra o archiva una).
 */
export async function decrementActiveCases(tenantId: string): Promise<void> {
  const ref = doc(collection(db, "tenant_plan_usage"), tenantId);
  await updateDoc(ref, {
    activeCases: increment(-1),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Incrementa el contador de seats activos.
 */
export async function incrementActiveSeats(tenantId: string, isExtra: boolean): Promise<void> {
  const ref = doc(collection(db, "tenant_plan_usage"), tenantId);
  await updateDoc(ref, {
    activeSeats: increment(1),
    extraSeats: isExtra ? increment(1) : increment(0),
    updatedAt: serverTimestamp(),
  });
}

// ─── Billing Events ──────────────────────────────────────────────────────────

/**
 * Registra un evento de facturación en Firestore.
 * Toda transacción (suscripción, pago único, devolución) debe registrarse aquí.
 */
export async function recordBillingEvent(
  event: Omit<BillingEvent, "createdAt">
): Promise<string> {
  const ref = collection(db, "billing_events");
  const docRef = await addDoc(ref, {
    ...event,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ─── Activación de Tenant ────────────────────────────────────────────────────

/**
 * Activa un tenant tras una suscripción aprobada.
 * Esta función SOLO debe llamarse desde el webhook de Mercado Pago.
 */
export async function activateTenant(
  tenantId: string,
  subscriptionData: {
    mpPreapprovalId: string;
    planId: PlanId;
    nextBillingDate: string;
    payerEmail: string;
  }
): Promise<void> {
  const tenantRef = doc(collection(db, "tenants"), tenantId);
  await updateDoc(tenantRef, {
    subscriptionStatus: "active",
    mpPreapprovalId: subscriptionData.mpPreapprovalId,
    planId: subscriptionData.planId,
    nextBillingDate: subscriptionData.nextBillingDate,
    payerEmail: subscriptionData.payerEmail,
    activatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Inicializar uso del plan
  await initTenantPlanUsage(tenantId, subscriptionData.planId);
}

/**
 * Pausa un tenant (suscripción pausada).
 */
export async function pauseTenant(tenantId: string): Promise<void> {
  const ref = doc(db, "tenants", tenantId);
  await updateDoc(ref, {
    subscriptionStatus: "paused",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Cancela un tenant.
 */
export async function cancelTenant(tenantId: string): Promise<void> {
  const ref = doc(db, "tenants", tenantId);
  await updateDoc(ref, {
    subscriptionStatus: "cancelled",
    updatedAt: serverTimestamp(),
  });
}
