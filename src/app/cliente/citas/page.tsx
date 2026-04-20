"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ExternalLink, Loader2, RefreshCw, Search, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AppointmentRecord, AppointmentSlot } from "@/features/appointments/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { auth } from "@/lib/firebase/client";

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending_payment: "Pendiente pago",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    completed: "Completada",
    no_show: "No asistio",
  };
  return labels[status] || status;
}

export default function ClienteCitasPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<AppointmentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [newTime, setNewTime] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => [row.title, row.lawyerName, row.status, row.date].some((value) => String(value || "").toLowerCase().includes(q)));
  }, [rows, search]);

  const upcoming = rows.filter((row) => ["confirmed", "pending_payment"].includes(row.status)).length;

  async function loadAppointments() {
    if (!user?.uid) return;
    setLoading(true);
    setMessage(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sesion no disponible");
      const res = await fetch("/api/appointments", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudieron cargar citas");
      setRows(data.data || []);
    } catch (error) {
      setRows([]);
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function updateAppointment(id: string, action: "cancel" | "reschedule") {
    setMessage(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sesion no disponible");
      const res = await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(action === "reschedule" ? { action, date: newDate, time: newTime } : { action }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo actualizar");
      setMessage(action === "cancel" ? "Cita cancelada." : "Cita reagendada.");
      setRescheduleId(null);
      setNewTime("");
      await loadAppointments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    }
  }

  async function loadSlots(row: AppointmentRecord, date: string) {
    setSlots([]);
    setNewTime("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sesion no disponible");
      const res = await fetch(`/api/appointments/availability?lawyerId=${encodeURIComponent(row.lawyerId)}&date=${encodeURIComponent(date)}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo cargar slots");
      setSlots(data.slots || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    }
  }

  useEffect(() => {
    if (!authLoading && user?.uid) void loadAppointments();
  }, [authLoading, user?.uid]);

  if (authLoading || loading) {
    return <div className="rounded-[32px] bg-white p-10 text-center text-neutral-500 shadow-sm"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Portal Cliente · Mis citas</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-950">Videollamadas agendadas</h1>
            <p className="mt-3 max-w-4xl text-base leading-7 text-neutral-600">Revisa estado, horario, abogado responsable y enlace de Google Meet.</p>
          </div>
          <Button onClick={() => void loadAppointments()} variant="outline" className="h-11 rounded-2xl border-neutral-200"><RefreshCw className="mr-2 h-4 w-4" /> Actualizar</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Proximas</p><p className="mt-2 text-3xl font-semibold">{upcoming}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Total citas</p><p className="mt-2 text-3xl font-semibold">{rows.length}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">Meet</p><p className="mt-2 text-3xl font-semibold">Activo</p></div>
      </div>

      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por abogado, estado o fecha" className="h-12 rounded-2xl border-neutral-200 pl-9" />
        </div>
        {message && <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">{message}</div>}

        <div className="mt-6 space-y-4">
          {filtered.map((row) => {
            const canOperate = ["confirmed", "pending_payment"].includes(row.status);
            return (
              <div key={row.id} className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500"><Video className="h-4 w-4" /> {statusLabel(row.status)} · {formatDateTime(row.start)}</div>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-neutral-950">{row.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">Abogado: {row.lawyerName}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {row.meetingUrl && <a href={row.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800">Abrir Meet <ExternalLink className="ml-2 h-4 w-4" /></a>}
                    <Button variant="outline" disabled={!canOperate} onClick={() => { setRescheduleId(row.id); void loadSlots(row, newDate); }} className="h-10 rounded-2xl border-neutral-200"><CalendarDays className="mr-2 h-4 w-4" /> Reagendar</Button>
                    <Button variant="outline" disabled={!canOperate} onClick={() => void updateAppointment(row.id, "cancel")} className="h-10 rounded-2xl border-neutral-200"><X className="mr-2 h-4 w-4" /> Cancelar</Button>
                  </div>
                </div>
                {rescheduleId === row.id && (
                  <div className="mt-5 rounded-3xl border border-neutral-200 bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-[0.5fr_1fr_auto]">
                      <Input type="date" value={newDate} onChange={(e) => { setNewDate(e.target.value); void loadSlots(row, e.target.value); }} className="h-11 rounded-2xl border-neutral-200" />
                      <div className="flex flex-wrap gap-2">
                        {slots.map((slot) => <button key={slot.time} onClick={() => setNewTime(slot.time)} className={`rounded-2xl border px-3 py-2 text-sm ${newTime === slot.time ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-neutral-50 text-neutral-700"}`} type="button">{slot.time}</button>)}
                        {slots.length === 0 && <span className="py-2 text-sm text-neutral-400">Sin slots</span>}
                      </div>
                      <Button disabled={!newTime} onClick={() => void updateAppointment(row.id, "reschedule")} className="h-11 rounded-2xl bg-neutral-950 text-white">Guardar</Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center text-neutral-500">No hay citas con los filtros actuales.</div>}
        </div>
      </div>
    </div>
  );
}
