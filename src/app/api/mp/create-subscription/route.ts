/**
 * POST /api/mp/create-subscription
 *
 * Crea una preferencia de pago en Mercado Pago para la suscripción mensual.
 * El MP_ACCESS_TOKEN NUNCA sale del servidor.
 *
 * Body: { planId: PlanId, tenantId: string }
 * Response: { preferenceId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { PLANS, type PlanId } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, tenantId } = body as { planId: PlanId; tenantId: string };

    if (!planId || !tenantId) {
      return NextResponse.json(
        { error: "planId y tenantId son requeridos." },
        { status: 400 }
      );
    }

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken || accessToken === "TEST-REPLACE-WITH-YOUR-ACCESS-TOKEN") {
      // En modo desarrollo sin credenciales reales, devolvemos un ID simulado.
      console.warn("[MP] MP_ACCESS_TOKEN no configurado. Usando preferencia simulada.");
      return NextResponse.json({ preferenceId: "SIMULATED_PREFERENCE_ID" });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

    // Crear preferencia en Mercado Pago
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            id: plan.id,
            title: `Portal 360 — Plan ${plan.name}`,
            description: plan.tagline,
            quantity: 1,
            unit_price: plan.priceCLP,
            currency_id: "CLP",
          },
        ],
        back_urls: {
          success: `${appUrl}/pago/resultado?status=approved&plan=${planId}&tenant=${tenantId}`,
          failure: `${appUrl}/pago/resultado?status=rejected&plan=${planId}&tenant=${tenantId}`,
          pending: `${appUrl}/pago/resultado?status=pending&plan=${planId}&tenant=${tenantId}`,
        },
        auto_return: "approved",
        external_reference: `subscription:${tenantId}:${planId}`,
        notification_url: `${appUrl}/api/mp/webhook`,
        metadata: {
          tenantId,
          planId,
          type: "subscription",
        },
      }),
    });

    if (!mpResponse.ok) {
      const mpError = await mpResponse.json();
      console.error("[MP] Error creando preferencia:", mpError);
      return NextResponse.json(
        { error: "Error al crear la preferencia en Mercado Pago." },
        { status: 500 }
      );
    }

    const mpData = await mpResponse.json();

    return NextResponse.json({ preferenceId: mpData.id });
  } catch (error) {
    console.error("[MP] Error en create-subscription:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
