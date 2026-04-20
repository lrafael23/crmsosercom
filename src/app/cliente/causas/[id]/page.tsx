"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ClientCaseDetailView } from "@/components/client-portal/ClientCaseDetailView";
import type { ClientCaseDetailPayload } from "@/features/client-portal/types";
import { useAuth } from "@/lib/auth/AuthContext";
import { auth } from "@/lib/firebase/client";

export default function ClientCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ClientCaseDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!user?.uid || !id) return;
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sesion no disponible");

      const res = await fetch(`/api/client/cases/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || "No se pudo cargar la causa");

      setData({ case: payload.case, timeline: payload.timeline, agenda: payload.agenda, documents: payload.documents, payments: payload.payments });
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [id, user?.uid]);

  useEffect(() => {
    if (!authLoading && user?.uid) void loadDetail();
  }, [authLoading, user?.uid, loadDetail]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center rounded-[32px] bg-white shadow-sm">
        <div className="flex flex-col items-center gap-3 text-neutral-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Cargando detalle</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Link href="/cliente/causas" className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-950">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a mis causas
        </Link>
        <div className="rounded-[32px] border border-dashed border-neutral-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Causa no disponible</h1>
          <p className="mt-2 text-sm text-neutral-500">{error || "No tienes permisos para ver esta causa."}</p>
        </div>
      </div>
    );
  }

  return <ClientCaseDetailView data={data} />;
}
