import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function PagosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Honorarios y Planes</h2>
          <p className="text-muted-foreground">Consulta el estado de tus servicios contratados.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Plan Contratado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Premium 360</div>
            <p className="text-xs text-muted-foreground mt-1">Servicio Integral Mensual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Valor Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 UF</div>
            <p className="text-xs text-muted-foreground mt-1">Se factura los días 5</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estado de Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Al día</div>
            <p className="text-xs text-muted-foreground mt-1">Sin deuda pendiente</p>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-bold tracking-tight mt-6">Historial de Honorarios</h3>
      <div className="rounded-md border bg-white dark:bg-black">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Servicio / Descripción</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead className="text-right">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Mensualidad Plan Premium</TableCell>
              <TableCell>05/04/2026</TableCell>
              <TableCell>12 UF</TableCell>
              <TableCell className="text-right">
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">Pagado</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Redacción Contrato Especifico</TableCell>
              <TableCell>15/03/2026</TableCell>
              <TableCell>4 UF</TableCell>
              <TableCell className="text-right">
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">Pagado</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Mensualidad Plan Premium</TableCell>
              <TableCell>05/03/2026</TableCell>
              <TableCell>12 UF</TableCell>
              <TableCell className="text-right">
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">Pagado</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
