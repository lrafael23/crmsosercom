import { NextRequest, NextResponse } from "next/server";
import { addTimelineEvent, createAgendaEventFromCase } from "@/features/cases/server/cases-repo";
import { patchDocument, requireFirebaseUser } from "@/lib/firebase/rest-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const authUser = await requireFirebaseUser(req);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const timeline = await addTimelineEvent({
      caseId: id,
      tenantId: body.tenantId,
      clientId: body.clientId ?? null,
      title: body.title,
      description: body.description,
      type: body.type,
      eventDate: body.eventDate,
      visibleToClient: !!body.visibleToClient,
      createdBy: body.createdBy,
      createdByName: body.createdByName ?? null,
      assignedTo: body.assignedTo ?? null,
      linkedAgendaEventId: null,
      linkedDocumentId: body.linkedDocumentId ?? null,
      linkedBillingId: body.linkedBillingId ?? null,
    }, authUser.token);

    let agendaEvent = null;
    if (body.createAgendaEvent) {
      agendaEvent = await createAgendaEventFromCase({
        tenantId: body.tenantId,
        caseId: id,
        clientId: body.clientId ?? null,
        createdBy: body.createdBy,
        assignedTo: body.assignedTo,
        assignedToName: body.assignedToName,
        title: body.agendaTitle ?? body.title,
        description: body.agendaDescription ?? body.description,
        type: body.agendaType,
        date: body.agendaDate,
        startAt: body.agendaStartAt,
        endAt: body.agendaEndAt,
        token: authUser.token,
      });
      await patchDocument("case_timeline_events", timeline.id, { linkedAgendaEventId: agendaEvent.id }, authUser.token);
      timeline.linkedAgendaEventId = agendaEvent.id;
    }

    return NextResponse.json({ ok: true, timeline, agendaEvent }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
