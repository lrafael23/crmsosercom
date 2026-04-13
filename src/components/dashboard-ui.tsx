"use client";

import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface StatItem {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
}

interface TableColumn<T extends Record<string, unknown>> {
  key: keyof T & string;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export function StatCard({ item }: { item: StatItem }) {
  const Icon = item.icon;

  return (
    <Card className="rounded-3xl border-neutral-200/70 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">{item.value}</p>
            <p className="mt-1 text-sm text-neutral-500">{item.sub}</p>
          </div>
          <div className="rounded-2xl bg-neutral-100 p-3">
            <Icon className="h-5 w-5 text-neutral-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const cls = useMemo(() => {
    if (["Aprobado", "Finalizado", "Respondido"].includes(value)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (["Observado", "Alta", "Urgente", "Atencion"].includes(value)) return "bg-rose-50 text-rose-700 border-rose-200";
    if (["Pendiente", "Abierto", "Requiere cliente", "En revision"].includes(value)) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-sky-50 text-sky-700 border-sky-200";
  }, [value]);

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>{value}</span>;
}

export function SimpleTable<T extends Record<string, unknown>>({ rows, columns }: { rows: T[]; columns: TableColumn<T>[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-left font-medium text-neutral-600">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="odd:bg-white even:bg-neutral-50/50">
              {columns.map((col) => (
                <td key={col.key} className="border-b border-neutral-100 px-4 py-3 align-middle text-neutral-700">
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
