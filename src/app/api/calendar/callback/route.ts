import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/google";
import { setFirestoreDocREST } from "@/lib/firebase/rest";

/**
 * GET /api/calendar/callback?code=...&state=...
 * 
 * Callback de Google OAuth para procesar la autorización.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const userId = searchParams.get("state"); // El UID que pasamos en el auth route

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Código o Estado faltante" }, 
        { status: 400 }
      );
    }

    // 1. Intercambiar código por tokens
    const tokens = await getTokensFromCode(code);

    // 2. Persistir tokens en Firestore (REST)
    // Guardamos el objeto tokens (que contiene access_token, refresh_token, etc)
    await setFirestoreDocREST("user_credentials", `${userId}/google_calendar`, tokens);

    // 3. Redirigir a la agenda con éxito
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    return NextResponse.redirect(`${baseUrl}/firm/agenda?status=connected`);

  } catch (error: any) {
    console.error("Error in Google Callback:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    return NextResponse.redirect(`${baseUrl}/firm/agenda?status=error&message=${encodeURIComponent(error.message)}`);
  }
}
