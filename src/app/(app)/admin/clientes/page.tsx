"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { logAction } from "@/lib/audit";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Eye, 
  UserPen, 
  Building2,
  ShieldAlert,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  taxId: string;
  status: string;
  industry?: string;
  plan?: string;
}

export default function AdminClientesPage() {
  const { user: currentUser, impersonate } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "companies"));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Company[];
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
        toast.error("No se pudieron cargar las empresas.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanies();
  }, []);

  const handleImpersonate = async (companyId: string) => {
    if (currentUser?.role !== 'super_admin_global') {
      toast.error("Sólo el Super Admin Global puede usar el modo impersonación.");
      return;
    }

    setLoading(true);
    try {
      // Buscar el primer usuario activo de esta empresa
      const usersRef = collection(db, "users");
      const q = query(
        usersRef, 
        where("companyId", "==", companyId), 
        where("role", "==", "cliente"),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error("No se encontraron usuarios activos para esta empresa.");
        setLoading(false);
        return;
      }

      const targetUser = querySnapshot.docs[0];
      const targetData = targetUser.data();

      // Auditar
      await logAction(
        currentUser.uid,
        currentUser.email || "N/A",
        "IMPERSONATION_START",
        `Iniciando impersonación del usuario ${targetData.displayName} (Empresa: ${companyId})`,
        companyId
      );

      await impersonate(targetUser.id);
      toast.success(`Ahora estás viendo el portal como ${targetData.displayName}`);
    } catch (e) {
      console.error("Impersonation error:", e);
      toast.error("Error al intentar iniciar impersonación.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.taxId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header con Stats Rápidos */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Relación con Clientes (CRM)</h2>
          <p className="text-slate-500 mt-1 text-sm">Centralización de activos, contratos y cumplimiento corporativo.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar por nombre o RUT..." 
                className="pl-10 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">
             <Plus className="h-4 w-4" />
             Alta de Cliente
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Empresas", value: companies.length, color: "blue" },
          { label: "Activas", value: companies.filter(c => c.status === 'active').length, color: "emerald" },
          { label: "En Revisión", value: 0, color: "orange" },
          { label: "Operaciones Hoy", value: 12, color: "purple" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Tabla Principal */}
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b border-slate-200 hover:bg-transparent">
              <TableHead className="w-[300px] font-bold text-slate-900 uppercase text-[10px] tracking-widest pl-8 py-5">Nombre / Razón Social</TableHead>
              <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-widest py-5">Identificador Fiscal</TableHead>
              <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-widest py-5">Plan / Nivel</TableHead>
              <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-widest py-5">Estado</TableHead>
              <TableHead className="text-right font-bold text-slate-900 uppercase text-[10px] tracking-widest pr-8 py-5">Operaciones de Gestión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                   <div className="flex flex-col items-center gap-3">
                     <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
                     <p className="text-sm font-medium text-slate-500 italic">Sincronizando base de datos...</p>
                   </div>
                </TableCell>
              </TableRow>
            ) : filteredCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-slate-400">
                  No se encontraron registros que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            ) : (
              filteredCompanies.map((company) => (
                <TableRow key={company.id} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{company.name}</span>
                        <span className="text-xs text-slate-500 italic">{company.industry || "Industria no clasificada"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <code className="bg-slate-100 px-2 py-1 rounded-lg text-xs font-mono text-slate-700 border border-slate-200">
                      {company.taxId}
                    </code>
                  </TableCell>
                  <TableCell className="py-5">
                    <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-200 text-slate-600 font-medium">
                      {company.plan || "Standard"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${company.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <span className={`text-xs font-bold uppercase tracking-wide ${company.status === 'active' ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {company.status === 'active' ? 'Vigente' : 'Suspendido'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8 py-5">
                    <div className="flex items-center justify-end gap-2">
                       {currentUser?.role === 'super_admin_global' && (
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="h-9 px-4 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-xl"
                           onClick={() => handleImpersonate(company.id)}
                         >
                           <ShieldAlert className="w-4 h-4" />
                           <span className="hidden sm:inline">Vivir como Cliente</span>
                         </Button>
                       )}
                       
                       <DropdownMenu>
                         <DropdownMenuTrigger render={
                           <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm">
                             <MoreHorizontal className="h-4 w-4" />
                           </Button>
                         } />
                         <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-slate-200">
                           <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-400">Opciones Críticas</DropdownMenuLabel>
                           <DropdownMenuItem className="rounded-xl flex items-center gap-3 cursor-pointer py-2.5">
                             <Eye className="w-4 h-4 text-slate-500" />
                             <span className="font-semibold">Ficha Técnica</span>
                           </DropdownMenuItem>
                           <DropdownMenuItem className="rounded-xl flex items-center gap-3 cursor-pointer py-2.5">
                             <UserPen className="w-4 h-4 text-slate-500" />
                             <span className="font-semibold">Editar Datos</span>
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem className="rounded-xl flex items-center gap-3 cursor-pointer py-2.5 text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                             <ShieldAlert className="w-4 h-4" />
                             <span className="font-bold italic underline">Suspender Acceso</span>
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                       
                       <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100">
                         <ChevronRight className="h-4 w-4" />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
