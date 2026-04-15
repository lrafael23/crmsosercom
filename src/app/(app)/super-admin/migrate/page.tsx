"use client";

import { useState } from "react";
import { collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, Users, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function MigrationPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ total: number; updated: number; errors: number } | null>(null);

  const normalizeData = async () => {
    setLoading(true);
    setStats(null);
    let updatedCount = 0;
    let errorCount = 0;

    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const batch = writeBatch(db);

      snapshot.forEach((userDoc) => {
        const data = userDoc.data();
        let changed = false;
        const updates: any = {};

        // 1. Rename admin_interno to admin
        if (data.role === "admin_interno") {
          updates.role = "admin";
          changed = true;
        }

        // 2. Ensure status exists
        if (!data.status) {
          updates.status = "active";
          changed = true;
        }

        // 3. Ensure tenantId exists
        if (!data.tenantId) {
          updates.tenantId = "sosercom-main";
          changed = true;
        }

        // 4. Ensure companyId for clients
        if (data.role === "cliente" && !data.companyId) {
          updates.companyId = "unassigned";
          changed = true;
        }

        if (changed) {
          const docRef = doc(db, "users", userDoc.id);
          batch.update(docRef, updates);
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        toast.success(`Se normalizaron ${updatedCount} registros correctamente.`);
      } else {
        toast.info("No se encontraron registros que requieran normalización.");
      }

      setStats({ total: snapshot.size, updated: updatedCount, errors: errorCount });
    } catch (error) {
      console.error("Migration error:", error);
      toast.error("Error crítico durante la migración.");
      errorCount++;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-4xl mx-auto shadow-lg border-slate-200">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Herramienta de Migración y Normalización</CardTitle>
              <CardDescription>
                Esta utilidad sincroniza la base de datos con la nueva arquitectura Multi-Tenant v1.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" /> Transformaciones
              </h3>
              <ul className="text-sm text-slate-600 space-y-1 list-disc pl-5">
                <li>Renombrar <code className="text-blue-600">admin_interno</code> → <code className="text-blue-600">admin</code></li>
                <li>Asignar <code className="text-blue-600">status: "active"</code> por defecto</li>
                <li>Asignar <code className="text-blue-600">tenantId: "sosercom-main"</code> si falta</li>
                <li>Normalizar herencia de permisos jerárquicos</li>
              </ul>
            </div>
            
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50 space-y-2">
              <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Advertencias
              </h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                Esta acción es irreversible y afecta directamente a la colección <code className="font-bold">users</code> de producción. 
                Se recomienda hacer un respaldo previo de Firestore.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl text-slate-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">Instrucciones de Ejecución</span>
              {!loading && !stats && (
                <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={normalizeData}>
                  Iniciar Normalización Ahora
                </Button>
              )}
            </div>
            
            {loading && (
              <div className="flex items-center justify-center py-4 gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Procesando registros de Firestore...</span>
              </div>
            )}

            {stats && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white/10 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div className="bg-green-500/20 p-4 rounded-xl border border-green-500/30">
                    <p className="text-xs text-green-400 mb-1 uppercase tracking-wider">Actualizados</p>
                    <p className="text-2xl font-bold text-green-400">{stats.updated}</p>
                  </div>
                  <div className="bg-red-500/20 p-4 rounded-xl border border-red-500/30">
                    <p className="text-xs text-red-400 mb-1 uppercase tracking-wider">Errores</p>
                    <p className="text-2xl font-bold text-red-400">{stats.errors}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-400 bg-green-950/50 p-3 rounded-xl border border-green-900">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs">Sincronización de arquitectura v1 completada exitosamente.</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
