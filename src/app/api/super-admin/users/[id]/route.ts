import { NextRequest, NextResponse } from "next/server";
import { updateUserStatus } from "@/features/super-admin/server/support-repo";
import { requireSuperAdminActor } from "@/lib/auth/server-actor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const actor = await requireSuperAdminActor(req);
    if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const status = body.status === "suspended" || body.status === "pending_validation" ? body.status : "active";
    await updateUserStatus(actor.token, id, status, actor.uid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "User not found" ? 404 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
