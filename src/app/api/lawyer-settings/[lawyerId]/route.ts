import { NextRequest, NextResponse } from "next/server";
import { getLawyerSettings, saveLawyerSettings } from "@/features/appointments/server/appointments-repo";
import { firestoreFetch, fromFirestoreFields, requireFirebaseUser } from "@/lib/firebase/rest-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ lawyerId: string }> };

async function getActor(req: NextRequest) {
  const authUser = await requireFirebaseUser(req);
  if (!authUser) return null;
  const userDoc = await firestoreFetch(`users/${authUser.uid}`, authUser.token).catch(() => null);
  const userData = userDoc?.fields ? fromFirestoreFields(userDoc.fields) : {};
  return { ...authUser, role: String(userData.role || ""), tenantId: typeof userData.tenantId === "string" ? userData.tenantId : null, displayName: String(userData.displayName || userData.email || "Usuario") };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const actor = await getActor(req);
    if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { lawyerId } = await params;
    const settings = await getLawyerSettings(lawyerId, actor.token);
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error("[lawyer-settings/get]", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const actor = await getActor(req);
    if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { lawyerId } = await params;
    const body = await req.json();
    const settings = await saveLawyerSettings({ lawyerId, actorId: actor.uid, actorRole: actor.role, actorTenantId: actor.tenantId || "", patch: body, token: actor.token });
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Forbidden" ? 403 : 500;
    console.error("[lawyer-settings/patch]", error);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
