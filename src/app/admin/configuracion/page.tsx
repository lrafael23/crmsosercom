import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminConfiguracionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuración del Sistema</h2>
          <p className="text-muted-foreground">Ajustes generales, catálogo y usuarios internos.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios del Equipo de Trabajo</CardTitle>
            <CardDescription>
              Invita a nuevos contadores y abogados al sistema. Role y permisos automáticos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex gap-2">
               <Input placeholder="correo@empresa.com" />
               <Button>Invitar</Button>
             </div>
             <div className="border rounded-md p-4 mt-4 bg-muted/20">
                <p className="text-sm text-center text-muted-foreground">La base de usuarios actual se gestiona temporalmente desde Firebase Console.</p>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Servicios</CardTitle>
            <CardDescription>
              Añade tipos de planes predeterminados para asignar a clientes luego.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del Servicio / Plan</Label>
              <Input placeholder="Ej. Retención Mensual Jurídica" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Guardar Nuevo Servicio</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
