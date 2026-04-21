import { NextRequest, NextResponse } from "next/server";
import { getClientCaseSummary, listClientCases } from "@/features/client-portal/server/client-portal-repo";
import { resolveRequestActor } from "@/lib/auth/server-actor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isClientRole(role: string) {
  return role === "cliente_final" || role === "cliente";
}

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveRequestActor(req);
    if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (!isClientRole(actor.role)) {
      return NextResponse.json({ error: "Solo clientes pueden usar este portal" }, { status: 403 });
    }

    const search = req.nextUrl.searchParams.get("search") || undefined;
    const status = req.nextUrl.searchParams.get("status") || undefined;
    const [data, summary] = await Promise.all([
      listClientCases({ clientId: actor.uid, token: actor.token, search, status }),
      getClientCaseSummary({ clientId: actor.uid, token: actor.token }),
    ]);

    return NextResponse.json({ ok: true, data, summary });
  } catch (error) {
    console.error("[api/client/cases]", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
