"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, increment } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase/client";
import { 
  Gavel, 
  FileText, 
  Clock, 
  User, 
  ChevronLeft,
  Calendar,
  Shield,
  LayoutGrid,
  History,
  Trash2,
  Edit2,
  Loader2
} from "lucide-react";
import LegalVault from "@/components/vault/LegalVault";
import CaseTimeline from "@/components/cases/CaseTimeline";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CaseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "vault" | "timeline">("vault");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: ""
  });

  useEffect(() => {
    if (!id) return;
    const loadCase = async () => {
      try {
        const snap = await getDoc(doc(db, "cases", id as string));
        if (snap.exists()) {
          const data = snap.data();
          setCaseData({ id: snap.id, ...data });
          setEditForm({
            title: data.title || "",
            description: data.description || "",
            status: data.status || "activo"
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCase();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar este expediente? Esta acción no se puede deshacer.")) return;
    try {
      // Decrement tenant case count
      if (caseData?.tenantId) {
        await updateDoc(doc(db, "tenants", caseData.tenantId), {
          activeCases: increment(-1),
          updatedAt: serverTimestamp()
        });
      }
      
      // Decrement client case count
      if (caseData?.clientId) {
        await updateDoc(doc(db, "clients", caseData.clientId), {
          cases: increment(-1),
          updatedAt: serverTimestamp()
        });
      }

      await deleteDoc(doc(db, "cases", id as string));
      toast.success("Expediente eliminado correctamente");
      router.push("/firm/causas");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar la causa");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "cases", id as string), {
        ...editForm,
        updatedAt: serverTimestamp()
      });
      setCaseData({ ...caseData, ...editForm });
      setIsEditOpen(false);
      toast.success("Expediente actualizado");
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  if (!caseData) return (
    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/5">
      <h2 className="text-2xl font-black text-slate-900 dark:text-white">Expediente no encontrado</h2>
      <button onClick={() => router.push("/firm/causas")} className="mt-4 text-emerald-500 font-bold">Volver al listado</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header & Back Button */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-white/5">
        <div className="space-y-4">
          <button 
            onClick={() => router.push("/firm/causas")}
            className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-emerald-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a Causas
          </button>
          
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                <Gavel className="w-7 h-7" />
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none capitalize">{caseData.title}</h1>
                <p className="text-slate-500 font-bold mt-2 flex items-center gap-2">
                   <User className="w-4 h-4" />
                   {caseData.clientName}
                </p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="hidden sm:block px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500">
              ID: {caseData.id.slice(-6).toUpperCase()}
           </div>
           
           <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
             <DialogTrigger render={
               <Button variant="outline" className="rounded-2xl border-slate-200 dark:border-white/10 hover:bg-slate-50">
                 <Edit2 className="w-4 h-4 mr-2" /> EDITAR
               </Button>
             } />
             <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 rounded-[2rem]">
               <DialogHeader>
                 <DialogTitle className="text-2xl font-black">Editar Expediente</DialogTitle>
                 <DialogDescription className="font-bold text-slate-500">Actualiza la información principal de la causa.</DialogDescription>
               </DialogHeader>
               <form onSubmit={handleUpdate} className="space-y-4 py-4">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título / Carátula</Label>
                   <Input 
                    className="rounded-xl border-slate-200"
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</Label>
                   <Input 
                    className="rounded-xl border-slate-200"
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción</Label>
                   <Textarea 
                    className="rounded-xl border-slate-200 min-h-[100px]"
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                   />
                 </div>
                 <DialogFooter>
                   <Button type="submit" className="w-full bg-emerald-500 text-slate-950 font-black rounded-xl py-6" disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "GUARDAR CAMBIOS"}
                   </Button>
                 </DialogFooter>
               </form>
             </DialogContent>
           </Dialog>

           <Button 
            variant="ghost" 
            className="rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            onClick={handleDelete}
           >
             <Trash2 className="w-4 h-4 mr-2" /> ELIMINAR
           </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] w-fit">
        {[
          { id: "info", label: "Información", icon: LayoutGrid },
          { id: "vault", label: "Bóveda Legal", icon: Shield },
          { id: "timeline", label: "Línea de Tiempo", icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-8 py-4 rounded-[2rem] text-sm font-black transition-all ${
              activeTab === tab.id 
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl" 
                : "text-slate-400 hover:text-slate-600 dark:hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "vault" && <LegalVault caseId={caseData.id} />}
        {activeTab === "info" && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-white/5 space-y-6">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Detalles del Caso</h3>
                 <div className="space-y-4">
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                       {caseData.description || "No hay descripción detallada para esta causa."}
                    </p>
                 </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-white/5 space-y-6">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Datos del Cliente</h3>
                 <div className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5">
                    <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
                       <User className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                       <p className="text-lg font-black text-slate-900 dark:text-white">{caseData.clientName}</p>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Titular</p>
                    </div>
                 </div>
              </div>
           </div>
        )}
        {activeTab === "timeline" && (
          <CaseTimeline 
            events={[]} // Aquí se podrían cargar eventos reales de Firestore en el futuro
            currentStage={caseData.stage || "intake"} 
            caseName={caseData.title} 
          />
        )}
      </motion.div>
    </div>
  );
}
