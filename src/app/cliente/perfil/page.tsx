"use client";

import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

export default function ClientePerfilPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">Cuenta</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Mi perfil</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Datos basicos de acceso para pruebas 0MVP.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900">
          <UserRound className="mb-4 h-8 w-8 text-indigo-600" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre</p>
          <p className="mt-2 font-black text-slate-900 dark:text-white">{user.displayName || "Cliente"}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900">
          <Mail className="mb-4 h-8 w-8 text-indigo-600" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Correo</p>
          <p className="mt-2 break-all font-black text-slate-900 dark:text-white">{user.email}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900">
          <ShieldCheck className="mb-4 h-8 w-8 text-emerald-600" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Estado</p>
          <p className="mt-2 font-black text-slate-900 dark:text-white">{user.status}</p>
        </div>
      </div>
    </div>
  );
}
