"use client";

import { Upload } from "lucide-react";
import { auth } from "@/lib/firebase/client";

export function ExcelImportButton({ tenantId, createdBy, onImported }: { tenantId: string; createdBy: string; onImported?: () => void }) {
  async function handleFile(file: File) {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const records = XLSX.utils.sheet_to_json(sheet);
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("No auth token");

    const res = await fetch("/api/cases/import", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tenantId, createdBy, records }),
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "No se pudo importar");
    alert(`Importacion completada: ${data.imported} causas.`);
    onImported?.();
  }

  return (
    <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file).catch((error) => alert(error instanceof Error ? error.message : "No se pudo importar"));
          event.currentTarget.value = "";
        }}
      />
      <Upload className="mr-2 h-4 w-4" /> Importar Excel
    </label>
  );
}
