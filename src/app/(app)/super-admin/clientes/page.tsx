import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminClientesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight">Análisis de Clientes</h2>
      <p className="text-muted-foreground">Visión ejecutiva de la cartera total de empresas.</p>
      
      <Card>
        <CardHeader><CardTitle>Monitor de Riesgo / Churn Oportunidad</CardTitle></CardHeader>
        <CardContent className="h-48 flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-lg m-4">
            Listado de clientes con problemas o que requieren atención para up-sell.
        </CardContent>
      </Card>
    </div>
  );
}
