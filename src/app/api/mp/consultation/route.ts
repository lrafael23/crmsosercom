import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/mp/consultation
 * 
 * Crea una preferencia de pago para una consulta telemática única.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, lawyerId, appointmentId, price } = body;

    const accessToken = process.env.MP_ACCESS_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

    if (!accessToken || accessToken === "TEST-REPLACE-WITH-YOUR-ACCESS-TOKEN") {
      return NextResponse.json({ preferenceId: "SIMULATED_CONSULTATION_PREF" });
    }

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            id: "one_off_consultation",
            title: "Conferencia Telemática — Portal 360",
            quantity: 1,
            unit_price: price || 25000,
            currency_id: "CLP",
          },
        ],
        back_urls: {
          success: `${appUrl}/pago/resultado?status=approved&type=consultation&id=${appointmentId}`,
          failure: `${appUrl}/pago/resultado?status=rejected&type=consultation&id=${appointmentId}`,
          pending: `${appUrl}/pago/resultado?status=pending&type=consultation&id=${appointmentId}`,
        },
        auto_return: "approved",
        external_reference: `consultation:${appointmentId}:${userId}`,
        notification_url: `${appUrl}/api/mp/webhook`,
        metadata: {
          appointmentId,
          userId,
          type: "consultation",
        },
      }),
    });

    if (!mpResponse.ok) {
      const err = await mpResponse.json();
      return NextResponse.json({ error: "Error MP", details: err }, { status: 500 });
    }

    const data = await mpResponse.json();
    return NextResponse.json({ preferenceId: data.id });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
