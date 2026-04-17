import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDocREST, setFirestoreDocREST } from "@/lib/firebase/rest";
import { PLANS, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";

/**
 * POST /api/appointments/confirm-free
 *
 * Confirma una cita incluida en el plan activo del tenant.
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, appointmentId } = await request.json();

    if (!tenantId || !appointmentId) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const usage = await getFirestoreDocREST<{
      tenantId: string;
      planId: PlanId;
      activeCases?: number;
      activeSeats?: number;
      extraSeats?: number;
      monthlyConferences?: number;
    }>("tenant_plan_usage", tenantId);

    if (!usage?.planId || !PLANS[usage.planId]) {
      return NextResponse.json({ error: "Tenant sin plan inicializado" }, { status: 403 });
    }

    const current = Number(usage.monthlyConferences ?? 0);
    const max = PLANS[usage.planId].maxMonthlyConferences;

    if (max !== null && current >= max) {
      return NextResponse.json(
        { error: `Limite de conferencias mensuales alcanzado (${max}).` },
        { status: 403 }
      );
    }

    await setFirestoreDocREST("tenant_plan_usage", tenantId, {
      ...usage,
      monthlyConferences: current + 1,
      updatedAt: new Date().toISOString(),
    });

    await setFirestoreDocREST("appointments", appointmentId, {
      status: "confirmed",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ConfirmFree] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
