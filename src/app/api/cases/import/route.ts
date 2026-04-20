import { NextRequest, NextResponse } from "next/server";
import { importCasesBulk } from "@/features/cases/server/cases-repo";
import type { CaseRecord } from "@/features/cases/types";
import { requireFirebaseUser } from "@/lib/firebase/rest-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireFirebaseUser(req);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const tenantId = body.tenantId;
    const createdBy = body.createdBy;
    const records = body.records;

    if (!tenantId || !createdBy || !Array.isArray(records)) {
      return NextResponse.json({ error: "tenantId, createdBy y records requeridos" }, { status: 400 });
    }

    const valueOf = (row: Record<string, unknown>, keys: string[], fallback: unknown = "") => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
      }
      return fallback;
    };

    const normalized = records.map((row: Record<string, unknown>) => ({
      tenantId,
      companyId: typeof row.companyId === "string" ? row.companyId : null,
      clientId: String(valueOf(row, ["clientId", "clienteId", "ClienteId", "client_id"], "cliente-importado")),
      clientName: String(valueOf(row, ["clientName", "clienteNombre", "Cliente", "cliente"], "Cliente importado")),
      title: String(valueOf(row, ["title", "titulo", "Titulo", "Causa", "causa"], "Causa importada")),
      category: String(valueOf(row, ["category", "materia", "Materia"], "General")),
      type: String(valueOf(row, ["type", "tipo", "Tipo"], "General")),
      procedure: String(valueOf(row, ["procedure", "procedimiento", "Procedimiento"], "Procedimiento general")),
      description: String(valueOf(row, ["description", "descripcion", "Comentarios"], "")),
      status: String(valueOf(row, ["status", "estado", "Estado"], "active")) as CaseRecord["status"],
      stage: String(valueOf(row, ["stage", "etapa", "Etapa"], "intake")) as CaseRecord["stage"],
      assignedTo: String(valueOf(row, ["assignedTo", "responsableId", "ResponsableId"], createdBy)),
      assignedToName: String(valueOf(row, ["assignedToName", "responsableNombre", "Responsable"], "Responsable importado")),
      lastAction: valueOf(row, ["lastAction", "ultimaAccion", "Ultima accion"], null) as string | null,
      pendingBalance: Number(valueOf(row, ["pendingBalance", "saldoPendiente", "Saldo"], 0)),
      trackedMinutes: Number(valueOf(row, ["trackedMinutes", "minutosAcumulados", "Minutos"], 0)),
      nextDeadline: valueOf(row, ["nextDeadline", "proximoPlazo", "Plazo"], null) as string | null,
      visibleToClient: valueOf(row, ["visibleToClient", "visibleCliente"], true) !== false,
      createdBy,
      updatedBy: null,
      priority: String(valueOf(row, ["priority", "prioridad", "Prioridad"], "medium")) as "low" | "medium" | "high" | "critical",
    }));

    const count = await importCasesBulk(normalized, authUser.token);
    return NextResponse.json({ ok: true, imported: count });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
