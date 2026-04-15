import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google";

/**
 * GET /api/calendar/auth?uid=...
 * 
 * Inicia el flujo de OAuth2 para Google Calendar.
 */
export async function GET(req: any) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "UID es requerido" }, { status: 400 });
    }

    const url = getAuthUrl(uid);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Error generating auth URL:", error);
    return NextResponse.json(
      { error: "Error al iniciar la autenticación con Google" },
      { status: 500 }
    );
  }
}
