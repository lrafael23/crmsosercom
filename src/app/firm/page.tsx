"use client";

import { useEffect, useState } from "react";
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
  Plus,
  Zap,
  TrendingUp,
  Activity,
  ChevronRight,
  ArrowRight,
  Clock
} from "lucide-react";

import WeeklyCalendar from "@/components/dashboard/WeeklyCalendar";
import CockpitFinancials from "@/components/dashboard/CockpitFinancials";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ─── Componentes Auxiliares ──────────────────────────────────────────────────

function MiniStat({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-md group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-500/10 text-${color}-500 group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}

// ─── Dashboard Principal ─────────────────────────────────────────────────────

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

        const clientsQ = query(collection(db, "clients"), where("tenantId", "==", user!.tenantId || "none"));
        const clientsSnap = await getDocs(clientsQ);

        setStats(prev => ({ ...prev, totalClients: clientsSnap.size }));
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* 1. Header de Bienvenida y Acción Rápida */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Panel de <span className="text-emerald-500">Comando Global</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Bienvenido, <span className="font-bold">{user?.displayName}</span> • {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-xl border-slate-200 font-bold text-xs uppercase tracking-widest h-11 px-6">
             Ver Reportes
           </Button>
           <Link href="/firm/causas/nueva">
             <Button className="rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest h-11 px-6 hover:bg-slate-800 transition-colors shadow-lg">
               Nueva Operación <Plus className="ml-2 w-4 h-4" />
             </Button>
           </Link>
        </div>
      </div>

      {/* 2. KPIs de Alto Nivel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat title="Causas Activas" value={usage?.activeCases ?? 0} icon={FolderOpen} color="emerald" />
        <MiniStat title="Clientes" value={stats.totalClients} icon={Users} color="blue" />
        <MiniStat title="Equipo" value={usage?.activeSeats ?? 1} icon={UserCheck} color="purple" />
        <MiniStat title="Ingresos Mes" value={plan ? formatCLP(1250000) : "N/A"} icon={TrendingUp} color="amber" />
      </div>

      {/* 3. El Cockpit (Grid Principal) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        
        {/* Columna Izquierda: Agenda y Actividad */}
        <div className="lg:col-span-4 space-y-6">
          <div className="h-[500px]">
            <WeeklyCalendar />
          </div>
          
          {/* Feed de Actividad Compacto */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                   <Activity className="w-4 h-4 text-emerald-500" />
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Actividad Reciente</h3>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
             </div>
             <div className="space-y-4">
                {[
                  { user: "R. González", action: "creó nueva causa", time: "hace 5m" },
                  { user: "Sistema", action: "pago recibido $450.000", time: "hace 12m" },
                  { user: "M. Soto", action: "subió 3 documentos", time: "hace 45m" }
                ].map((act, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <span className="font-black">{act.user}</span> {act.action}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase">{act.time}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Columna Central: Finanzas y Gestión Directa */}
        <div className="lg:col-span-5 space-y-6">
          <div className="h-[400px]">
            <CockpitFinancials />
          </div>
          
          {/* Quick Actions Panel */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
             <div className="relative z-10">
                <h3 className="text-lg font-black uppercase tracking-tight mb-6">Acceso Rápido</h3>
                <div className="grid grid-cols-2 gap-4">
                   {[
                     { label: "Nuevo Cliente", icon: Users, href: "/firm/clientes/nuevo" },
                     { label: "Nueva Causa", icon: FolderOpen, href: "/firm/causas/nueva" },
                     { label: "Agenda Global", icon: Clock, href: "/firm/agenda" },
                     { label: "Admin Equipo", icon: UserCheck, href: "/firm/equipo" }
                   ].map((item, i) => (
                     <Link key={i} href={item.href} className="group flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-900 group-hover:scale-110 transition-transform">
                           <item.icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                     </Link>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Columna Derecha: Plan y Estado Operativo */}
        <div className="lg:col-span-3 space-y-6">
           <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 p-8 flex flex-col items-center text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                 <Zap className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Plan {plan?.name}</h4>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Ecosistema Sosercom</p>
              
              <div className="w-full mt-6 space-y-4">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Uso de Causas</span>
                    <span className="text-xs font-black">{usage?.activeCases ?? 0} / {plan?.maxActiveCases || '∞'}</span>
                 </div>
                 <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${Math.min(((usage?.activeCases ?? 0) / (plan?.maxActiveCases || 100)) * 100, 100)}%` }} 
                    />
                 </div>
              </div>
              
              <Link href="/planes" className="mt-8 w-full py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                 Mejorar Capacidad
              </Link>
           </div>

           {/* Soporte Directo */}
           <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20">
              <h4 className="text-lg font-black tracking-tight mb-2">Soporte Estratégico</h4>
              <p className="text-xs text-blue-100/80 font-medium leading-relaxed mb-6">
                ¿Necesitas ayuda con una liquidación o trámite complejo? Nuestro equipo está disponible.
              </p>
              <button className="flex items-center gap-2 group text-[10px] font-black uppercase tracking-widest">
                 Contactar Equipo Sosercom <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
