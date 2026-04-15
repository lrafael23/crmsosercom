"use client";

import { useState, useEffect } from "react";
import { 
  File, 
  UploadCloud, 
  Download, 
  Trash2, 
  ExternalLink, 
  Search,
  FileIcon,
  ShieldCheck,
  AlertCircle,
  MoreVertical,
  Loader2,
  FileText as FileTextIcon,
  ImageIcon,
  Table,
  FileCode,
  FileArchive,
  Presentation
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthContext";

interface VaultFile {
  id: string;
  name: string;
  type: string;
  size: number;
  webViewLink: string;
  webContentLink: string;
  createdAt: string;
}

export default function LegalVault({ caseId }: { caseId: string }) {
  const { user } = useAuth();
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const loadFiles = async () => {
    try {
      const res = await fetch(`/api/vault/list?caseId=${caseId}`);
      const data = await res.json();
      if (data.documents) setFiles(data.documents);
    } catch (err) {
      console.error("Error loading vault:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [caseId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("caseId", caseId);
    formData.append("userId", user.uid);

    try {
      const res = await fetch("/api/vault/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await loadFiles();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return { icon: FileTextIcon, color: "text-red-500", bg: "bg-red-500/10" };
    if (type.includes("word") || type.includes("text")) return { icon: FileTextIcon, color: "text-blue-500", bg: "bg-blue-500/10" };
    if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) return { icon: Table, color: "text-emerald-500", bg: "bg-emerald-500/10" };
    if (type.includes("image")) return { icon: ImageIcon, color: "text-amber-500", bg: "bg-amber-500/10" };
    if (type.includes("presentation") || type.includes("powerpoint")) return { icon: Presentation, color: "text-orange-500", bg: "bg-orange-500/10" };
    if (type.includes("zip") || type.includes("rar") || type.includes("archive")) return { icon: FileArchive, color: "text-purple-500", bg: "bg-purple-500/10" };
    return { icon: File, color: "text-slate-500", bg: "bg-slate-500/10" };
  };

  return (
    <div className="space-y-6">
      {/* Vault Status/Control */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-white/10 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
             <h4 className="text-white font-black tracking-tight leading-tight">Bóveda Cifrada (Drive)</h4>
             <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-0.5">Estado: Seguro</p>
          </div>
        </div>

        <label className={`relative z-10 flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-950 font-black rounded-xl text-sm transition-all shadow-xl cursor-pointer hover:scale-105 active:scale-95 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          {uploading ? "SUBIENDO..." : "SUBIR DOCUMENTO"}
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {/* File Explorer */}
      <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar en la bóveda..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-white/5 border-none rounded-xl text-xs focus:ring-1 ring-emerald-500/50"
            />
          </div>
          <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{files.length} Documentos</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Archivo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tamaño</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                 <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                       <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
                    </td>
                 </tr>
              ) : filteredFiles.length === 0 ? (
                <tr>
                   <td colSpan={4} className="px-6 py-20 text-center">
                      <FileIcon className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                      <p className="text-slate-400 text-sm font-medium">Bóveda vacía para esta causa.</p>
                   </td>
                </tr>
              ) : filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       {(() => {
                         const { icon: Icon, color, bg } = getFileIcon(file.type);
                         return (
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${bg} ${color} group-hover:scale-110`}>
                              <Icon className="w-5 h-5" />
                           </div>
                         );
                       })()}
                       <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{file.name}</p>
                          <p className="text-[10px] text-slate-500 font-black uppercase mt-1.5 tracking-tighter">
                            {file.type.split('/')[1]?.split('.').pop()?.toUpperCase() || 'DOC'}
                          </p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{formatSize(file.size)}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">
                    {new Date(file.createdAt).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <a 
                        href={file.webViewLink} 
                        target="_blank" 
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                        title="Ver en Drive"
                       >
                         <ExternalLink className="w-4 h-4" />
                       </a>
                       <a 
                        href={file.webContentLink} 
                        download 
                        className="p-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                       >
                         Descargar
                       </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Notice */}
      <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
         <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
         <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
           Los archivos aquí listados son privados y compartidos bajo seguridad mediante el Portal 360.
         </p>
      </div>
    </div>
  );
}
