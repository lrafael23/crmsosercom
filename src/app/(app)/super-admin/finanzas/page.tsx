import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminFinanzasPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight">Finanzas y Rentabilidad</h2>
      <p className="text-muted-foreground">Márgenes de la firma mes a mes.</p>
      
      <Card>
        <CardHeader><CardTitle>Proyección de Flujo</CardTitle></CardHeader>
        <CardContent className="h-48 flex items-center justify-center text-muted-foreground border-dashed border-2 rounded-lg m-4">
            Módulo contable gerencial (P&L).
        </CardContent>
      </Card>
    </div>
  );
}
