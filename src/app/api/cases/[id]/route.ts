import { NextRequest, NextResponse } from "next/server";
import { getCaseDetail, updateCase } from "@/features/cases/server/cases-repo";
import { requireFirebaseUser } from "@/lib/firebase/rest-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const authUser = await requireFirebaseUser(req);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const tenantId = req.nextUrl.searchParams.get("tenantId");
    if (!tenantId) return NextResponse.json({ error: "tenantId requerido" }, { status: 400 });

    const result = await getCaseDetail(id, tenantId, authUser.token);
    if (!result) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const authUser = await requireFirebaseUser(req);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    if (!body.tenantId || !body.actorId || !body.patch) {
      return NextResponse.json({ error: "tenantId, actorId y patch requeridos" }, { status: 400 });
    }

    await updateCase(id, body.tenantId, body.patch, body.actorId, authUser.token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
