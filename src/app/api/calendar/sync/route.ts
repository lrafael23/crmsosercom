import { NextRequest, NextResponse } from "next/server";
import { listGoogleEvents } from "@/lib/google";
import { getFirestoreDocREST } from "@/lib/firebase/rest";

export const runtime = "nodejs";

/**
 * GET /api/calendar/sync?uid=...
 *
 * Obtiene los eventos de la cuenta de Google conectada.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "UID es requerido" }, { status: 400 });
    }

    const credentials = await getFirestoreDocREST<{ googleCalendar?: unknown }>(
      "user_credentials",
      uid
    );

    if (!credentials?.googleCalendar) {
      return NextResponse.json({ error: "Google no conectado" }, { status: 404 });
    }

    const events = await listGoogleEvents(credentials.googleCalendar);
    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("Error syncing calendar:", error);
    return NextResponse.json(
      { error: "Error al sincronizar con Google", details: error.message },
      { status: 500 }
    );
  }
}
