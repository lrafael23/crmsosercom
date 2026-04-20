"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BlockedSlot, LawyerSettingsRecord, WeeklyAvailability } from "@/features/appointments/types";
import { auth } from "@/lib/firebase/client";

const DAYS: Array<{ key: keyof WeeklyAvailability & string; label: string }> = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miercoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sabado" },
  { key: "sun", label: "Domingo" },
];

const DEFAULT_AVAILABILITY: WeeklyAvailability = {
  mon: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] },
  tue: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] },
  wed: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] },
  thu: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] },
  fri: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "17:00" }] },
  sat: { enabled: false, slots: [] },
  sun: { enabled: false, slots: [] },
};

export function LawyerAvailabilityPanel({ lawyerId }: { lawyerId: string }) {
  const [settings, setSettings] = useState<LawyerSettingsRecord | null>(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability>(DEFAULT_AVAILABILITY);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(45);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [monthlyConferenceLimit, setMonthlyConferenceLimit] = useState(25);
  const [meetingUrl, setMeetingUrl] = useState("https://meet.google.com/nyz-vuxh-xmu");
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedSlot, setNewBlockedSlot] = useState<BlockedSlot>({ date: "", start: "09:00", end: "09:45" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const enabledDays = useMemo(() => DAYS.filter((day) => weeklyAvailability[day.key]?.enabled).length, [weeklyAvailability]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Sesion no disponible");
        const res = await fetch(`/api/lawyer-settings/${encodeURIComponent(lawyerId)}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo cargar disponibilidad");
        const record = data.settings as LawyerSettingsRecord;
        setSettings(record);
        setWeeklyAvailability(record.weeklyAvailability || DEFAULT_AVAILABILITY);
        setBlockedDates(record.blockedDates || []);
        setBlockedSlots(record.blockedSlots || []);
        setSlotDurationMinutes(record.slotDurationMinutes || 45);
        setBufferMinutes(record.bufferMinutes || 0);
        setMonthlyConferenceLimit(record.monthlyConferenceLimit || 25);
        setMeetingUrl(record.meetingUrl || "https://meet.google.com/nyz-vuxh-xmu");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [lawyerId]);

  function toggleDay(day: string) {
    setWeeklyAvailability((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day]?.enabled, slots: prev[day]?.slots || [] } }));
  }

  function updateSlot(day: string, index: number, field: "start" | "end", value: string) {
    setWeeklyAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], slots: prev[day].slots.map((slot, idx) => idx === index ? { ...slot, [field]: value } : slot) },
    }));
  }

  function addSlot(day: string) {
    setWeeklyAvailability((prev) => ({ ...prev, [day]: { ...prev[day], enabled: true, slots: [...(prev[day]?.slots || []), { start: "09:00", end: "10:00" }] } }));
  }

  function removeSlot(day: string, index: number) {
    setWeeklyAvailability((prev) => ({ ...prev, [day]: { ...prev[day], slots: prev[day].slots.filter((_, idx) => idx !== index) } }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sesion no disponible");
      const res = await fetch(`/api/lawyer-settings/${encodeURIComponent(lawyerId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ weeklyAvailability, blockedDates, blockedSlots, slotDurationMinutes, bufferMinutes, monthlyConferenceLimit, meetingUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo guardar");
      setSettings(data.settings);
      setMessage("Disponibilidad guardada correctamente");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="rounded-[32px] bg-white p-10 text-center text-neutral-500 shadow-sm">Cargando disponibilidad...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Portal 360 · Disponibilidad</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-950">Agendamiento cliente → estudio</h1>
            <p className="mt-3 max-w-4xl text-base leading-7 text-neutral-600">
              Define horarios, bloqueos y duracion de videollamadas. Estos slots son los que vera el cliente al agendar.
            </p>
          </div>
          <Button onClick={() => void save()} disabled={saving} className="h-11 rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800">
            <Save className="mr-2 h-4 w-4" /> {saving ? "Guardando..." : "Guardar disponibilidad"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Dias activos</p><p className="mt-2 text-3xl font-semibold">{enabledDays}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Duracion base</p><p className="mt-2 text-3xl font-semibold">{slotDurationMinutes} min</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Bloqueos</p><p className="mt-2 text-3xl font-semibold">{blockedDates.length + blockedSlots.length}</p></div>
      </div>

      {message && <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 shadow-sm">{message}</div>}

      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block"><span className="mb-2 block text-sm font-medium text-neutral-700">Duracion reunion</span><Input type="number" value={slotDurationMinutes} onChange={(e) => setSlotDurationMinutes(Number(e.target.value || 45))} className="h-12 rounded-2xl border-neutral-200" /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-neutral-700">Buffer minutos</span><Input type="number" value={bufferMinutes} onChange={(e) => setBufferMinutes(Number(e.target.value || 0))} className="h-12 rounded-2xl border-neutral-200" /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-neutral-700">Tope mensual</span><Input type="number" value={monthlyConferenceLimit} onChange={(e) => setMonthlyConferenceLimit(Number(e.target.value || 0))} className="h-12 rounded-2xl border-neutral-200" /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-neutral-700">Meet fijo</span><Input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} className="h-12 rounded-2xl border-neutral-200" /></label>
        </div>
      </div>

      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Semana tipo</h2>
        <div className="mt-6 space-y-4">
          {DAYS.map((day) => (
            <div key={day.key} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <label className="flex min-w-40 items-center gap-3 text-sm font-semibold text-neutral-900">
                  <input type="checkbox" checked={weeklyAvailability[day.key]?.enabled || false} onChange={() => toggleDay(day.key)} className="h-5 w-5" /> {day.label}
                </label>
                <div className="flex-1 space-y-3">
                  {(weeklyAvailability[day.key]?.slots || []).map((slot, index) => (
                    <div key={`${day.key}-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <Input type="time" value={slot.start} onChange={(e) => updateSlot(day.key, index, "start", e.target.value)} className="h-11 rounded-2xl border-neutral-200 bg-white" />
                      <Input type="time" value={slot.end} onChange={(e) => updateSlot(day.key, index, "end", e.target.value)} className="h-11 rounded-2xl border-neutral-200 bg-white" />
                      <Button variant="outline" onClick={() => removeSlot(day.key, index)} className="h-11 rounded-2xl border-neutral-200"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => addSlot(day.key)} className="h-10 rounded-2xl border-neutral-200"><Plus className="mr-2 h-4 w-4" /> Agregar bloque</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[32px] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Fechas bloqueadas</h2>
          <div className="mt-4 flex gap-3">
            <Input type="date" value={newBlockedDate} onChange={(e) => setNewBlockedDate(e.target.value)} className="h-12 rounded-2xl border-neutral-200" />
            <Button onClick={() => { if (newBlockedDate && !blockedDates.includes(newBlockedDate)) setBlockedDates((prev) => [...prev, newBlockedDate]); setNewBlockedDate(""); }} className="h-12 rounded-2xl bg-neutral-950 text-white"><CalendarDays className="mr-2 h-4 w-4" /> Bloquear</Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">{blockedDates.map((date) => <button key={date} onClick={() => setBlockedDates((prev) => prev.filter((item) => item !== date))} className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700">{date} ×</button>)}</div>
        </div>
        <div className="rounded-[32px] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Franjas bloqueadas</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_0.7fr_0.7fr_auto]">
            <Input type="date" value={newBlockedSlot.date} onChange={(e) => setNewBlockedSlot((p) => ({ ...p, date: e.target.value }))} className="h-12 rounded-2xl border-neutral-200" />
            <Input type="time" value={newBlockedSlot.start} onChange={(e) => setNewBlockedSlot((p) => ({ ...p, start: e.target.value }))} className="h-12 rounded-2xl border-neutral-200" />
            <Input type="time" value={newBlockedSlot.end || ""} onChange={(e) => setNewBlockedSlot((p) => ({ ...p, end: e.target.value }))} className="h-12 rounded-2xl border-neutral-200" />
            <Button onClick={() => { if (newBlockedSlot.date && newBlockedSlot.start) setBlockedSlots((prev) => [...prev, newBlockedSlot]); }} className="h-12 rounded-2xl bg-neutral-950 text-white"><Clock3 className="mr-2 h-4 w-4" /> Bloquear</Button>
          </div>
          <div className="mt-4 space-y-2">{blockedSlots.map((slot, index) => <button key={`${slot.date}-${slot.start}-${index}`} onClick={() => setBlockedSlots((prev) => prev.filter((_, idx) => idx !== index))} className="block rounded-2xl bg-neutral-100 px-3 py-2 text-sm text-neutral-700">{slot.date} · {slot.start}-{slot.end || ""} ×</button>)}</div>
        </div>
      </div>
    </div>
  );
}
