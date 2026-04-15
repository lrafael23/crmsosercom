"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { logAction } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  PlusCircle, 
  LifeBuoy, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Ticket {
  id: string;
  title: string;
  category: "juridico" | "contable" | "tributario" | "otro";
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: any;
  companyId: string;
}

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<string>("juridico");
  const [newPriority, setNewPriority] = useState<string>("medium");
  const [newDescription, setNewDescription] = useState("");

  const fetchTickets = async () => {
    if (!user?.companyId) return;
    try {
      const q = query(
        collection(db, "tickets"), 
        where("companyId", "==", user.companyId)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ticket[];
      
      // Ordenar localmente por fecha (desc)
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTickets(data);
    } catch (e) {
      console.error("Error fetching tickets:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const ticketData = {
        title: newTitle,
        category: newCategory,
        priority: newPriority,
        description: newDescription,
        status: "open",
        companyId: user.companyId,
        createdBy: user.uid,
        createdByEmail: user.email,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "tickets"), ticketData);
      
      await logAction(
        user.uid,
        user.email || "N/A",
        "TICKET_CREATED",
        `Nuevo ticket creado: ${newTitle}`,
        docRef.id
      );

      toast.success("Ticket creado correctamente");
      setIsDialogOpen(false);
      
      // Limpiar formulario y refrescar
      setNewTitle("");
      setNewDescription("");
      fetchTickets();
    } catch (e) {
      console.error("Error creating ticket:", e);
      toast.error("Error al crear el ticket");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Ticket["status"]) => {
    switch (status) {
      case "open": return <Badge className="bg-blue-500 hover:bg-blue-600 rounded-full">Abierto</Badge>;
      case "in_progress": return <Badge className="bg-amber-500 hover:bg-amber-600 rounded-full">En Proceso</Badge>;
      case "resolved": return <Badge className="bg-emerald-500 hover:bg-emerald-600 rounded-full">Resuelto</Badge>;
      case "closed": return <Badge className="bg-slate-500 hover:bg-slate-600 rounded-full">Cerrado</Badge>;
    }
  };

  const getPriorityIcon = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "low": return <div className="w-2 h-2 rounded-full bg-slate-300" />;
      case "medium": return <div className="w-2 h-2 rounded-full bg-blue-400" />;
      case "high": return <div className="w-2 h-2 rounded-full bg-amber-400" />;
      case "critical": return <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />;
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Soporte y Consultas</h2>
          <p className="text-slate-500 mt-1">Canal directo con su equipo de especialistas Sosercom.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="h-12 px-6 bg-slate-900 hover:bg-slate-800 rounded-2xl gap-3 shadow-xl shadow-slate-200 transition-all active:scale-95">
              <PlusCircle className="h-5 w-5" />
              Nueva Consulta
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
            <form onSubmit={handleCreateTicket}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Abrir Nuevo Ticket</DialogTitle>
                <DialogDescription>
                  Describa su solicitud. Un especialista será asignado a la brevedad.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Asunto de la consulta</Label>
                  <Input 
                    id="title" 
                    placeholder="Ej: Duda sobre declaración anual" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Área Responsable</Label>
                    <Select value={newCategory} onValueChange={(val) => val && setNewCategory(val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione área" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="juridico">Jurídico</SelectItem>
                        <SelectItem value="contable">Contable</SelectItem>
                        <SelectItem value="tributario">Tributario</SelectItem>
                        <SelectItem value="otro">Otros / Administrativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select value={newPriority} onValueChange={(val) => val && setNewPriority(val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción Detallada</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Escriba aquí los detalles..." 
                    className="h-32"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  Enviar Requerimiento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats e Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Clock, label: "Tickets Abiertos", value: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length, color: "text-blue-600" },
          { icon: CheckCircle2, label: "Resueltos este mes", value: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length, color: "text-emerald-600" },
          { icon: AlertCircle, label: "Pendiente de Sosercom", value: tickets.filter(t => t.status === 'open').length, color: "text-amber-600" },
        ].map((stat, i) => (
          <Card key={i} className="border-slate-200/60 shadow-sm rounded-[1.5rem]">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de Tickets */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Historial de Requerimientos</h3>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100 italic text-slate-400">
             Cargando tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-300">
             <LifeBuoy className="w-12 h-12 text-slate-200 mb-4" />
             <p className="text-slate-500 font-medium">No se han generado tickets aún.</p>
             <p className="text-sm text-slate-400 mt-1">Use el botón "Nueva Consulta" para iniciar una solicitud.</p>
          </div>
        ) : (
          <div className="grid gap-3">
             {tickets.map((ticket) => (
               <div key={ticket.id} className="group bg-white hover:bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center justify-between transition-all hover:shadow-md cursor-pointer">
                 <div className="flex items-center gap-5">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                     ticket.category === 'juridico' ? 'bg-orange-50 text-orange-600' :
                     ticket.category === 'contable' ? 'bg-blue-50 text-blue-600' :
                     'bg-purple-50 text-purple-600'
                   }`}>
                     <MessageSquare className="w-6 h-6" />
                   </div>
                   <div className="space-y-1">
                     <div className="flex items-center gap-3">
                       <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{ticket.title}</span>
                       {getStatusBadge(ticket.status)}
                     </div>
                     <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5 uppercase tracking-tighter">
                          {getPriorityIcon(ticket.priority)}
                          {ticket.priority}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="capitalize">{ticket.category}</span>
                        <span className="text-slate-300">|</span>
                        <span>{ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString() : "Reciente"}</span>
                     </div>
                   </div>
                 </div>
                 <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                   <ChevronRight className="w-5 h-5" />
                 </Button>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
