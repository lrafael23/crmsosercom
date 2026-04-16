"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Download, 
  Search, 
  FolderClosed, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Filter,
  Eye,
  MoreVertical,
  Cloud
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DOCUMENTS = [
  { id: 1, name: "Contrato de Prestación de Servicios", type: "PDF", size: "1.2 MB", date: "Hace 2 días", category: "Legal", status: "Firmado" },
  { id: 2, name: "Escritura Constitución de Sociedad", type: "PDF", size: "4.5 MB", date: "10 Abr 2026", category: "Notarial", status: "Validado" },
  { id: 3, name: "Mandato Judicial General", type: "PDF", size: "800 KB", date: "05 Abr 2026", category: "Judicial", status: "Pendiente" },
  { id: 4, name: "Liquidación de Impuestos Mensual", type: "XLSX", size: "1.1 MB", date: "01 Abr 2026", category: "Tributario", status: "Revisado" },
];

export default function LawVaultPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-950 p-12 text-white border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Cloud className="w-64 h-64 text-emerald-500" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-emerald-500 text-slate-950 font-black mb-4 px-4 py-1">ENCRIPTADO E2EE</Badge>
          <h1 className="text-5xl font-black tracking-tight mb-4">LawVault™</h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed">
            Tu archivo legal centralizado. Todos tus documentos están protegidos con estándares bancarios y sincronizados con la nube de tu abogado.
          </p>
          <div className="flex gap-4 mt-8">
            <Button className="bg-white text-slate-950 font-black rounded-2xl px-8 py-6 hover:scale-105 transition-all">
              DESCARGAR TODO (.ZIP)
            </Button>
            <Button variant="outline" className="border-white/20 text-white font-black rounded-2xl px-8 py-6 hover:bg-white/10 transition-all">
              SOLICITAR COPIA FÍSICA
            </Button>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 rounded-2xl w-full md:w-96 shadow-sm">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input 
            placeholder="Buscar en la bóveda..." 
            className="bg-transparent border-none text-sm outline-none w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {['todos', 'legal', 'judicial', 'tributario'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                filter === f 
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" 
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Vault Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {DOCUMENTS.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <Card className="group relative border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 bg-white dark:bg-slate-900 shadow-sm hover:shadow-2xl transition-all h-full flex flex-col">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <FileText className="w-7 h-7" />
                  </div>
                  <Badge variant="outline" className="border-slate-200 rounded-full text-[10px] uppercase font-black tracking-widest px-3">
                    {doc.type}
                  </Badge>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2">
                    {doc.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {doc.date}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tamaño</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{doc.size}</span>
                  </div>
                  <Button className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                    <Eye className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
