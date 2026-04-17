"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Calendar, ChevronRight, FolderOpen, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";

export default function ClienteCausasPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    async function loadCases() {
      try {
        const q = query(collection(db, "cases"), where("clientId", "==", user!.uid));
        const snap = await getDocs(q);
        const docs = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        docs.sort((a: any, b: any) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setCases(docs);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, [user]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">Portal cliente</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Mis causas</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Consulta expedientes, avances y documentos vinculados.</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-[2rem] bg-white dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-12 text-center dark:border-white/10 dark:bg-slate-900">
          <FolderOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Aun no hay causas vinculadas</h2>
          <p className="mt-2 text-sm text-slate-500">Cuando el estudio cree una causa para este cliente aparecera aqui.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cases.map((item) => (
            <div key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-500/10">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-white/10">
                  {item.status || "active"}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{item.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">{item.description || "Sin descripcion."}</p>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/10">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Calendar className="h-4 w-4" /> {item.category || item.type || "General"}
                </span>
                <Link href="/cliente" className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-indigo-600">
                  Ver resumen <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
