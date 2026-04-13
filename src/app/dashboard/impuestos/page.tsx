import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Calculator } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ImpuestosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Estimaciones Tributarias</h2>
          <p className="text-muted-foreground">Proyección y control de impuestos para evitar sorpresas.</p>
        </div>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Nota del área Tributaria</AlertTitle>
        <AlertDescription>
          Los valores mostrados son estimaciones calculadas en base a la documentación entregada hasta la fecha. El valor final del impuesto a pagar (F29) puede variar al cierre del periodo.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-primary/5 rounded-t-lg">
            <CardTitle className="text-md font-bold">Impuesto Próximo a Pagar (F29)</CardTitle>
            <Calculator className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-4xl font-extrabold mb-2">$1,245,000</div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Periodo:</span>
              <span className="font-semibold">Marzo 2026</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-muted-foreground">Vencimiento:</span>
              <span className="font-semibold text-red-500">20 Abril 2026</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-bold tracking-tight mt-6">Historial de Obligaciones</h3>
      <div className="rounded-md border bg-white dark:bg-black">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periodo</TableHead>
              <TableHead>Formulario</TableHead>
              <TableHead>Monto Base</TableHead>
              <TableHead>Impuesto Resultante</TableHead>
              <TableHead className="text-right">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Febrero 2026</TableCell>
              <TableCell>F29 IVA</TableCell>
              <TableCell>$8,500,000</TableCell>
              <TableCell>$1,100,000</TableCell>
              <TableCell className="text-right">Declarado y Pagado</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Enero 2026</TableCell>
              <TableCell>F29 IVA</TableCell>
              <TableCell>$9,200,000</TableCell>
              <TableCell>$1,350,000</TableCell>
              <TableCell className="text-right">Declarado y Pagado</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
