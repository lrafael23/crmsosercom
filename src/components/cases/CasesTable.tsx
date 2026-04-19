"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CaseRecord } from "@/features/cases/types";

export function CasesTable({ rows, basePath = "/firm/causas" }: { rows: CaseRecord[]; basePath?: string }) {
  return (
    <div className="overflow-x-auto rounded-[28px] border border-neutral-200 bg-white dark:border-white/10 dark:bg-slate-900">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            {["Cliente", "Materia", "Procedimiento", "Estado", "Ultima accion", "Comentarios", "Saldo", "Horas", "Abrir"].map((head) => (
              <th key={head} className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-left font-medium text-neutral-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className="odd:bg-white even:bg-neutral-50/50 dark:odd:bg-slate-900 dark:even:bg-slate-950/50">
              <td className="border-b border-neutral-100 px-4 py-3 font-semibold text-neutral-900 dark:border-white/10 dark:text-white">{item.clientName}</td>
              <td className="border-b border-neutral-100 px-4 py-3 dark:border-white/10">{item.category}</td>
              <td className="border-b border-neutral-100 px-4 py-3 dark:border-white/10">{item.procedure}</td>
              <td className="border-b border-neutral-100 px-4 py-3 dark:border-white/10">{item.status.replace(/_/g, " ")}</td>
              <td className="border-b border-neutral-100 px-4 py-3 dark:border-white/10">{item.lastAction ?? "Sin registro"}</td>
              <td className="max-w-[280px] truncate border-b border-neutral-100 px-4 py-3 dark:border-white/10">{item.description}</td>
              <td className="border-b border-neutral-100 px-4 py-3 dark:border-white/10">${(item.pendingBalance ?? 0).toLocaleString("es-CL")}</td>
              <td className="border-b border-neutral-100 px-4 py-3 dark:border-white/10">{Math.floor((item.trackedMinutes ?? 0) / 60)} h</td>
              <td className="border-b border-neutral-100 px-4 py-3 dark:border-white/10">
                <Link href={`${basePath}/${item.id}`} className="inline-flex h-9 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800">
                  Abrir <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
