import { NextRequest, NextResponse } from "next/server";
import { listGoogleEvents } from "@/lib/google";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

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

    // 1. Obtener tokens de Firestore
    // Nota: Aquí usamos el client SDK de Firebase para lectura (seguro según nuestras reglas)
    const docRef = doc(db, "user_credentials", `${uid}/google_calendar`);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ error: "Google no conectado" }, { status: 404 });
    }

    const tokens = snap.data().fields ? parseFirestoreRest(snap.data()) : snap.data();

    // 2. Listar eventos de Google
    const events = await listGoogleEvents(tokens);

    return NextResponse.json({ events });

  } catch (error: any) {
    console.error("Error syncing calendar:", error);
    return NextResponse.json(
      { error: "Error al sincronizar con Google", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Ayudante para parsear el formato REST de Firestore si viene de ahí
 */
function parseFirestoreRest(doc: any) {
  const data: any = {};
  for (const [key, val] of Object.entries(doc.fields)) {
    const v = val as any;
    if (v.stringValue) {
      try {
        data[key] = JSON.parse(v.stringValue);
      } catch {
        data[key] = v.stringValue;
      }
    }
  }
  return data;
}
