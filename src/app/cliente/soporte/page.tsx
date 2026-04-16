"use client";

import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Send,
  Plus,
  History,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ACTIVE_TICKETS = [
  { id: "TK-4512", subject: "Duda plazo de apelación", status: "En Revisión", date: "Ayer", priority: "Alta" },
  { id: "TK-4498", subject: "Carga de mandato fallida", status: "Resuelto", date: "12 Abr", priority: "Media" },
];

export default function JusticeTicketsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Centro de Ayuda</h1>
          <p className="text-slate-500 font-medium text-lg">Resolución inmediata de dudas y soporte legal técnico.</p>
        </div>
        <Button className="bg-slate-900 dark:bg-white dark:text-slate-900 font-black rounded-2xl px-8 py-7 hover:scale-105 transition-all">
          <Plus className="w-5 h-5 mr-2" /> NUEVA CONSULTA
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-10">
          <Card className="border-slate-200 dark:border-white/5 rounded-[3rem] p-10 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <MessageSquare className="w-40 h-40" />
             </div>
             
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center">
                    <Send className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black">Escribe tu consulta</h3>
                </div>

                <form className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">¿Sobre qué trata?</label>
                      <select className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                        <option>Duda sobre mi causa actual</option>
                        <option>Problema técnico en el portal</option>
                        <option>Solicitud de documento original</option>
                        <option>Otros temas</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Urgencia</label>
                      <div className="flex gap-2">
                         {['Baja', 'Media', 'Alta'].map(p => (
                           <button key={p} type="button" className="flex-1 py-4 bg-slate-50 dark:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                             {p}
                           </button>
                         ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Explicación Detallada</label>
                    <textarea 
                      rows={5}
                      placeholder="Describe tu situación lo más detallado posible..."
                      className="w-full px-6 py-5 bg-slate-50 dark:bg-white/5 border-none rounded-[2rem] text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  <Button className="w-full md:w-auto bg-emerald-500 text-slate-950 font-black rounded-2xl px-12 py-7 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">
                    ENVIAR REQUERIMIENTO
                  </Button>
                </form>
             </div>
          </Card>
        </div>

        {/* Sidebar Status Area */}
        <div className="space-y-8">
          <Card className="border-slate-200 dark:border-white/5 rounded-[3rem] p-8 bg-slate-50/30 dark:bg-white/5">
             <div className="flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-slate-400" />
                <h3 className="font-black text-lg">Consultas Recientes</h3>
             </div>

             <div className="space-y-4">
                {ACTIVE_TICKETS.map((tk) => (
                  <div key={tk.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-emerald-500 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ID {tk.id}</span>
                      <Badge className={cn(
                        "text-[9px] font-black px-2 py-0.5 border-none",
                        tk.status === 'Resuelto' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {tk.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{tk.subject}</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1">Actualizado: {tk.date}</p>
                  </div>
                ))}
             </div>
          </Card>

          <div className="p-8 bg-slate-950 rounded-[3rem] text-white space-y-4">
             <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                <span className="font-black text-sm uppercase tracking-widest">Compromiso 360</span>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Nos comprometemos a responder todas tus dudas técnicas en menos de 2 horas hábiles. Para temas legales, tu abogado revisará la consulta hoy mismo.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
