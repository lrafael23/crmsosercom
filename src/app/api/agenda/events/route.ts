import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AgendaAction = "create" | "update" | "delete" | "duplicate" | "status" | "reassign";
type AgendaRequest = { action?: AgendaAction; id?: string; event?: Record<string, unknown>; patch?: Record<string, unknown> };
type FirestoreValue = any;

function projectId() {
  const id = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!id) throw new Error("Missing Firebase project id");
  return id;
}

function baseUrl() {
  return `https://firestore.googleapis.com/v1/projects/${projectId()}/databases/(default)/documents/agenda_events`;
}

function toValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  if (typeof value === "object") return { mapValue: { fields: Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toValue(item)])) } };
  return { stringValue: String(value) };
}

function toFields(data: Record<string, unknown>) {
  return { fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toValue(value)])) };
}

function stringFromValue(value: FirestoreValue) {
  return value?.stringValue || value?.integerValue || value?.doubleValue || value?.booleanValue || "";
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

async function firestoreLog(eventId: string, action: string, token: string, actorId: string, payload: unknown) {
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId()}/databases/(default)/documents/agenda_activity_logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(toFields({ eventId, action, actorId, actorRole: null, oldValue: null, newValue: payload ?? null, createdAt: new Date() })),
  });
  if (!response.ok) console.warn("[agenda/events] log skipped", await response.text());
}

async function firestoreRequest(url: string, token: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
  if (!response.ok) throw new Error(await response.text());
  return response.status === 204 ? null : response.json();
}

export async function POST(request: Request) {
  try {
    const token = getBearer(request);
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const decoded = await lookupUser(token);
    if (!decoded?.localId) return NextResponse.json({ error: "Token invalido" }, { status: 401 });

    const body = (await request.json()) as AgendaRequest;
    const action = body.action || "create";

    if (action === "create") {
      const id = body.id || crypto.randomUUID();
      await firestoreRequest(`${baseUrl()}?documentId=${id}`, token, {
        method: "POST",
        body: JSON.stringify(toFields({ id, ...(body.event || {}), createdBy: decoded.localId, createdAt: new Date(), updatedAt: new Date() })),
      });
      await firestoreLog(id, "api_create", token, decoded.localId, body.event || null);
      return NextResponse.json({ ok: true, id });
    }

    if (!body.id) return NextResponse.json({ error: "id obligatorio" }, { status: 400 });
    const documentUrl = `${baseUrl()}/${body.id}`;

    if (action === "update" || action === "status" || action === "reassign") {
      const patch = { ...(body.patch || {}), updatedAt: new Date() };
      const mask = Object.keys(patch).map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`).join("&");
      await firestoreRequest(`${documentUrl}?${mask}`, token, { method: "PATCH", body: JSON.stringify(toFields(patch)) });
      await firestoreLog(body.id, `api_${action}`, token, decoded.localId, patch);
      return NextResponse.json({ ok: true, id: body.id });
    }

    if (action === "delete") {
      await firestoreLog(body.id, "api_delete", token, decoded.localId, null);
      await firestoreRequest(documentUrl, token, { method: "DELETE" });
      return NextResponse.json({ ok: true, id: body.id });
    }

    if (action === "duplicate") {
      const original = await firestoreRequest(documentUrl, token);
      const copyId = crypto.randomUUID();
      const fields = { ...(original.fields || {}) };
      fields.id = toValue(copyId);
      fields.title = toValue(`${stringFromValue(fields.title) || "Evento"} (copia)`);
      fields.status = toValue("pendiente");
      fields.createdBy = toValue(decoded.localId);
      fields.createdAt = toValue(new Date());
      fields.updatedAt = toValue(new Date());
      await firestoreRequest(`${baseUrl()}?documentId=${copyId}`, token, { method: "POST", body: JSON.stringify({ fields }) });
      await firestoreLog(copyId, "api_duplicate", token, decoded.localId, body.id);
      return NextResponse.json({ ok: true, id: copyId });
    }

    return NextResponse.json({ error: "Accion no soportada" }, { status: 400 });
  } catch (error) {
    console.error("[agenda/events]", error);
    return NextResponse.json({ error: "No se pudo procesar agenda_events" }, { status: 500 });
  }
}
