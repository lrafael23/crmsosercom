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

    const normalized = records.map((row: Record<string, unknown>) => ({
      tenantId,
      companyId: typeof row.companyId === "string" ? row.companyId : null,
      clientId: String(row.clientId || row.ClienteId || row.client_id || "cliente-importado"),
      clientName: String(row.clientName || row.Cliente || row.cliente || "Cliente importado"),
      title: String(row.title || row.Titulo || row.Causa || row.causa || "Causa importada"),
      category: String(row.category || row.Materia || row.materia || "General"),
      type: String(row.type || row.Tipo || row.tipo || "General"),
      procedure: String(row.procedure || row.Procedimiento || row.procedimiento || "Procedimiento general"),
      description: String(row.description || row.Comentarios || row.descripcion || ""),
      status: String(row.status || row.Estado || "active") as CaseRecord["status"],
      stage: String(row.stage || row.Etapa || "intake") as CaseRecord["stage"],
      assignedTo: String(row.assignedTo || row.ResponsableId || createdBy),
      assignedToName: String(row.assignedToName || row.Responsable || "Responsable importado"),
      lastAction: row.lastAction ? String(row.lastAction) : row["Ultima accion"] ? String(row["Ultima accion"]) : null,
      pendingBalance: Number(row.pendingBalance ?? row.Saldo ?? 0),
      trackedMinutes: Number(row.trackedMinutes ?? row.Minutos ?? 0),
      nextDeadline: row.nextDeadline ? String(row.nextDeadline) : row.Plazo ? String(row.Plazo) : null,
      visibleToClient: row.visibleToClient !== false,
      createdBy,
      updatedBy: null,
      priority: String(row.priority || row.Prioridad || "medium") as "low" | "medium" | "high" | "critical",
    }));

    const count = await importCasesBulk(normalized, authUser.token);
    return NextResponse.json({ ok: true, imported: count });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
