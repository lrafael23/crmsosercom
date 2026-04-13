"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard, StatusBadge, SimpleTable } from "@/components/dashboard-ui";
import { Scale, Calculator, Receipt, FolderOpen, Briefcase, MessageSquare } from "lucide-react";

const kpisCliente = [
  { label: "Trámites activos", value: "12", sub: "+2 esta semana", icon: Briefcase },
  { label: "Documentos pendientes", value: "5", sub: "2 observados", icon: FolderOpen },
  { label: "Tickets abiertos", value: "4", sub: "1 urgente", icon: MessageSquare },
  { label: "Impuesto estimado", value: "$1.480.000", sub: "Vence en 9 días", icon: Receipt },
];

const documentos = [
  { nombre: "Balance marzo 2026", area: "Contable", estado: "Aprobado", fecha: "11-04-2026" },
  { nombre: "Contrato de prestación", area: "Jurídico", estado: "Observado", fecha: "10-04-2026" },
  { nombre: "Libro de compras", area: "Tributario", estado: "Pendiente", fecha: "09-04-2026" },
  { nombre: "Factura proveedor", area: "Contable", estado: "Pendiente", fecha: "08-04-2026" },
];

const tickets = [
  { asunto: "Duda sobre honorarios adicionales", area: "Administración", estado: "Abierto", tiempo: "Hace 2 h" },
  { asunto: "Subí factura errónea", area: "Contable", estado: "En revisión", tiempo: "Hace 5 h" },
  { asunto: "Consulta por contrato de arriendo", area: "Jurídico", estado: "Respondido", tiempo: "Ayer" },
  { asunto: "Fecha de pago estimado", area: "Tributario", estado: "Abierto", tiempo: "Ayer" },
];

export default function DashboardClientPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpisCliente.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="rounded-3xl border-neutral-200/70">
          <CardHeader>
            <CardTitle>Estado por departamentos</CardTitle>
            <CardDescription>Lo que hoy está en curso dentro de tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-neutral-200 bg-white p-5">
                <div className="flex items-center gap-3"><Scale className="h-5 w-5" /><h4 className="font-medium">Jurídico</h4></div>
                <p className="mt-4 text-3xl font-semibold">4</p>
                <p className="mt-1 text-sm text-neutral-500">Trámites activos</p>
                <div className="mt-4"><StatusBadge value="En proceso" /></div>
              </div>
              <div className="rounded-3xl border border-neutral-200 bg-white p-5">
                <div className="flex items-center gap-3"><Calculator className="h-5 w-5" /><h4 className="font-medium">Contable</h4></div>
                <p className="mt-4 text-3xl font-semibold">2</p>
                <p className="mt-1 text-sm text-neutral-500">Documentos observados</p>
                <div className="mt-4"><StatusBadge value="Pendiente" /></div>
              </div>
              <div className="rounded-3xl border border-neutral-200 bg-white p-5">
                <div className="flex items-center gap-3"><Receipt className="h-5 w-5" /><h4 className="font-medium">Tributario</h4></div>
                <p className="mt-4 text-3xl font-semibold">9</p>
                <p className="mt-1 text-sm text-neutral-500">Días para próximo pago</p>
                <div className="mt-4"><StatusBadge value="Atención" /></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-neutral-200/70">
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
            <CardDescription>Eventos que requieren acción</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              Falta documento contable para cerrar revisión mensual.
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Impuesto estimado con vencimiento cercano.
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
              Reunión estratégica agendada para el jueves.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl border-neutral-200/70">
          <CardHeader>
            <CardTitle>Documentos recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTable
              rows={documentos}
              columns={[
                { key: "nombre", label: "Documento" },
                { key: "area", label: "Área" },
                { key: "estado", label: "Estado", render: (v: string) => <StatusBadge value={v} /> },
                { key: "fecha", label: "Fecha" },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-neutral-200/70">
          <CardHeader>
            <CardTitle>Tickets y consultas</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTable
              rows={tickets}
              columns={[
                { key: "asunto", label: "Asunto" },
                { key: "area", label: "Área" },
                { key: "estado", label: "Estado", render: (v: string) => <StatusBadge value={v} /> },
                { key: "tiempo", label: "Última actividad" },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
