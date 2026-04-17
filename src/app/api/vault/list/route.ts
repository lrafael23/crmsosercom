import { NextRequest, NextResponse } from "next/server";
import { queryFirestoreEqualsREST } from "@/lib/firebase/rest";

export const runtime = "nodejs";

/**
 * GET /api/vault/list?caseId=...
 * 
 * Lista documentos de una causa.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("caseId");

    if (!caseId) {
      return NextResponse.json({ error: "caseId es requerido" }, { status: 400 });
    }

    const documents = await queryFirestoreEqualsREST(
      "case_documents",
      "caseId",
      caseId,
      { field: "createdAt", direction: "DESCENDING" }
    );

    return NextResponse.json({ documents });

  } catch (error: any) {
    console.error("Vault List Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
