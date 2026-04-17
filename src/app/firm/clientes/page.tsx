"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ExternalLink,
  Trash2,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/AuthContext";
import { db } from "@/lib/firebase/client";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
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
import { toast } from "sonner";

export default function ClientHubPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    rut: "",
    email: "",
    phone: "",
    type: "Persona Natural",
  });

  useEffect(() => {
    if (!user?.tenantId) return;

    const q = query(
      collection(db, "clients"),
      where("tenantId", "==", user.tenantId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "clients"), {
        ...formData,
        tenantId: user.tenantId,
        cases: 0,
        status: "Activo",
        lastContact: "Hoy",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setIsNewClientOpen(false);
      setFormData({ name: "", rut: "", email: "", phone: "", type: "Persona Natural" });
      toast.success("Cliente registrado con éxito");
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      toast.success("Cliente eliminado");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar");
    }
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.rut?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

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
           <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
             <DialogTrigger render={
               <Button className="bg-emerald-500 text-slate-950 font-black rounded-2xl px-8 py-7 shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all">
                 <UserPlus className="w-5 h-5 mr-2" /> REGISTRAR CLIENTE
               </Button>
             } />
             <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-[2rem]">
               <DialogHeader>
                 <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">Nuevo Cliente</DialogTitle>
                 <DialogDescription className="text-slate-500 font-medium font-bold">
                   Ingresa los datos para registrar un nuevo cliente en tu estudio.
                 </DialogDescription>
               </DialogHeader>
               <form onSubmit={handleCreateClient} className="space-y-4 py-4">
                 <div className="space-y-2">
                   <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre Completo</Label>
                   <Input 
                     id="name" 
                     className="rounded-xl border-slate-200" 
                     placeholder="Ej: Juan Pérez"
                     value={formData.name}
                     onChange={(e) => setFormData({...formData, name: e.target.value})}
                     required
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="rut" className="text-xs font-black uppercase tracking-widest text-slate-400">RUT</Label>
                     <Input 
                       id="rut" 
                       className="rounded-xl border-slate-200" 
                       placeholder="12.345.678-9"
                       value={formData.rut}
                       onChange={(e) => setFormData({...formData, rut: e.target.value})}
                       required
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-slate-400">Teléfono</Label>
                     <Input 
                       id="phone" 
                       className="rounded-xl border-slate-200" 
                       placeholder="+56 9..."
                       value={formData.phone}
                       onChange={(e) => setFormData({...formData, phone: e.target.value})}
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400">Correo Electrónico</Label>
                   <Input 
                     id="email" 
                     type="email" 
                     className="rounded-xl border-slate-200" 
                     placeholder="email@ejemplo.com"
                     value={formData.email}
                     onChange={(e) => setFormData({...formData, email: e.target.value})}
                     required
                   />
                 </div>
                 <DialogFooter>
                   <Button 
                    type="submit" 
                    className="w-full bg-emerald-500 text-slate-950 font-black rounded-xl py-6"
                    disabled={isSubmitting}
                   >
                     {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "REGISTRAR CLIENTE"}
                   </Button>
                 </DialogFooter>
               </form>
             </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Clientes", val: loading ? "..." : clients.length.toString(), icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Causas Activas", val: loading ? "..." : clients.reduce((acc, c) => acc + (c.cases || 0), 0).toString(), icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-500/10" },
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Cargando cartera de clientes...</p>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold italic">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, i) => (
                <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
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
                        {client.cases || 0} CAUSAS
                      </Badge>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Visto: {client.lastContact}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge className={cn(
                      "border-none px-3 py-1 font-black text-[10px]",
                      client.status === 'Premium' ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                    )}>
                      {client.status?.toUpperCase() || 'ACTIVO'}
                    </Badge>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600"
                        onClick={() => handleDeleteClient(client.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )))}
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
