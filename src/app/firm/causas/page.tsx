"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { 
  FolderOpen, 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  ChevronRight,
  Gavel
} from "lucide-react";

export default function CasesPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?.tenantId) return;

    const q = query(
      collection(db, "cases"),
      where("tenantId", "==", user.tenantId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredCases = cases.filter(c => 
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.clientName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Expedientes Judiciales</h1>
          <p className="text-slate-500 font-medium mt-1">Gestión centralizada de causas y documentos legales.</p>
        </div>
        
        <Link 
          href="/firm/causas/nueva"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" />
          NUEVA CAUSA
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex-1 relative ml-4">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Buscar por carátula o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-4 py-2 bg-transparent border-none text-sm focus:ring-0"
          />
        </div>
      </div>

      {/* Cases Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-20 text-center border border-slate-200 dark:border-white/5">
           <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 text-slate-400" />
           </div>
           <h3 className="text-xl font-black text-slate-900 dark:text-white">No se encontraron causas</h3>
           <p className="text-slate-500 mt-2 max-w-sm mx-auto">Comienza registrando tu primera causa judicial para activar la bóveda de documentos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  c.status === 'audiencia' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <Gavel className="w-6 h-6" />
                </div>
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {c.status?.replace('_', ' ') || 'Activo'}
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-emerald-500 transition-colors">
                {c.title}
              </h3>
              <p className="text-sm font-bold text-slate-500 mb-6 truncate capitalize">
                {c.clientName}
              </p>

              <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{c.updatedAt ? "Reciente" : "Nueva"}</span>
                </div>
                <Link 
                  href={`/firm/causas/${c.id}`}
                  className="w-10 h-10 bg-slate-900 dark:bg-slate-800 text-white rounded-full flex items-center justify-center hover:bg-emerald-500 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
