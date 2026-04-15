import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminVentasPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight">Métricas de Ventas</h2>
      <p className="text-muted-foreground">Embudo de conversión y crecimiento.</p>
      
      <Card>
        <CardHeader><CardTitle>Conversión Leads vs Cierres</CardTitle></CardHeader>
        <CardContent className="h-48 flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-lg m-4">
            Gráficos de ventas (por implementar).
        </CardContent>
      </Card>
    </div>
  );
}
