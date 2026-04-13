"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard, StatusBadge, SimpleTable } from "@/components/dashboard-ui";
import { Users, Calendar, FileText, AlertTriangle } from "lucide-react";

const kpisAdmin = [
  { label: "Leads nuevos", value: "18", sub: "Mes actual", icon: Users },
  { label: "Reuniones agendadas", value: "11", sub: "6 confirmadas", icon: Calendar },
  { label: "Documentos por revisar", value: "23", sub: "7 críticos", icon: FileText },
  { label: "Tickets sin respuesta", value: "9", sub: "3 vencidos", icon: AlertTriangle },
];

const documentos = [
  { nombre: "Balance marzo 2026", area: "Contable", estado: "Aprobado", fecha: "11-04-2026" },
  { nombre: "Contrato de prestación", area: "Jurídico", estado: "Observado", fecha: "10-04-2026" },
  { nombre: "Libro de compras", area: "Tributario", estado: "Pendiente", fecha: "09-04-2026" },
];

const tramites = [
  { nombre: "Revisión de estructura societaria", area: "Jurídico", prioridad: "Alta", estado: "En proceso", encargado: "R. Vera" },
  { nombre: "Estimación impuesto abril", area: "Tributario", prioridad: "Media", estado: "Requiere cliente", encargado: "Equipo tributario" },
  { nombre: "Clasificación documental", area: "Contable", prioridad: "Alta", estado: "Pendiente", encargado: "Equipo contable" },
];

const tickets = [
  { asunto: "Duda sobre honorarios adicionales", area: "Administración", estado: "Abierto", tiempo: "Hace 2 h" },
  { asunto: "Subí factura errónea", area: "Contable", estado: "En revisión", tiempo: "Hace 5 h" },
  { asunto: "Consulta por contrato de arriendo", area: "Jurídico", estado: "Respondido", tiempo: "Ayer" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpisAdmin.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl border-neutral-200/70">
          <CardHeader>
            <CardTitle>Trámites en ejecución</CardTitle>
            <CardDescription>Vista rápida para control interno</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleTable
              rows={tramites}
              columns={[
                { key: "nombre", label: "Gestión" },
                { key: "area", label: "Área" },
                { key: "prioridad", label: "Prioridad", render: (v: string) => <StatusBadge value={v} /> },
                { key: "estado", label: "Estado", render: (v: string) => <StatusBadge value={v} /> },
                { key: "encargado", label: "Encargado" },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-neutral-200/70">
          <CardHeader>
            <CardTitle>Agenda y conversión</CardTitle>
            <CardDescription>Embudo comercial y reuniones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Lead a cliente</p>
              <p className="mt-2 text-3xl font-semibold">31%</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Reuniones hoy</p>
              <p className="mt-2 text-3xl font-semibold">4</p>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-500">Clientes con upsell potencial</p>
              <p className="mt-2 text-3xl font-semibold">7</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl border-neutral-200/70">
          <CardHeader>
            <CardTitle>Documentos por revisar</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTable
              rows={documentos}
              columns={[
                { key: "nombre", label: "Documento" },
                { key: "area", label: "Área" },
                { key: "estado", label: "Estado", render: (v: string) => <StatusBadge value={v} /> },
                { key: "fecha", label: "Ingreso" },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-neutral-200/70">
          <CardHeader>
            <CardTitle>Tickets abiertos</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTable
              rows={tickets}
              columns={[
                { key: "asunto", label: "Asunto" },
                { key: "area", label: "Área" },
                { key: "estado", label: "Estado", render: (v: string) => <StatusBadge value={v} /> },
                { key: "tiempo", label: "Tiempo" },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
