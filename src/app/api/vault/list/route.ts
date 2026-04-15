import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

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

    const q = query(
      collection(db, "case_documents"),
      where("caseId", "==", caseId),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    const documents = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ documents });

  } catch (error: any) {
    console.error("Vault List Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
