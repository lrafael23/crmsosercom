import { NextResponse } from "next/server";
import { processReminders } from "@/lib/notifications/reminders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Validación básica de seguridad si se configura CRON_SECRET en el entorno
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await processReminders();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("[CRON] Error ejecutando recordatorios:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
