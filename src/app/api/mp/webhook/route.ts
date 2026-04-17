/**
 * POST /api/mp/webhook
 *
 * Recibe las notificaciones de Mercado Pago y actualiza Firestore
 * usando la REST API de Firestore con autenticación por service account.
 *
 * NOTA DE ARQUITECTURA:
 * Se usa la Firestore REST API en lugar del firebase-admin SDK para
 * evitar problemas de symlinks en entornos Windows durante el build
 * de Firebase Web Frameworks.
 *
 * Para que funcione en producción (Cloud Run), usa las credenciales
 * de Application Default Credentials (ADC) vía metadata server de GCP.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

export const runtime = "nodejs";

// ─── Firestore REST API Helper ─────────────────────────────────────────────────

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "sosercom-cb383";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * Obtiene un token de acceso para la Firestore REST API.
 * En Cloud Run, usa el metadata server de GCP (ADC).
 * En desarrollo local, puede fallar si no hay credenciales configuradas.
 */
async function getAccessToken(): Promise<string | null> {
  try {
    // En Cloud Run / Firebase Hosting Functions
    const res = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      { headers: { "Metadata-Flavor": "Google" }, signal: AbortSignal.timeout(3000) }
    );
    if (res.ok) {
      const data = (await res.json()) as { access_token: string };
      return data.access_token;
    }
  } catch {
    // No estamos en un entorno GCP
  }

  // Fallback: usar el service account key si está disponible
  // En producción, configura GOOGLE_APPLICATION_CREDENTIALS
  return null;
}

/**
 * Convierte un valor JS a formato Firestore Value object.
 */
function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === "object") {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

/**
 * Crea o actualiza un documento en Firestore via REST API.
 */
async function firestorePatch(
  collection: string,
  docId: string,
  data: Record<string, unknown>,
  token: string | null
): Promise<boolean> {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    // SERVER_TIMESTAMP no se puede enviar via REST del mismo modo
    if (v === "SERVER_TIMESTAMP") {
      // Lo omitimos — usaremos un timestamp real
      fields[k] = toFirestoreValue(new Date().toISOString());
    } else {
      fields[k] = toFirestoreValue(v);
    }
  }

  const updateMask = Object.keys(data)
    .map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`)
    .join("&");
  const url = `${FIRESTORE_BASE}/${collection}/${docId}${updateMask ? `?${updateMask}` : ""}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields }),
  });

  return res.ok;
}

/**
 * Agrega un documento a una colección (usando un ID autogenerado).
 * Firestore REST API no tiene un endpoint de "add" directo,
 * así que usamos POST con el ID del documento como UUID.
 */
async function firestoreAdd(
  collection: string,
  data: Record<string, unknown>,
  token: string | null
): Promise<boolean> {
  const docId = crypto.randomUUID();
  return firestorePatch(collection, docId, data, token);
}

// ─── Tipos de eventos de MP ───────────────────────────────────────────────────

interface MpNotification {
  type: string;
  data: { id: string };
  external_reference?: string;
  metadata?: Record<string, string>;
}

function verifyMercadoPagoSignature(request: NextRequest, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret || secret.includes("REPLACE") || secret.includes("YOUR")) return true;

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  if (!xSignature || !xRequestId || !dataId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, value] = part.trim().split("=");
      return [key, value];
    })
  );

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(v1, "hex");

    return (
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer)
    );
  } catch {
    return false;
  }
}

// ─── Procesadores ─────────────────────────────────────────────────────────────

async function processPaymentEvent(paymentId: string, token: string | null) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) return;

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return;

  const payment = await res.json() as {
    status: string;
    status_detail: string;
    transaction_amount: number;
    currency_id: string;
    external_reference: string | null;
    metadata?: Record<string, string>;
    payer?: { email: string };
    description?: string;
  };

  const externalRef = payment.external_reference;
  const metadata = payment.metadata ?? {};
  const tenantId = metadata.tenantId ?? null;

  // Log en billing_events
  await firestoreAdd("billing_events", {
    type: "payment",
    tenantId,
    amountCLP: payment.transaction_amount,
    currency: payment.currency_id,
    paymentType: metadata.paymentType ?? "otro",
    paymentStatus: payment.status,
    mpPaymentId: paymentId,
    description: `Pago ${payment.status}: ${payment.description ?? paymentId}`,
    createdAt: "SERVER_TIMESTAMP",
  }, token);

  // Activar tenant si es pago aprobado de suscripción
  if (payment.status === "approved" && tenantId && externalRef?.startsWith("subscription:")) {
    const parts = externalRef.split(":");
    const planId = parts[2] ?? null;

    await firestorePatch("tenants", tenantId, {
      subscriptionStatus: "active",
      planId,
      activatedAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP",
    }, token);

    await firestorePatch("tenant_plan_usage", tenantId, {
      tenantId,
      planId,
      activeCases: 0,
      activeSeats: 1,
      extraSeats: 0,
      updatedAt: "SERVER_TIMESTAMP",
    }, token);

    await firestoreAdd("audit_logs", {
      action: "tenant_activated",
      entityType: "tenant",
      entityId: tenantId,
      details: { trigger: "payment_approved", mpPaymentId: paymentId, planId },
      createdAt: "SERVER_TIMESTAMP",
    }, token);
  }

  // Confirmar Cita si es pago de consulta
  if (payment.status === "approved" && metadata.type === "consultation" && metadata.appointmentId) {
    await firestorePatch("appointments", metadata.appointmentId, {
      status: "confirmed",
      updatedAt: "SERVER_TIMESTAMP",
      mpPaymentId: paymentId
    }, token);

    await firestoreAdd("audit_logs", {
      action: "appointment_confirmed_payment",
      entityType: "appointment",
      entityId: metadata.appointmentId,
      details: { mpPaymentId: paymentId },
      createdAt: "SERVER_TIMESTAMP",
    }, token);
  }
}

async function processSubscriptionEvent(subscriptionId: string, token: string | null) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) return;

  const res = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return;

  const sub = await res.json() as {
    status: string;
    external_reference?: string;
    next_payment_date?: string;
  };

  const externalRef = sub.external_reference ?? "";
  const tenantId = externalRef.split(":")?.[1] ?? null;
  const planId = externalRef.split(":")?.[2] ?? null;

  if (!tenantId) return;

  const statusMap: Record<string, string> = {
    authorized: "active",
    paused: "paused",
    cancelled: "cancelled",
    pending: "pending",
  };
  const internalStatus = statusMap[sub.status] ?? sub.status;

  await firestorePatch("tenants", tenantId, {
    subscriptionStatus: internalStatus,
    mpPreapprovalId: subscriptionId,
    planId,
    nextBillingDate: sub.next_payment_date ?? null,
    updatedAt: "SERVER_TIMESTAMP",
  }, token);

  await firestoreAdd("subscription_events", {
    mpPreapprovalId: subscriptionId,
    tenantId,
    planId,
    event: sub.status,
    internalStatus,
    createdAt: "SERVER_TIMESTAMP",
  }, token);

  await firestoreAdd("billing_events", {
    type: "subscription",
    tenantId,
    amountCLP: 0,
    currency: "CLP",
    paymentType: "suscripcion",
    paymentStatus: internalStatus,
    mpSubscriptionId: subscriptionId,
    description: `Suscripción ${sub.status}: Plan ${planId}`,
    createdAt: "SERVER_TIMESTAMP",
  }, token);

  if (internalStatus === "active") {
    await firestorePatch("tenant_plan_usage", tenantId, {
      tenantId,
      planId,
      activeCases: 0,
      activeSeats: 1,
      extraSeats: 0,
      updatedAt: "SERVER_TIMESTAMP",
    }, token);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    let notification: MpNotification;

    try {
      notification = JSON.parse(body) as MpNotification;
    } catch {
      return NextResponse.json({ error: "Body inválido." }, { status: 400 });
    }

    const { type, data } = notification;

    if (!type || !data?.id) {
      return NextResponse.json({ received: true });
    }

    if (!verifyMercadoPagoSignature(request, data.id)) {
      return NextResponse.json({ error: "Firma invalida." }, { status: 401 });
    }

    // Procesamiento asíncrono sin bloquear la respuesta
    const token = await getAccessToken();

    setImmediate(async () => {
      try {
        if (type === "payment") {
          await processPaymentEvent(data.id, token);
        } else if (type === "subscription_preapproval") {
          await processSubscriptionEvent(data.id, token);
        }
      } catch (err) {
        console.error("[MP Webhook] Error procesando evento:", err);
      }
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[MP Webhook] Error general:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
