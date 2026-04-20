import { NextRequest, NextResponse } from "next/server";
import { fromFirestoreFields, firestoreFetch, requireFirebaseUser, upsertDocument } from "@/lib/firebase/rest-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MEET_LINK = process.env.NEXT_PUBLIC_DEFAULT_MEET_LINK || "https://meet.google.com/nyz-vuxh-xmu";

type DemoDoc = { collection: string; id: string; data: Record<string, unknown> };

function nowIso() {
  return new Date().toISOString();
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function startOfCurrentWeek() {
  const value = new Date();
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  value.setHours(9, 0, 0, 0);
  return value;
}

function addDays(base: Date, days: number, hour = 9, minute = 0) {
  const value = new Date(base);
  value.setDate(value.getDate() + days);
  value.setHours(hour, minute, 0, 0);
  return value;
}

function eventDoc(params: {
  id: string;
  tenantId: string;
  caseId?: string;
  clientId?: string;
  clientName?: string;
  createdBy: string;
  assignedTo: string;
  assignedToName: string;
  title: string;
  description: string;
  type: string;
  status?: string;
  priority?: string;
  startAt: Date;
  endAt: Date;
  meetingUrl?: string | null;
  location?: string | null;
  linkedBillingId?: string | null;
}) {
  return {
    id: params.id,
    tenantId: params.tenantId,
    companyId: null,
    caseId: params.caseId ?? null,
    clientId: params.clientId ?? null,
    clientName: params.clientName ?? null,
    clientEmail: null,
    createdBy: params.createdBy,
    assignedTo: params.assignedTo,
    assignedToName: params.assignedToName,
    assignedToEmail: null,
    title: params.title,
    description: params.description,
    type: params.type,
    status: params.status ?? "pendiente",
    priority: params.priority ?? "media",
    day: dateKey(params.startAt),
    date: dateKey(params.startAt),
    startAt: params.startAt,
    endAt: params.endAt,
    timezone: "America/Santiago",
    location: params.location ?? null,
    meetingUrl: params.meetingUrl ?? null,
    notifyClient: true,
    notifyAssignee: true,
    emailNotificationStatus: "pending",
    reminderAt: null,
    linkedBillingId: params.linkedBillingId ?? null,
    linkedDeadlineId: params.type === "plazo" ? params.caseId ?? null : null,
    linkedWorkflowStepId: null,
    demoSeed: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function buildDemoDocs(tenantId: string, actorId: string, actorName: string): DemoDoc[] {
  const now = nowIso();
  const week = startOfCurrentWeek();
  const clients = [
    { id: "demo-client-juan-perez", name: "Juan Perez", email: "juan.perez.demo@sosercom.cl", rut: "12.345.678-9" },
    { id: "demo-client-maria-gonzalez", name: "Maria Gonzalez", email: "maria.gonzalez.demo@sosercom.cl", rut: "15.234.567-8" },
    { id: "demo-client-sociedad-alfa", name: "Sociedad Alfa SpA", email: "contacto.alfa.demo@sosercom.cl", rut: "76.123.456-7" },
  ];

  const cases = [
    {
      id: "demo-case-cobro-ejecutivo",
      clientId: clients[0].id,
      clientName: clients[0].name,
      title: "Juan Perez - Cobro ejecutivo de honorarios",
      category: "Judicial",
      type: "Cobro ejecutivo",
      procedure: "Ejecutivo",
      description: "Expediente demo con saldo pendiente, audiencia y seguimiento de cobranza.",
      status: "active",
      stage: "filing",
      lastAction: "Demanda ingresada y audiencia pendiente",
      pendingBalance: 450000,
      trackedMinutes: 210,
      priority: "high",
      nextDeadline: dateKey(addDays(week, 3, 10)),
      visibleToClient: true,
    },
    {
      id: "demo-case-docs-pendientes",
      clientId: clients[1].id,
      clientName: clients[1].name,
      title: "Maria Gonzalez - Regularizacion contractual",
      category: "Civil",
      type: "Revision contractual",
      procedure: "Gestion extrajudicial",
      description: "Causa demo en espera de documentos del cliente.",
      status: "waiting_client",
      stage: "documents",
      lastAction: "Se solicitaron antecedentes al cliente",
      pendingBalance: 0,
      trackedMinutes: 90,
      priority: "medium",
      nextDeadline: dateKey(addDays(week, 2, 15)),
      visibleToClient: true,
    },
    {
      id: "demo-case-audiencia-alfa",
      clientId: clients[2].id,
      clientName: clients[2].name,
      title: "Sociedad Alfa SpA - Audiencia preparatoria",
      category: "Laboral",
      type: "Defensa laboral",
      procedure: "Aplicacion general",
      description: "Causa demo con audiencia critica de la semana.",
      status: "hearing",
      stage: "hearing",
      lastAction: "Carpeta de audiencia en preparacion",
      pendingBalance: 180000,
      trackedMinutes: 360,
      priority: "critical",
      nextDeadline: dateKey(addDays(week, 1, 11, 30)),
      visibleToClient: true,
    },
  ];

  const docs: DemoDoc[] = [];

  for (const client of clients) {
    docs.push({
      collection: "clients",
      id: client.id,
      data: { ...client, tenantId, status: "active", source: "demo_seed", demoSeed: true, createdAt: now, updatedAt: now },
    });
  }

  for (const item of cases) {
    docs.push({
      collection: "cases",
      id: item.id,
      data: {
        ...item,
        tenantId,
        companyId: null,
        assignedTo: actorId,
        assignedToName: actorName,
        openedAt: now,
        createdAt: now,
        updatedAt: now,
        createdBy: actorId,
        updatedBy: actorId,
        autosaveVersion: 1,
        lastAutosavedAt: now,
        demoSeed: true,
      },
    });
  }

  docs.push(
    {
      collection: "case_timeline_events",
      id: "demo-timeline-cobro-ingreso",
      data: { id: "demo-timeline-cobro-ingreso", caseId: cases[0].id, tenantId, clientId: cases[0].clientId, title: "Ingreso de causa", description: "Causa creada con antecedentes iniciales y saldo pendiente.", type: "ingreso", eventDate: now, visibleToClient: true, createdBy: actorId, createdByName: actorName, assignedTo: actorId, linkedAgendaEventId: "demo-agenda-audiencia-alfa", linkedDocumentId: "demo-doc-antecedentes", linkedBillingId: "demo-payment-cuota-2", createdAt: now, updatedAt: now, demoSeed: true },
    },
    {
      collection: "case_timeline_events",
      id: "demo-timeline-docs-solicitud",
      data: { id: "demo-timeline-docs-solicitud", caseId: cases[1].id, tenantId, clientId: cases[1].clientId, title: "Solicitud de documentos", description: "Se solicito copia de contrato, comprobantes y poder simple.", type: "documentos", eventDate: now, visibleToClient: true, createdBy: actorId, createdByName: actorName, assignedTo: actorId, linkedAgendaEventId: "demo-agenda-plazo-docs", linkedDocumentId: "demo-doc-minuta", linkedBillingId: null, createdAt: now, updatedAt: now, demoSeed: true },
    },
    {
      collection: "case_timeline_events",
      id: "demo-timeline-audiencia-prep",
      data: { id: "demo-timeline-audiencia-prep", caseId: cases[2].id, tenantId, clientId: cases[2].clientId, title: "Preparacion de audiencia", description: "Se prepara carpeta, testigos y estrategia para audiencia.", type: "audiencia", eventDate: now, visibleToClient: false, createdBy: actorId, createdByName: actorName, assignedTo: actorId, linkedAgendaEventId: "demo-agenda-audiencia-alfa", linkedDocumentId: null, linkedBillingId: "demo-payment-audiencia", createdAt: now, updatedAt: now, demoSeed: true },
    },
  );

  docs.push(
    { collection: "payment_orders", id: "demo-payment-cuota-2", data: { id: "demo-payment-cuota-2", tenantId, caseId: cases[0].id, clientId: cases[0].clientId, clientName: cases[0].clientName, title: "Honorarios cuota 2", description: "Cobro demo pendiente por honorarios de tramitacion.", amountCLP: 450000, currency: "CLP", status: "pending", paymentType: "honorario", source: "demo_seed", createdBy: actorId, createdAt: now, updatedAt: now, demoSeed: true } },
    { collection: "payment_orders", id: "demo-payment-audiencia", data: { id: "demo-payment-audiencia", tenantId, caseId: cases[2].id, clientId: cases[2].clientId, clientName: cases[2].clientName, title: "Preparacion audiencia", description: "Cobro demo por preparacion de audiencia.", amountCLP: 180000, currency: "CLP", status: "pending", paymentType: "honorario", source: "demo_seed", createdBy: actorId, createdAt: now, updatedAt: now, demoSeed: true } },
  );

  docs.push(
    { collection: "case_documents", id: "demo-doc-antecedentes", data: { id: "demo-doc-antecedentes", caseId: cases[0].id, tenantId, clientId: cases[0].clientId, uploadedBy: actorId, name: "Antecedentes iniciales - Cobro ejecutivo.txt", type: "text/plain", size: 1240, storagePath: "demo-docs/antecedentes-causa-demo.txt", webViewLink: "/demo-docs/antecedentes-causa-demo.txt", webContentLink: "/demo-docs/antecedentes-causa-demo.txt", createdAt: now, demoSeed: true } },
    { collection: "case_documents", id: "demo-doc-minuta", data: { id: "demo-doc-minuta", caseId: cases[2].id, tenantId, clientId: cases[2].clientId, uploadedBy: actorId, name: "Minuta preparacion audiencia.txt", type: "text/plain", size: 980, storagePath: "demo-docs/minuta-audiencia-demo.txt", webViewLink: "/demo-docs/minuta-audiencia-demo.txt", webContentLink: "/demo-docs/minuta-audiencia-demo.txt", createdAt: now, demoSeed: true } },
  );

  const agenda = [
    eventDoc({ id: "demo-agenda-videollamada-juan", tenantId, caseId: cases[0].id, clientId: cases[0].clientId, clientName: cases[0].clientName, createdBy: actorId, assignedTo: actorId, assignedToName: actorName, title: "Videollamada revision de demanda", description: "Revisar antecedentes finales antes de ingreso.", type: "videollamada", startAt: addDays(week, 0, 9), endAt: addDays(week, 0, 9, 45), meetingUrl: DEFAULT_MEET_LINK }),
    eventDoc({ id: "demo-agenda-audiencia-alfa", tenantId, caseId: cases[2].id, clientId: cases[2].clientId, clientName: cases[2].clientName, createdBy: actorId, assignedTo: actorId, assignedToName: actorName, title: "Audiencia preparatoria Sociedad Alfa", description: "Audiencia critica con carpeta y testigos preparados.", type: "audiencia", status: "critico", priority: "critica", startAt: addDays(week, 1, 11, 30), endAt: addDays(week, 1, 12, 30), location: "Tribunal laboral" }),
    eventDoc({ id: "demo-agenda-cobro-juan", tenantId, caseId: cases[0].id, clientId: cases[0].clientId, clientName: cases[0].clientName, createdBy: actorId, assignedTo: actorId, assignedToName: actorName, title: "Insistir pago honorarios cuota 2", description: "Enviar recordatorio de saldo pendiente y actualizar estado financiero.", type: "cobro", startAt: addDays(week, 2, 15), endAt: addDays(week, 2, 15, 30), linkedBillingId: "demo-payment-cuota-2" }),
    eventDoc({ id: "demo-agenda-plazo-docs", tenantId, caseId: cases[1].id, clientId: cases[1].clientId, clientName: cases[1].clientName, createdBy: actorId, assignedTo: actorId, assignedToName: actorName, title: "Vencimiento entrega documentos", description: "Cliente debe enviar documentos para continuar redaccion.", type: "plazo", status: "critico", priority: "alta", startAt: addDays(week, 3, 10), endAt: addDays(week, 3, 10, 30) }),
    eventDoc({ id: "demo-agenda-tarea-informe", tenantId, caseId: cases[2].id, clientId: cases[2].clientId, clientName: cases[2].clientName, createdBy: actorId, assignedTo: actorId, assignedToName: actorName, title: "Redactar informe ultimo movimiento", description: "Preparar resumen ejecutivo para cliente y equipo.", type: "tarea", status: "en_proceso", startAt: addDays(week, 4, 17), endAt: addDays(week, 4, 18) }),
  ];

  for (const event of agenda) docs.push({ collection: "agenda_events", id: String(event.id), data: event });

  docs.push({
    collection: "audit_logs",
    id: "demo-seed-last-run",
    data: { id: "demo-seed-last-run", module: "demo_seed", action_type: "upsert_demo_data", entity_type: "seed", entity_id: tenantId, tenantId, user_id: actorId, timestamp: now, demoSeed: true },
  });

  return docs;
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireFirebaseUser(req);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const userDoc = await firestoreFetch(`users/${authUser.uid}`, authUser.token);
    const userData = fromFirestoreFields(userDoc.fields || {});
    const role = String(userData.role || "");
    if (role !== "super_admin_global") {
      return NextResponse.json({ error: "Solo super_admin_global puede ejecutar seed demo" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const userTenantId = String(userData.tenantId || "");
    const defaultTenantId = process.env.NEXT_PUBLIC_DEMO_TENANT_ID || (userTenantId && userTenantId !== "global" ? userTenantId : "sosercom-main");
    const tenantId = String(body.tenantId || defaultTenantId);
    const actorName = String(userData.displayName || userData.email || "Admin demo");
    const docs = buildDemoDocs(tenantId, authUser.uid, actorName);

    for (const item of docs) {
      await upsertDocument(item.collection, item.id, item.data, authUser.token);
    }

    return NextResponse.json({
      ok: true,
      tenantId,
      upserted: docs.length,
      clients: 3,
      cases: 3,
      agendaEvents: 5,
      paymentOrders: 2,
      documents: 2,
      links: {
        cases: "/firm/causas",
        agenda: "/firm/agenda",
        template: "/templates/plantilla-importacion-causas.xlsx",
      },
    });
  } catch (error) {
    console.error("[demo/seed]", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
