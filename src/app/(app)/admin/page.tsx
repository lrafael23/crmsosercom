"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Users, FileStack, LayoutDashboard } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Panel de Operaciones Internas
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Vista para el rol: <span className="font-semibold text-emerald-600 capitalize">{user.role}</span>
        </p>
      </div>

      {/* Basic Metrics Shell */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <MetricCard title="Requerimientos Activos" value="12" icon={<LayoutDashboard />} />
         <MetricCard title="Clientes Asignados" value="5" icon={<Users />} />
         <MetricCard title="Doc. Pendientes" value="8" icon={<FileStack />} />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Bandeja de Entrada de Casos</h2>
        <p className="text-slate-500">
          En este módulo podrás revisar y asignar tareas de tu departamento.
        </p>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-600 dark:text-slate-400 text-sm">{title}</h3>
        <div className="text-emerald-500 w-5 h-5 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{value}</p>
    </div>
  );
}
