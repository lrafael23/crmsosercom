"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, limit, getDocs, getCountFromServer, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { 
  Building2, 
  Users, 
  Receipt, 
  ShieldAlert, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Search,
  Bell,
  Cpu,
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import WeeklyCalendar from "@/components/dashboard/WeeklyCalendar";
import CockpitFinancials from "@/components/dashboard/CockpitFinancials";

interface StatRecord {
  label: string;
  value: string | number;
  icon: any;
  trend: string;
  trendUp: boolean;
  color: string;
}

interface AuditEntry {
  id: string;
  action: string;
  performedByEmail: string;
  details: string;
  timestamp: any;
}

export default function SuperAdminPage() {
  const { user, impersonate } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"system" | "operations">("system");
  const [stats, setStats] = useState<StatRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Stats (Counts)
        const companiesCount = await getCountFromServer(collection(db, "companies"));
        const usersCount = await getCountFromServer(collection(db, "users"));
        const ticketsCount = await getCountFromServer(collection(db, "tickets"));
        
        setStats([
          { 
            label: "Total Empresas", 
            value: companiesCount.data().count, 
            icon: Building2, 
            trend: "+12% vs mes anterior", 
            trendUp: true,
            color: "blue"
          },
          { 
            label: "Usuarios Activos", 
            value: usersCount.data().count, 
            icon: Users, 
            trend: "+5% crecimiento", 
            trendUp: true,
            color: "emerald"
          },
          { 
            label: "Tickets Pendientes", 
            value: ticketsCount.data().count, 
            icon: ShieldAlert, 
            trend: "-2% resolución rápida", 
            trendUp: false,
            color: "rose"
          },
          { 
            label: "Ingresos (ARR)", 
            value: "$42.5k", 
            icon: Receipt, 
            trend: "+20% anual", 
            trendUp: true,
            color: "purple"
          },
        ]);

        // 2. Fetch Recent Audit Logs
        const auditQuery = query(
          collection(db, "audit_logs"), 
          orderBy("timestamp", "desc"), 
          limit(6)
        );
        const auditSnap = await getDocs(auditQuery);
        const logs = auditSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            action: data.action || data.actionType || "Acción",
            performedByEmail: data.performedByEmail || data.userId || "Usuario",
            details: typeof data.details === "string" 
              ? data.details 
              : Object.keys(data.details || {}).length > 0 
                ? JSON.stringify(data.details) 
                : "Sin detalles adicionales",
            timestamp: data.timestamp
          };
        }) as AuditEntry[];
        setAuditLogs(logs);

      } catch (e) {
        console.error("Error fetching super-admin dashboard data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!user) return null;

  const openDemoAs = async (email: string, path: string) => {
    const userQuery = query(collection(db, "users"), where("email", "==", email), limit(1));
    const snap = await getDocs(userQuery);
    if (!snap.empty) {
      await impersonate(snap.docs[0].id);
      router.push(path);
    }
  };

  const openDemoSchedule = async () => {
    const lawyerQuery = query(collection(db, "users"), where("email", "==", "lawyer.0mvp@sosercom.cl"), limit(1));
    const lawyerSnap = await getDocs(lawyerQuery);
    if (!lawyerSnap.empty) {
      await openDemoAs("cliente.0mvp@sosercom.cl", `/cliente/agendar/${lawyerSnap.docs[0].id}`);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Top Bar / Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-rose-500/10 text-rose-600 border-rose-200 uppercase tracking-widest text-[10px] font-black px-3">
              Access Level: Global
            </Badge>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistemas Operativos S.A</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">
            {activeTab === 'system' ? 'Control Room' : 'Mi Cabina Operativa'}
          </h1>
          <p className="text-slate-500 font-medium pt-2">
            {activeTab === 'system' 
              ? 'Panel de mando central para la infraestructura Portal 360.' 
              : 'Gestión personal de causas, agenda y finanzas.'}
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Tab Selector */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab("system")}
              className={cn(
                "px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                activeTab === "system" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Cpu className="w-3.5 h-3.5" />
              Sistemas
            </button>
            <button
              onClick={() => setActiveTab("operations")}
              className={cn(
                "px-4 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                activeTab === "operations" 
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" 
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Operaciones
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" className="h-11 w-11 rounded-xl p-0 border-slate-200">
              <Search className="w-4 h-4 text-slate-400" />
            </Button>
            <Button variant="outline" className="h-11 w-11 rounded-xl p-0 border-slate-200 relative">
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white" />
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'system' ? (
          <motion.div
            key="system"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
           Array(4).fill(0).map((_, i) => (
             <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-[2rem]" />
           ))
        ) : (
          stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all"
            >
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                   <stat.icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${stat.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend.split(' ')[0]}
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2 relative z-10">{stat.value}</h3>
              
              {/* Decorative side accent */}
              <div className={`absolute top-0 right-0 bottom-0 w-1 bg-${stat.color}-500/10`} />
            </motion.div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Audit Feed */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <Activity className="w-4 h-4 text-emerald-500" />
                Trazabilidad Técnica (Logs)
              </h3>
              <Button variant="link" className="text-xs font-bold text-emerald-600 p-0 h-auto">Ver todo</Button>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-20 text-center animate-pulse italic text-slate-300">Cargando eventos...</div>
              ) : auditLogs.length === 0 ? (
                <div className="p-20 text-center text-slate-400 italic">No se registran acciones recientes.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                   {auditLogs.map((log) => (
                     <div key={log.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                           <ShieldAlert className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">{log.action}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : "Ahora"}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800">{log.details}</p>
                          <p className="text-xs text-slate-500">{log.performedByEmail}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-200 mt-1" />
                     </div>
                   ))}
                </div>
              )}
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                 <Button variant="ghost" className="text-xs font-bold text-slate-500 uppercase tracking-widest gap-2">
                    Acceder al módulo de auditoría completo
                    <ChevronRight className="w-3 h-3" />
                 </Button>
              </div>
           </div>
        </div>

        {/* System Health / Quick Actions */}
        <div className="space-y-6">
           <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Servicios Críticos</h3>
           
           <div className="space-y-3">
              {[
                { name: "Auth Engine", status: "Operational", color: "emerald" },
                { name: "Firestore Cluster", status: "Operational", color: "emerald" },
                { name: "Cloud Functions", status: "Idle/Ready", color: "blue" },
                { name: "Storage Bucket", status: "Operational", color: "emerald" },
                { name: "OpenAI API", status: "Degraded", color: "amber" },
              ].map((service, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                   <span className="text-sm font-bold text-slate-700">{service.name}</span>
                   <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider text-${service.color}-600`}>{service.status}</span>
                      <div className={`w-1.5 h-1.5 rounded-full bg-${service.color}-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]`} />
                   </div>
                </div>
              ))}
           </div>

           <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-4">
              <h4 className="font-bold">Mantenimiento Global</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Próxima ventana de actualización: Sábado 02:00 AM UTC. No se esperan caídas de servicio.</p>
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold">
                 Ver Calendario Tech
              </Button>
           </div>
          </div>
        </div>
      </motion.div>
    ) : (
          <motion.div
            key="operations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <Badge className="mb-3 border-none bg-emerald-600 text-white">0MVP TEST LAB</Badge>
                  <h2 className="text-2xl font-black text-slate-900">Flujos habilitados sin pago</h2>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    Usa estos accesos para probar clientes, causas, documentos y videollamadas con datos demo reales.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Button
                    onClick={() => openDemoAs("lawyer.0mvp@sosercom.cl", "/firm")}
                    className="h-12 rounded-2xl bg-slate-900 px-5 text-xs font-black uppercase tracking-widest text-white"
                  >
                    Probar Estudio
                  </Button>
                  <Button
                    onClick={() => openDemoAs("lawyer.0mvp@sosercom.cl", "/firm/clientes")}
                    className="h-12 rounded-2xl bg-emerald-600 px-5 text-xs font-black uppercase tracking-widest text-white"
                  >
                    Crear Cliente
                  </Button>
                  <Button
                    onClick={openDemoSchedule}
                    className="h-12 rounded-2xl bg-indigo-600 px-5 text-xs font-black uppercase tracking-widest text-white"
                  >
                    Agendar Meet
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2">
                <WeeklyCalendar />
              </div>
              <div className="space-y-8">
                <CockpitFinancials />
                <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                  <div className="relative z-10 space-y-4">
                    <h4 className="text-xl font-black uppercase tracking-tight">Atención Prioritaria</h4>
                    <p className="text-emerald-100 text-sm font-medium leading-relaxed">
                      Como Super Admin, tienes visibilidad total de los casos críticos del sistema. Revisa las alertas de clientes con pagos pendientes.
                    </p>
                    <Button className="w-full bg-white text-emerald-600 hover:bg-emerald-50 rounded-2xl font-black uppercase tracking-widest text-[10px] h-12">
                      Ver Alertas Globales
                    </Button>
                  </div>
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                    <ShieldAlert className="w-24 h-24" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
