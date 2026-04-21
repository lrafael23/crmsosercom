import { NextRequest, NextResponse } from "next/server";
import { getTenantDetail, updateTenantStatus } from "@/features/super-admin/server/support-repo";
import { requireSuperAdminActor } from "@/lib/auth/server-actor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const actor = await requireSuperAdminActor(req);
    if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;
    const data = await getTenantDetail(actor.token, id);
    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const actor = await requireSuperAdminActor(req);
    if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const status = body.status === "suspended" ? "suspended" : "active";
    await updateTenantStatus(actor.token, id, status, actor.uid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
