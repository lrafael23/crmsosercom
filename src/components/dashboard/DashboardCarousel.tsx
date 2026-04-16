"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  User as UserIcon, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  CheckCircle2
} from "lucide-react";

const slides = [
  {
    id: "professional",
    title: "Software de Gestión Pro",
    subtitle: "El centro de mando para tu estudio jurídico o contable.",
    role: "SOCIO / PROFESIONAL",
    icon: Briefcase,
    color: "emerald",
    content: (
      <div className="w-full h-full p-4 flex flex-col gap-4">
        {/* Mock Top bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="h-8 w-1/3 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-emerald-500/20 rounded-full" />
            <div className="h-8 w-8 bg-slate-100 dark:bg-white/5 rounded-full" />
          </div>
        </div>
        
        {/* Mock Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Causas", val: "24", color: "text-emerald-500" },
            { label: "Ingresos", val: "$4.2M", color: "text-blue-500" },
            { label: "Citas", val: "5", color: "text-amber-500" }
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
              <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Mock Main Area */}
        <div className="flex-1 grid grid-cols-12 gap-3">
          <div className="col-span-8 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 p-4 flex flex-col gap-3">
             <div className="flex items-center gap-2 mb-2">
               <Calendar className="w-4 h-4 text-emerald-500" />
               <p className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300">Agenda Semanal</p>
             </div>
             {[1, 2, 3].map(i => (
               <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                 <div className={`w-1.5 h-8 rounded-full ${i === 1 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                 <div className="flex-1">
                   <div className="h-2 w-2/3 bg-slate-200 dark:bg-white/10 rounded mb-1" />
                   <div className="h-1.5 w-1/3 bg-slate-100 dark:bg-white/5 rounded" />
                 </div>
               </div>
             ))}
          </div>
          <div className="col-span-4 flex flex-col gap-3">
             <div className="flex-1 bg-emerald-600 rounded-2xl p-4 text-white flex flex-col justify-end">
                <TrendingUp className="w-6 h-6 mb-2" />
                <p className="text-[10px] font-bold uppercase opacity-80">Rendimiento</p>
                <p className="text-sm font-black">+12%</p>
             </div>
             <div className="flex-1 bg-slate-900 rounded-2xl p-4 text-white flex flex-col justify-center items-center text-center">
                <PlusIcon className="w-5 h-5 mb-1" />
                <p className="text-[8px] font-bold uppercase">Nuevo Caso</p>
             </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "client",
    title: "Portal Cliente Transparente",
    subtitle: "Tus procesos legales al alcance de tu mano.",
    role: "CLIENTE FINAL",
    icon: UserIcon,
    color: "blue",
    content: (
      <div className="w-full h-full p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-800 dark:text-white">Hola, Juan Pérez</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado: Al día</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-20">
              <Clock className="w-20 h-20 -mr-6 -mt-6" />
           </div>
           <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Próxima Audiencia</p>
           <p className="text-xl font-black mb-4">Lunes, 24 de Abril</p>
           <button className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest">Ver Detalles</button>
        </div>

        <div className="flex-1 space-y-3">
          <p className="text-[11px] font-black uppercase text-slate-400">Mis Trámites</p>
          {[
            { name: "Divorcio Mutuo", status: "En Proceso", pct: 60, icon: FileText },
            { name: "Posesión Efectiva", status: "Finalizado", pct: 100, icon: CheckCircle2 }
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 ${item.pct === 100 ? 'text-emerald-500' : 'text-blue-500'}`} />
                    <p className="text-xs font-black text-slate-800 dark:text-white">{item.name}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${item.pct === 100 ? 'text-emerald-500' : 'text-blue-500'}`}>
                    {item.status}
                  </span>
               </div>
               <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    className={`h-full ${item.pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                  />
               </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
];

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

export default function DashboardCarousel() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  const activeSlide = slides[current];

  return (
    <div className="w-full h-full flex flex-col relative group">
      {/* Background Glow */}
      <div className={`absolute -inset-20 bg-${activeSlide.color}-500/10 blur-[100px] transition-colors duration-1000 -z-10`} />
      
      {/* Container Principal */}
      <div className="flex-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full h-full flex flex-col"
          >
            {/* Header del Preview */}
            <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
              <div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-${activeSlide.color}-500/10 border border-${activeSlide.color}-500/20 text-[10px] font-black text-${activeSlide.color}-600 dark:text-${activeSlide.color}-400 uppercase tracking-widest`}>
                  <activeSlide.icon className="w-3 h-3" />
                  {activeSlide.role}
                </div>
                <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {activeSlide.title}
                </h3>
              </div>
              <div className="flex gap-2">
                <button onClick={prev} className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
                <button onClick={next} className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Content del Preview */}
            <div className="flex-1 overflow-hidden relative">
               {activeSlide.content}
            </div>
            
            {/* Footer descriptivo */}
            <div className="px-8 py-6 bg-slate-50/50 dark:bg-black/20">
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                 {activeSlide.subtitle}
               </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicadores */}
      <div className="flex justify-center gap-2 mt-6">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              current === i ? `w-8 bg-${activeSlide.color}-500` : "w-2 bg-slate-200 dark:bg-slate-800"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
