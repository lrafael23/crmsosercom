"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs, getCountFromServer } from "firebase/firestore";
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
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const { user } = useAuth();
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
        const logs = auditSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as AuditEntry[];
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

  return (
    <div className="flex flex-col gap-10 pb-10">
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
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">Control Room</h1>
          <p className="text-slate-500 font-medium">Panel de mando central para la infraestructura Portal 360.</p>
        </motion.div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="h-12 w-12 rounded-2xl p-0 border-slate-200">
            <Search className="w-5 h-5 text-slate-400" />
          </Button>
          <Button variant="outline" className="h-12 w-12 rounded-2xl p-0 border-slate-200 relative">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </Button>
          <Button className="h-12 px-6 bg-slate-900 hover:bg-slate-800 rounded-2xl gap-3 shadow-xl shadow-slate-200">
             <TrendingUp className="w-5 h-5" />
             Reporte Ejecutivo
          </Button>
        </div>
      </div>

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
    </div>
  );
}
