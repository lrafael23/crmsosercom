"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase/client";
import { 
  Gavel, 
  FileText, 
  Clock, 
  User, 
  ChevronLeft,
  Calendar,
  Shield,
  LayoutGrid,
  History
} from "lucide-react";
import LegalVault from "@/components/vault/LegalVault";
import CaseTimeline from "@/components/cases/CaseTimeline";

export default function CaseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "vault" | "timeline">("vault");

  useEffect(() => {
    if (!id) return;
    const loadCase = async () => {
      try {
        const snap = await getDoc(doc(db, "cases", id as string));
        if (snap.exists()) setCaseData({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCase();
  }, [id]);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  if (!caseData) return (
    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5">
      <h2 className="text-2xl font-black text-slate-900 dark:text-white">Expediente no encontrado</h2>
      <button onClick={() => router.push("/firm/causas")} className="mt-4 text-emerald-500 font-bold">Volver al listado</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header & Back Button */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-white/5">
        <div className="space-y-4">
          <button 
            onClick={() => router.push("/firm/causas")}
            className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-emerald-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a Causas
          </button>
          
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                <Gavel className="w-7 h-7" />
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none capitalize">{caseData.title}</h1>
                <p className="text-slate-500 font-bold mt-2 flex items-center gap-2">
                   <User className="w-4 h-4" />
                   {caseData.clientName}
                </p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500">
              ID: {caseData.id.slice(-6).toUpperCase()}
           </div>
           <div className="px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest">
              {caseData.status?.replace('_', ' ') || 'ACTIVO'}
           </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] w-fit">
        {[
          { id: "info", label: "Información", icon: LayoutGrid },
          { id: "vault", label: "Bóveda Legal", icon: Shield },
          { id: "timeline", label: "Línea de Tiempo", icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-8 py-4 rounded-[2rem] text-sm font-black transition-all ${
              activeTab === tab.id 
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl" 
                : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "vault" && <LegalVault caseId={caseData.id} />}
        {activeTab === "info" && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-white/5 space-y-6">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Detalles del Caso</h3>
                 <div className="space-y-4">
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                       {caseData.description || "No hay descripción detallada para esta causa."}
                    </p>
                 </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-white/5 space-y-6">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Datos del Cliente</h3>
                 <div className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5">
                    <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
                       <User className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                       <p className="text-lg font-black text-slate-900 dark:text-white">{caseData.clientName}</p>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Titular</p>
                    </div>
                 </div>
              </div>
           </div>
        )}
        {activeTab === "timeline" && (
          <CaseTimeline 
            events={[]} // Aquí se podrían cargar eventos reales de Firestore en el futuro
            currentStage={caseData.stage || "intake"} 
            caseName={caseData.title} 
          />
        )}
      </motion.div>
    </div>
  );
}
