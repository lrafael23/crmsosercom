"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ClientCasesList } from "@/components/client-portal/ClientCasesList";
import type { CaseRecord } from "@/features/cases/types";
import type { ClientCaseSummary } from "@/features/client-portal/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { auth } from "@/lib/firebase/client";

export default function ClienteCausasPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<CaseRecord[]>([]);
  const [summary, setSummary] = useState<ClientCaseSummary | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sesion no disponible");

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status.trim()) params.set("status", status.trim());

      const res = await fetch(`/api/client/cases?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "No se pudieron cargar las causas");

      setRows(data.data ?? []);
      setSummary(data.summary ?? null);
    } catch (err) {
      setRows([]);
      setSummary(null);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [search, status, user?.uid]);

  useEffect(() => {
    if (!authLoading && user?.uid) void loadCases();
  }, [authLoading, user?.uid]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center rounded-[32px] bg-white shadow-sm">
        <div className="flex flex-col items-center gap-3 text-neutral-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Cargando portal cliente</p>
        </div>
      </div>
    );
  }

  return (
    <ClientCasesList
      rows={rows}
      summary={summary}
      search={search}
      status={status}
      loading={loading}
      error={error}
      onSearchChange={setSearch}
      onStatusChange={setStatus}
      onSubmit={() => void loadCases()}
    />
  );
}
