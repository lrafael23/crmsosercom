"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function SuperAdminAuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(20));
        const qSnap = await getDocs(q);
        setLogs(qSnap.docs.map(doc => ({id: doc.id, ...doc.data()})));
      } catch (error) {
        // Ignorar en mock si falla
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight">Logs de Auditoría</h2>
      <p className="text-muted-foreground">Registro inmutable de actividades en la plataforma.</p>
      
      <div className="rounded-md border bg-white dark:bg-black">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                 <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No hay logs registrados o falta permisos.</TableCell>
              </TableRow>
            ) : logs.map(l => (
              <TableRow key={l.id}>
                <TableCell>{l.timestamp?.toDate ? l.timestamp.toDate().toLocaleString() : 'N/A'}</TableCell>
                <TableCell className="font-mono text-xs">{l.userId}</TableCell>
                <TableCell><Badge variant="outline">{l.actionType}</Badge></TableCell>
                <TableCell>{l.entityType}: {l.entityId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
