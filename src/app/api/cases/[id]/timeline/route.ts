import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addTimelineEvent, createAgendaEventFromCase, getCaseDetail } from "@/features/cases/server/cases-repo";
import { createDocument, patchDocument, requireFirebaseUser } from "@/lib/firebase/rest-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const authUser = await requireFirebaseUser(req);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const isBillingAction = body.createBillingRecord || body.agendaType === "cobro";
    let linkedBillingId: string | null = body.linkedBillingId ?? null;

    if (isBillingAction) {
      linkedBillingId = linkedBillingId || `case-billing-${randomUUID()}`;
      const amount = Number(body.billingAmount ?? body.amount ?? 0);
      await createDocument("payment_orders", linkedBillingId, {
        id: linkedBillingId,
        tenantId: body.tenantId,
        caseId: id,
        clientId: body.clientId ?? null,
        clientName: body.clientName ?? null,
        title: body.billingTitle ?? body.agendaTitle ?? body.title ?? "Cobro vinculado a causa",
        description: body.billingDescription ?? body.agendaDescription ?? body.description ?? "Cobro creado desde la ficha de la causa.",
        amountCLP: amount,
        currency: "CLP",
        status: "pending",
        paymentType: "honorario",
        source: "case_agenda_flow",
        createdBy: body.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, authUser.token);

      const caseDetail = await getCaseDetail(id, body.tenantId, authUser.token).catch(() => null);
      await patchDocument("cases", id, {
        pendingBalance: Number(caseDetail?.case.pendingBalance ?? 0) + amount,
        lastAction: body.agendaTitle ?? body.title ?? "Cobro creado desde causa",
        updatedAt: new Date().toISOString(),
        updatedBy: body.createdBy,
      }, authUser.token);
    }

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
      linkedBillingId,
    }, authUser.token);

    let agendaEvent = null;
    if (body.createAgendaEvent) {
      agendaEvent = await createAgendaEventFromCase({
        tenantId: body.tenantId,
        caseId: id,
        clientId: body.clientId ?? null,
        clientName: body.clientName ?? null,
        companyId: body.companyId ?? null,
        createdBy: body.createdBy,
        assignedTo: body.assignedTo,
        assignedToName: body.assignedToName,
        title: body.agendaTitle ?? body.title,
        description: body.agendaDescription ?? body.description,
        type: body.agendaType,
        date: body.agendaDate,
        startAt: body.agendaStartAt,
        endAt: body.agendaEndAt,
        status: body.agendaStatus,
        priority: body.agendaPriority,
        location: body.agendaLocation ?? null,
        meetingUrl: body.agendaMeetingUrl ?? null,
        notifyClient: body.notifyClient,
        notifyAssignee: body.notifyAssignee,
        linkedBillingId,
        linkedDeadlineId: body.linkedDeadlineId ?? null,
        token: authUser.token,
      });
      await patchDocument("case_timeline_events", timeline.id, { linkedAgendaEventId: agendaEvent.id }, authUser.token);
      timeline.linkedAgendaEventId = agendaEvent.id;
    }

    return NextResponse.json({ ok: true, timeline, agendaEvent, linkedBillingId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
