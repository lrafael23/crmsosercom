"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, Clock3, ExternalLink, FileText, Gavel, MessageSquare, Plus, Save, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/lib/firebase/client";
import { useCaseAutosave } from "@/features/cases/hooks/useCaseAutosave";
import {
  CASE_STAGE_OPTIONS,
  CASE_STATUS_OPTIONS,
  type CaseRecord,
  type CaseStage,
  type CaseStatus,
  type TimelineEventRecord,
  type TimelineType,
} from "@/features/cases/types";
import type { AgendaEventStatus, AgendaEventType, AgendaPriority } from "@/lib/agenda/types";

interface Props {
  record: CaseRecord;
  timeline: TimelineEventRecord[];
  actorId: string;
}

type CaseAgendaAction = "audiencia" | "plazo" | "reunion" | "cobro";

type CaseAgendaForm = {
  action: CaseAgendaAction;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  assignedTo: string;
  assignedToName: string;
  clientId: string;
  clientName: string;
  status: AgendaEventStatus;
  priority: AgendaPriority;
  visibleToClient: boolean;
  notifyAssignee: boolean;
  location: string;
  meetingUrl: string;
  amount: string;
};

const DEFAULT_MEET_LINK = process.env.NEXT_PUBLIC_DEFAULT_MEET_LINK || "https://meet.google.com/nyz-vuxh-xmu";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function addMinutesIso(date: string, time: string, minutes: number) {
  const value = buildDateTime(date, time);
  value.setMinutes(value.getMinutes() + minutes);
  return value.toTimeString().slice(0, 5);
}

function buildDateTime(date: string, time: string) {
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  const value = new Date(`${date}T00:00:00`);
  value.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return value;
}

function saveLabelFor(state: string) {
  if (state === "saving") return "Guardando...";
  if (state === "saved") return "Guardado";
  if (state === "offline") return "Modo offline";
  if (state === "pending_sync") return "Pendiente de sincronizar";
  if (state === "error") return "Error";
  return "Guardar cambios";
}

function agendaTypeFor(action: CaseAgendaAction): AgendaEventType {
  if (action === "reunion") return "videollamada";
  return action;
}

function timelineTypeFor(action: CaseAgendaAction): TimelineType {
  if (action === "reunion") return "reunion";
  return action;
}

function actionLabel(action: CaseAgendaAction) {
  if (action === "audiencia") return "audiencia";
  if (action === "plazo") return "plazo";
  if (action === "reunion") return "reunion";
  return "cobro";
}

function makeActionDraft(action: CaseAgendaAction, record: CaseRecord): CaseAgendaForm {
  const date = record.nextDeadline || todayDate();
  const titles: Record<CaseAgendaAction, string> = {
    audiencia: `Audiencia - ${record.title}`,
    plazo: `Plazo - ${record.title}`,
    reunion: `Videollamada - ${record.clientName}`,
    cobro: `Cobro pendiente - ${record.clientName}`,
  };
  const descriptions: Record<CaseAgendaAction, string> = {
    audiencia: "Preparar carpeta, documentos y estrategia para audiencia.",
    plazo: "Plazo operativo vinculado a la causa.",
    reunion: "Reunion de seguimiento con cliente por avance de causa.",
    cobro: "Insistir o registrar cobro pendiente vinculado a la causa.",
  };

  return {
    action,
    title: titles[action],
    description: descriptions[action],
    date,
    startTime: action === "cobro" ? "15:00" : "09:00",
    endTime: action === "cobro" ? "15:30" : "10:00",
    assignedTo: record.assignedTo,
    assignedToName: record.assignedToName,
    clientId: record.clientId,
    clientName: record.clientName,
    status: action === "audiencia" || action === "plazo" ? "critico" : "pendiente",
    priority: action === "audiencia" || action === "plazo" ? "alta" : "media",
    visibleToClient: action !== "cobro",
    notifyAssignee: true,
    location: action === "audiencia" ? "Tribunal / sala por confirmar" : "",
    meetingUrl: action === "reunion" ? DEFAULT_MEET_LINK : "",
    amount: action === "cobro" ? String(record.pendingBalance || 0) : "0",
  };
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-400">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function CaseAgendaModal({ form, onClose, onChange, onSubmit, busy }: { form: CaseAgendaForm | null; onClose: () => void; onChange: (patch: Partial<CaseAgendaForm>) => void; onSubmit: () => void; busy: boolean }) {
  if (!form) return null;
  const label = actionLabel(form.action);
  const isCobro = form.action === "cobro";
  const isReunion = form.action === "reunion";
  const isAudiencia = form.action === "audiencia";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Causa - Agenda Maestra</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">Crear {label}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-600">Completa fecha, hora, responsable y visibilidad. El evento quedara vinculado a esta causa y aparecera en Agenda Maestra.</p>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-50" type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-neutral-700">Titulo</span>
            <Input className="h-12 rounded-2xl border-neutral-200" value={form.title} onChange={(event) => onChange({ title: event.target.value })} />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-neutral-700">Descripcion</span>
            <Textarea className="min-h-[110px] rounded-2xl border-neutral-200" value={form.description} onChange={(event) => onChange({ description: event.target.value })} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-700">Fecha</span>
            <Input type="date" className="h-12 rounded-2xl border-neutral-200" value={form.date} onChange={(event) => onChange({ date: event.target.value })} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-700">Hora inicio</span>
            <Input type="time" className="h-12 rounded-2xl border-neutral-200" value={form.startTime} onChange={(event) => onChange({ startTime: event.target.value, endTime: addMinutesIso(form.date, event.target.value, isCobro ? 30 : 60) })} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-700">Hora termino</span>
            <Input type="time" className="h-12 rounded-2xl border-neutral-200" value={form.endTime} onChange={(event) => onChange({ endTime: event.target.value })} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-700">Responsable</span>
            <Input className="h-12 rounded-2xl border-neutral-200" value={form.assignedToName} onChange={(event) => onChange({ assignedToName: event.target.value })} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-700">Cliente vinculado</span>
            <Input className="h-12 rounded-2xl border-neutral-200" value={form.clientName} onChange={(event) => onChange({ clientName: event.target.value })} />
          </label>

          <SelectField label="Estado inicial" value={form.status} onChange={(value) => onChange({ status: value as AgendaEventStatus })} options={[{ value: "pendiente", label: "Pendiente" }, { value: "en_proceso", label: "En proceso" }, { value: "critico", label: "Critico" }]} />
          <SelectField label="Prioridad" value={form.priority} onChange={(value) => onChange({ priority: value as AgendaPriority })} options={[{ value: "baja", label: "Baja" }, { value: "media", label: "Media" }, { value: "alta", label: "Alta" }, { value: "critica", label: "Critica" }]} />

          {(isAudiencia || !isReunion) && !isCobro ? (
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-neutral-700">Ubicacion</span>
              <Input className="h-12 rounded-2xl border-neutral-200" value={form.location} onChange={(event) => onChange({ location: event.target.value })} placeholder="Tribunal, oficina o direccion" />
            </label>
          ) : null}

          {isReunion ? (
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-neutral-700">Link videollamada</span>
              <Input className="h-12 rounded-2xl border-neutral-200" value={form.meetingUrl} onChange={(event) => onChange({ meetingUrl: event.target.value })} placeholder={DEFAULT_MEET_LINK} />
            </label>
          ) : null}

          {isCobro ? (
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-neutral-700">Monto cobro CLP</span>
              <Input type="number" className="h-12 rounded-2xl border-neutral-200" value={form.amount} onChange={(event) => onChange({ amount: event.target.value })} />
            </label>
          ) : null}

          <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              Visible para cliente
              <input type="checkbox" checked={form.visibleToClient} onChange={(event) => onChange({ visibleToClient: event.target.checked })} />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              Avisar responsable
              <input type="checkbox" checked={form.notifyAssignee} onChange={(event) => onChange({ notifyAssignee: event.target.checked })} />
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button onClick={onClose} variant="outline" className="h-11 rounded-2xl border-neutral-200 px-5" disabled={busy}>Cancelar</Button>
          <Button onClick={onSubmit} className="h-11 rounded-2xl bg-neutral-950 px-5 text-white hover:bg-neutral-800" disabled={busy}>
            <Save className="mr-2 h-4 w-4" /> {busy ? "Guardando..." : "Guardar en agenda"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CaseDetailView({ record, timeline, actorId }: Props) {
  const [draft, setDraft] = useState<CaseRecord>(record);
  const [events, setEvents] = useState<TimelineEventRecord[]>(timeline);
  const [newTimelineTitle, setNewTimelineTitle] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [agendaForm, setAgendaForm] = useState<CaseAgendaForm | null>(null);

  const autosaveValue = useMemo<Partial<CaseRecord>>(
    () => ({
      title: draft.title,
      clientName: draft.clientName,
      category: draft.category,
      type: draft.type,
      procedure: draft.procedure,
      description: draft.description,
      status: draft.status,
      stage: draft.stage,
      assignedTo: draft.assignedTo,
      assignedToName: draft.assignedToName,
      nextDeadline: draft.nextDeadline,
      pendingBalance: draft.pendingBalance,
      trackedMinutes: draft.trackedMinutes,
      lastAction: draft.lastAction,
      priority: draft.priority,
    }),
    [draft],
  );

  const { saveState, saveNow, lastSavedAt, hasLocalDraft } = useCaseAutosave({
    caseId: draft.id,
    tenantId: draft.tenantId,
    actorId,
    value: autosaveValue,
  });

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 5000);
  }

  async function postTimeline(payload: {
    title: string;
    description: string;
    type: TimelineType;
    visibleToClient?: boolean;
    createAgendaEvent?: boolean;
    agendaType?: AgendaEventType;
    agendaDate?: string;
    agendaStartAt?: string;
    agendaEndAt?: string;
    agendaStatus?: AgendaEventStatus;
    agendaPriority?: AgendaPriority;
    agendaLocation?: string | null;
    agendaMeetingUrl?: string | null;
    billingAmount?: number;
    createBillingRecord?: boolean;
    notifyAssignee?: boolean;
    clientName?: string;
    assignedToName?: string;
  }) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("No auth token");

    const res = await fetch(`/api/cases/${draft.id}/timeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tenantId: draft.tenantId,
        companyId: draft.companyId ?? null,
        clientId: draft.clientId,
        clientName: payload.clientName ?? draft.clientName,
        createdBy: actorId,
        createdByName: payload.assignedToName ?? draft.assignedToName,
        assignedTo: draft.assignedTo,
        assignedToName: payload.assignedToName ?? draft.assignedToName,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        eventDate: new Date().toISOString(),
        visibleToClient: payload.visibleToClient ?? false,
        createAgendaEvent: payload.createAgendaEvent ?? false,
        agendaTitle: payload.title,
        agendaDescription: payload.description,
        agendaType: payload.agendaType,
        agendaDate: payload.agendaDate,
        agendaStartAt: payload.agendaStartAt,
        agendaEndAt: payload.agendaEndAt,
        agendaStatus: payload.agendaStatus,
        agendaPriority: payload.agendaPriority,
        agendaLocation: payload.agendaLocation,
        agendaMeetingUrl: payload.agendaMeetingUrl,
        notifyClient: payload.visibleToClient ?? false,
        notifyAssignee: payload.notifyAssignee ?? true,
        billingAmount: payload.billingAmount,
        createBillingRecord: payload.createBillingRecord,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo crear hito");
    setEvents((prev) => [...prev, data.timeline].sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
    return data as { timeline: TimelineEventRecord; agendaEvent?: { id: string }; linkedBillingId?: string | null };
  }

  async function createTimelineEvent(title = newTimelineTitle.trim()) {
    if (!title) return;
    setBusyAction("timeline");
    try {
      await postTimeline({ title, description: "Hito creado desde la ficha de la causa.", type: "observacion" });
      setNewTimelineTitle("");
      setDraft((prev) => ({ ...prev, lastAction: title }));
      showNotice("Hito creado correctamente.");
    } finally {
      setBusyAction(null);
    }
  }

  function openAgendaAction(action: CaseAgendaAction) {
    setAgendaForm(makeActionDraft(action, draft));
  }

  async function saveAgendaAction() {
    if (!agendaForm) return;
    if (!agendaForm.title.trim() || !agendaForm.date || !agendaForm.startTime) {
      showNotice("Titulo, fecha y hora inicio son obligatorios.");
      return;
    }

    setBusyAction(agendaForm.action);
    try {
      const startAt = buildDateTime(agendaForm.date, agendaForm.startTime);
      const endAt = buildDateTime(agendaForm.date, agendaForm.endTime || agendaForm.startTime);
      const safeEndAt = endAt <= startAt ? buildDateTime(agendaForm.date, addMinutesIso(agendaForm.date, agendaForm.startTime, 60)) : endAt;
      const result = await postTimeline({
        title: agendaForm.title.trim(),
        description: agendaForm.description.trim() || "Evento creado desde ficha de causa.",
        type: timelineTypeFor(agendaForm.action),
        visibleToClient: agendaForm.visibleToClient,
        createAgendaEvent: true,
        agendaType: agendaTypeFor(agendaForm.action),
        agendaDate: agendaForm.date,
        agendaStartAt: startAt.toISOString(),
        agendaEndAt: safeEndAt.toISOString(),
        agendaStatus: agendaForm.status,
        agendaPriority: agendaForm.priority,
        agendaLocation: agendaForm.location || null,
        agendaMeetingUrl: agendaForm.meetingUrl || null,
        billingAmount: Number(agendaForm.amount || 0),
        createBillingRecord: agendaForm.action === "cobro",
        notifyAssignee: agendaForm.notifyAssignee,
        clientName: agendaForm.clientName,
        assignedToName: agendaForm.assignedToName,
      });

      setDraft((prev) => ({
        ...prev,
        lastAction: agendaForm.title,
        pendingBalance: agendaForm.action === "cobro" ? Number(prev.pendingBalance ?? 0) + Number(agendaForm.amount || 0) : prev.pendingBalance,
        assignedToName: agendaForm.assignedToName,
        clientName: agendaForm.clientName,
      }));
      setAgendaForm(null);
      showNotice(result.agendaEvent?.id ? `Evento creado y visible en Agenda Maestra (${result.agendaEvent.id.slice(0, 8)}).` : "Evento creado.");
    } catch (error) {
      console.error(error);
      showNotice(error instanceof Error ? error.message : "No se pudo crear el evento.");
    } finally {
      setBusyAction(null);
    }
  }

  async function notifyClient() {
    setBusyAction("notify");
    try {
      await postTimeline({ title: "Aviso al cliente", description: "Se registra aviso o comunicacion al cliente.", type: "observacion", visibleToClient: true });
      setDraft((prev) => ({ ...prev, lastAction: "Aviso al cliente" }));
      showNotice("Aviso registrado en timeline.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <CaseAgendaModal form={agendaForm} onClose={() => setAgendaForm(null)} onChange={(patch) => setAgendaForm((prev) => (prev ? { ...prev, ...patch } : prev))} onSubmit={() => void saveAgendaAction()} busy={!!busyAction} />

      {notice ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</div> : null}

      <div className="rounded-[32px] bg-white p-6 shadow-sm dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">{draft.category}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">{draft.title}</h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-slate-400">Cliente: {draft.clientName}</p>
          </div>
          <Button onClick={() => void saveNow()} className="rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800">
            <Save className="mr-2 h-4 w-4" /> {saveLabelFor(saveState)}
          </Button>
        </div>

        <div className="mt-4 text-sm text-neutral-500">
          Ultimo guardado: {lastSavedAt ? new Date(lastSavedAt).toLocaleString() : "sin guardar"}
          {hasLocalDraft ? " - hay borrador local pendiente" : ""}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input className="h-12 rounded-2xl border-neutral-200" value={draft.clientName} onChange={(event) => setDraft((prev) => ({ ...prev, clientName: event.target.value }))} placeholder="Cliente" />
          <Input className="h-12 rounded-2xl border-neutral-200" value={draft.title} onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="Titulo de la causa" />
          <Input className="h-12 rounded-2xl border-neutral-200" value={draft.category} onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))} placeholder="Materia" />
          <Input className="h-12 rounded-2xl border-neutral-200" value={draft.type} onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value }))} placeholder="Tipo" />
          <Input className="h-12 rounded-2xl border-neutral-200" value={draft.procedure} onChange={(event) => setDraft((prev) => ({ ...prev, procedure: event.target.value }))} placeholder="Procedimiento" />
          <Input className="h-12 rounded-2xl border-neutral-200" value={draft.assignedToName} onChange={(event) => setDraft((prev) => ({ ...prev, assignedToName: event.target.value }))} placeholder="Responsable" />
          <Input className="h-12 rounded-2xl border-neutral-200" type="date" value={draft.nextDeadline ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, nextDeadline: event.target.value }))} placeholder="Proximo plazo" />
          <Input className="h-12 rounded-2xl border-neutral-200" type="number" value={draft.pendingBalance ?? 0} onChange={(event) => setDraft((prev) => ({ ...prev, pendingBalance: Number(event.target.value || 0) }))} placeholder="Saldo pendiente" />
          <Input className="h-12 rounded-2xl border-neutral-200" type="number" value={draft.trackedMinutes ?? 0} onChange={(event) => setDraft((prev) => ({ ...prev, trackedMinutes: Number(event.target.value || 0) }))} placeholder="Minutos acumulados" />
          <Input className="h-12 rounded-2xl border-neutral-200 xl:col-span-3" value={draft.lastAction ?? ""} onChange={(event) => setDraft((prev) => ({ ...prev, lastAction: event.target.value }))} placeholder="Ultima accion" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <select className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm dark:bg-slate-950" value={draft.status} onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value as CaseStatus }))}>
            {CASE_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm dark:bg-slate-950" value={draft.stage} onChange={(event) => setDraft((prev) => ({ ...prev, stage: event.target.value as CaseStage }))}>
            {CASE_STAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm dark:bg-slate-950" value={draft.priority || "medium"} onChange={(event) => setDraft((prev) => ({ ...prev, priority: event.target.value as CaseRecord["priority"] }))}>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="critical">Critica</option>
          </select>
        </div>

        <Textarea className="mt-4 min-h-[120px] w-full rounded-2xl border-neutral-200 px-4 py-3" value={draft.description} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} placeholder="Descripcion de la causa" />
      </div>

      <div className="rounded-[32px] bg-white p-6 shadow-sm dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <Button variant="outline" className="rounded-2xl" onClick={() => void createTimelineEvent("Hito operativo creado")} disabled={!!busyAction}><Plus className="mr-2 h-4 w-4" />Crear hito</Button>
          <Button variant="outline" className="rounded-2xl" onClick={() => openAgendaAction("plazo")} disabled={!!busyAction}><Clock3 className="mr-2 h-4 w-4" />Crear plazo</Button>
          <Button variant="outline" className="rounded-2xl" onClick={() => openAgendaAction("reunion")} disabled={!!busyAction}><CalendarDays className="mr-2 h-4 w-4" />Crear reunion</Button>
          <Button variant="outline" className="rounded-2xl" onClick={() => openAgendaAction("audiencia")} disabled={!!busyAction}><Gavel className="mr-2 h-4 w-4" />Crear audiencia</Button>
          <Button variant="outline" className="rounded-2xl" onClick={() => openAgendaAction("cobro")} disabled={!!busyAction}><Wallet className="mr-2 h-4 w-4" />Crear cobro</Button>
          <Button variant="outline" className="rounded-2xl" onClick={() => void notifyClient()} disabled={!!busyAction}><MessageSquare className="mr-2 h-4 w-4" />Avisar cliente</Button>
          <Button variant="outline" className="rounded-2xl" onClick={() => void createTimelineEvent("Informe ultimo movimiento")} disabled={!!busyAction}><FileText className="mr-2 h-4 w-4" />Informe ultimo movimiento</Button>
        </div>
      </div>

      <div className="rounded-[32px] bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">Timeline</h2>
        <div className="mt-4 flex gap-3">
          <Input className="h-12 flex-1 rounded-2xl border-neutral-200" value={newTimelineTitle} onChange={(event) => setNewTimelineTitle(event.target.value)} placeholder="Nuevo hito" />
          <Button onClick={() => void createTimelineEvent()} className="h-12 rounded-2xl bg-neutral-950 px-5 text-white hover:bg-neutral-800">Crear hito</Button>
        </div>

        <div className="mt-6 space-y-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-neutral-500">{new Date(event.eventDate).toLocaleString()}</p>
                  <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">{event.title}</h3>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-white/10 dark:text-slate-300">{event.type}</span>
              </div>
              <p className="mt-2 text-sm text-neutral-600 dark:text-slate-400">{event.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                {event.linkedAgendaEventId ? (
                  <Link href={`/firm/agenda?eventId=${event.linkedAgendaEventId}`} className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 transition hover:bg-emerald-100">
                    Ver en Agenda <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                ) : null}
                {event.linkedBillingId ? <span className="rounded-full bg-white px-3 py-1 text-neutral-500">Cobro: {event.linkedBillingId.slice(0, 12)}</span> : null}
              </div>
            </div>
          ))}
          {events.length === 0 ? <div className="rounded-3xl border border-dashed border-neutral-200 p-8 text-center text-neutral-400">Sin hitos registrados.</div> : null}
        </div>
      </div>
    </div>
  );
}
