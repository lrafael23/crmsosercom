import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/features/appointments/server/appointments-repo";
import { resolveRequestActor } from "@/lib/auth/server-actor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveRequestActor(req);
    if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const lawyerId = req.nextUrl.searchParams.get("lawyerId");
    const date = req.nextUrl.searchParams.get("date");
    if (!lawyerId || !date) return NextResponse.json({ error: "lawyerId y date requeridos" }, { status: 400 });

    const data = await getAvailability({ lawyerId, date, token: actor.token });
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    console.error("[appointments/availability]", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
