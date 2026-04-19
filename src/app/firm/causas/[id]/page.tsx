"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, FileText, Loader2, Shield } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import LegalVault from "@/components/vault/LegalVault";
import { Button } from "@/components/ui/button";
import { CaseDetailView } from "@/features/cases/components/CaseDetailView";
import type { CaseRecord, TimelineEventRecord } from "@/features/cases/types";

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [record, setRecord] = useState<CaseRecord | null>(null);
  const [timeline, setTimeline] = useState<TimelineEventRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"operacion" | "documentos">("operacion");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id || !user?.tenantId) return;
    async function loadCase() {
      setLoading(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("No auth token");
        const res = await fetch(`/api/cases/${params.id}?tenantId=${encodeURIComponent(user!.tenantId!)}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "No se pudo cargar causa");
        setRecord(data.case);
        setTimeline(data.timeline || []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    void loadCase();
  }, [params?.id, user?.tenantId]);

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;
  }

  if (!record || error) {
    return (
      <div className="rounded-[3rem] border border-slate-200 bg-white p-12 text-center dark:border-white/5 dark:bg-slate-900">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Expediente no encontrado</h2>
        <p className="mt-2 text-sm text-slate-500">{error || "No existe o no tienes permisos para verlo."}</p>
        <Button onClick={() => router.push("/firm/causas")} className="mt-5 rounded-2xl bg-emerald-500 text-slate-950">Volver al listado</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <button onClick={() => router.push("/firm/causas")} className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-emerald-500">
        <ChevronLeft className="h-4 w-4" /> Volver a causas
      </button>

      <div className="flex w-fit items-center gap-2 rounded-[2.5rem] border border-slate-200 bg-white p-1.5 dark:border-white/5 dark:bg-slate-900">
        <button onClick={() => setActiveTab("operacion")} className={`flex items-center gap-2 rounded-[2rem] px-6 py-3 text-sm font-black transition-all ${activeTab === "operacion" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-400"}`}>
          <FileText className="h-4 w-4" /> Operacion y timeline
        </button>
        <button onClick={() => setActiveTab("documentos")} className={`flex items-center gap-2 rounded-[2rem] px-6 py-3 text-sm font-black transition-all ${activeTab === "documentos" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-400"}`}>
          <Shield className="h-4 w-4" /> Boveda legal
        </button>
      </div>

      {activeTab === "operacion" ? <CaseDetailView record={record} timeline={timeline} actorId={user?.uid || record.assignedTo} /> : <LegalVault caseId={record.id} />}
    </div>
  );
}
