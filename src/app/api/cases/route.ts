import { NextRequest, NextResponse } from "next/server";
import { createCase, listCasesByClient, listCasesByTenant } from "@/features/cases/server/cases-repo";
import { requireFirebaseUser } from "@/lib/firebase/rest-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireFirebaseUser(req);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const tenantId = req.nextUrl.searchParams.get("tenantId");
    const clientId = req.nextUrl.searchParams.get("clientId");
    const assignedTo = req.nextUrl.searchParams.get("assignedTo") || undefined;
    const status = req.nextUrl.searchParams.get("status") || undefined;
    const search = req.nextUrl.searchParams.get("search") || undefined;

    if (clientId) {
      const data = await listCasesByClient({ clientId, token: authUser.token });
      return NextResponse.json({ ok: true, data });
    }

    if (!tenantId) return NextResponse.json({ error: "tenantId requerido" }, { status: 400 });
    const data = await listCasesByTenant({ tenantId, assignedTo, status, search, token: authUser.token });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireFirebaseUser(req);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const required = ["tenantId", "clientId", "clientName", "title", "category", "type", "description", "status", "stage", "assignedTo", "assignedToName", "visibleToClient", "createdBy"];
    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return NextResponse.json({ error: `Campo requerido: ${field}` }, { status: 400 });
      }
    }

    const { record, initialTimeline } = await createCase(body, authUser.token);
    return NextResponse.json({ ok: true, record, initialTimeline }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
