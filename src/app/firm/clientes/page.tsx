"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MoreVertical,
  UserPlus,
  TrendingUp,
  Briefcase,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CLIENTS = [
  { id: 1, name: "Carlos Valenzuela", rut: "12.345.678-9", email: "carlos@example.com", phone: "+56 9 1234 5678", cases: 3, status: "Activo", lastContact: "Hoy" },
  { id: 2, name: "María José Fuentes", rut: "15.987.654-3", email: "mj.fuentes@cl.cl", phone: "+56 9 8765 4321", cases: 1, status: "Nuevo", lastContact: "Hace 2h" },
  { id: 3, name: "Agrícola del Sur SpA", rut: "77.123.000-K", email: "admin@agrisur.cl", phone: "+56 2 2345 6789", cases: 8, status: "Premium", lastContact: "Ayer" },
];

export default function ClientHubPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <Badge className="bg-blue-500/10 text-blue-500 border-none px-4 py-1 font-black">CRM LEGAL</Badge>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">ClientHub™</h1>
          <p className="text-slate-500 font-medium text-lg">Administra tu cartera de clientes y centraliza la comunicación.</p>
        </div>
        
        <div className="flex gap-4">
           <Button className="bg-emerald-500 text-slate-950 font-black rounded-2xl px-8 py-7 shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all">
             <UserPlus className="w-5 h-5 mr-2" /> REGISTRAR CLIENTE
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Clientes", val: "128", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Causas Activas", val: "45", icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Nuevos (Mes)", val: "+12", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((stat, i) => (
          <Card key={i} className="border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 bg-white dark:bg-slate-900 shadow-sm">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.val}</p>
          </Card>
        ))}
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm bg-white dark:bg-slate-900">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Buscar por nombre, RUT o etiquetas..." 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-[1.5rem] text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="rounded-[1.2rem] py-6 px-6 font-bold border-slate-200">
                <Filter className="w-4 h-4 mr-2" /> FILTRAR
              </Button>
              <Button variant="outline" className="rounded-[1.2rem] py-6 px-6 font-bold border-slate-200">
                EXPORTAR
              </Button>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-8 py-5">Cliente / RUT</th>
                <th className="px-8 py-5">Contacto</th>
                <th className="px-8 py-5">Actividad</th>
                <th className="px-8 py-5">Estado</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {CLIENTS.map((client, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                      {client.name}
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{client.rut}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" /> {client.phone}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Mail className="w-3.5 h-3.5" /> {client.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black w-fit">
                        {client.cases} CAUSAS
                      </Badge>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Visto: {client.lastContact}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge className={cn(
                      "border-none px-3 py-1 font-black text-[10px]",
                      client.status === 'Premium' ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                    )}>
                      {client.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
