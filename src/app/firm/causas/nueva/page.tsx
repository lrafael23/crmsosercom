"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  increment 
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { 
  Plus, 
  ChevronLeft, 
  Gavel, 
  User, 
  FileText, 
  Scale, 
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export default function NewCasePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    category: "Judicial",
    description: "",
    status: "activo",
    stage: "intake"
  });

  useEffect(() => {
    if (!user?.tenantId) return;

    const loadClients = async () => {
      try {
        const q = query(
          collection(db, "clients"),
          where("tenantId", "==", user.tenantId)
        );
        const snap = await getDocs(q);
        setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar clientes");
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId) return;
    if (!formData.clientId) {
      toast.error("Debes seleccionar un cliente");
      return;
    }

    setIsSubmitting(true);
    const selectedClient = clients.find(c => c.id === formData.clientId);

    try {
      // 1. Create Case
      const caseRef = await addDoc(collection(db, "cases"), {
        ...formData,
        clientName: selectedClient?.name || "Desconocido",
        tenantId: user.tenantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Increment client case count
      await updateDoc(doc(db, "clients", formData.clientId), {
        cases: increment(1),
        updatedAt: serverTimestamp()
      });

      // 3. Update tenant usage (optional but recommended)
      await updateDoc(doc(db, "tenants", user.tenantId), {
        activeCases: increment(1),
        updatedAt: serverTimestamp()
      });

      toast.success("Causa judicial creada con éxito");
      router.push(`/firm/causas/${caseRef.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Error al crear la causa");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-emerald-500 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver
        </button>
        
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-emerald-500 text-slate-950 rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <Scale className="w-7 h-7" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Nueva Causa Judicial</h1>
              <p className="text-slate-500 font-bold mt-2">Inicia un nuevo expediente y vincula a tu cliente.</p>
           </div>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-white/5 rounded-[3rem] p-10 bg-white dark:bg-slate-900 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Carátula / Título de la Causa</Label>
              <Input 
                placeholder="Ej: Valenzuela con Banco Estado - Cobro de Pesos"
                className="rounded-2xl border-slate-200 py-6 px-6 text-lg font-bold"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Cliente Vinculado</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(val) => val && setFormData({...formData, clientId: val})}
                >
                  <SelectTrigger className="rounded-2xl border-slate-200 py-6 px-6 font-bold">
                    <SelectValue placeholder={loadingClients ? "Cargando clientes..." : "Seleccionar cliente"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200">
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id} className="font-bold py-3">
                        {client.name} ({client.rut})
                      </SelectItem>
                    ))}
                    {clients.length === 0 && !loadingClients && (
                      <div className="p-4 text-center text-xs text-slate-400 font-bold italic">
                        No hay clientes. Créalos en el ClientHub primero.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Procedimiento</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => val && setFormData({...formData, category: val})}
                >
                  <SelectTrigger className="rounded-2xl border-slate-200 py-6 px-6 font-bold">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200">
                    <SelectItem value="Judicial" className="font-bold py-3 italic text-blue-600">Judicial</SelectItem>
                    <SelectItem value="Administrativo" className="font-bold py-3 italic text-amber-600">Administrativo</SelectItem>
                    <SelectItem value="Extrajudicial" className="font-bold py-3 italic text-emerald-600">Extrajudicial</SelectItem>
                    <SelectItem value="Asesoría" className="font-bold py-3 italic text-purple-600">Asesoría</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Descripción Inicial / Materia</Label>
              <Textarea 
                placeholder="Breve resumen de la materia del juicio o la solicitud del cliente..."
                className="rounded-[2rem] border-slate-200 min-h-[150px] p-6 text-sm font-medium leading-relaxed"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex gap-4">
             <Button 
               type="button" 
               variant="outline" 
               className="flex-1 rounded-2xl py-7 font-black bg-slate-50 dark:bg-slate-800"
               onClick={() => router.back()}
             >
               CANCELAR
             </Button>
             <Button 
               type="submit" 
               className="flex-[2] bg-emerald-500 text-slate-950 font-black rounded-2xl py-7 shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all"
               disabled={isSubmitting}
             >
               {isSubmitting ? (
                 <>
                   <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                   CREANDO EXPEDIENTE...
                 </>
               ) : (
                 <>
                   <CheckCircle2 className="w-5 h-5 mr-2" />
                   CONFIRMAR Y CREAR CAUSA
                 </>
               )}
             </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
