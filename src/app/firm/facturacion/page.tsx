"use client";

import { motion } from "framer-motion";
import { 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight,
  Zap,
  CheckCircle2,
  FileText,
  Clock,
  Download
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BillingCenterPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Hero Billing */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
        <div className="space-y-4 max-w-xl">
          <Badge className="bg-emerald-500 text-slate-950 font-black px-4 py-1">Suscripción Activa</Badge>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">BillingCenter™</h1>
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            Gestiona la potencia de tu estudio. Controla tus límites de causas, almacenamiento y usuarios internos en tiempo real.
          </p>
        </div>

        <Card className="w-full lg:w-96 border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 bg-slate-950 text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-20 h-20 text-emerald-500" />
           </div>
           <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Plan Actual</p>
              <h3 className="text-2xl font-black text-emerald-500 mb-6">Expert SaaS</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold opacity-60">Próximo cobro</span>
                  <span className="text-sm font-black italic underline decoration-emerald-500 decoration-2">15 May 2026</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold opacity-60">Monto mensual</span>
                  <span className="text-xl font-black">$45.000 <span className="text-[10px] opacity-40">CLP</span></span>
                </div>
              </div>
              <Button className="w-full bg-white text-slate-950 font-black rounded-xl mt-8 py-6 hover:scale-105 transition-all">
                 GESTIONAR EN MERCADO PAGO
              </Button>
           </div>
        </Card>
      </div>

      {/* Quotas & Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { label: "Causas Judiciales", used: 45, total: 100, unit: "Causas", color: "bg-emerald-500" },
          { label: "Almacenamiento Cloud", used: 12.4, total: 50, unit: "GB", color: "bg-blue-500" },
          { label: "Usuarios Equipo", used: 4, total: 10, unit: "Cuentas", color: "bg-amber-500" },
        ].map((item, i) => (
          <Card key={i} className="border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 bg-white dark:bg-slate-900 shadow-sm border-b-4 border-b-transparent hover:border-b-emerald-500 transition-all">
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
             <div className="flex items-end gap-2 mb-6">
                <span className="text-4xl font-black text-slate-900 dark:text-white">{item.used}</span>
                <span className="text-sm font-bold text-slate-400 mb-1.5">/ {item.total} {item.unit}</span>
             </div>
             <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.used / item.total) * 100}%` }}
                  transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                  className={`h-full ${item.color}`} 
                />
             </div>
          </Card>
        ))}
      </div>

      {/* Invoices List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-2xl font-black flex items-center gap-3">
              <Receipt className="w-6 h-6 text-emerald-500" />
              Historial de Facturación
           </h3>
           <Button variant="ghost" className="text-emerald-500 font-black">VER TODO</Button>
        </div>

        <Card className="border-slate-200 dark:border-white/5 rounded-[3rem] overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
           <div className="divide-y divide-slate-100 dark:divide-white/5">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <FileText className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="font-black text-lg text-slate-900 dark:text-white">Factura de Suscripción #{202400 + idx}</p>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mt-1">
                           <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 15 {idx === 1 ? 'Abr' : idx === 2 ? 'Mar' : 'Feb'} 2026</span>
                           <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> PAGADA</span>
                        </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-8">
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-black text-slate-900 dark:text-white">$45.000 CLP</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Debitado - VISA 4242</p>
                      </div>
                      <Button variant="outline" className="rounded-xl border-slate-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all">
                        <Download className="w-4 h-4 mr-2" /> DESCARGAR PDF
                      </Button>
                   </div>
                </div>
              ))}
           </div>
        </Card>
      </div>

      {/* Banner MP Security */}
      <div className="p-8 border border-emerald-500/20 bg-emerald-500/5 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
            <div>
              <p className="font-black text-emerald-900 dark:text-emerald-400">Pagos Seguros vía Mercado Pago</p>
              <p className="text-sm font-medium text-emerald-700/70">No almacenamos los datos de tus tarjetas. Todo el proceso es gestionado por la pasarela de pago líder en LatAm.</p>
            </div>
         </div>
         <Badge variant="outline" className="border-emerald-500 text-emerald-500 font-black px-6 py-2">PCI COMPLIANT</Badge>
      </div>
    </div>
  );
}
