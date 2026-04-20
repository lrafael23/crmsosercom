import { NextRequest, NextResponse } from "next/server";
import { getClientCaseDetail } from "@/features/client-portal/server/client-portal-repo";
import { firestoreFetch, fromFirestoreFields, requireFirebaseUser } from "@/lib/firebase/rest-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function isClientRole(role: string) {
  return role === "cliente_final" || role === "cliente";
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const authUser = await requireFirebaseUser(req);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const userDoc = await firestoreFetch(`users/${authUser.uid}`, authUser.token).catch(() => null);
    const userData = userDoc?.fields ? fromFirestoreFields(userDoc.fields) : {};
    const role = String(userData.role || "");

    if (!isClientRole(role)) {
      return NextResponse.json({ error: "Solo clientes pueden usar este portal" }, { status: 403 });
    }

    const { id } = await params;
    const result = await getClientCaseDetail({ clientId: authUser.uid, caseId: id, token: authUser.token });
    if (!result) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[api/client/cases/id]", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
