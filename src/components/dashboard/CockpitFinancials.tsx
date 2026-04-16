import { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  Timestamp,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Download, 
  Eye, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Printer
} from "lucide-react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ... [rest of the types] ...

export default function CockpitFinancials({ tenantId: propTenantId }: { tenantId?: string }) {
  const { user } = useAuth();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const activeTenantId = propTenantId || user?.tenantId;

  useEffect(() => {
    if (!activeTenantId) return;

    const q = query(
      collection(db, "payments"),
      where("tenantId", "==", activeTenantId),
      orderBy("date", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTxs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date)
        } as Transaction;
      });
      setTxs(fetchedTxs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching financial data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTenantId]);

  const totalIncome = txs.reduce((acc, curr) => curr.type === "income" && curr.status === "paid" ? acc + curr.amount : acc, 0);
  const pendingIncome = txs.reduce((acc, curr) => curr.status === "pending" ? acc + curr.amount : acc, 0);

  const formatCLP = (val: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

  return (
    <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Finanzas y Cobranza</h3>
        </div>
        
        <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white gap-2 rounded-xl">
              <Plus className="w-3 h-3" /> Facturar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white dark:bg-slate-950">
             <CreateInvoiceView 
               tenantId={activeTenantId!}
               onSuccess={() => setIsInvoiceModalOpen(false)} 
             />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Quick View */}
      <div className="p-6 grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-white/5">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos Mes</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{loading ? "..." : formatCLP(totalIncome)}</p>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
            <TrendingUp className="w-3 h-3" /> +15.3%
          </div>
        </div>
        <div className="space-y-1 border-l border-slate-100 dark:border-white/5 pl-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Por Cobrar</p>
          <p className="text-xl font-black text-rose-500">{loading ? "..." : formatCLP(pendingIncome)}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{txs.filter(t => t.status === 'pending').length} Documentos</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-y-auto min-h-[200px]">
        {loading ? (
          <div className="p-20 text-center animate-pulse italic text-slate-300">Cargando transacciones...</div>
        ) : txs.length === 0 ? (
          <div className="p-20 text-center text-slate-400 italic">No hay movimientos registrados.</div>
        ) : (
          txs.map((tx) => (
          <div key={tx.id} className="group flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                tx.type === "income" ? "bg-emerald-50 text-emerald-500" : "bg-slate-100 text-slate-500"
              )}>
                {tx.type === "income" ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-white">{tx.client}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {tx.invoiceNum || "Sin Doc"} • {format(tx.date, "dd MMM", { locale: es })}
                </p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <p className={cn("text-xs font-black", tx.type === "income" ? "text-slate-900 dark:text-white" : "text-rose-500")}>
                {tx.type === "income" ? "+" : "-"}{formatCLP(tx.amount)}
              </p>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {tx.invoiceType && (
                  <button className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
                <button className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600">
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )))}
      </div>
    </div>
  );
}

function CreateInvoiceView({ tenantId, onSuccess }: { tenantId: string, onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client: "",
    amount: "",
    type: "exenta" as "exenta" | "boleta",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        client: formData.client,
        amount: Number(formData.amount),
        type: "income",
        status: "pending",
        date: Timestamp.now(),
        invoiceType: formData.type,
        invoiceNum: formData.type === "exenta" ? `EE-${Math.floor(Math.random() * 900) + 100}` : `B-${Math.floor(Math.random() * 9000) + 1000}`,
        description: formData.description,
        tenantId: tenantId,
        createdBy: user?.uid,
        createdAt: Timestamp.now()
      });
      onSuccess();
    } catch (e) {
      console.error("Error creating invoice:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Nueva Factura Exenta</DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400">Cliente / Razón Social</Label>
          <Input 
            required
            placeholder="Ej: Constructora Delta" 
            className="rounded-xl border-slate-200"
            value={formData.client}
            onChange={e => setFormData({ ...formData, client: e.target.value })}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-400">Monto (CLP)</Label>
          <Input 
            required
            type="number"
            placeholder="Ej: 500000" 
            className="rounded-xl border-slate-200"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase text-slate-400">Tipo de Documento</Label>
        <div className="flex gap-2">
          {["exenta", "boleta"].map((t) => (
            <button
              key={t}
              type="button"
              disabled={loading}
              onClick={() => setFormData({ ...formData, type: t as any })}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-black uppercase border-2 transition-all",
                formData.type === t 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : "bg-white text-slate-400 border-slate-100 hover:border-emerald-500/30"
              )}
            >
              {t === 'exenta' ? 'Factura Exenta' : 'Boleta de Honorarios'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase text-slate-400">Glosa / Descripción</Label>
        <Input 
          placeholder="Ej: Asesoría legal mensual Marzo 2026" 
          className="rounded-xl border-slate-200"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
         <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
              Este documento será emitido como **FACTURA EXENTA** bajo la normativa vigente de servicios profesionales. El registro quedará guardado para tu contabilidad interna.
            </p>
         </div>
         <div className="flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
            <span>TOTAL A FACTURAR</span>
            <span className="text-xl text-emerald-600">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(formData.amount) || 0)}</span>
         </div>
      </div>

      <DialogFooter>
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20"
        >
          {loading ? "PROCESANDO..." : "EMITIR Y REGISTRAR DOCUMENTO"}
        </Button>
      </DialogFooter>
    </form>
  );
}
