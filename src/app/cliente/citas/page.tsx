"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { CalendarClock, ExternalLink, Loader2, Video } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";

export default function ClienteCitasPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [lawyerId, setLawyerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    async function loadData() {
      try {
        const aptsQ = query(collection(db, "appointments"), where("clientId", "==", user!.uid));
        const aptsSnap = await getDocs(aptsQ);
        const data = aptsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        data.sort((a: any, b: any) => String(a.fecha || "").localeCompare(String(b.fecha || "")));
        setAppointments(data);

        const casesQ = query(collection(db, "cases"), where("clientId", "==", user!.uid));
        const casesSnap = await getDocs(casesQ);
        const firstCase = casesSnap.docs[0]?.data();
        if (firstCase?.asignadoA) setLawyerId(firstCase.asignadoA);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">Agenda</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Mis citas</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Revisa videollamadas y agenda nuevas reuniones.</p>
        </div>
        {lawyerId && (
          <Link href={`/cliente/agendar/${lawyerId}`} className="rounded-2xl bg-indigo-600 px-6 py-3 text-center text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20">
            Agendar videollamada
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-[2rem] bg-white dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-12 text-center dark:border-white/10 dark:bg-slate-900">
          <CalendarClock className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white">No hay citas registradas</h2>
          <p className="mt-2 text-sm text-slate-500">Agenda una videollamada desde el boton superior.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-500/10">
                  <Video className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 dark:text-white">{item.titulo || item.title || "Videollamada"}</h2>
                  <p className="text-sm font-medium text-slate-500">{item.fecha || "Fecha pendiente"} - {item.hora || "Hora pendiente"}</p>
                </div>
              </div>
              {item.meetingUrl && (
                <a href={item.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white">
                  Abrir Meet <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
