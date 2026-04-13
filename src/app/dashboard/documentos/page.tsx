"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileUp, Download, Eye, FileIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Document {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt?: unknown;
}

export default function ClientDocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocs();
  }, [user]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestor Documental</h2>
          <p className="text-muted-foreground">Tus archivos, escrituras y documentos tributarios.</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto">
          <FileUp className="h-4 w-4" />
          Subir Documento
        </Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-black overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Archivo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">Cargando...</TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center p-4">
                    <FileIcon className="h-8 w-8 mb-2 opacity-20" />
                    No tienes documentos almacenados actualmente.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
             documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-primary" />
                    {doc.title}
                  </TableCell>
                  <TableCell>{doc.category}</TableCell>
                  <TableCell>
                    <Badge variant={
                        doc.status === 'approved' ? 'default' :
                        doc.status === 'rejected' ? 'destructive' :
                        'secondary'
                    }>
                        {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
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
