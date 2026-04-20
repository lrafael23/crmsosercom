import { randomUUID } from "crypto";
import type { AppointmentRecord, AppointmentSlot, AppointmentStatus, DayAvailability, LawyerSettingsRecord, WeeklyAvailability } from "@/features/appointments/types";
import { createDocument, firestoreFetch, fromFirestoreFields, patchDocument, runQuery, upsertDocument } from "@/lib/firebase/rest-server";

const APPOINTMENTS = "appointments";
const APPOINTMENT_SLOT_LOCKS = "appointment_slot_locks";
const AGENDA = "agenda_events";
const SETTINGS = "lawyer_settings";
const USERS = "users";
const CASES = "cases";
const AUDIT = "audit_logs";

const DEFAULT_MEET_LINK = process.env.NEXT_PUBLIC_DEFAULT_MEET_LINK || "https://meet.google.com/nyz-vuxh-xmu";
const ACTIVE_STATUSES: AppointmentStatus[] = ["pending_payment", "confirmed"];

export const DEFAULT_WEEKLY_AVAILABILITY: WeeklyAvailability = {
  mon: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] },
  tue: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] },
  wed: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] },
  thu: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] },
  fri: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "17:00" }] },
  sat: { enabled: false, slots: [] },
  sun: { enabled: false, slots: [] },
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function nowIso() {
  return new Date().toISOString();
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function buildDateTime(date: string, time: string) {
  const [hour, minute] = normalizeTime(time).split(":").map(Number);
  const value = new Date(`${date}T00:00:00`);
  value.setHours(Number.isFinite(hour) ? hour : 9, Number.isFinite(minute) ? minute : 0, 0, 0);
  return value;
}

function addMinutes(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60_000);
}

function slotKey(lawyerId: string, date: string, time: string) {
  return `${lawyerId}_${date}_${normalizeTime(time).replace(":", "")}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function asWeeklyAvailability(value: unknown): WeeklyAvailability {
  if (!value || typeof value !== "object") return DEFAULT_WEEKLY_AVAILABILITY;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(
    DAY_KEYS.map((day) => {
      const raw = source[day] as Partial<DayAvailability> | undefined;
      return [day, { enabled: Boolean(raw?.enabled), slots: Array.isArray(raw?.slots) ? raw.slots : [] }];
    }),
  ) as WeeklyAvailability;
}

export function asLawyerSettings(row: Record<string, unknown>, lawyerId: string): LawyerSettingsRecord {
  const weeklyAvailability = asWeeklyAvailability(row.weeklyAvailability || row.availability);
  return {
    id: lawyerId,
    lawyerId,
    lawyerName: typeof row.lawyerName === "string" ? row.lawyerName : null,
    tenantId: asString(row.tenantId, "sosercom-main"),
    weeklyAvailability,
    availability: weeklyAvailability,
    blockedDates: Array.isArray(row.blockedDates) ? row.blockedDates.map(String) : [],
    blockedSlots: Array.isArray(row.blockedSlots) ? row.blockedSlots as LawyerSettingsRecord["blockedSlots"] : [],
    slotDurationMinutes: asNumber(row.slotDurationMinutes, 45),
    bufferMinutes: asNumber(row.bufferMinutes, 0),
    monthlyConferenceLimit: typeof row.monthlyConferenceLimit === "number" ? row.monthlyConferenceLimit : null,
    meetingUrl: typeof row.meetingUrl === "string" ? row.meetingUrl : DEFAULT_MEET_LINK,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
  };
}

export function asAppointment(row: Record<string, unknown>): AppointmentRecord {
  const start = asString(row.start, nowIso());
  const date = asString(row.date, start.slice(0, 10));
  return {
    id: asString(row.id),
    tenantId: asString(row.tenantId),
    lawyerId: asString(row.lawyerId),
    lawyerName: asString(row.lawyerName, "Abogado"),
    clientId: asString(row.clientId),
    clientName: asString(row.clientName, "Cliente"),
    caseId: typeof row.caseId === "string" ? row.caseId : null,
    title: asString(row.title, "Videollamada"),
    description: typeof row.description === "string" ? row.description : null,
    start,
    end: asString(row.end, start),
    date,
    time: asString(row.time, start.slice(11, 16)),
    status: (row.status as AppointmentStatus) || "confirmed",
    type: asString(row.type, "videollamada"),
    source: asString(row.source, "client_portal"),
    meetingUrl: asString(row.meetingUrl, DEFAULT_MEET_LINK),
    agendaEventId: typeof row.agendaEventId === "string" ? row.agendaEventId : null,
    createdAt: asString(row.createdAt, nowIso()),
    updatedAt: asString(row.updatedAt, nowIso()),
    visibleToClient: row.visibleToClient !== false,
    visibleToFirm: row.visibleToFirm !== false,
  };
}

async function readDoc(collection: string, id: string, token: string) {
  const raw = await firestoreFetch(`${collection}/${encodeURIComponent(id)}`, token).catch(() => null);
  return raw?.fields ? ({ id, ...fromFirestoreFields(raw.fields) } as Record<string, unknown>) : null;
}

export async function getLawyerProfile(lawyerId: string, token: string) {
  const raw = await readDoc(USERS, lawyerId, token);
  if (!raw) return null;
  return {
    id: lawyerId,
    displayName: asString(raw.displayName, asString(raw.email, "Abogado")),
    email: typeof raw.email === "string" ? raw.email : null,
    tenantId: asString(raw.tenantId, "sosercom-main"),
    role: asString(raw.role),
  };
}

export async function getLawyerSettings(lawyerId: string, token: string) {
  const [settingsRaw, profile] = await Promise.all([readDoc(SETTINGS, lawyerId, token), getLawyerProfile(lawyerId, token)]);
  const settings = asLawyerSettings(settingsRaw || {}, lawyerId);
  return {
    ...settings,
    lawyerName: settings.lawyerName || profile?.displayName || "Abogado",
    tenantId: settingsRaw?.tenantId ? settings.tenantId : profile?.tenantId || settings.tenantId,
  };
}

export async function saveLawyerSettings(params: {
  lawyerId: string;
  actorId: string;
  actorRole: string;
  actorTenantId: string;
  patch: Partial<LawyerSettingsRecord>;
  token: string;
}) {
  const profile = await getLawyerProfile(params.lawyerId, params.token);
  const tenantId = params.patch.tenantId || profile?.tenantId || params.actorTenantId || "sosercom-main";
  const canWrite =
    params.actorRole === "super_admin_global" ||
    params.actorRole === "admin" ||
    params.actorId === params.lawyerId ||
    (["owner_firm", "abogado"].includes(params.actorRole) && tenantId === params.actorTenantId);

  if (!canWrite) throw new Error("Forbidden");

  const weeklyAvailability = asWeeklyAvailability(params.patch.weeklyAvailability || params.patch.availability || DEFAULT_WEEKLY_AVAILABILITY);
  const record = {
    lawyerId: params.lawyerId,
    lawyerName: params.patch.lawyerName || profile?.displayName || null,
    tenantId,
    weeklyAvailability,
    availability: weeklyAvailability,
    blockedDates: Array.isArray(params.patch.blockedDates) ? params.patch.blockedDates : [],
    blockedSlots: Array.isArray(params.patch.blockedSlots) ? params.patch.blockedSlots : [],
    slotDurationMinutes: Number(params.patch.slotDurationMinutes || 45),
    bufferMinutes: Number(params.patch.bufferMinutes || 0),
    monthlyConferenceLimit: typeof params.patch.monthlyConferenceLimit === "number" ? params.patch.monthlyConferenceLimit : null,
    meetingUrl: params.patch.meetingUrl || DEFAULT_MEET_LINK,
    updatedAt: nowIso(),
  };

  await upsertDocument(SETTINGS, params.lawyerId, record, params.token);
  await audit(params.token, { module: "appointments", action_type: "update_lawyer_settings", entity_type: "lawyer_settings", entity_id: params.lawyerId, tenantId, user_id: params.actorId });
  return asLawyerSettings(record, params.lawyerId);
}

export async function listAppointmentsForLawyerDate(params: { lawyerId: string; date: string; token: string }) {
  const rows = await runQuery(APPOINTMENTS, [{ field: "lawyerId", value: params.lawyerId }, { field: "date", value: params.date }], params.token);
  return rows.map(asAppointment);
}

type AppointmentSlotLock = {
  id: string;
  tenantId: string;
  lawyerId: string;
  clientId?: string | null;
  appointmentId?: string | null;
  date: string;
  time: string;
  start: string;
  end: string;
  status: AppointmentStatus;
};

function asSlotLock(row: Record<string, unknown>): AppointmentSlotLock {
  return {
    id: asString(row.id),
    tenantId: asString(row.tenantId),
    lawyerId: asString(row.lawyerId),
    clientId: typeof row.clientId === "string" ? row.clientId : null,
    appointmentId: typeof row.appointmentId === "string" ? row.appointmentId : null,
    date: asString(row.date),
    time: asString(row.time),
    start: asString(row.start),
    end: asString(row.end),
    status: (row.status as AppointmentStatus) || "confirmed",
  };
}

async function listSlotLocksForLawyerDate(params: { lawyerId: string; date: string; token: string }) {
  const rows = await runQuery(APPOINTMENT_SLOT_LOCKS, [{ field: "lawyerId", value: params.lawyerId }, { field: "date", value: params.date }], params.token);
  return rows.map(asSlotLock);
}

function generateSlotsForDate(settings: LawyerSettingsRecord, date: string, locks: AppointmentSlotLock[]): AppointmentSlot[] {
  const dateObj = new Date(`${date}T00:00:00`);
  const dayKey = DAY_KEYS[dateObj.getDay()];
  const dayConfig = settings.weeklyAvailability[dayKey];
  if (!dayConfig?.enabled || settings.blockedDates.includes(date)) return [];

  const duration = settings.slotDurationMinutes || 45;
  const step = duration + (settings.bufferMinutes || 0);
  const now = new Date();
  const activeLocks = locks.filter((lock) => ACTIVE_STATUSES.includes(lock.status));

  const blockedStarts = new Set(settings.blockedSlots.filter((slot) => slot.date === date).map((slot) => normalizeTime(slot.start)));
  const slots: AppointmentSlot[] = [];

  for (const range of dayConfig.slots) {
    let cursor = buildDateTime(date, range.start);
    const rangeEnd = buildDateTime(date, range.end);
    while (addMinutes(cursor, duration).getTime() <= rangeEnd.getTime()) {
      const startIso = cursor.toISOString();
      const end = addMinutes(cursor, duration);
      const time = cursor.toTimeString().slice(0, 5);
      const occupied = activeLocks.some((lock) => lock.start === startIso || lock.time === time);
      const hasNotice = cursor.getTime() > now.getTime() + 24 * 60 * 60 * 1000;
      if (!blockedStarts.has(time) && !occupied && hasNotice) {
        slots.push({ time, start: startIso, end: end.toISOString(), available: true });
      }
      cursor = addMinutes(cursor, step);
    }
  }

  return slots;
}

export async function getAvailability(params: { lawyerId: string; date: string; token: string }) {
  const settings = await getLawyerSettings(params.lawyerId, params.token);
  const locks = await listSlotLocksForLawyerDate({ lawyerId: params.lawyerId, date: params.date, token: params.token });
  const slots = generateSlotsForDate(settings, params.date, locks);
  return { settings, appointments: [], slots };
}

async function clientHasActiveCase(params: { clientId: string; tenantId: string; token: string }) {
  const rows = await runQuery(CASES, [{ field: "clientId", value: params.clientId }, { field: "tenantId", value: params.tenantId }, { field: "visibleToClient", value: true }], params.token).catch(() => []);
  return rows.some((row) => ["active", "in_progress", "hearing", "waiting_client"].includes(String((row as Record<string, unknown>).status || "")));
}

async function audit(token: string, data: Record<string, unknown>) {
  await createDocument(AUDIT, randomUUID(), { id: randomUUID(), timestamp: nowIso(), ...data }, token).catch(() => undefined);
}

export async function createAppointment(params: {
  lawyerId: string;
  clientId: string;
  clientName: string;
  caseId?: string | null;
  title?: string;
  description?: string;
  date: string;
  time: string;
  token: string;
}) {
  const availability = await getAvailability({ lawyerId: params.lawyerId, date: params.date, token: params.token });
  const selected = availability.slots.find((slot) => slot.time === normalizeTime(params.time));
  if (!selected) throw new Error("Slot no disponible");

  const appointmentId = slotKey(params.lawyerId, params.date, params.time);
  const agendaEventId = `agenda_${appointmentId}`;
  const confirmedByCase = await clientHasActiveCase({ clientId: params.clientId, tenantId: availability.settings.tenantId, token: params.token });
  const status: AppointmentStatus = confirmedByCase ? "confirmed" : "pending_payment";
  const now = nowIso();
  const meetingUrl = availability.settings.meetingUrl || DEFAULT_MEET_LINK;

  const appointment: AppointmentRecord = {
    id: appointmentId,
    tenantId: availability.settings.tenantId,
    lawyerId: params.lawyerId,
    lawyerName: availability.settings.lawyerName || "Abogado",
    clientId: params.clientId,
    clientName: params.clientName,
    caseId: params.caseId || null,
    title: params.title || `Videollamada con ${params.clientName}`,
    description: params.description || "Reunion agendada desde el portal cliente.",
    start: selected.start,
    end: selected.end,
    date: params.date,
    time: normalizeTime(params.time),
    status,
    type: "videollamada",
    source: "client_portal",
    meetingUrl,
    agendaEventId,
    createdAt: now,
    updatedAt: now,
    visibleToClient: true,
    visibleToFirm: true,
  };

  await createDocument(APPOINTMENT_SLOT_LOCKS, appointmentId, {
    id: appointmentId,
    tenantId: appointment.tenantId,
    lawyerId: appointment.lawyerId,
    clientId: appointment.clientId,
    appointmentId,
    date: appointment.date,
    time: appointment.time,
    start: appointment.start,
    end: appointment.end,
    status: appointment.status,
    createdAt: now,
    updatedAt: now,
  }, params.token);
  await createDocument(APPOINTMENTS, appointmentId, { ...appointment }, params.token);
  await createDocument(AGENDA, agendaEventId, {
    id: agendaEventId,
    appointmentId,
    tenantId: appointment.tenantId,
    companyId: null,
    caseId: appointment.caseId,
    clientId: appointment.clientId,
    clientName: appointment.clientName,
    clientEmail: null,
    createdBy: appointment.clientId,
    assignedTo: appointment.lawyerId,
    assignedToName: appointment.lawyerName,
    assignedToEmail: null,
    title: appointment.title,
    description: appointment.description,
    type: "videollamada",
    status: "pendiente",
    appointmentStatus: appointment.status,
    priority: "media",
    day: appointment.date,
    date: appointment.date,
    startAt: appointment.start,
    endAt: appointment.end,
    timezone: "America/Santiago",
    location: null,
    meetingUrl,
    notifyClient: true,
    visibleToClient: true,
    notifyAssignee: true,
    emailNotificationStatus: "pending",
    reminderAt: null,
    linkedBillingId: null,
    linkedDeadlineId: null,
    linkedWorkflowStepId: null,
    createdAt: now,
    updatedAt: now,
  }, params.token);
  await audit(params.token, { module: "appointments", action_type: "create_appointment", entity_type: "appointment", entity_id: appointmentId, tenantId: appointment.tenantId, user_id: params.clientId, new_value: appointment });

  return appointment;
}

export async function listAppointments(params: { actorId: string; actorRole: string; actorTenantId?: string | null; token: string }) {
  let rows: Array<Record<string, unknown>> = [];
  if (params.actorRole === "cliente_final" || params.actorRole === "cliente") {
    rows = await runQuery(APPOINTMENTS, [{ field: "clientId", value: params.actorId }], params.token);
  } else if (params.actorRole === "super_admin_global" || params.actorRole === "admin") {
    rows = await runQuery(APPOINTMENTS, [], params.token);
  } else {
    rows = await runQuery(APPOINTMENTS, [{ field: "tenantId", value: params.actorTenantId || "__none__" }], params.token);
  }
  return rows.map(asAppointment).filter((item) => item.visibleToClient || item.visibleToFirm).sort((a, b) => a.start.localeCompare(b.start));
}

export async function updateAppointment(params: {
  appointmentId: string;
  actorId: string;
  actorRole: string;
  actorTenantId?: string | null;
  action: "cancel" | "reschedule" | "complete" | "no_show";
  date?: string;
  time?: string;
  token: string;
}) {
  const raw = await readDoc(APPOINTMENTS, params.appointmentId, params.token);
  if (!raw) throw new Error("Appointment not found");
  const current = asAppointment(raw);
  const isClientOwner = (params.actorRole === "cliente_final" || params.actorRole === "cliente") && current.clientId === params.actorId;
  const isFirmTenant = ["owner_firm", "abogado", "contador", "tributario", "staff"].includes(params.actorRole) && current.tenantId === params.actorTenantId;
  const canUpdate = isClientOwner || isFirmTenant || params.actorRole === "super_admin_global" || params.actorRole === "admin";
  if (!canUpdate) throw new Error("Forbidden");

  const patch: Partial<AppointmentRecord> = { updatedAt: nowIso() };
  const agendaPatch: Record<string, unknown> = { updatedAt: nowIso() };

  if (params.action === "cancel") {
    patch.status = "cancelled";
    agendaPatch.status = "cancelado";
    agendaPatch.appointmentStatus = "cancelled";
  } else if (params.action === "complete") {
    patch.status = "completed";
    agendaPatch.status = "cumplido";
    agendaPatch.appointmentStatus = "completed";
  } else if (params.action === "no_show") {
    patch.status = "no_show";
    agendaPatch.status = "cancelado";
    agendaPatch.appointmentStatus = "no_show";
  } else if (params.action === "reschedule") {
    if (!params.date || !params.time) throw new Error("Fecha y hora requeridas");
    const nextDate = params.date;
    const nextTime = params.time;
    const availability = await getAvailability({ lawyerId: current.lawyerId, date: nextDate, token: params.token });
    const selected = availability.slots.find((slot) => slot.time === normalizeTime(nextTime));
    if (!selected) throw new Error("Slot no disponible");
    patch.date = nextDate;
    patch.time = normalizeTime(nextTime);
    patch.start = selected.start;
    patch.end = selected.end;
    patch.status = "confirmed";
    agendaPatch.date = nextDate;
    agendaPatch.day = nextDate;
    agendaPatch.startAt = selected.start;
    agendaPatch.endAt = selected.end;
    agendaPatch.status = "reprogramado";
    agendaPatch.appointmentStatus = "confirmed";

    await createDocument(APPOINTMENT_SLOT_LOCKS, slotKey(current.lawyerId, nextDate, nextTime), {
      id: slotKey(current.lawyerId, nextDate, nextTime),
      tenantId: current.tenantId,
      lawyerId: current.lawyerId,
      clientId: current.clientId,
      appointmentId: current.id,
      date: nextDate,
      time: normalizeTime(nextTime),
      start: selected.start,
      end: selected.end,
      status: "confirmed",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }, params.token);
    await patchDocument(APPOINTMENT_SLOT_LOCKS, current.id, { status: "cancelled", updatedAt: nowIso() }, params.token).catch(() => undefined);
  }

  await patchDocument(APPOINTMENTS, params.appointmentId, patch as Record<string, unknown>, params.token);
  if (params.action === "cancel" || params.action === "complete" || params.action === "no_show") {
    await patchDocument(APPOINTMENT_SLOT_LOCKS, current.id, { status: patch.status, updatedAt: nowIso() }, params.token).catch(() => undefined);
  }
  if (current.agendaEventId) await patchDocument(AGENDA, current.agendaEventId, agendaPatch, params.token).catch(() => undefined);
  await audit(params.token, { module: "appointments", action_type: params.action, entity_type: "appointment", entity_id: params.appointmentId, tenantId: current.tenantId, user_id: params.actorId, new_value: patch });
  return { ...current, ...patch } as AppointmentRecord;
}
