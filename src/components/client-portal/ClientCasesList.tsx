"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, FolderOpen, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CaseRecord } from "@/features/cases/types";
import type { ClientCaseSummary } from "@/features/client-portal/types";

export function ClientCasesList({
  rows,
  summary,
  search,
  status,
  loading = false,
  error,
  onSearchChange,
  onStatusChange,
  onSubmit,
}: {
  rows: CaseRecord[];
  summary: ClientCaseSummary | null;
  search: string;
  status: string;
  loading?: boolean;
  error?: string | null;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const pendingAmount = summary?.pendingPaymentsAmount ?? rows.reduce((acc, row) => acc + (row.pendingBalance ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">Portal Cliente · Causas</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-neutral-950">Tus causas y seguimiento</h1>
            <p className="mt-3 max-w-4xl text-base leading-7 text-neutral-600">
              Revisa causas activas, proximos eventos, documentos visibles y pagos pendientes vinculados a tu cuenta.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><FolderOpen className="h-4 w-4" /> Causas visibles</div>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">{summary?.casesCount ?? rows.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><Wallet className="h-4 w-4" /> Pagos pendientes</div>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">${pendingAmount.toLocaleString("es-CL")}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><CalendarDays className="h-4 w-4" /> Reuniones/eventos</div>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">{summary?.upcomingEventsCount ?? 0}</p>
        </div>
      </div>

      <div className="rounded-[32px] bg-white p-6 shadow-sm">
        <form
          className="grid gap-4 xl:grid-cols-[1fr_0.25fr_0.2fr]"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por causa, materia, procedimiento o descripcion"
              className="h-12 rounded-2xl border-neutral-200 pl-9"
            />
          </div>
          <Input value={status} onChange={(event) => onStatusChange(event.target.value)} placeholder="Estado" className="h-12 rounded-2xl border-neutral-200" />
          <Button type="submit" className="h-12 rounded-2xl bg-neutral-950 text-white hover:bg-neutral-800" disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </form>

        {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

        <div className="mt-6 overflow-x-auto rounded-[28px] border border-neutral-200 bg-white">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                {["Causa", "Materia", "Estado", "Etapa", "Proximo hito", "Saldo", "Abrir"].map((head) => (
                  <th key={head} className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-left font-medium text-neutral-600">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="odd:bg-white even:bg-neutral-50/50">
                  <td className="border-b border-neutral-100 px-4 py-3 font-semibold text-neutral-900">{row.title}</td>
                  <td className="border-b border-neutral-100 px-4 py-3">{row.category}</td>
                  <td className="border-b border-neutral-100 px-4 py-3">{row.status}</td>
                  <td className="border-b border-neutral-100 px-4 py-3">{row.stage}</td>
                  <td className="border-b border-neutral-100 px-4 py-3">{row.nextDeadline ?? "Sin plazo"}</td>
                  <td className="border-b border-neutral-100 px-4 py-3">${(row.pendingBalance ?? 0).toLocaleString("es-CL")}</td>
                  <td className="border-b border-neutral-100 px-4 py-3">
                    <Link href={`/cliente/causas/${row.id}`} className="inline-flex h-10 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800">
                      Abrir <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && rows.length === 0 && (
            <div className="p-10 text-center text-sm text-neutral-500">No hay causas visibles con los filtros actuales.</div>
          )}
        </div>
      </div>
    </div>
  );
}
