"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  FileUp, 
  Download, 
  Eye, 
  FileIcon, 
  Search, 
  Filter,
  FileText,
  ShieldCheck,
  MoreVertical,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Document {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt?: any;
  fileUrl?: string;
  type?: string;
}

export default function ClientDocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user || user.role !== 'cliente') {
      setLoading(false);
      return;
    }

    const fetchDocs = async () => {
      try {
        if (!user.companyId) {
          setLoading(false);
          return;
        }

        const q = query(collection(db, "documents"), where("companyId", "==", user.companyId));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Document[];
        setDocuments(data);
      } catch (error) {
        console.error("Error fetching docs:", error);
        toast.error("Error al cargar los documentos.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocs();
  }, [user]);

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Gestor Documental</h2>
          <p className="text-slate-500">Repositorio centralizado con validez jurídica y fiscal.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar documentos..." 
              className="pl-10 bg-white" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 rounded-2xl gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95">
            <FileUp className="h-5 w-5" />
            Subir Archivo
          </Button>
        </div>
      </div>

      {/* Grid de Categorías Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ShieldCheck, title: "Jurídicos", color: "blue", count: documents.filter(d => d.category === 'Jurídico').length },
          { icon: FileText, title: "Contables", color: "amber", count: documents.filter(d => d.category === 'Contable').length },
          { icon: FileIcon, title: "Tributarios", color: "emerald", count: documents.filter(d => d.category === 'Tributario').length },
          { icon: Filter, title: "Otros", color: "slate", count: documents.filter(d => !['Jurídico', 'Contable', 'Tributario'].includes(d.category)).length },
        ].map((cat, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between group cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
               <div className={`w-12 h-12 rounded-2xl bg-${cat.color}-50 flex items-center justify-center`}>
                  <cat.icon className={`h-6 w-6 text-${cat.color}-600`} />
               </div>
               <div>
                 <h4 className="font-bold text-slate-800">{cat.title}</h4>
                 <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">{cat.count} ARCHIVOS</p>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de Documentos */}
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b border-slate-200 hover:bg-transparent">
              <TableHead className="w-[400px] font-bold text-slate-900 uppercase text-[10px] tracking-widest pl-8 py-5">Identificación del Documento</TableHead>
              <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-widest py-5">Categoría / Área</TableHead>
              <TableHead className="font-bold text-slate-900 uppercase text-[10px] tracking-widest py-5">Estado de Validación</TableHead>
              <TableHead className="text-right font-bold text-slate-900 uppercase text-[10px] tracking-widest pr-8 py-5">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-slate-400 italic">
                  Sincronizando archivos...
                </TableCell>
              </TableRow>
            ) : filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center p-4">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                      <FileIcon className="h-8 w-8 text-slate-200" />
                    </div>
                    <p className="font-bold text-slate-800">No se encontraron documentos</p>
                    <p className="text-sm text-slate-400 max-w-xs mt-1">
                      Sube tus primeros archivos para comenzar a organizar tu ecosistema digital.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
             filteredDocs.map((doc) => (
                <TableRow key={doc.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <FileIcon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 leading-none">{doc.title}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">PDF / {doc.type || "Archivo"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <Badge variant="outline" className="rounded-full bg-white border-slate-200 text-slate-600 font-semibold text-[11px] px-3">
                      {doc.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-2">
                       <span className={`w-1.5 h-1.5 rounded-full ${
                         doc.status === 'approved' ? 'bg-emerald-500' : 
                         doc.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                       }`} />
                       <span className={`text-[11px] font-bold uppercase tracking-wider ${
                         doc.status === 'approved' ? 'text-emerald-700' : 
                         doc.status === 'rejected' ? 'text-rose-700' : 'text-amber-700'
                       }`}>
                         {doc.status === 'approved' ? 'Verificado' : 
                          doc.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                       </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8 py-5">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm group/btn">
                        <Eye className="h-4 w-4 text-slate-400 group-hover/btn:text-emerald-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm group/btn">
                        <Download className="h-4 w-4 text-slate-400 group-hover/btn:text-emerald-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm">
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                        <ChevronRight className="h-4 w-4 text-slate-300" />
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
