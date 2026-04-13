"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AuditLog {
  id: string;
  userId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  timestamp?: {
    toDate?: () => Date;
  };
}

function mapAuditLog(doc: QueryDocumentSnapshot<DocumentData>): AuditLog {
  const data = doc.data();

  return {
    id: doc.id,
    userId: typeof data.userId === "string" ? data.userId : "N/A",
    actionType: typeof data.actionType === "string" ? data.actionType : "N/A",
    entityType: typeof data.entityType === "string" ? data.entityType : "N/A",
    entityId: typeof data.entityId === "string" ? data.entityId : "N/A",
    timestamp: data.timestamp,
  };
}

export default function SuperAdminAuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const logsQuery = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(20));
        const snapshot = await getDocs(logsQuery);
        setLogs(snapshot.docs.map(mapAuditLog));
      } catch {
        setLogs([]);
      }
    }

    fetchLogs();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight">Logs de Auditoria</h2>
      <p className="text-muted-foreground">Registro inmutable de actividades en la plataforma.</p>

      <div className="rounded-md border bg-white dark:bg-black">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Accion</TableHead>
              <TableHead>Entidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  No hay logs registrados o faltan permisos.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : "N/A"}</TableCell>
                  <TableCell className="font-mono text-xs">{log.userId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.actionType}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.entityType}: {log.entityId}
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
