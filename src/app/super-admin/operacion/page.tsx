import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminOperacionPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight">Operación Completa</h2>
      <p className="text-muted-foreground">Estado general de todos los trámites y tickets activos de la firma.</p>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Trámites Atrasados</CardTitle></CardHeader>
          <CardContent className="h-32 flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-lg m-4">
             Tabla de Trámites consolidados
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tickets sin respuesta</CardTitle></CardHeader>
          <CardContent className="h-32 flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-lg m-4">
             Tabla de Tickets urgentes
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
