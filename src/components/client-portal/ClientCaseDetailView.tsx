"use client";

import Link from "next/link";
import { CalendarDays, ExternalLink, FileText, MessageSquare, Upload, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClientCaseDetailPayload } from "@/features/client-portal/types";

function money(value: number) {
  return `$${value.toLocaleString("es-CL")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("es-CL", { dateStyle: "medium", timeStyle: value.includes("T") ? "short" : undefined });
}

export function ClientCaseDetailView({ data }: { data: ClientCaseDetailPayload }) {
  const nextEvent = data.agenda[0];
  const pendingAmount = data.payments.reduce((acc, payment) => acc + payment.amount, 0);
  const meetingUrl = data.agenda.find((event) => event.meetingUrl)?.meetingUrl;

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Portal Cliente · Detalle de causa</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-950">{data.case.title}</h1>
            <p className="mt-3 max-w-4xl text-base leading-7 text-neutral-600">
              Estado, movimientos visibles, documentos, reuniones y pagos pendientes asociados a tu causa.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/cliente/agendar/${data.case.assignedTo || "demo"}`} className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800">
              <CalendarDays className="mr-2 h-4 w-4" /> Agendar reunion
            </Link>
            <Link href={meetingUrl || "/cliente/citas"} target={meetingUrl ? "_blank" : undefined} rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50">
              <MessageSquare className="mr-2 h-4 w-4" /> Revisar reunion
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Estado</p><p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{data.case.status}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Etapa</p><p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{data.case.stage}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Abogado a cargo</p><p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{data.case.assignedToName}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Proximo hito</p><p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{nextEvent?.date ?? data.case.nextDeadline ?? "Sin plazo"}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Saldo pendiente</p><p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{money(pendingAmount || data.case.pendingBalance || 0)}</p></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="rounded-[32px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Timeline visible</h2>
            <p className="mt-2 text-sm text-neutral-500">Solo se muestran hitos habilitados para cliente.</p>
            <div className="mt-6 space-y-4">
              {data.timeline.map((event, index) => (
                <div key={event.id} className="relative rounded-3xl border border-neutral-200 bg-white p-4">
                  {index !== data.timeline.length - 1 && <div className="absolute left-7 top-16 h-[calc(100%-2rem)] w-px bg-neutral-200" />}
                  <div className="flex items-start gap-4">
                    <div className="mt-1 rounded-2xl bg-neutral-100 p-3 text-neutral-700"><FileText className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-neutral-500">{formatDate(event.eventDate)}</p>
                      <h3 className="text-lg font-semibold tracking-tight text-neutral-950">{event.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">{event.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              {data.timeline.length === 0 && <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">No hay hitos visibles por ahora.</div>}
            </div>
          </section>

          <section className="rounded-[32px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Documentos visibles</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {data.documents.map((doc) => (
                <div key={doc.id} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-neutral-500"><FileText className="h-4 w-4" /> {doc.category ?? "Documento"}</div>
                  <h3 className="mt-2 text-base font-semibold text-neutral-950">{doc.title}</h3>
                  {doc.fileUrl && (
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center text-sm font-medium text-neutral-900 underline-offset-4 hover:underline">
                      Abrir documento <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
              {data.documents.length === 0 && <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500 md:col-span-2">No hay documentos visibles.</div>}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[32px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Reuniones y eventos</h2>
            <div className="mt-6 space-y-4">
              {data.agenda.map((event) => (
                <div key={event.id} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-neutral-500"><CalendarDays className="h-4 w-4" /><span>{event.date ?? "Sin fecha"}</span></div>
                  <h3 className="mt-2 text-base font-semibold text-neutral-950">{event.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{event.description}</p>
                  {event.meetingUrl && (
                    <a href={event.meetingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-10 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50">
                      Entrar a reunion
                    </a>
                  )}
                </div>
              ))}
              {data.agenda.length === 0 && <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">No hay eventos visibles.</div>}
            </div>
          </section>

          <section className="rounded-[32px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Pagos pendientes</h2>
            <div className="mt-6 space-y-4">
              {data.payments.map((payment) => (
                <div key={payment.id} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-neutral-500"><Wallet className="h-4 w-4" /><span>{payment.status}</span></div>
                  <h3 className="mt-2 text-base font-semibold text-neutral-950">{payment.title}</h3>
                  <p className="mt-2 text-sm text-neutral-600">Monto: {money(payment.amount)}</p>
                  <p className="mt-1 text-sm text-neutral-500">Vence: {payment.dueDate ?? "Sin fecha"}</p>
                </div>
              ))}
              {data.payments.length === 0 && <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">No hay pagos pendientes.</div>}
            </div>
          </section>

          <section className="rounded-[32px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Acciones rapidas</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <Link href={`/cliente/agendar/${data.case.assignedTo || "demo"}`} className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"><CalendarDays className="mr-2 h-4 w-4" /> Agendar reunion</Link>
              <Link href="/cliente/documentos" className="inline-flex h-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"><FileText className="mr-2 h-4 w-4" /> Ver documentos</Link>
              <Button variant="outline" className="h-11 rounded-2xl border-neutral-200"><Wallet className="mr-2 h-4 w-4" /> Revisar pagos</Button>
              <Button variant="outline" className="h-11 rounded-2xl border-neutral-200"><Upload className="mr-2 h-4 w-4" /> Enviar antecedente</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
