"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, FolderOpen, Plus, Search, Wallet } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { CaseRecord } from "@/features/cases/types";
import { CASE_STAGE_OPTIONS, CASE_STATUS_OPTIONS } from "@/features/cases/types";
import { CasesTable } from "@/components/cases/CasesTable";
import { ExcelImportButton } from "@/components/cases/ExcelImportButton";

export default function CasesPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId;
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [stage, setStage] = useState("todos");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const activeTenantId = tenantId ?? "";
    if (!activeTenantId) return;

    async function loadCases() {
      setLoading(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("No auth token");

        const params = new URLSearchParams({ tenantId: activeTenantId });
        if (status !== "todos") params.set("status", status);
        if (stage !== "todos") params.set("stage", stage);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/cases?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
  }, [reloadKey, search, stage, status, tenantId]);

  const stats = useMemo(
    () => ({
      total: cases.length,
      critical: cases.filter((item) => item.priority === "critical" || item.status === "hearing").length,
      balance: cases.reduce((sum, item) => sum + (item.pendingBalance || 0), 0),
      hours: cases.reduce((sum, item) => sum + Math.floor((item.trackedMinutes || 0) / 60), 0),
    }),
    [cases],
  );

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="rounded-[32px] bg-white p-6 shadow-sm dark:bg-slate-900">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Portal 360 - Gestion de causas</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white">
              Centro de causas y operacion juridica
            </h1>
            <p className="mt-3 max-w-4xl text-base leading-7 text-neutral-600 dark:text-slate-400">
              Crea, importa, busca y administra expedientes conectados con timeline, documentos, agenda y cobros.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {user?.tenantId && user?.uid ? (
              <ExcelImportButton tenantId={user.tenantId} createdBy={user.uid} onImported={() => setReloadKey((value) => value + 1)} />
            ) : null}
            <Link
              href="/firm/causas/nueva"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" /> Nueva causa
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><Briefcase className="h-4 w-4" /> Total causas</div>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><FolderOpen className="h-4 w-4" /> Criticas / audiencia</div>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">{stats.critical}</p>
        </div>
        <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><Wallet className="h-4 w-4" /> Saldo pendiente</div>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">${stats.balance.toLocaleString("es-CL")}</p>
        </div>
        <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm text-neutral-500">Horas registradas</div>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">{stats.hours} h</p>
        </div>
      </div>

      <div className="grid gap-4 rounded-[32px] bg-white p-6 shadow-sm dark:bg-slate-900 xl:grid-cols-[1fr_240px_240px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar cliente, materia, procedimiento, responsable o causa"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-12 w-full rounded-2xl border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-neutral-400 dark:border-white/10 dark:bg-slate-950"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm dark:border-white/10 dark:bg-slate-950"
        >
          <option value="todos">Todos los estados</option>
          {CASE_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select
          value={stage}
          onChange={(event) => setStage(event.target.value)}
          className="h-12 rounded-2xl border border-neutral-200 bg-white px-4 text-sm dark:border-white/10 dark:bg-slate-950"
        >
          <option value="todos">Todas las etapas</option>
          {CASE_STAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          className="h-12 rounded-2xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-[32px] border border-neutral-200 bg-white p-20 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
          <FolderOpen className="mx-auto mb-6 h-12 w-12 text-neutral-300" />
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">No se encontraron causas</h3>
          <p className="mx-auto mt-2 max-w-sm text-neutral-500">Crea o importa una causa para activar timeline, autosave, documentos y agenda vinculada.</p>
        </div>
      ) : (
        <CasesTable rows={cases} />
      )}
    </div>
  );
}
