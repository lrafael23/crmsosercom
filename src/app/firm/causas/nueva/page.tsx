"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { CheckCircle2, ChevronLeft, Loader2, Scale } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CASE_STAGE_OPTIONS, CASE_STATUS_OPTIONS, type CaseStage, type CaseStatus } from "@/features/cases/types";

type ClientOption = { id: string; name: string; rut?: string | null; email?: string | null };

export default function NewCasePage() {
  const router = useRouter();
  const { user } = useAuth();
  const tenantId = user?.tenantId;
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    clientName: "",
    category: "Judicial",
    type: "Procedimiento general",
    procedure: "Ordinario",
    description: "",
    status: "active" as CaseStatus,
    stage: "intake" as CaseStage,
    priority: "medium" as "low" | "medium" | "high" | "critical",
    nextDeadline: "",
    pendingBalance: "0",
    trackedMinutes: "0",
    lastAction: "Ingreso inicial",
    visibleToClient: true,
  });

  useEffect(() => {
    if (!tenantId) return;
    async function loadClients() {
      try {
        const snap = await getDocs(query(collection(db, "clients"), where("tenantId", "==", tenantId)));
        setClients(snap.docs.map((item) => {
          const data = item.data();
          return { id: item.id, name: String(data.name || data.nombre || data.displayName || data.email || "Cliente"), rut: typeof data.rut === "string" ? data.rut : null, email: typeof data.email === "string" ? data.email : null };
        }));
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar clientes");
      } finally {
        setLoadingClients(false);
      }
    }
    void loadClients();
  }, [tenantId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user?.tenantId || !user.uid) return;
    if (!formData.clientId && !formData.clientName.trim()) {
      toast.error("Debes seleccionar o escribir un cliente");
      return;
    }

    setIsSubmitting(true);
    const selectedClient = clients.find((client) => client.id === formData.clientId);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("No auth token");
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tenantId: user.tenantId,
          companyId: user.companyId || null,
          clientId: formData.clientId || `manual-${Date.now()}`,
          clientName: selectedClient?.name || formData.clientName.trim() || "Cliente",
          title: formData.title,
          category: formData.category,
          type: formData.type,
          procedure: formData.procedure,
          description: formData.description,
          status: formData.status,
          stage: formData.stage,
          assignedTo: user.uid,
          assignedToName: user.displayName || user.email || "Responsable",
          priority: formData.priority,
          nextDeadline: formData.nextDeadline || null,
          pendingBalance: Number(formData.pendingBalance || 0),
          trackedMinutes: Number(formData.trackedMinutes || 0),
          lastAction: formData.lastAction || "Ingreso inicial",
          visibleToClient: formData.visibleToClient,
          createdBy: user.uid,
          updatedBy: null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Error al crear causa");
      toast.success("Causa creada con exito");
      router.push(`/firm/causas/${data.record.id}`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Error al crear la causa");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-emerald-500">
          <ChevronLeft className="h-4 w-4" /> Volver
        </button>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[2rem] bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/20"><Scale className="h-7 w-7" /></div>
          <div>
            <h1 className="text-3xl font-black leading-none tracking-tight text-slate-900 dark:text-white">Nueva Causa Judicial</h1>
            <p className="mt-2 font-bold text-slate-500">Inicia un expediente con timeline, autosave y agenda vinculada.</p>
          </div>
        </div>
      </div>

      <Card className="rounded-[3rem] border-slate-200 bg-white p-8 shadow-sm dark:border-white/5 dark:bg-slate-900 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">Caratula / titulo de la causa</Label>
              <Input placeholder="Ej: Valenzuela con Banco Estado - Cobro de Pesos" className="h-14 rounded-2xl border-slate-200 px-6 text-lg font-bold" value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} required />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">Cliente existente</Label>
                <select value={formData.clientId} onChange={(event) => setFormData({ ...formData, clientId: event.target.value })} className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold dark:bg-slate-950">
                  <option value="">{loadingClients ? "Cargando clientes..." : "Seleccionar cliente"}</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.rut ? ` (${client.rut})` : ""}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">O cliente manual</Label>
                <Input placeholder="Nombre cliente" className="h-14 rounded-2xl border-slate-200 px-5" value={formData.clientName} onChange={(event) => setFormData({ ...formData, clientName: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">Categoria</Label>
                <select value={formData.category} onChange={(event) => setFormData({ ...formData, category: event.target.value })} className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold dark:bg-slate-950">
                  <option value="Judicial">Judicial</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Extrajudicial">Extrajudicial</option>
                  <option value="Asesoria">Asesoria</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">Tipo de causa</Label>
                <Input placeholder="Ej: Cobro ejecutivo, laboral, familia" className="h-12 rounded-2xl border-slate-200 px-4" value={formData.type} onChange={(event) => setFormData({ ...formData, type: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">Procedimiento</Label>
                <Input placeholder="Ej: Ejecutivo, ordinario, administrativo" className="h-12 rounded-2xl border-slate-200 px-4" value={formData.procedure} onChange={(event) => setFormData({ ...formData, procedure: event.target.value })} />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value as CaseStatus })} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold dark:bg-slate-950">
                {CASE_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={formData.stage} onChange={(event) => setFormData({ ...formData, stage: event.target.value as CaseStage })} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold dark:bg-slate-950">
                {CASE_STAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={formData.priority} onChange={(event) => setFormData({ ...formData, priority: event.target.value as typeof formData.priority })} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold dark:bg-slate-950">
                <option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option><option value="critical">Critica</option>
              </select>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Input type="date" className="h-12 rounded-2xl border-slate-200 px-4" value={formData.nextDeadline} onChange={(event) => setFormData({ ...formData, nextDeadline: event.target.value })} />
              <Input type="number" className="h-12 rounded-2xl border-slate-200 px-4" value={formData.pendingBalance} onChange={(event) => setFormData({ ...formData, pendingBalance: event.target.value })} placeholder="Saldo pendiente" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Input type="number" className="h-12 rounded-2xl border-slate-200 px-4" value={formData.trackedMinutes} onChange={(event) => setFormData({ ...formData, trackedMinutes: event.target.value })} placeholder="Minutos acumulados" />
              <Input className="h-12 rounded-2xl border-slate-200 px-4" value={formData.lastAction} onChange={(event) => setFormData({ ...formData, lastAction: event.target.value })} placeholder="Ultima accion" />
            </div>

            <div className="space-y-2">
              <Label className="ml-1 text-xs font-black uppercase tracking-widest text-slate-400">Descripcion inicial / materia</Label>
              <Textarea placeholder="Breve resumen de la materia del juicio o solicitud del cliente..." className="min-h-[150px] rounded-[2rem] border-slate-200 p-6 text-sm font-medium leading-relaxed" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} required />
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 dark:border-white/10 dark:bg-slate-950">
              Visible para cliente
              <input type="checkbox" checked={formData.visibleToClient} onChange={(event) => setFormData({ ...formData, visibleToClient: event.target.checked })} />
            </label>
          </div>

          <div className="flex gap-4 border-t border-slate-100 pt-6 dark:border-white/5">
            <Button type="button" variant="outline" className="flex-1 rounded-2xl py-7 font-black" onClick={() => router.back()}>CANCELAR</Button>
            <Button type="submit" className="flex-[2] rounded-2xl bg-emerald-500 py-7 font-black text-slate-950 shadow-xl shadow-emerald-500/20 transition-all hover:scale-105" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />CREANDO EXPEDIENTE...</> : <><CheckCircle2 className="mr-2 h-5 w-5" />CONFIRMAR Y CREAR CAUSA</>}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
