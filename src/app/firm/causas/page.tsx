"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { CaseRecord } from "@/features/cases/types";
import { CASE_STATUS_OPTIONS } from "@/features/cases/types";
import { ChevronRight, Clock, FolderOpen, Gavel, Plus, Search } from "lucide-react";

export default function CasesPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");

  useEffect(() => {
    if (!user?.tenantId) return;
    async function loadCases() {
      setLoading(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("No auth token");
        const params = new URLSearchParams({ tenantId: user!.tenantId! });
        if (status !== "todos") params.set("status", status);
        if (search.trim()) params.set("search", search.trim());
        const res = await fetch(`/api/cases?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo cargar causas");
        setCases(data.data || []);
      } catch (error) {
        console.error(error);
        setCases([]);
      } finally {
        setLoading(false);
      }
    }
    const timer = window.setTimeout(() => void loadCases(), 250);
    return () => window.clearTimeout(timer);
  }, [search, status, user?.tenantId]);

  const stats = useMemo(() => ({
    total: cases.length,
    critical: cases.filter((item) => item.priority === "critical" || item.status === "hearing").length,
    balance: cases.reduce((sum, item) => sum + (item.pendingBalance || 0), 0),
  }), [cases]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Portal 360 - Causas</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Expedientes Judiciales</h1>
          <p className="mt-1 font-medium text-slate-500">Listado conectado al detalle, agenda y timeline operativo.</p>
        </div>
        <Link href="/firm/causas/nueva" className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-black text-slate-950 shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02]">
          <Plus className="h-5 w-5" /> NUEVA CAUSA
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] bg-white p-5 shadow-sm dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total causas</p><p className="mt-2 text-3xl font-black">{stats.total}</p></div>
        <div className="rounded-[2rem] bg-white p-5 shadow-sm dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Criticas / audiencia</p><p className="mt-2 text-3xl font-black">{stats.critical}</p></div>
        <div className="rounded-[2rem] bg-white p-5 shadow-sm dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Saldo pendiente</p><p className="mt-2 text-3xl font-black">${stats.balance.toLocaleString("es-CL")}</p></div>
      </div>

      <div className="grid gap-3 rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm dark:border-white/5 dark:bg-slate-900 md:grid-cols-[1fr_240px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar por caratula, cliente, categoria o responsable..." value={search} onChange={(event) => setSearch(event.target.value)} className="h-12 w-full rounded-2xl bg-transparent pl-10 pr-4 text-sm outline-none" />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold dark:border-white/10 dark:bg-slate-950">
          <option value="todos">Todos los estados</option>
          {CASE_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" /></div>
      ) : cases.length === 0 ? (
        <div className="rounded-[3rem] border border-slate-200 bg-white p-20 text-center dark:border-white/5 dark:bg-slate-900">
          <FolderOpen className="mx-auto mb-6 h-12 w-12 text-slate-300" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white">No se encontraron causas</h3>
          <p className="mx-auto mt-2 max-w-sm text-slate-500">Crea una causa para activar timeline, autosave, documentos y agenda vinculada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((item, index) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} whileHover={{ y: -5 }} className="group rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl dark:border-white/5 dark:bg-slate-900">
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><Gavel className="h-6 w-6" /></div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800">{item.status.replace(/_/g, " ")}</div>
              </div>
              <h3 className="mb-2 text-lg font-black leading-tight text-slate-900 transition-colors group-hover:text-emerald-500 dark:text-white">{item.title}</h3>
              <p className="mb-6 truncate text-sm font-bold capitalize text-slate-500">{item.clientName}</p>
              <p className="mb-6 line-clamp-2 text-sm text-slate-500">{item.description}</p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-6 dark:border-white/5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Clock className="h-3.5 w-3.5" /><span>{new Date(item.updatedAt).toLocaleDateString()}</span></div>
                <Link href={`/firm/causas/${item.id}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition-all hover:bg-emerald-500 dark:bg-slate-800"><ChevronRight className="h-5 w-5" /></Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
