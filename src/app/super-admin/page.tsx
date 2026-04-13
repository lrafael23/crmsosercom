"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard, StatusBadge, SimpleTable } from "@/components/dashboard-ui";
import { CircleDollarSign, TrendingUp, Clock3, UserCog, Scale, Calculator, Receipt } from "lucide-react";

const kpisSuper = [
  { label: "Ingresos estimados", value: "$14.800.000", sub: "Mes actual", icon: CircleDollarSign },
  { label: "Conversión de leads", value: "31%", sub: "vs. 24% mes anterior", icon: TrendingUp },
  { label: "Trámites atrasados", value: "14", sub: "Requieren intervención", icon: Clock3 },
  { label: "Carga crítica equipo", value: "3 áreas", sub: "Contable lidera pendientes", icon: UserCog },
];

export default function SuperAdminPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpisSuper.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl border-neutral-200/70">
          <CardHeader>
            <CardTitle>Control por departamentos</CardTitle>
            <CardDescription>Salud operacional general</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="font-medium">Jurídico</span>
                <Scale className="h-5 w-5 text-neutral-600" />
              </div>
              <p className="mt-4 text-3xl font-semibold">86%</p>
              <p className="mt-1 text-sm text-neutral-500">Cumplimiento</p>
              <div className="mt-4"><StatusBadge value="Finalizado" /></div> {/* Reemplazo color estable */}
            </div>
            <div className="rounded-3xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="font-medium">Contable</span>
                <Calculator className="h-5 w-5 text-neutral-600" />
              </div>
              <p className="mt-4 text-3xl font-semibold">64%</p>
              <p className="mt-1 text-sm text-neutral-500">Cumplimiento</p>
              <div className="mt-4"><StatusBadge value="Pendiente" /></div>
            </div>
            <div className="rounded-3xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="font-medium">Tributario</span>
                <Receipt className="h-5 w-5 text-neutral-600" />
              </div>
              <p className="mt-4 text-3xl font-semibold">71%</p>
              <p className="mt-1 text-sm text-neutral-500">Cumplimiento</p>
              <div className="mt-4"><StatusBadge value="En revisión" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-neutral-200/70">
          <CardHeader>
            <CardTitle>Alertas críticas</CardTitle>
            <CardDescription>Eventos que requieren intervención gerencial</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              3 tickets vencidos en área contable con más de 48 horas sin respuesta.
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              5 clientes con documentos críticos faltantes para cierre mensual.
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
              2 oportunidades comerciales listas para cierre con alto ticket.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl border-neutral-200/70">
          <CardHeader>
            <CardTitle>Rendimiento del equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTable
              rows={[
                { usuario: "Área contable", tickets: 9, tramites: 14, respuesta: "19 h", atraso: "Urgente" }, 
                { usuario: "Área jurídica", tickets: 4, tramites: 10, respuesta: "7 h", atraso: "Aprobado" }, // Hack for colors mapping
                { usuario: "Área tributaria", tickets: 6, tramites: 8, respuesta: "11 h", atraso: "Pendiente" },
              ]}
              columns={[
                { key: "usuario", label: "Equipo" },
                { key: "tickets", label: "Tickets" },
                { key: "tramites", label: "Trámites" },
                { key: "respuesta", label: "Prom. respuesta" },
                { key: "atraso", label: "Riesgo", render: (v: string) => <StatusBadge value={v} /> },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-neutral-200/70">
          <CardHeader>
            <CardTitle>Auditoría reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTable
              rows={[
                { accion: "Cambio de estado de ticket", usuario: "staff@portal360.cl", modulo: "Tickets", fecha: "Hoy 09:32" },
                { accion: "Subida de balance", usuario: "cliente@empresa.cl", modulo: "Documentos", fecha: "Hoy 08:51" },
                { accion: "Reasignación de trámite", usuario: "admin@portal360.cl", modulo: "Trámites", fecha: "Ayer 18:14" },
                { accion: "Impersonación de cliente", usuario: "superadmin@portal360.cl", modulo: "Auditoría", fecha: "Ayer 17:02" },
              ]}
              columns={[
                { key: "accion", label: "Acción" },
                { key: "usuario", label: "Usuario" },
                { key: "modulo", label: "Módulo" },
                { key: "fecha", label: "Fecha" },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
