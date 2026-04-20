import { NextRequest, NextResponse } from "next/server";
import { getClientCaseSummary, listClientCases } from "@/features/client-portal/server/client-portal-repo";
import { firestoreFetch, fromFirestoreFields, requireFirebaseUser } from "@/lib/firebase/rest-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isClientRole(role: string) {
  return role === "cliente_final" || role === "cliente";
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireFirebaseUser(req);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const userDoc = await firestoreFetch(`users/${authUser.uid}`, authUser.token).catch(() => null);
    const userData = userDoc?.fields ? fromFirestoreFields(userDoc.fields) : {};
    const role = String(userData.role || "");

    if (!isClientRole(role)) {
      return NextResponse.json({ error: "Solo clientes pueden usar este portal" }, { status: 403 });
    }

    const search = req.nextUrl.searchParams.get("search") || undefined;
    const status = req.nextUrl.searchParams.get("status") || undefined;
    const [data, summary] = await Promise.all([
      listClientCases({ clientId: authUser.uid, token: authUser.token, search, status }),
      getClientCaseSummary({ clientId: authUser.uid, token: authUser.token }),
    ]);

    return NextResponse.json({ ok: true, data, summary });
  } catch (error) {
    console.error("[api/client/cases]", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
