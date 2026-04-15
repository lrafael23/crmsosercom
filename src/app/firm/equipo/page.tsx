"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Clock,
  Briefcase,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthContext";
import { db } from "@/lib/firebase/client";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { getPlan, formatCLP } from "@/lib/plans";
import { getTenantPlanUsage } from "@/lib/billing";
import UserInviteModal from "@/components/team/UserInviteModal";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface TeamMember {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  status: "active" | "pending" | "inactive";
  photoURL?: string;
  createdAt: any;
}

// ─── Componentes Auxiliares ──────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const configs: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    owner_firm: { label: "Titular", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", icon: Shield },
    abogado: { label: "Abogado", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", icon: Briefcase },
    contador: { label: "Contador", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", icon: Users },
    staff: { label: "Staff", bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", icon: Users },
  };

  const config = configs[role] || { label: role, bg: "bg-slate-100", text: "text-slate-600", icon: Users };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs = {
    active: { label: "Activo", color: "text-emerald-500", icon: CheckCircle2 },
    pending: { label: "Pendiente", color: "text-amber-500", icon: Clock },
    inactive: { label: "Inactivo", color: "text-red-500", icon: XCircle },
  };
  const config = configs[status as keyof typeof configs] || configs.inactive;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────

export default function EquipoPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<any>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    if (!user?.tenantId) return;

    // 1. Escuchar miembros del equipo
    const q = query(
      collection(db, "users"),
      where("tenantId", "==", user.tenantId)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ uid: d.id, ...d.data() } as TeamMember));
      // Ordenar: owner primero, luego por nombre
      const sorted = docs.sort((a, b) => {
        if (a.role === 'owner_firm') return -1;
        if (b.role === 'owner_firm') return 1;
        return a.displayName.localeCompare(b.displayName);
      });
      setMembers(sorted);
      setLoading(false);
    });

    // 2. Cargar uso del plan
    getTenantPlanUsage(user.tenantId).then(setUsage);

    return () => unsubscribe();
  }, [user]);

  const plan = usage ? getPlan(usage.planId) : null;
  const seatsUsed = members.length;
  const seatsLimit = plan ? (plan.id === 'premium' ? '∞' : plan.includedSeats) : '--';
  const usagePercentage = plan && typeof seatsLimit === 'number' ? (seatsUsed / seatsLimit) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mi Equipo</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Gestiona los accesos y roles de tu estudio jurídico.</p>
        </div>

        {/* Plan Usage Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6 min-w-[320px]">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${usagePercentage >= 90 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
            <UserCheck className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cupos del Plan</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {seatsUsed} <span className="text-slate-400">/ {seatsLimit}</span>
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
                className={`h-full rounded-full ${usagePercentage >= 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="relative group">
           <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
             <Users className="w-4 h-4 text-slate-400" />
           </div>
           <input 
            type="text" 
            placeholder="Buscar por nombre o rol..." 
            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm w-80 focus:ring-2 ring-emerald-500/20 transition-all outline-none"
           />
        </div>

        <button 
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          Invitar Colaborador
        </button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {members.map((member, index) => (
            <motion.div
              key={member.uid}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all outline-none"
            >
              {/* Member Card Content */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-bold text-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.displayName} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      member.displayName?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">{member.displayName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                       <Mail className="w-3 h-3 text-slate-400" />
                       <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{member.email}</span>
                    </div>
                  </div>
                </div>
                
                {member.role !== 'owner_firm' && (
                  <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <RoleBadge role={member.role} />
                <StatusBadge status={member.status} />
              </div>

              {/* Hover Effect Background */}
              <div className="absolute inset-0 rounded-3xl bg-emerald-600/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 mt-4 font-bold text-xs uppercase tracking-widest">Cargando equipo...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && members.length === 0 && (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <Users className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">No hay miembros aún</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">Comienza invitando a tus colaboradores para trabajar en conjunto.</p>
          <button 
             onClick={() => setIsInviteOpen(true)}
             className="mt-8 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold transition-all hover:shadow-lg hover:shadow-emerald-500/20"
          >
            Invitar ahora
          </button>
        </div>
      )}
      {/* Modal de Invitación */}
      <UserInviteModal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        tenantId={user?.tenantId || ""} 
      />
    </div>
  );
}
