"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Copy, FileText, CalendarClock, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function DashboardClientPage() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Bienvenido, {user.displayName || "Cliente"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Resumen de actividad de tu cuenta y estado de servicios.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tenant ID:</span>
          <span className="text-sm font-mono text-slate-700 dark:text-slate-300 ml-1">{user.tenantId}</span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(user.tenantId || "Global");
              toast.success("ID copiado al portapapeles");
            }}
            className="ml-2 text-slate-400 hover:text-emerald-500 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Causas Activas</h3>
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-4">2</p>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-emerald-500 font-medium">1 actualización</span>
            <span className="text-slate-500 ml-2">esta semana</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Documentos Nuevos</h3>
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-4">5</p>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-500">Pendientes de revisión</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300">Próximos Pagos</h3>
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-4">$0.00</p>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-emerald-500 font-medium">Al día</span>
            <span className="text-slate-500 ml-2">con sus obligaciones</span>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Espacio de Trabajo del Cliente</h2>
        <p className="text-slate-500">
          La funcionalidad extendida se habilitará pronto, esto es una pre-visualización de su entorno.
        </p>
      </div>
    </div>
  );
}
