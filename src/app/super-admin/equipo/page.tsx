import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminEquipoPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight">Staff y Rendimiento</h2>
      <p className="text-muted-foreground">Medición de tiempos y cuellos de botella por abogado/contador.</p>
      
      <Card>
        <CardHeader><CardTitle>Listado de Rendimiento Interno</CardTitle></CardHeader>
        <CardContent className="h-48 flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-lg m-4">
            Horas trabajadas vs Casos cerrados.
        </CardContent>
      </Card>
    </div>
  );
}
