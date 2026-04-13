import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-bold tracking-tight">Panel Ejecutivo (Super Admin)</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Facturación Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12.4M</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
