"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { PLANS, formatCLP } from "@/lib/plans";
import type { TenantPlanUsage } from "@/lib/billing";
import {
  FolderOpen,
  Users,
  UserCheck,
  CreditCard,
  ArrowRight,
  Plus,
  TrendingUp,
  Clock,
  Briefcase,
  Zap,
} from "lucide-react";

// ─── Tarjeta KPI Premium ──────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  delay = 0,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-full -mr-16 -mt-16`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${color} text-white shadow-lg`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
      
      <div className="mt-6 relative z-10">
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{title}</p>
        {subtitle && (
           <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs font-semibold text-slate-400">{subtitle}</p>
           </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Progress Bar Premium ────────────────────────────────────────────────────

function PremiumProgress({ label, current, max, icon: Icon }: { label: string; current: number; max: number | null; icon: any }) {
  const pct = max === null ? 0 : Math.min((current / max) * 100, 100);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Icon className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
        </div>
        <span className="text-sm font-black text-slate-900 dark:text-white">
          {current} <span className="text-slate-400 font-medium">/ {max === null ? "∞" : max}</span>
        </span>
      </div>
      <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/5 p-0.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${pct > 90 ? 'from-red-500 to-orange-500' : 'from-emerald-500 to-teal-500'}`}
        />
      </div>
    </div>
  );
}

// ─── Página del Dashboard ─────────────────────────────────────────────────────

export default function FirmDashboardPage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<TenantPlanUsage | null>(null);
  const [stats, setStats] = useState({ pendingCases: 0, totalClients: 0 });
  const [loadingData, setLoadingData] = useState(true);

  const plan = user?.planId ? PLANS[user.planId as keyof typeof PLANS] : null;

  useEffect(() => {
    if (!user?.tenantId) return;

    async function loadData() {
      try {
        const { doc, getDoc, collection } = await import("firebase/firestore");
        const usageSnap = await getDoc(doc(collection(db, "tenant_plan_usage"), user!.tenantId!));
        if (usageSnap.exists()) setUsage(usageSnap.data() as TenantPlanUsage);

        const casesQ = query(
          collection(db, "cases"),
          where("tenantId", "==", user!.tenantId || "none"),
          where("status", "in", ["intake", "en_estudio", "en_tramitacion", "audiencia"])
        );
        const casesSnap = await getDocs(casesQ);

        const clientsQ = query(collection(db, "clients"), where("tenantId", "==", user!.tenantId || "none"));
        const clientsSnap = await getDocs(clientsQ);

        setStats({ pendingCases: casesSnap.size, totalClients: clientsSnap.size });
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Welcome Header con Glassmorphism y Gradiente */}
      <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 border border-white/10 p-12 shadow-2xl">
         <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.15),transparent)] pointer-events-none" />
         
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-[0.2em]">
                <Zap className="w-3.5 h-3.5" />
                Resumen Ejecutivo
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">{user?.displayName?.split(" ")[0]}</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-xl font-medium">
                Tu estudio jurídico ha gestionado <span className="text-white font-bold">{stats.totalClients} clientes</span> este mes. Revisa las actividades pendientes a continuación.
              </p>
            </div>
            
            <Link
              href="/firm/causas/nueva"
              className="group flex items-center justify-center gap-3 px-8 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-3xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20"
            >
              <Plus className="w-6 h-6" />
              NUEVA CAUSA
            </Link>
         </div>
      </section>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Causas Activas"
          value={loadingData ? "..." : (usage?.activeCases ?? 0)}
          subtitle={plan ? `Límite: ${plan.maxActiveCases || '∞'}` : "Sin plan"}
          icon={FolderOpen}
          color="from-emerald-500 to-teal-600"
          delay={0.1}
        />
        <KpiCard
          title="Clientes"
          value={loadingData ? "..." : stats.totalClients}
          subtitle="Registrados"
          icon={Users}
          color="from-blue-500 to-indigo-600"
          delay={0.2}
        />
        <KpiCard
          title="Equipo"
          value={loadingData ? "..." : (usage?.activeSeats ?? 1)}
          subtitle={`${plan?.includedSeats ?? 0} seats`}
          icon={UserCheck}
          color="from-purple-500 to-violet-600"
          delay={0.3}
        />
        <KpiCard
          title="Inversión"
          value={plan ? formatCLP(plan.priceCLP) : "N/A"}
          subtitle="Mensual"
          icon={CreditCard}
          color="from-amber-400 to-orange-500"
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Panel de Gestión de Plan */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-4 bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 p-10 space-y-8"
        >
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Uso del Ecosistema</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Nivel actual: <span className="text-emerald-500 font-bold">{plan?.name}</span></p>
          </div>
          
          <div className="space-y-8">
            <PremiumProgress
              label="Causas en Trámite"
              current={usage?.activeCases ?? 0}
              max={plan?.maxActiveCases ?? null}
              icon={Briefcase}
            />
            <PremiumProgress
              label="Asientos de Abogados"
              current={usage?.activeSeats ?? 1}
              max={plan?.includedSeats ?? null}
              icon={UserCheck}
            />
          </div>

          <div className="pt-8 flex flex-col gap-3">
             <Link
              href="/planes"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 border border-white/5 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all"
            >
              Mejorar Plan Actual
            </Link>
             <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
               Límites actualizados <br /> al {new Date().toLocaleDateString('es-CL')}
             </p>
          </div>
        </motion.div>

        {/* Acciones de Operación */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-8 bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 p-10"
        >
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Acciones Médulas</h2>
            <Link href="/manual" className="text-xs font-bold text-emerald-500 hover:underline uppercase tracking-widest">Documentación →</Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                label: "Crear Causa",
                desc: "Inicia el flujo de tramitación",
                icon: FolderOpen,
                color: "bg-emerald-500/10 text-emerald-500",
                href: "/firm/causas/nueva",
              },
              {
                label: "Asignar Equipo",
                desc: "Gestiona permisos internos",
                icon: UserCheck,
                color: "bg-purple-500/10 text-purple-500",
                href: "/firm/equipo",
              },
              {
                label: "Alta de Cliente",
                desc: "Registrar datos y mandatos",
                icon: Users,
                color: "bg-blue-500/10 text-blue-500",
                href: "/firm/clientes/nuevo",
              },
              {
                label: "Agenda Global",
                desc: "Reuniones y audiencias",
                icon: Clock,
                color: "bg-amber-500/10 text-amber-500",
                href: "/firm/agenda",
              },
            ].map((action, i) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex flex-col p-8 rounded-3xl border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/20 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {action.label}
                    </p>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium mt-1">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
