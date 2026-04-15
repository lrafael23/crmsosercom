"use client";

import { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  RefreshCw, 
  Cloud, 
  CloudOff,
  Clock,
  MapPin,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AvailabilitySettings } from "@/components/calendar/AvailabilitySettings";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from "date-fns";
import { es } from "date-fns/locale";
import { getAuthUrl } from "@/lib/google";
import { useAuth } from "@/lib/auth/AuthContext";
import { db } from "@/lib/firebase/client";
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  location?: string;
  type: "meeting" | "hearing" | "deadline" | "other";
  source: "local" | "google";
}

// ─── Componente Principal ──────────────────────────────────────────────────────

export default function AgendaPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{ current: number; max: number | null; isFull: boolean } | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    // 1. Verificar conexión a Google y sincronizar
    const syncGoogle = async () => {
      try {
        const docRef = doc(db, "user_credentials", `${user.uid}/google_calendar`);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          setIsGoogleConnected(true);
          setSyncing(true);
          
          const res = await fetch(`/api/calendar/sync?uid=${user.uid}`);
          if (res.ok) {
            const { events } = await res.json();
            const googleApts = events.map((e: any) => ({
              id: e.id,
              title: e.summary || "Evento de Google",
              start: new Date(e.start.dateTime || e.start.date),
              location: e.location,
              source: "google",
              type: "meeting"
            }));
            
            setAppointments(prev => {
              const localOnly = prev.filter(a => a.source === 'local');
              return [...localOnly, ...googleApts];
            });
          }
        }
      } catch (err) {
        console.error("Error syncing Google Calendar:", err);
      } finally {
        setSyncing(false);
      }
    };

    syncGoogle();

    // 2. Escuchar cuota y uso
    const usageRef = doc(db, "tenant_plan_usage", user.tenantId);
    const getUsage = async () => {
        const snap = await getDoc(usageRef);
        if (snap.exists()) {
            const data = snap.data();
            const planLimit = data.planId === 'basico' ? 5 : data.planId === 'full' ? 25 : null;
            setQuotaInfo({
                current: data.monthlyConferences || 0,
                max: planLimit,
                isFull: planLimit !== null && (data.monthlyConferences || 0) >= planLimit
            });
        }
    };
    getUsage();

    // 3. Escuchar citas locales de Firestore
    const q = query(
      collection(db, "appointments"),
      where("tenantId", "==", user.tenantId)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        start: d.data().start?.toDate() || new Date(),
        end: d.data().end?.toDate(),
        source: "local"
      } as Appointment));
      setAppointments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // ─── Lógica del Calendario ─────────────────────────────────────────────────

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <CalendarIcon className="w-8 h-8 text-emerald-600" />
             Agenda
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">
            {format(currentMonth, "MMMM yyyy", { locale: es }).toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1 shadow-sm">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">
                    Hoy
                </button>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
            </div>

            <button 
                onClick={() => window.location.href = `/api/calendar/auth?uid=${user?.uid}`}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-lg ${
                    isGoogleConnected 
                    ? "bg-slate-100 dark:bg-slate-800 text-emerald-600 shadow-none border border-emerald-500/20" 
                    : "bg-emerald-600 text-white shadow-emerald-500/20 hover:scale-[1.02]"
                }`}
            >
                {isGoogleConnected ? <CheckCircle2 className="w-4 h-4" /> : <Cloud className="w-4 h-4" />}
                {isGoogleConnected ? "Google Conectado" : "Conectar Google"}
            </button>

            <button 
                onClick={() => setShowSettings(true)}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 hover:text-emerald-600 transition-all shadow-sm group"
                title="Ajustes de Disponibilidad"
            >
                <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-4">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayAppointments = appointments.filter(apt => isSameDay(apt.start, cloneDay));
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());

        days.push(
          <motion.div
            key={day.toString()}
            whileHover={{ y: -2 }}
            className={`min-h-[140px] p-2 border border-slate-100 dark:border-slate-800/50 relative transition-all group ${
              !isCurrentMonth ? "bg-slate-50/50 dark:bg-slate-950/20 opacity-30" : "bg-white dark:bg-slate-950"
            } ${isSelected ? "ring-2 ring-emerald-500 ring-inset z-10" : ""}`}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <span className={`text-xs font-bold inline-flex items-center justify-center w-7 h-7 rounded-lg mb-2 ${
                isToday ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30" : "text-slate-500 dark:text-slate-400"
            }`}>
              {format(day, "d")}
            </span>

            <div className="space-y-1 overflow-y-auto max-h-[100px] custom-scrollbar">
                {dayAppointments.slice(0, 3).map(apt => (
                    <div 
                        key={apt.id} 
                        className="px-2 py-1 rounded-md bg-emerald-500/10 border-l-2 border-emerald-500 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 truncate"
                    >
                        {format(apt.start, "HH:mm")} - {apt.title}
                    </div>
                ))}
                {dayAppointments.length > 3 && (
                    <div className="text-[9px] text-slate-400 font-bold pl-2">
                        + {dayAppointments.length - 3} más
                    </div>
                )}
            </div>
            
            {/* Add Button on hover */}
            <button className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-emerald-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-emerald-500/20">
                <Plus className="w-3 h-3" />
            </button>
          </motion.div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">{rows}</div>;
  };

  return (
    <div className="max-w-7xl mx-auto">
        {/* Banner de Cuota Excedida */}
        {quotaInfo?.isFull && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-amber-500 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/20"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black tracking-tight leading-tight">¡Atención! Cupos de Agenda Agotados</h3>
                        <p className="text-sm font-medium opacity-90">Has alcanzado el límite de {quotaInfo.max} conferencias de tu plan actual.</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-6 py-3 bg-white text-amber-600 font-bold rounded-xl text-sm hover:scale-[1.02] transition-transform shadow-lg">
                        Mejorar Plan
                    </button>
                    <button className="flex-1 md:flex-none px-6 py-3 bg-white/20 text-white font-bold rounded-xl text-sm hover:bg-white/30 transition-colors">
                        Soporte
                    </button>
                </div>
            </motion.div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
            {/* Calendario Principal */}
            <div className="flex-1">
                {renderHeader()}
                {renderDays()}
                {renderCells()}
            </div>

            {/* Sidebar de Detalles */}
            <div className="w-full lg:w-96 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[500px]">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        Próximas Citas
                    </h2>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                            </div>
                        ) : appointments.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <p className="text-sm font-medium">No hay citas programadas.</p>
                            </div>
                        ) : (
                            appointments.sort((a,b) => a.start.getTime() - b.start.getTime()).slice(0, 5).map(apt => (
                                <motion.div 
                                    key={apt.id}
                                    whileHover={{ x: 5 }}
                                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                            {format(apt.start, "EEEE d MMMM", { locale: es })}
                                        </span>
                                        {apt.source === 'google' && <Cloud className="w-3 h-3 text-emerald-500" />}
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors uppercase text-sm">{apt.title}</h4>
                                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <Clock className="w-3.5 h-3.5" />
                                            {format(apt.start, "HH:mm")}
                                        </div>
                                        {apt.location && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {apt.location}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    <button className="w-full mt-8 flex items-center justify-center gap-2 bg-slate-900 dark:bg-emerald-600 py-4 rounded-2xl text-white font-bold text-sm shadow-xl shadow-emerald-500/10 hover:scale-[1.02] transition-transform">
                        <Plus className="w-4 h-4" />
                        Nueva Cita
                    </button>
                </div>

                {isGoogleConnected && (
                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 leading-tight">Sync Activo</h3>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">Sincronización con Google activa</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <AnimatePresence>
            {showSettings && user && (
                <AvailabilitySettings 
                    userId={user.uid} 
                    onClose={() => setShowSettings(false)} 
                />
            )}
        </AnimatePresence>
    </div>
  );
}
