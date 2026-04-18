import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/mail";

export const runtime = "nodejs";

type NotifyBody = {
  eventId?: string;
  eventTitle?: string;
  type?: string;
  status?: string;
  recipients?: string[];
  subject?: string;
  message?: string;
};

type FirestoreValue =
  | { nullValue: null }
  | { stringValue: string }
  | { booleanValue: boolean }
  | { doubleValue: number }
  | { integerValue: string }
  | { timestampValue: string }
  | { arrayValue: { values: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

function htmlTemplate(body: NotifyBody) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin:0 0 12px">${body.eventTitle || "Evento de agenda"}</h2>
      <p style="margin:0 0 12px">${body.message || "Hay una actualizacion en Portal 360."}</p>
      <p style="margin:0;color:#6b7280;font-size:13px">Tipo: ${body.type || "agenda"} | Estado: ${body.status || "pendiente"}</p>
    </div>
  `;
}

function toValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toValue(item)])),
      },
    };
  }
  return { stringValue: String(value) };
}

function toFields(data: Record<string, unknown>) {
  return { fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toValue(value)])) };
}

function getBearer(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null;
}

async function lookupUser(token: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.users?.[0] || null;
}

async function firestoreCreate(collectionName: string, data: Record<string, unknown>, token: string) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Missing Firebase project id");
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(toFields(data)),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firestore create failed: ${text}`);
  }
  return response.json();
}

export async function POST(request: Request) {
  try {
    const token = getBearer(request);
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const decoded = await lookupUser(token);
    if (!decoded?.localId) return NextResponse.json({ error: "Token invalido" }, { status: 401 });

    const body = (await request.json()) as NotifyBody;
    if (!body.eventId || !body.eventTitle) {
      return NextResponse.json({ error: "eventId y eventTitle son obligatorios" }, { status: 400 });
    }

    const recipients = Array.from(new Set((body.recipients || []).filter((email) => typeof email === "string" && email.includes("@"))));
    const createdAt = new Date();
    const queue = await firestoreCreate(
      "notification_queue",
      {
        type: "agenda_event",
        recipient: recipients,
        subject: body.subject || `Portal 360 - ${body.eventTitle}`,
        payload: body,
        status: recipients.length > 0 ? "queued" : "skipped",
        retries: 0,
        createdAt,
        createdBy: decoded.localId,
      },
      token,
    );

    let emailStatus: "sent" | "queued" | "skipped" | "failed" = recipients.length > 0 ? "queued" : "skipped";
    if (recipients.length > 0 && process.env.RESEND_API_KEY) {
      try {
        await sendEmail({ to: recipients, subject: body.subject || `Portal 360 - ${body.eventTitle}`, html: htmlTemplate(body) });
        emailStatus = "sent";
      } catch (error) {
        console.error("[agenda/notify] Resend failed", error);
        emailStatus = "failed";
      }
    }

    await firestoreCreate(
      "agenda_activity_logs",
      {
        eventId: body.eventId,
        action: "email_notification",
        actorId: decoded.localId,
        actorRole: null,
        oldValue: null,
        newValue: { emailStatus, queueName: queue.name || null, recipients },
        createdAt: new Date(),
      },
      token,
    );

    return NextResponse.json({ ok: true, queueName: queue.name, emailStatus, recipientsCount: recipients.length });
  } catch (error) {
    console.error("[agenda/notify]", error);
    return NextResponse.json({ error: "No se pudo procesar la notificacion" }, { status: 500 });
  }
}
