"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppointmentSlot, LawyerSettingsRecord } from "@/features/appointments/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { auth } from "@/lib/firebase/client";

function dateKey(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function humanDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return format(parsed, "EEEE d 'de' MMMM", { locale: es });
}

export default function AgendarClientePage() {
  const { lawyerId } = useParams<{ lawyerId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const caseId = searchParams.get("caseId");
  const [settings, setSettings] = useState<LawyerSettingsRecord | null>(null);
  const [selectedDate, setSelectedDate] = useState(dateKey(addDays(new Date(), 1)));
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const nextDays = useMemo(() => Array.from({ length: 15 }, (_, index) => addDays(new Date(), index + 1)), []);

  async function loadAvailability(date: string) {
    if (!lawyerId || !user?.uid) return;
    setLoading(true);
    setMessage(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sesion no disponible");
      const res = await fetch(`/api/appointments/availability?lawyerId=${encodeURIComponent(lawyerId)}&date=${encodeURIComponent(date)}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo cargar disponibilidad");
      setSettings(data.settings);
      setSlots(data.slots || []);
      setSelectedSlot("");
    } catch (error) {
      setSlots([]);
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user?.uid) void loadAvailability(selectedDate);
  }, [authLoading, user?.uid, selectedDate, lawyerId]);

  async function confirmBooking() {
    if (!selectedSlot) return;
    setBooking(true);
    setMessage(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sesion no disponible");
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lawyerId, date: selectedDate, time: selectedSlot, caseId, description }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo agendar");
      setCreatedId(data.appointment.id);
      setMessage("Cita confirmada. Ya aparece en tu portal y en la Agenda Maestra del estudio.");
      await loadAvailability(selectedDate);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setBooking(false);
    }
  }

  if (authLoading) return <div className="rounded-[32px] bg-white p-10 text-center text-neutral-500 shadow-sm"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Portal Cliente · Agendar reunion</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-950">Agenda una videollamada</h1>
            <p className="mt-3 max-w-4xl text-base leading-7 text-neutral-600">Elige un horario disponible. La cita se guarda para ti y queda visible para el estudio en Agenda Maestra.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">Meet fijo: {settings?.meetingUrl ? "activo" : "pendiente"}</div>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-neutral-100 p-4"><Video className="h-6 w-6 text-neutral-700" /></div>
              <div><p className="text-sm text-neutral-500">Abogado / responsable</p><h2 className="text-2xl font-semibold tracking-tight text-neutral-950">{settings?.lawyerName || "Responsable"}</h2></div>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-neutral-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Duracion</p><p className="mt-2 text-lg font-semibold">{settings?.slotDurationMinutes || 45} min</p></div>
              <div className="rounded-2xl bg-neutral-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Estado</p><p className="mt-2 text-lg font-semibold">Confirmable</p></div>
            </div>
          </div>
          <div className="rounded-[32px] bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Resumen</h2>
            <div className="mt-5 space-y-3 text-sm text-neutral-600">
              <div className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4"><span>Fecha</span><strong>{humanDate(selectedDate)}</strong></div>
              <div className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4"><span>Hora</span><strong>{selectedSlot || "Selecciona un slot"}</strong></div>
              <div className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4"><span>Tipo</span><strong>Videollamada</strong></div>
            </div>
            <label className="mt-5 block"><span className="mb-2 block text-sm font-medium text-neutral-700">Comentario opcional</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px] w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400" placeholder="Indica brevemente que quieres revisar." /></label>
            <Button onClick={() => void confirmBooking()} disabled={!selectedSlot || booking} className="mt-5 h-12 w-full rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800">{booking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Confirmar reserva</Button>
          </div>
        </div>
        <div className="rounded-[32px] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">Selecciona fecha y hora</h2>
          <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
            {nextDays.map((day) => {
              const key = dateKey(day);
              const active = key === selectedDate;
              return <button key={key} onClick={() => setSelectedDate(key)} className={`min-w-24 rounded-2xl border p-4 text-center transition ${active ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"}`} type="button"><span className="block text-xs uppercase tracking-[0.14em]">{format(day, "eee", { locale: es })}</span><span className="mt-1 block text-2xl font-semibold">{format(day, "d")}</span></button>;
            })}
          </div>
          <div className="mt-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-neutral-500"><Clock3 className="h-4 w-4" /> Horarios disponibles</div>
            {loading ? <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center text-neutral-500"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div> : slots.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{slots.map((slot) => <button key={slot.time} type="button" onClick={() => setSelectedSlot(slot.time)} className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${selectedSlot === slot.time ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-white"}`}>{slot.time}</button>)}</div>
            ) : <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center text-neutral-500"><AlertCircle className="mx-auto mb-3 h-8 w-8 text-neutral-300" /> No hay horarios disponibles para este dia.</div>}
          </div>
          {message && <div className={`mt-6 rounded-2xl border p-4 text-sm ${createdId ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-neutral-200 bg-neutral-50 text-neutral-700"}`}>{message}{createdId && <button onClick={() => router.push("/cliente/citas")} className="mt-3 inline-flex items-center font-semibold underline-offset-4 hover:underline" type="button">Ver mis citas <ArrowRight className="ml-2 h-4 w-4" /></button>}</div>}
        </div>
      </div>
    </div>
  );
}
