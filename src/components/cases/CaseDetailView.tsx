"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock3, FileText, Gavel, MessageSquare, Plus, Save, Wallet } from "lucide-react";
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

interface Props {
  record: CaseRecord;
  timeline: TimelineEventRecord[];
  actorId: string;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function nextHourIso() {
  const value = new Date();
  value.setHours(value.getHours() + 1, 0, 0, 0);
  return value.toISOString();
}

function saveLabelFor(state: string) {
  if (state === "saving") return "Guardando...";
  if (state === "saved") return "Guardado";
  if (state === "offline") return "Modo offline";
  if (state === "pending_sync") return "Pendiente de sincronizar";
  if (state === "error") return "Error";
  return "Guardar cambios";
}

export function CaseDetailView({ record, timeline, actorId }: Props) {
  const [draft, setDraft] = useState<CaseRecord>(record);
  const [events, setEvents] = useState<TimelineEventRecord[]>(timeline);
  const [newTimelineTitle, setNewTimelineTitle] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);

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

  async function postTimeline(payload: {
    title: string;
    description: string;
    type: TimelineType;
    visibleToClient?: boolean;
    createAgendaEvent?: boolean;
    agendaType?: "audiencia" | "videollamada" | "tarea" | "plazo" | "cobro" | "recordatorio_cliente" | "reunion_interna";
  }) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("No auth token");

    const start = nextHourIso();
    const res = await fetch(`/api/cases/${draft.id}/timeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tenantId: draft.tenantId,
        clientId: draft.clientId,
        createdBy: actorId,
        createdByName: draft.assignedToName,
        assignedTo: draft.assignedTo,
        assignedToName: draft.assignedToName,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        eventDate: new Date().toISOString(),
        visibleToClient: payload.visibleToClient ?? false,
        createAgendaEvent: payload.createAgendaEvent ?? false,
        agendaTitle: payload.title,
        agendaDescription: payload.description,
        agendaType: payload.agendaType,
        agendaDate: todayDate(),
        agendaStartAt: start,
        agendaEndAt: start,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo crear hito");
    setEvents((prev) => [...prev, data.timeline].sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
  }

  async function createTimelineEvent(title = newTimelineTitle.trim()) {
    if (!title) return;
    setBusyAction("timeline");
    try {
      await postTimeline({ title, description: "Hito creado desde la ficha de la causa.", type: "observacion" });
      setNewTimelineTitle("");
      setDraft((prev) => ({ ...prev, lastAction: title }));
    } finally {
      setBusyAction(null);
    }
  }

  async function createShortcut(type: "plazo" | "reunion" | "audiencia" | "cobro") {
    const config = {
      plazo: { title: "Plazo vinculado a la causa", description: "Plazo operativo creado desde la ficha de la causa.", agendaType: "plazo" as const },
      reunion: { title: "Reunion vinculada a la causa", description: "Reunion creada desde la ficha de la causa.", agendaType: "videollamada" as const },
      audiencia: { title: "Audiencia vinculada a la causa", description: "Audiencia creada desde la ficha de la causa.", agendaType: "audiencia" as const },
      cobro: { title: "Cobro vinculado a la causa", description: "Cobro o insistencia creado desde la ficha de la causa.", agendaType: "cobro" as const },
    }[type];

    setBusyAction(type);
    try {
      await postTimeline({ ...config, type: type === "reunion" ? "reunion" : type, createAgendaEvent: true, visibleToClient: true });
      setDraft((prev) => ({ ...prev, lastAction: config.title }));
    } finally {
      setBusyAction(null);
    }
  }

  async function notifyClient() {
    setBusyAction("notify");
    try {
      await postTimeline({ title: "Aviso al cliente", description: "Se registra aviso o comunicacion al cliente.", type: "observacion", visibleToClient: true });
      setDraft((prev) => ({ ...prev, lastAction: "Aviso al cliente" }));
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-6">
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
          <Button variant="outline" className="rounded-2xl" onClick={() => void createShortcut("plazo")} disabled={!!busyAction}><Clock3 className="mr-2 h-4 w-4" />Crear plazo</Button>
          <Button variant="outline" className="rounded-2xl" onClick={() => void createShortcut("reunion")} disabled={!!busyAction}><CalendarDays className="mr-2 h-4 w-4" />Crear reunion</Button>
          <Button variant="outline" className="rounded-2xl" onClick={() => void createShortcut("audiencia")} disabled={!!busyAction}><Gavel className="mr-2 h-4 w-4" />Crear audiencia</Button>
          <Button variant="outline" className="rounded-2xl" onClick={() => void createShortcut("cobro")} disabled={!!busyAction}><Wallet className="mr-2 h-4 w-4" />Crear cobro</Button>
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
              {event.linkedAgendaEventId ? <p className="mt-2 text-xs font-medium text-emerald-600">Agenda vinculada: {event.linkedAgendaEventId.slice(0, 8)}</p> : null}
            </div>
          ))}
          {events.length === 0 ? <div className="rounded-3xl border border-dashed border-neutral-200 p-8 text-center text-neutral-400">Sin hitos registrados.</div> : null}
        </div>
      </div>
    </div>
  );
}
