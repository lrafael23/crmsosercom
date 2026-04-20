import { NextRequest, NextResponse } from "next/server";
import { createAppointment, listAppointments } from "@/features/appointments/server/appointments-repo";
import { firestoreFetch, fromFirestoreFields, requireFirebaseUser } from "@/lib/firebase/rest-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getActor(req: NextRequest) {
  const authUser = await requireFirebaseUser(req);
  if (!authUser) return null;
  const userDoc = await firestoreFetch(`users/${authUser.uid}`, authUser.token).catch(() => null);
  const userData = userDoc?.fields ? fromFirestoreFields(userDoc.fields) : {};
  return {
    ...authUser,
    role: String(userData.role || ""),
    tenantId: typeof userData.tenantId === "string" ? userData.tenantId : null,
    displayName: String(userData.displayName || userData.email || "Cliente"),
  };
}

function isClientRole(role: string) {
  return role === "cliente_final" || role === "cliente";
}

export async function GET(req: NextRequest) {
  try {
    const actor = await getActor(req);
    if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const data = await listAppointments({ actorId: actor.uid, actorRole: actor.role, actorTenantId: actor.tenantId, token: actor.token });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[appointments/get]", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await getActor(req);
    if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!isClientRole(actor.role)) return NextResponse.json({ error: "Solo clientes pueden crear citas desde este flujo" }, { status: 403 });

    const body = await req.json();
    const required = ["lawyerId", "date", "time"];
    for (const field of required) {
      if (!body[field]) return NextResponse.json({ error: `Campo requerido: ${field}` }, { status: 400 });
    }

    const appointment = await createAppointment({
      lawyerId: String(body.lawyerId),
      clientId: actor.uid,
      clientName: actor.displayName,
      caseId: body.caseId ? String(body.caseId) : null,
      title: body.title ? String(body.title) : undefined,
      description: body.description ? String(body.description) : undefined,
      date: String(body.date),
      time: String(body.time),
      token: actor.token,
    });

    return NextResponse.json({ ok: true, appointment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("ALREADY_EXISTS") || message.includes("Slot no disponible") ? 409 : 500;
    console.error("[appointments/post]", error);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
