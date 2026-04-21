import { NextRequest, NextResponse } from "next/server";
import { listTenants } from "@/features/super-admin/server/support-repo";
import { requireSuperAdminActor } from "@/lib/auth/server-actor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireSuperAdminActor(req);
    if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const search = req.nextUrl.searchParams.get("search") || undefined;
    const rawStatus = req.nextUrl.searchParams.get("status");
    const status = rawStatus === "active" || rawStatus === "suspended" ? rawStatus : undefined;
    const data = await listTenants(actor.token, search, status);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
