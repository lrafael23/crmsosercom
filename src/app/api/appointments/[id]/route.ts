import { NextRequest, NextResponse } from "next/server";
import { updateAppointment } from "@/features/appointments/server/appointments-repo";
import { resolveRequestActor } from "@/lib/auth/server-actor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const actor = await resolveRequestActor(req);
    if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const action = body.action === "reschedule" ? "reschedule" : body.action === "complete" ? "complete" : body.action === "no_show" ? "no_show" : "cancel";
    const actorId = actor.uid || actor.realUid;
    const actorRole = actor.role || actor.realRole;
    const actorTenantId = actor.tenantId ?? undefined;
    const appointment = await updateAppointment({ appointmentId: id, actorId, actorRole, actorTenantId, action, date: body.date ? String(body.date) : undefined, time: body.time ? String(body.time) : undefined, token: actor.token });
    return NextResponse.json({ ok: true, appointment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Forbidden" ? 403 : message.includes("Slot no disponible") ? 409 : message.includes("not found") ? 404 : 500;
    console.error("[appointments/patch]", error);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
