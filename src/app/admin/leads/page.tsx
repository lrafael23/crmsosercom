import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminLeadsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leads y Prospectos</h2>
          <p className="text-muted-foreground">Prospectos captados desde el sitio web.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Añadir Lead Manual
        </Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-black">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email de contacto</TableHead>
              <TableHead>Necesidad Principal</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Juan Pérez (Independiente)</TableCell>
              <TableCell>juan.perez@example.com</TableCell>
              <TableCell>Inicio Emprendimiento SpA</TableCell>
              <TableCell>
                <Badge className="bg-yellow-500 hover:bg-yellow-600">Nuevo</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="gap-2"><Eye className="h-4 w-4"/>Ver / Convertir</Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Empresa Constructora Alpha</TableCell>
              <TableCell>contacto@alpha.cl</TableCell>
              <TableCell>Asesoría Tributaria F29 Mensual</TableCell>
              <TableCell>
                <Badge variant="secondary">Contactado</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="gap-2"><Eye className="h-4 w-4"/>Ver / Convertir</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
