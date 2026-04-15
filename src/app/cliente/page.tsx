"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { CaseTimeline, generateDemoTimeline } from "@/components/cases/CaseTimeline";
import type { CaseStage } from "@/components/cases/CaseTimeline";
import { 
  FolderOpen, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Loader2, 
  Star,
  FileText,
  AlertCircle,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LegalVault from "@/components/vault/LegalVault";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ClientCase {
  id: string;
  title: string;
  type: string;
  status: CaseStage;
  asignadoA?: string;
  createdAt?: { seconds: number };
}

interface ClientAppointment {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  tipo: string;
}

// ─── Componentes del Dashboard ────────────────────────────────────────────────

export default function ClientePortalPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<ClientCase[]>([]);
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "vault">("timeline");

  // Cargar causas y citas del cliente
  useEffect(() => {
    if (!user?.uid) return;

    async function loadClientData() {
      try {
        // Causas donde el clientId es este usuario
        const casesQ = query(
          collection(db, "cases"),
          where("clientId", "==", user!.uid),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const casesSnap = await getDocs(casesQ);
        const casesData = casesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ClientCase[];
        
        setCases(casesData);
        if (casesData.length > 0) {
          setSelectedCaseId(casesData[0].id);
        }

        // Próximas citas
        const aptsQ = query(
          collection(db, "appointments"),
          where("clientId", "==", user!.uid),
          orderBy("fecha", "asc"),
          limit(5)
        );
        const aptsSnap = await getDocs(aptsQ);
        setAppointments(
          aptsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as ClientAppointment[]
        );
      } catch (err) {
        console.error("Error cargando datos del cliente:", err);
      } finally {
        setDataLoading(false);
      }
    }

    loadClientData();
  }, [user]);

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando tus causas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Bienvenida Premium */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Dashboard del Cliente
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Hola, <span className="text-indigo-600 dark:text-indigo-400">{user?.displayName?.split(" ")[0]}</span> 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-lg font-medium">
          Mantente al tanto del progreso de tus procesos legales de forma transparente y segura.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Lateral (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Mis Causas - Selector */}
          <section className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-xl shadow-indigo-500/5">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-transparent to-indigo-500/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Mis Procesos</h2>
              </div>
              <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg">
                {cases.length}
              </span>
            </div>
            
            {cases.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-white/5">
                   <FolderOpen className="w-6 h-6 text-slate-200 dark:text-slate-700" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No hay causas activas vinculadas a tu cuenta.</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {cases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`w-full group relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
                      selectedCaseId === c.id
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                        : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div className="flex flex-col items-start min-w-0">
                      <p className={`text-xs font-black truncate w-full ${selectedCaseId === c.id ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                        {c.title}
                      </p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${selectedCaseId === c.id ? 'text-indigo-100/80' : 'text-slate-400'}`}>
                        {c.type}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${selectedCaseId === c.id ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Próximas Citas Premium */}
          <section className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-xl shadow-indigo-500/5">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-transparent to-indigo-500/5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Agenda</h2>
            </div>
            {appointments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50 dark:bg-black/20 m-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sin reuniones próximas</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {appointments.map((apt) => (
                  <div key={apt.id} className="p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">{apt.titulo}</p>
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 tracking-wider">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        {apt.fecha}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                        {apt.hora}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Acceso a Documentos */}
           <section 
            onClick={() => setActiveTab("vault")}
            className={`group cursor-pointer hover:scale-[1.02] transition-all rounded-3xl p-6 shadow-xl ${
              activeTab === "vault" 
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-indigo-500/20" 
                : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/20"
            }`}
          >
             <div className="flex items-center justify-between mb-4">
               <div className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-md ${
                 activeTab === "vault" ? "bg-emerald-500 text-white" : "bg-white/20 text-white"
               }`}>
                 <FileText className="w-5 h-5" />
               </div>
               <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <ChevronRight className="w-4 h-4" />
               </div>
             </div>
             <h3 className="font-black text-lg tracking-tight mb-1">Mis Documentos</h3>
             <p className={`text-[11px] font-medium leading-relaxed ${activeTab === "vault" ? "text-slate-400" : "text-indigo-100/70"}`}>
               {activeTab === "vault" ? "Viendo ahora la bóveda digital" : "Accede a la bóveda digital con todos tus contratos."}
             </p>
           </section>
        </div>

        {/* Columna de Contenido (8/12) */}
        <div className="lg:col-span-8">
          <div className="flex items-center gap-2 mb-6">
             <button 
              onClick={() => setActiveTab("timeline")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "timeline" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
              }`}
             >
               Seguimiento
             </button>
             <button 
              onClick={() => setActiveTab("vault")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === "vault" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
              }`}
             >
               Documentos
             </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (selectedCaseId || "")}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {selectedCase ? (
                activeTab === "timeline" ? (
                  <CaseTimeline
                    caseName={selectedCase.title}
                    currentStage={selectedCase.status}
                    events={generateDemoTimeline(selectedCase.status)}
                  />
                ) : (
                  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-2xl">
                    <LegalVault caseId={selectedCase.id} />
                  </div>
                )
              ) : (
                <div className="bg-white/50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-20 text-center backdrop-blur-sm">
                    <AlertCircle className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                    <h3 className="text-slate-400 font-black text-xs uppercase tracking-widest">Esperando Selección</h3>
                    <p className="text-slate-400/60 text-[10px] uppercase font-bold mt-1">Elige un proceso para ver su seguimiento detallado</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
