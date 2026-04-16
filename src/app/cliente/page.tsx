"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import CaseTimeline, { generateDemoTimeline } from "@/components/cases/CaseTimeline";
import type { CaseStage } from "@/components/cases/CaseTimeline";
import { 
  FolderOpen, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Loader2, 
  FileText,
  AlertCircle,
  TrendingUp,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LegalVault from "@/components/vault/LegalVault";
import { Button } from "@/components/ui/button";

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

// ─── Dashboard Cliente ────────────────────────────────────────────────────────

export default function ClientePortalPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<ClientCase[]>([]);
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "vault">("timeline");

  useEffect(() => {
    if (!user?.uid) return;

    async function loadClientData() {
      try {
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
        if (casesData.length > 0) setSelectedCaseId(casesData[0].id);

        const aptsQ = query(
          collection(db, "appointments"),
          where("clientId", "==", user!.uid),
          orderBy("fecha", "asc"),
          limit(5)
        );
        const aptsSnap = await getDocs(aptsQ);
        setAppointments(aptsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as ClientAppointment[]);
      } catch (err) {
        console.error("Error cargando dashboard cliente:", err);
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
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* 1. Hero: Estado Crítico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.15),transparent)] pointer-events-none" />
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Próximo Hito Detectado</p>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                {appointments[0] 
                  ? `Tienes una cita agendada: ${appointments[0].titulo}` 
                  : `Todo en marcha, ${user?.displayName?.split(" ")[0]}`}
              </h1>
              <div className="flex flex-wrap gap-4">
                 <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/5 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-[8px] font-black uppercase opacity-60">Fecha</p>
                      <p className="text-sm font-bold">{appointments[0]?.fecha || 'Sin fecha fija'}</p>
                    </div>
                 </div>
                 <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/5 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-[8px] font-black uppercase opacity-60">Hora</p>
                      <p className="text-sm font-bold">{appointments[0]?.hora || '--:--'}</p>
                    </div>
                 </div>
              </div>
              <Button className="mt-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl h-12 px-8 uppercase text-[10px] tracking-widest">
                VER DETALLES COMPLETOS
              </Button>
           </div>
        </div>

        {/* Mini Cockpit: Resumen de Trámites */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-8 flex flex-col justify-between shadow-sm">
           <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Mis Gestiones</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-2xl font-black text-blue-500">{cases.length}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Causas</p>
                 </div>
                 <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-2xl font-black text-emerald-500">2</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Finalizados</p>
                 </div>
              </div>
           </div>
           <div className="mt-8 flex flex-col gap-3">
              <Button variant="outline" className="w-full rounded-xl h-10 text-[9px] font-black uppercase tracking-widest gap-2">
                <MessageSquare className="w-3.5 h-3.5" /> Contactar Ejecutivo
              </Button>
              <p className="text-[8px] text-center text-slate-400 uppercase font-black">Atención 24/7 preferencial</p>
           </div>
        </div>
      </div>

      {/* 2. Grid de Operaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Selector de Procesos (Lateral) */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">Seleccionar Proceso</h3>
              <div className="space-y-2">
                 {cases.map((c) => (
                   <button 
                    key={c.id} 
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
                      selectedCaseId === c.id ? "bg-slate-900 text-white shadow-xl" : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500"
                    }`}
                   >
                     <div className="text-left">
                        <p className={`text-xs font-black truncate w-40 ${selectedCaseId === c.id ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{c.title}</p>
                        <p className="text-[10px] uppercase font-bold opacity-60 mt-0.5">{c.type}</p>
                     </div>
                     <ChevronRight className={`w-4 h-4 ${selectedCaseId === c.id ? 'opacity-100' : 'opacity-20'}`} />
                   </button>
                 ))}
              </div>
           </div>
           
           {/* Vault Banner */}
           <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white group cursor-pointer hover:scale-[1.02] transition-transform shadow-xl shadow-blue-500/20" onClick={() => setActiveTab("vault")}>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                 <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-black tracking-tight mb-2">Bóveda Digital</h4>
              <p className="text-xs text-blue-100/70 font-medium mb-4">Accede a tus contratos, mandatos y certificaciones de forma segura.</p>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-b border-white/20 pb-1">
                Explorar Archivos <ExternalLink className="w-3 h-3" />
              </div>
           </div>
        </div>

        {/* Visualización de Seguimiento (Centro) */}
        <div className="lg:col-span-8 space-y-6">
           <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
              <button 
                onClick={() => setActiveTab("timeline")}
                className={`text-[11px] font-black uppercase tracking-tighter pb-2 transition-all relative ${
                  activeTab === 'timeline' ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                Seguimiento Paso a Paso
                {activeTab === 'timeline' && <motion.div layoutId="clientTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveTab("vault")}
                className={`text-[11px] font-black uppercase tracking-tighter pb-2 transition-all relative ${
                  activeTab === 'vault' ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                Archivos del Proceso
                {activeTab === 'vault' && <motion.div layoutId="clientTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
              </button>
           </div>

           <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + (selectedCaseId || "")}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                 {selectedCase ? (
                   activeTab === 'timeline' ? (
                     <CaseTimeline
                        caseName={selectedCase.title}
                        currentStage={selectedCase.status}
                        events={generateDemoTimeline(selectedCase.status)}
                      />
                   ) : (
                     <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-10 border border-slate-200 dark:border-white/5 shadow-2xl">
                        <LegalVault caseId={selectedCase.id} />
                     </div>
                   )
                 ) : (
                    <div className="h-[400px] flex flex-col items-center justify-center bg-slate-50 dark:bg-black/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/5">
                       <FolderOpen className="w-12 h-12 text-slate-200 mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecciona un proceso activo para continuar</p>
                    </div>
                 )}
              </motion.div>
           </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
