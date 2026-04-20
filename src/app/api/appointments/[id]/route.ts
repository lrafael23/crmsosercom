import { NextRequest, NextResponse } from "next/server";
import { updateAppointment } from "@/features/appointments/server/appointments-repo";
import { firestoreFetch, fromFirestoreFields, requireFirebaseUser } from "@/lib/firebase/rest-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function getActor(req: NextRequest) {
  const authUser = await requireFirebaseUser(req);
  if (!authUser) return null;
  const userDoc = await firestoreFetch(`users/${authUser.uid}`, authUser.token).catch(() => null);
  const userData = userDoc?.fields ? fromFirestoreFields(userDoc.fields) : {};
  return { ...authUser, role: String(userData.role || ""), tenantId: typeof userData.tenantId === "string" ? userData.tenantId : null };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const actor = await getActor(req);
    if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const action = body.action === "reschedule" ? "reschedule" : body.action === "complete" ? "complete" : body.action === "no_show" ? "no_show" : "cancel";
    const appointment = await updateAppointment({ appointmentId: id, actorId: actor.uid, actorRole: actor.role, actorTenantId: actor.tenantId, action, date: body.date ? String(body.date) : undefined, time: body.time ? String(body.time) : undefined, token: actor.token });
    return NextResponse.json({ ok: true, appointment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Forbidden" ? 403 : message.includes("Slot no disponible") ? 409 : message.includes("not found") ? 404 : 500;
    console.error("[appointments/patch]", error);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
