"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileWarning,
  Filter,
  FolderOpen,
  Gavel,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  Video,
  Wallet,
  X,
} from "lucide-react";
import { addDays, addMinutes, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth/AuthContext";
import { auth, db } from "@/lib/firebase/client";
import {
  AGENDA_EVENT_STATUSES,
  AGENDA_EVENT_TYPES,
  AGENDA_PRIORITIES,
  agendaTypeMeta,
  canClientCreateAgendaEvent,
  canCreateAgendaEvent,
  canManageAgendaEvent,
  getNextStatus,
  visibleAgendaScope,
  type AgendaClient,
  type AgendaEvent,
  type AgendaEventFormData,
  type AgendaEventStatus,
  type AgendaEventType,
  type AgendaPerson,
  type AgendaPriority,
} from "@/lib/agenda/types";
import { cn } from "@/lib/utils";

type AgendaScope = "firm" | "admin" | "super_admin" | "client";
type AgendaView = "dia" | "semana" | "mes";
type ModalMode = "create" | "edit";

type AgendaCase = {
  id: string;
  title: string;
  tenantId?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  assignedTo?: string | null;
  assignedToName?: string | null;
};

const CHILE_TZ = "America/Santiago";
const DEFAULT_MEET_LINK = process.env.NEXT_PUBLIC_DEFAULT_MEET_LINK || "https://meet.google.com/nyz-vuxh-xmu";

const statusLabels: Record<AgendaEventStatus, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  cumplido: "Cumplido",
  critico: "Critico",
  cancelado: "Cancelado",
  reprogramado: "Reprogramado",
};

const priorityLabels: Record<AgendaPriority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Critica",
};

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function buildDateTime(date: string, time: string) {
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  const value = new Date(`${date}T00:00:00`);
  value.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return value;
}

function timeFromDate(value: Date) {
  return format(value, "HH:mm");
}

function dateKey(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function humanDay(value: Date) {
  const label = format(value, "EEEE d", { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function eventStyles(type: AgendaEventType) {
  return agendaTypeMeta[type]?.block || "border-neutral-200 bg-neutral-100 text-neutral-800";
}

function statusPill(status: AgendaEventStatus) {
  switch (status) {
    case "cumplido":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "critico":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "en_proceso":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "cancelado":
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
    case "reprogramado":
      return "bg-violet-50 text-violet-700 border-violet-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

function eventIcon(type: AgendaEventType) {
  switch (type) {
    case "audiencia":
      return <Gavel className="h-4 w-4" />;
    case "videollamada":
      return <Video className="h-4 w-4" />;
    case "tarea":
      return <CheckCircle2 className="h-4 w-4" />;
    case "plazo":
      return <FileWarning className="h-4 w-4" />;
    case "cobro":
      return <Wallet className="h-4 w-4" />;
    default:
      return <Clock3 className="h-4 w-4" />;
  }
}

function serializeEvent(snapshotId: string, data: Record<string, unknown>): AgendaEvent {
  const startAt = toDate(data.startAt || data.date);
  const endAt = toDate(data.endAt || addMinutes(startAt, 60));
  const type = AGENDA_EVENT_TYPES.includes(data.type as AgendaEventType) ? (data.type as AgendaEventType) : "tarea";
  const status = AGENDA_EVENT_STATUSES.includes(data.status as AgendaEventStatus) ? (data.status as AgendaEventStatus) : "pendiente";
  const priority = AGENDA_PRIORITIES.includes(data.priority as AgendaPriority) ? (data.priority as AgendaPriority) : "media";

  return {
    id: String(data.id || snapshotId),
    tenantId: typeof data.tenantId === "string" ? data.tenantId : null,
    companyId: typeof data.companyId === "string" ? data.companyId : null,
    caseId: typeof data.caseId === "string" ? data.caseId : null,
    clientId: typeof data.clientId === "string" ? data.clientId : null,
    clientName: typeof data.clientName === "string" ? data.clientName : null,
    clientEmail: typeof data.clientEmail === "string" ? data.clientEmail : null,
    createdBy: String(data.createdBy || ""),
    assignedTo: String(data.assignedTo || ""),
    assignedToName: String(data.assignedToName || "Sin asignar"),
    assignedToEmail: typeof data.assignedToEmail === "string" ? data.assignedToEmail : null,
    title: String(data.title || "Evento sin titulo"),
    description: String(data.description || "Sin descripcion"),
    type,
    status,
    priority,
    day: String(data.day || dateKey(startAt)),
    date: String(data.date || dateKey(startAt)),
    startAt,
    endAt,
    timezone: String(data.timezone || CHILE_TZ),
    location: typeof data.location === "string" ? data.location : null,
    meetingUrl: typeof data.meetingUrl === "string" ? data.meetingUrl : null,
    notifyClient: Boolean(data.notifyClient),
    notifyAssignee: data.notifyAssignee !== false,
    emailNotificationStatus: ["pending", "queued", "sent", "failed", "skipped"].includes(String(data.emailNotificationStatus))
      ? (data.emailNotificationStatus as AgendaEvent["emailNotificationStatus"])
      : "pending",
    reminderAt: data.reminderAt ? toDate(data.reminderAt) : null,
    linkedBillingId: typeof data.linkedBillingId === "string" ? data.linkedBillingId : null,
    linkedDeadlineId: typeof data.linkedDeadlineId === "string" ? data.linkedDeadlineId : null,
    linkedWorkflowStepId: typeof data.linkedWorkflowStepId === "string" ? data.linkedWorkflowStepId : null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ShortcutButton({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-45"
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function makeEmptyDraft(date: string, userId: string, userName: string, tenantId: string | null): AgendaEventFormData {
  return {
    tenantId,
    companyId: null,
    caseId: null,
    clientId: null,
    clientName: null,
    clientEmail: null,
    assignedTo: userId,
    assignedToName: userName || "Sin asignar",
    assignedToEmail: null,
    title: "",
    description: "",
    type: "tarea",
    status: "pendiente",
    priority: "media",
    date,
    startTime: "09:00",
    endTime: "10:00",
    timezone: CHILE_TZ,
    location: "",
    meetingUrl: "",
    notifyClient: false,
    notifyAssignee: true,
    reminderAt: "",
    linkedBillingId: "",
    linkedDeadlineId: "",
    linkedWorkflowStepId: "",
  };
}

function EventFormModal({
  open,
  title,
  form,
  people,
  clients,
  cases,
  clientMode,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  form: AgendaEventFormData;
  people: AgendaPerson[];
  clients: AgendaClient[];
  cases: AgendaCase[];
  clientMode: boolean;
  onClose: () => void;
  onChange: (patch: Partial<AgendaEventFormData>) => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Agenda maestra</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Crea o modifica audiencias, videollamadas, tareas, plazos, cobros y tramites ligados al trabajo operativo.
            </p>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-50" type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-neutral-700">Titulo</span>
            <Input
              value={form.title}
              onChange={(event) => onChange({ title: event.target.value })}
              className="h-12 rounded-2xl border-neutral-200"
              placeholder="Ej.: Audiencia preparatoria, videollamada, insistir pago, etc."
            />
          </label>

          <SelectField
            label="Tipo"
            value={form.type}
            onChange={(value) => {
              const type = value as AgendaEventType;
              onChange({ type, meetingUrl: type === "videollamada" && !form.meetingUrl ? DEFAULT_MEET_LINK : form.meetingUrl });
            }}
            options={AGENDA_EVENT_TYPES.map((type) => ({ value: type, label: agendaTypeMeta[type].label }))}
          />

          <SelectField
            label="Estado"
            value={form.status}
            onChange={(value) => onChange({ status: value as AgendaEventStatus })}
            options={AGENDA_EVENT_STATUSES.map((status) => ({ value: status, label: statusLabels[status] }))}
            disabled={clientMode}
          />

          <SelectField
            label="Prioridad"
            value={form.priority}
            onChange={(value) => onChange({ priority: value as AgendaPriority })}
            options={AGENDA_PRIORITIES.map((priority) => ({ value: priority, label: priorityLabels[priority] }))}
            disabled={clientMode}
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-700">Fecha</span>
            <Input value={form.date} onChange={(event) => onChange({ date: event.target.value })} type="date" className="h-12 rounded-2xl border-neutral-200" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-700">Hora inicio</span>
            <Input value={form.startTime} onChange={(event) => onChange({ startTime: event.target.value })} type="time" className="h-12 rounded-2xl border-neutral-200" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-700">Hora termino</span>
            <Input value={form.endTime} onChange={(event) => onChange({ endTime: event.target.value })} type="time" className="h-12 rounded-2xl border-neutral-200" />
          </label>

          <SelectField
            label="Responsable"
            value={form.assignedTo || "manual"}
            onChange={(value) => {
              const person = people.find((item) => item.id === value);
              onChange({
                assignedTo: person?.id || "manual",
                assignedToName: person?.displayName || form.assignedToName || "Sin asignar",
                assignedToEmail: person?.email || null,
              });
            }}
            options={[
              { value: "manual", label: form.assignedToName || "Sin asignar" },
              ...people.map((person) => ({ value: person.id, label: person.displayName })),
            ]}
            disabled={clientMode}
          />

          {!clientMode && (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700">Responsable manual</span>
              <Input
                value={form.assignedToName}
                onChange={(event) => onChange({ assignedToName: event.target.value })}
                className="h-12 rounded-2xl border-neutral-200"
                placeholder="Nombre del abogado o encargado"
              />
            </label>
          )}

          {!clientMode && (
            <SelectField
              label="Cliente"
              value={form.clientId || "none"}
              onChange={(value) => {
                const client = clients.find((item) => item.id === value);
                onChange({ clientId: value === "none" ? null : value, clientName: client?.name || "", clientEmail: client?.email || null });
              }}
              options={[{ value: "none", label: "Sin cliente / interno" }, ...clients.map((client) => ({ value: client.id, label: client.name }))]}
            />
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-700">Cliente manual</span>
            <Input
              value={form.clientName || ""}
              onChange={(event) => onChange({ clientName: event.target.value })}
              className="h-12 rounded-2xl border-neutral-200"
              placeholder="Cliente o empresa"
              disabled={clientMode}
            />
          </label>

          {!clientMode && (
            <SelectField
              label="Causa vinculada"
              value={form.caseId || "none"}
              onChange={(value) => {
                const selectedCase = cases.find((item) => item.id === value);
                if (!selectedCase) {
                  onChange({ caseId: null });
                  return;
                }
                onChange({
                  caseId: selectedCase.id,
                  clientId: selectedCase.clientId || form.clientId,
                  clientName: selectedCase.clientName || form.clientName,
                  assignedTo: selectedCase.assignedTo || form.assignedTo,
                  assignedToName: selectedCase.assignedToName || form.assignedToName,
                });
              }}
              options={[{ value: "none", label: "Sin causa vinculada" }, ...cases.map((item) => ({ value: item.id, label: item.title }))]}
            />
          )}

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-neutral-700">URL de reunion / ubicacion</span>
            <Input
              value={form.type === "videollamada" ? form.meetingUrl || "" : form.location || ""}
              onChange={(event) => (form.type === "videollamada" ? onChange({ meetingUrl: event.target.value }) : onChange({ location: event.target.value }))}
              className="h-12 rounded-2xl border-neutral-200"
              placeholder={form.type === "videollamada" ? DEFAULT_MEET_LINK : "Tribunal, oficina o direccion"}
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-neutral-700">Descripcion</span>
            <textarea
              value={form.description}
              onChange={(event) => onChange({ description: event.target.value })}
              className="min-h-[120px] w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
              placeholder="Describe que se debe hacer, documentos pendientes, si debe enviarse correo o si hay riesgo operativo."
            />
          </label>

          <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              Avisar al cliente
              <input type="checkbox" checked={form.notifyClient} onChange={(event) => onChange({ notifyClient: event.target.checked })} />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              Avisar al responsable
              <input type="checkbox" checked={form.notifyAssignee} onChange={(event) => onChange({ notifyAssignee: event.target.checked })} />
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button onClick={onClose} variant="outline" className="h-11 rounded-2xl border-neutral-200 px-5">
            Cancelar
          </Button>
          <Button onClick={onSubmit} className="h-11 rounded-2xl bg-neutral-950 px-5 text-white hover:bg-neutral-800">
            <Save className="mr-2 h-4 w-4" /> Guardar evento
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AgendaMaestra({ scope = "firm" }: { scope?: AgendaScope }) {
  const { user, loading: authLoading } = useAuth();
  const clientMode = scope === "client" || user?.role === "cliente_final" || user?.role === "cliente";
  const caseBasePath = clientMode ? "/cliente/causas" : "/firm/causas";
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [people, setPeople] = useState<AgendaPerson[]>([]);
  const [clients, setClients] = useState<AgendaClient[]>([]);
  const [cases, setCases] = useState<AgendaCase[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [view, setView] = useState<AgendaView>("semana");
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState<"todos" | AgendaEventType>("todos");
  const [statusFilter, setStatusFilter] = useState<"todos" | AgendaEventStatus>("todos");
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<AgendaEventFormData>(() => makeEmptyDraft(dateKey(new Date()), "", "Sin asignar", null));
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [requestedEventId, setRequestedEventId] = useState<string | null>(null);

  const userName = user?.displayName || user?.email || "Sin asignar";
  const internalCanCreate = canCreateAgendaEvent(user);
  const clientCanCreate = canClientCreateAgendaEvent(user);
  const canCreate = clientMode ? clientCanCreate : internalCanCreate;
  const scopeMode = visibleAgendaScope(user);

  const weekDays = useMemo(() => {
    const start = startOfWeek(weekAnchor, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(start, index);
      return { key: dateKey(date), label: humanDay(date), date };
    });
  }, [weekAnchor]);

  useEffect(() => {
    setRequestedEventId(new URLSearchParams(window.location.search).get("eventId"));
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    setDataLoading(true);

    const constraints = [];
    if (scopeMode === "client") {
      constraints.push(where("clientId", "==", user.uid));
      constraints.push(where("notifyClient", "==", true));
    } else if (scopeMode === "tenant") {
      constraints.push(where("tenantId", "==", user.tenantId || "__none__"));
    }

    const eventsQuery = constraints.length > 0 ? query(collection(db, "agenda_events"), ...constraints) : query(collection(db, "agenda_events"));
    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const next = snapshot.docs.map((item) => serializeEvent(item.id, item.data())).sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
        setEvents(next);
        setSelectedId((current) => current || next[0]?.id || null);
        setDataLoading(false);
      },
      (error) => {
        console.error("[AgendaMaestra] No se pudo leer agenda_events", error);
        setNotice("No pude leer agenda_events. Revisa permisos de Firestore o sesion activa.");
        setDataLoading(false);
      },
    );

    return () => unsubscribe();
  }, [scopeMode, user?.tenantId, user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    async function loadCatalogs() {
      try {
        const usersQuery = scopeMode === "tenant" ? query(collection(db, "users"), where("tenantId", "==", user!.tenantId || "__none__")) : query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);
        const nextPeople: AgendaPerson[] = usersSnapshot.docs
          .map((item) => {
            const data = item.data();
            return {
              id: item.id,
              displayName: String(data.displayName || data.name || data.email || "Usuario"),
              email: typeof data.email === "string" ? data.email : null,
              role: typeof data.role === "string" ? data.role : undefined,
              tenantId: typeof data.tenantId === "string" ? data.tenantId : null,
            };
          })
          .filter((item) => ["super_admin_global", "admin", "owner_firm", "abogado", "contador", "tributario", "staff"].includes(String(item.role)))
          .sort((a, b) => a.displayName.localeCompare(b.displayName));
        setPeople(nextPeople);

        if (!clientMode) {
          const clientsQuery = scopeMode === "tenant" ? query(collection(db, "clients"), where("tenantId", "==", user!.tenantId || "__none__")) : query(collection(db, "clients"));
          const clientsSnapshot = await getDocs(clientsQuery);
          setClients(
            clientsSnapshot.docs
              .map((item) => {
                const data = item.data();
                return {
                  id: item.id,
                  name: String(data.name || data.nombre || data.razonSocial || data.displayName || data.email || "Cliente"),
                  email: typeof data.email === "string" ? data.email : null,
                  tenantId: typeof data.tenantId === "string" ? data.tenantId : null,
                };
              })
              .sort((a, b) => a.name.localeCompare(b.name)),
          );
        }

        const casesQuery =
          scopeMode === "client"
            ? query(collection(db, "cases"), where("clientId", "==", user!.uid))
            : scopeMode === "tenant"
              ? query(collection(db, "cases"), where("tenantId", "==", user!.tenantId || "__none__"))
              : query(collection(db, "cases"));
        const casesSnapshot = await getDocs(casesQuery);
        setCases(
          casesSnapshot.docs.map((item) => {
            const data = item.data();
            return {
              id: item.id,
              title: String(data.title || data.titulo || data.name || `Causa ${item.id.slice(0, 6)}`),
              tenantId: typeof data.tenantId === "string" ? data.tenantId : null,
              clientId: typeof data.clientId === "string" ? data.clientId : null,
              clientName: typeof data.clientName === "string" ? data.clientName : typeof data.cliente === "string" ? data.cliente : null,
              assignedTo: typeof data.assignedTo === "string" ? data.assignedTo : typeof data.asignadoA === "string" ? data.asignadoA : null,
              assignedToName: typeof data.assignedToName === "string" ? data.assignedToName : typeof data.responsable === "string" ? data.responsable : null,
            };
          }),
        );
      } catch (error) {
        console.error("[AgendaMaestra] No se pudieron leer catalogos", error);
      }
    }

    loadCatalogs();
  }, [clientMode, scopeMode, user]);

  const filteredEvents = useMemo(() => {
    const queryText = normalizeText(search.trim());
    return events.filter((event) => {
      const inWeek = weekDays.some((day) => day.key === event.date);
      const searchable = normalizeText(`${event.title} ${event.description} ${event.assignedToName} ${event.clientName || ""} ${event.clientEmail || ""}`);
      const matchesSearch = !queryText || searchable.includes(queryText);
      const matchesOwner = ownerFilter === "todos" || event.assignedToName === ownerFilter || event.assignedTo === ownerFilter;
      const matchesType = typeFilter === "todos" || event.type === typeFilter;
      const matchesStatus = statusFilter === "todos" || event.status === statusFilter;
      return inWeek && matchesSearch && matchesOwner && matchesType && matchesStatus;
    });
  }, [events, ownerFilter, search, statusFilter, typeFilter, weekDays]);

  const selected = useMemo(() => {
    return filteredEvents.find((event) => event.id === selectedId) || filteredEvents[0] || events.find((event) => event.id === selectedId) || null;
  }, [events, filteredEvents, selectedId]);

  const owners = useMemo(() => Array.from(new Set(events.map((event) => event.assignedToName).filter(Boolean))).sort(), [events]);
  const critical = filteredEvents.filter((event) => event.status === "critico" || event.priority === "critica");
  const pending = filteredEvents.filter((event) => event.status === "pendiente" || event.status === "en_proceso" || event.status === "reprogramado");
  const pendingBilling = filteredEvents.filter((event) => event.type === "cobro" && event.status !== "cumplido" && event.status !== "cancelado");

  useEffect(() => {
    if (!requestedEventId || events.length === 0) return;
    const found = events.find((event) => event.id === requestedEventId);
    if (!found) return;
    setSelectedId(found.id);
    setWeekAnchor(found.startAt);
  }, [events, requestedEventId]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 5000);
  }

  function openCreate(prefill?: Partial<AgendaEventFormData>) {
    const base = makeEmptyDraft(prefill?.date || weekDays[0].key, user?.uid || "", userName, user?.tenantId || null);
    const type = prefill?.type || base.type;
    setDraft({
      ...base,
      ...prefill,
      type,
      tenantId: prefill?.tenantId ?? user?.tenantId ?? null,
      clientId: clientMode ? user?.uid || null : prefill?.clientId || null,
      clientName: clientMode ? userName : prefill?.clientName || null,
      clientEmail: clientMode ? user?.email || null : prefill?.clientEmail || null,
      status: clientMode ? "pendiente" : prefill?.status || base.status,
      meetingUrl: type === "videollamada" ? prefill?.meetingUrl || DEFAULT_MEET_LINK : prefill?.meetingUrl || "",
      notifyClient: clientMode ? true : Boolean(prefill?.notifyClient),
    });
    setModalMode("create");
    setIsModalOpen(true);
  }

  function openEdit() {
    if (!selected) return;
    if (!canManageAgendaEvent(user, selected)) {
      showNotice("No tienes permisos para modificar este evento.");
      return;
    }
    setDraft({
      id: selected.id,
      tenantId: selected.tenantId,
      companyId: selected.companyId || null,
      caseId: selected.caseId || null,
      clientId: selected.clientId || null,
      clientName: selected.clientName || null,
      clientEmail: selected.clientEmail || null,
      assignedTo: selected.assignedTo,
      assignedToName: selected.assignedToName,
      assignedToEmail: selected.assignedToEmail || null,
      title: selected.title,
      description: selected.description,
      type: selected.type,
      status: selected.status,
      priority: selected.priority,
      date: selected.date,
      startTime: timeFromDate(selected.startAt),
      endTime: timeFromDate(selected.endAt),
      timezone: selected.timezone,
      location: selected.location || "",
      meetingUrl: selected.meetingUrl || "",
      notifyClient: selected.notifyClient,
      notifyAssignee: selected.notifyAssignee,
      reminderAt: selected.reminderAt ? format(selected.reminderAt, "yyyy-MM-dd'T'HH:mm") : "",
      linkedBillingId: selected.linkedBillingId || "",
      linkedDeadlineId: selected.linkedDeadlineId || "",
      linkedWorkflowStepId: selected.linkedWorkflowStepId || "",
    });
    setModalMode("edit");
    setIsModalOpen(true);
  }

  function eventPayload(form: AgendaEventFormData) {
    const startAt = buildDateTime(form.date, form.startTime);
    const endAt = buildDateTime(form.date, form.endTime || form.startTime);
    const safeEndAt = endAt <= startAt ? addMinutes(startAt, 60) : endAt;
    return {
      tenantId: form.tenantId || null,
      companyId: form.companyId || null,
      caseId: form.caseId || null,
      clientId: form.clientId || null,
      clientName: form.clientName?.trim() || null,
      clientEmail: form.clientEmail || null,
      assignedTo: form.assignedTo || "manual",
      assignedToName: form.assignedToName?.trim() || "Sin asignar",
      assignedToEmail: form.assignedToEmail || null,
      title: form.title.trim() || "Nuevo evento",
      description: form.description.trim() || "Sin descripcion",
      type: form.type,
      status: form.status,
      priority: form.priority,
      day: form.date,
      date: form.date,
      startAt,
      endAt: safeEndAt,
      timezone: form.timezone || CHILE_TZ,
      location: form.location?.trim() || null,
      meetingUrl: form.type === "videollamada" ? form.meetingUrl?.trim() || DEFAULT_MEET_LINK : form.meetingUrl?.trim() || null,
      notifyClient: Boolean(form.notifyClient),
      notifyAssignee: Boolean(form.notifyAssignee),
      emailNotificationStatus: "pending" as const,
      reminderAt: form.reminderAt ? new Date(form.reminderAt) : null,
      linkedBillingId: form.linkedBillingId || null,
      linkedDeadlineId: form.linkedDeadlineId || null,
      linkedWorkflowStepId: form.linkedWorkflowStepId || null,
    };
  }

  async function writeActivity(eventId: string, action: string, oldValue?: unknown, newValue?: unknown) {
    if (!user?.uid) return;
    const payload = {
      eventId,
      action,
      actorId: user.uid,
      actorRole: user.role,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      tenantId: user.tenantId || null,
      createdAt: serverTimestamp(),
    };
    await Promise.allSettled([
      addDoc(collection(db, "agenda_activity_logs"), payload),
      addDoc(collection(db, "audit_logs"), {
        module: "agenda_maestra",
        entity: "agenda_events",
        entityId: eventId,
        action,
        actorId: user.uid,
        actorRole: user.role,
        oldValue: oldValue ?? null,
        newValue: newValue ?? null,
        createdAt: serverTimestamp(),
      }),
    ]);
  }

  async function saveCreate() {
    if (!user?.uid || !canCreate) return;
    setBusy(true);
    try {
      const ref = doc(collection(db, "agenda_events"));
      const payload = eventPayload(draft);
      await setDoc(ref, {
        id: ref.id,
        ...payload,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await writeActivity(ref.id, "create", null, payload);
      setSelectedId(ref.id);
      setIsModalOpen(false);
      showNotice("Evento creado correctamente.");
    } catch (error) {
      console.error("[AgendaMaestra] Error creando evento", error);
      showNotice("No se pudo crear el evento. Revisa permisos o conexion.");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!selected || !canManageAgendaEvent(user, selected)) return;
    setBusy(true);
    try {
      const payload = eventPayload(draft);
      await updateDoc(doc(db, "agenda_events", selected.id), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
      await writeActivity(selected.id, "update", selected, payload);
      setIsModalOpen(false);
      showNotice("Evento actualizado.");
    } catch (error) {
      console.error("[AgendaMaestra] Error editando evento", error);
      showNotice("No se pudo actualizar el evento.");
    } finally {
      setBusy(false);
    }
  }

  async function removeSelected() {
    if (!selected || !canManageAgendaEvent(user, selected)) return;
    const ok = window.confirm(`Eliminar "${selected.title}"? Esta accion queda auditada.`);
    if (!ok) return;
    setBusy(true);
    try {
      await writeActivity(selected.id, "delete", selected, null);
      await deleteDoc(doc(db, "agenda_events", selected.id));
      setSelectedId(filteredEvents.find((event) => event.id !== selected.id)?.id || null);
      showNotice("Evento eliminado.");
    } catch (error) {
      console.error("[AgendaMaestra] Error eliminando evento", error);
      showNotice("No se pudo eliminar el evento.");
    } finally {
      setBusy(false);
    }
  }

  async function duplicateSelected() {
    if (!selected || !canCreate) return;
    setBusy(true);
    try {
      const ref = doc(collection(db, "agenda_events"));
      const payload = {
        ...selected,
        id: ref.id,
        title: `${selected.title} (copia)`,
        status: "pendiente" as AgendaEventStatus,
        createdBy: user?.uid || selected.createdBy,
        emailNotificationStatus: "pending" as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, payload);
      await writeActivity(ref.id, "duplicate", selected.id, payload);
      setSelectedId(ref.id);
      showNotice("Evento duplicado.");
    } catch (error) {
      console.error("[AgendaMaestra] Error duplicando evento", error);
      showNotice("No se pudo duplicar el evento.");
    } finally {
      setBusy(false);
    }
  }

  async function markProgress(event = selected) {
    if (!event || !canManageAgendaEvent(user, event)) return;
    const nextStatus = getNextStatus(event.status);
    if (nextStatus === event.status) return;
    try {
      await updateDoc(doc(db, "agenda_events", event.id), { status: nextStatus, updatedAt: serverTimestamp() });
      await writeActivity(event.id, "status_change", event.status, nextStatus);
      showNotice(`Estado actualizado a ${statusLabels[nextStatus]}.`);
    } catch (error) {
      console.error("[AgendaMaestra] Error marcando avance", error);
      showNotice("No se pudo marcar avance.");
    }
  }

  async function reassignSelected(nextOwnerId: string) {
    if (!selected || !canManageAgendaEvent(user, selected)) return;
    const person = people.find((item) => item.id === nextOwnerId);
    if (!person) return;
    try {
      await updateDoc(doc(db, "agenda_events", selected.id), {
        assignedTo: person.id,
        assignedToName: person.displayName,
        assignedToEmail: person.email || null,
        updatedAt: serverTimestamp(),
      });
      await writeActivity(selected.id, "reassign", selected.assignedTo, person.id);
      showNotice("Responsable reasignado.");
    } catch (error) {
      console.error("[AgendaMaestra] Error reasignando", error);
      showNotice("No se pudo reasignar responsable.");
    }
  }

  async function sendNotification() {
    if (!selected) return;
    setBusy(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("No auth token");
      const recipients = [selected.notifyAssignee ? selected.assignedToEmail : null, selected.notifyClient ? selected.clientEmail : null].filter(Boolean);
      const response = await fetch("/api/agenda/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          eventId: selected.id,
          eventTitle: selected.title,
          type: selected.type,
          status: selected.status,
          recipients,
          subject: `Portal 360 - ${selected.title}`,
          message: selected.description,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "notify failed");
      await updateDoc(doc(db, "agenda_events", selected.id), {
        emailNotificationStatus: result.emailStatus || "queued",
        updatedAt: serverTimestamp(),
      });
      await writeActivity(selected.id, "email", null, result.emailStatus || "queued");
      showNotice(result.emailStatus === "sent" ? "Correo enviado." : "Correo encolado o registrado.");
    } catch (error) {
      console.error("[AgendaMaestra] Error enviando correo", error);
      showNotice("No se pudo enviar el correo. Si falta RESEND_API_KEY, queda pendiente en cola.");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || dataLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-[32px] bg-white text-neutral-500">
        <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Cargando Agenda Maestra...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <EventFormModal
        open={isModalOpen}
        title={modalMode === "create" ? "Crear nuevo evento" : "Editar evento"}
        form={draft}
        people={people}
        clients={clients}
        cases={cases}
        clientMode={clientMode}
        onClose={() => setIsModalOpen(false)}
        onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        onSubmit={modalMode === "create" ? saveCreate : saveEdit}
      />

      <div className="mx-auto max-w-[1500px] px-3 py-4 md:px-6 md:py-8">
        {notice && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {notice}
          </div>
        )}

        <div className="mb-6 rounded-[32px] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Portal 360 - Agenda maestra</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Calendario operativo con flujo vertical</h1>
              <p className="mt-3 max-w-4xl text-base leading-7 text-neutral-600">
                Gestiona tareas, plazos, audiencias, videollamadas, cobros y tramites desde una sola vista semanal conectada a Firestore.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button disabled={!canCreate || busy} className="h-11 rounded-2xl bg-neutral-950 px-5 text-white hover:bg-neutral-800" onClick={() => openCreate()}>
                <Plus className="mr-2 h-4 w-4" /> Crear evento
              </Button>
              <Button variant="outline" className="h-11 rounded-2xl border-neutral-200 px-5" onClick={sendNotification} disabled={!selected || busy}>
                <Bell className="mr-2 h-4 w-4" /> Avisos
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-neutral-100 p-3">
                <CalendarDays className="h-5 w-5 text-neutral-700" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Semana del {format(weekDays[0].date, "d", { locale: es })} al {format(weekDays[6].date, "d 'de' MMMM", { locale: es })}
                </h2>
                <p className="text-sm text-neutral-500">Vista semanal con click directo a cada audiencia, plazo, tarea o videollamada.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="h-10 rounded-2xl border-neutral-200" onClick={() => setWeekAnchor((prev) => subWeeks(prev, 1))}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Semana anterior
              </Button>
              <Button variant="outline" className="h-10 rounded-2xl border-neutral-200" onClick={() => setWeekAnchor(new Date())}>
                Hoy
              </Button>
              <Button variant="outline" className="h-10 rounded-2xl border-neutral-200" onClick={() => setWeekAnchor((prev) => addWeeks(prev, 1))}>
                Semana siguiente <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[0.7fr_1fr_0.9fr]">
            <div className="flex flex-wrap items-end gap-3">
              <Tabs value={view} onValueChange={(value) => setView(value as AgendaView)}>
                <TabsList className="rounded-2xl bg-neutral-100 p-1">
                  <TabsTrigger value="dia" className="rounded-xl px-4">Dia</TabsTrigger>
                  <TabsTrigger value="semana" className="rounded-xl px-4">Semana</TabsTrigger>
                  <TabsTrigger value="mes" className="rounded-xl px-4">Mes</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" className="h-10 rounded-2xl border-neutral-200" onClick={() => setStatusFilter(statusFilter === "todos" ? "critico" : "todos")}>
                <Filter className="mr-2 h-4 w-4" /> Filtros
              </Button>
            </div>

            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar audiencia, tarea, cliente, plazo o abogado"
                className="h-12 rounded-2xl border-neutral-200 pl-9"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <SelectField label="Responsable" value={ownerFilter} onChange={setOwnerFilter} options={[{ value: "todos", label: "Todos" }, ...owners.map((owner) => ({ value: owner, label: owner }))]} />
              <SelectField label="Tipo" value={typeFilter} onChange={(value) => setTypeFilter(value as "todos" | AgendaEventType)} options={[{ value: "todos", label: "Todos" }, ...AGENDA_EVENT_TYPES.map((type) => ({ value: type, label: agendaTypeMeta[type].label }))]} />
              <SelectField label="Estado" value={statusFilter} onChange={(value) => setStatusFilter(value as "todos" | AgendaEventStatus)} options={[{ value: "todos", label: "Todos" }, ...AGENDA_EVENT_STATUSES.map((status) => ({ value: status, label: statusLabels[status] }))]} />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-[28px] border border-neutral-200">
            <div className="grid min-w-[1200px] grid-cols-7 bg-neutral-50">
              {weekDays.map((day) => {
                const dayEvents = filteredEvents.filter((event) => event.date === day.key);
                return (
                  <div key={day.key} className="min-h-[330px] border-r border-neutral-200 px-4 py-4 last:border-r-0">
                    <p className="text-sm font-semibold text-neutral-900">{day.label}</p>
                    <div className="mt-4 space-y-3">
                      {dayEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => setSelectedId(event.id)}
                          className={cn("w-full rounded-2xl border p-3 text-left transition", eventStyles(event.type), selected?.id === event.id ? "ring-2 ring-neutral-900/15" : "hover:opacity-90")}
                          type="button"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em]">
                              {eventIcon(event.type)}
                              <span>{timeFromDate(event.startAt)}</span>
                            </div>
                            <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", statusPill(event.status))}>{statusLabels[event.status]}</span>
                          </div>
                          <p className="mt-2 text-sm font-semibold leading-5">{event.title}</p>
                          {event.clientName && <p className="mt-1 text-xs leading-5 opacity-80">{event.clientName}</p>}
                        </button>
                      ))}
                      {dayEvents.length === 0 && canCreate && (
                        <button
                          type="button"
                          onClick={() => openCreate({ date: day.key })}
                          className="w-full rounded-2xl border border-dashed border-neutral-200 bg-white px-3 py-4 text-sm text-neutral-400 transition hover:border-neutral-300 hover:text-neutral-600"
                        >
                          + Crear evento en este dia
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-8">
            <ShortcutButton icon={<Plus className="h-4 w-4" />} label="Crear tarea" onClick={() => openCreate({ type: "tarea" })} disabled={!canCreate || busy} />
            <ShortcutButton icon={<Gavel className="h-4 w-4" />} label="Crear audiencia" onClick={() => openCreate({ type: "audiencia", priority: "alta" })} disabled={!canCreate || busy || clientMode} />
            <ShortcutButton icon={<Video className="h-4 w-4" />} label="Agendar videollamada" onClick={() => openCreate({ type: "videollamada", meetingUrl: DEFAULT_MEET_LINK, notifyClient: true })} disabled={!canCreate || busy} />
            <ShortcutButton icon={<Wallet className="h-4 w-4" />} label="Crear cobro" onClick={() => openCreate({ type: "cobro" })} disabled={!canCreate || busy || clientMode} />
            <ShortcutButton icon={<Pencil className="h-4 w-4" />} label="Modificar" onClick={openEdit} disabled={!selected || busy || clientMode} />
            <ShortcutButton icon={<Save className="h-4 w-4" />} label="Guardar" onClick={openEdit} disabled={!selected || busy || clientMode} />
            <ShortcutButton icon={<Trash2 className="h-4 w-4" />} label="Eliminar" onClick={removeSelected} disabled={!selected || busy || clientMode} />
            <ShortcutButton icon={<MoreHorizontal className="h-4 w-4" />} label="Duplicar" onClick={duplicateSelected} disabled={!selected || busy || clientMode} />
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <Card className="rounded-[32px] border-neutral-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl tracking-tight">Pendientes y trabajo por hacer</CardTitle>
              <CardDescription>Despues del calendario, revisas tareas, plazos, cobros y causas que necesitan accion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pending.map((item) => (
                <div key={item.id} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-700">
                        {eventIcon(item.type)}
                        <span>{timeFromDate(item.startAt)}</span>
                        <span>-</span>
                        <span>{humanDay(item.startAt)}</span>
                        <span className={cn("rounded-full border px-2 py-0.5 text-xs", statusPill(item.status))}>{statusLabels[item.status]}</span>
                      </div>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight text-neutral-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">{item.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm text-neutral-500">
                        <span className="rounded-full bg-white px-3 py-1">Responsable: {item.assignedToName}</span>
                        {item.clientName && <span className="rounded-full bg-white px-3 py-1">Cliente: {item.clientName}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="h-10 rounded-2xl border-neutral-200" onClick={() => setSelectedId(item.id)}>Ver</Button>
                      <Button
                        variant="outline"
                        className="h-10 rounded-2xl border-neutral-200"
                        onClick={() => {
                          setSelectedId(item.id);
                          window.setTimeout(openEdit, 0);
                        }}
                        disabled={clientMode}
                      >
                        Editar
                      </Button>
                      <Button className="h-10 rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800" onClick={() => markProgress(item)} disabled={clientMode}>
                        Marcar avance
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {pending.length === 0 && <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-400">No hay pendientes con los filtros actuales.</div>}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-neutral-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl tracking-tight">Criticos de la semana</CardTitle>
              <CardDescription>Audiencias, vencimientos o clientes que necesitan atencion inmediata.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {critical.map((item) => (
                <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-left transition hover:opacity-95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-rose-700">
                      {eventIcon(item.type)}
                      <span>{timeFromDate(item.startAt)}</span>
                    </div>
                    <span className={cn("rounded-full border px-2 py-1 text-xs font-medium", statusPill(item.status))}>{statusLabels[item.status]}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-rose-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-rose-900/80">{item.description}</p>
                </button>
              ))}
              {critical.length === 0 && <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-400 md:col-span-2">No hay criticos con los filtros actuales.</div>}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-neutral-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl tracking-tight">Detalle del evento seleccionado</CardTitle>
              <CardDescription>Al hacer click en el calendario, aqui ves el detalle completo y acciones rapidas.</CardDescription>
            </CardHeader>
            <CardContent>
              {selected ? (
                <div className={cn("rounded-[28px] border p-5", eventStyles(selected.type))}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.16em]">
                      {eventIcon(selected.type)}
                      <span>{agendaTypeMeta[selected.type].label}</span>
                    </div>
                    <a href={selected.caseId ? `${caseBasePath}/${selected.caseId}` : "#"} className="rounded-2xl border border-current/20 bg-white/70 p-2" aria-label={selected.caseId ? "Abrir causa" : "Abrir ficha completa"}>
                      <MoreHorizontal className="h-4 w-4" />
                    </a>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight">{selected.title}</h3>
                  <p className="mt-3 text-sm leading-7 opacity-90">{selected.description}</p>
                  <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl bg-white/70 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] opacity-70">Fecha y hora</p>
                      <p className="mt-2 text-base font-semibold">{humanDay(selected.startAt)} - {timeFromDate(selected.startAt)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] opacity-70">Responsable</p>
                      <p className="mt-2 text-base font-semibold">{selected.assignedToName}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] opacity-70">Cliente</p>
                      <p className="mt-2 text-base font-semibold">{selected.clientName || "Interno"}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] opacity-70">Estado</p>
                      <p className="mt-2 text-base font-semibold">{statusLabels[selected.status]}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <a
                      href={selected.caseId ? `${caseBasePath}/${selected.caseId}` : selected.meetingUrl || "#"}
                      target={selected.meetingUrl ? "_blank" : undefined}
                      rel="noreferrer"
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
                    >
                      {selected.caseId ? "Abrir causa" : "Abrir ficha completa"} <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                    <Button variant="outline" className="h-11 rounded-2xl border-neutral-300 bg-white/70" onClick={openEdit} disabled={clientMode}>Editar / reagendar</Button>
                    <SelectField
                      label="Asignar responsable"
                      value={selected.assignedTo}
                      onChange={reassignSelected}
                      options={[{ value: selected.assignedTo, label: selected.assignedToName }, ...people.map((person) => ({ value: person.id, label: person.displayName }))]}
                      disabled={clientMode}
                    />
                    <Button variant="outline" className="h-11 rounded-2xl border-neutral-300 bg-white/70" onClick={sendNotification} disabled={busy}>
                      <Mail className="mr-2 h-4 w-4" /> Enviar correo
                    </Button>
                    <Button variant="outline" className="h-11 rounded-2xl border-neutral-300 bg-white/70" onClick={() => markProgress()} disabled={clientMode}>Marcar avance</Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-[28px] border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-400">No hay evento seleccionado.</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-neutral-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl tracking-tight">Indicadores rapidos</CardTitle>
              <CardDescription>Resumen operativo de la semana filtrada.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center gap-2 text-sm text-neutral-500"><AlertTriangle className="h-4 w-4" /> Criticos</div>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{critical.length}</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center gap-2 text-sm text-neutral-500"><FolderOpen className="h-4 w-4" /> Pendientes</div>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{pending.length}</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center gap-2 text-sm text-neutral-500"><Users className="h-4 w-4" /> Responsables visibles</div>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{owners.length}</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center gap-2 text-sm text-neutral-500"><Wallet className="h-4 w-4" /> Cobros pendientes</div>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{pendingBilling.length}</p>
              </div>
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center gap-2 text-sm text-neutral-500"><CalendarDays className="h-4 w-4" /> Total eventos</div>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{filteredEvents.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
