import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { assertCanAddConference, incrementMonthlyConferences } from "@/lib/billing";

/**
 * POST /api/appointments/confirm-free
 * 
 * Confirma una cita para un cliente con servicio activo (Gratis).
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, appointmentId } = await request.json();

    if (!tenantId || !appointmentId) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    // 1. Validar cuota
    await assertCanAddConference(tenantId);

    // 2. Incrementar uso
    await incrementMonthlyConferences(tenantId);

    // Nota: El status ya se pone en 'confirmed' en el frontend por 0MVP, 
    // pero aquí validamos que sea legal según el plan.

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[ConfirmFree] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
