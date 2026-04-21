import { NextRequest, NextResponse } from "next/server";
import { endImpersonation, startImpersonation } from "@/features/super-admin/server/support-repo";
import { requireSuperAdminActor } from "@/lib/auth/server-actor";
import { IMPERSONATION_COOKIE_NAME, serializeImpersonationSession } from "@/lib/auth/impersonation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const actor = await requireSuperAdminActor(req);
    if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    if (!body.targetUserId) {
      return NextResponse.json({ error: "targetUserId requerido" }, { status: 400 });
    }

    const { session, targetUser } = await startImpersonation(actor.token, {
      superAdminId: actor.uid,
      targetUserId: String(body.targetUserId),
    });

    const response = NextResponse.json({ ok: true, session, targetUser });
    response.cookies.set(IMPERSONATION_COOKIE_NAME, serializeImpersonationSession({
      sessionId: session.id,
      targetUserId: session.targetUserId,
      targetRole: session.targetRole,
      tenantId: session.tenantId || null,
    }), {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireSuperAdminActor(req);
    if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId requerido" }, { status: 400 });
    }

    await endImpersonation(actor.token, String(body.sessionId), actor.uid);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(IMPERSONATION_COOKIE_NAME, "", {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      expires: new Date(0),
    });
    return response;
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
