import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { 
  getAuthorizedClient, 
  findOrCreateFolder, 
  uploadFileToDrive 
} from "@/lib/google";

/**
 * POST /api/vault/upload
 * 
 * Sube un archivo al Google Drive del abogado y lo registra en Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const caseId = formData.get("caseId") as string;
    const userId = formData.get("userId") as string; // El abogado que sube (o a cuyo drive se sube)

    if (!file || !caseId || !userId) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // 1. Obtener tokens del abogado
    const credRef = doc(db, "user_credentials", `${userId}/google_calendar`);
    const credSnap = await getDoc(credRef);

    if (!credSnap.exists()) {
      return NextResponse.json({ error: "Google Drive no conectado. Por favor, conecta tu cuenta." }, { status: 401 });
    }

    const tokens = credSnap.data();
    const auth = getAuthorizedClient(tokens);

    // 2. Estructura de Carpetas en Drive
    // Root: Portal360
    const rootFolderId = await findOrCreateFolder(auth, "Portal360_Vault");
    
    // Subfolder de la Causa
    const caseFolderName = `Causa_${caseId}`;
    const caseFolderId = await findOrCreateFolder(auth, caseFolderName, rootFolderId);

    // 3. Subir a Drive
    const buffer = Buffer.from(await file.arrayBuffer());
    const driveFile = await uploadFileToDrive(auth, caseFolderId, {
      name: file.name,
      mimeType: file.type,
      buffer: buffer
    });

    // 4. Registrar en Firestore
    // Creamos un registro en case_documents para consulta rápida
    const docMeta = {
      name: file.name,
      type: file.type,
      size: file.size,
      driveId: driveFile.id,
      webViewLink: driveFile.webViewLink,
      webContentLink: driveFile.webContentLink,
      caseId,
      uploadedBy: userId,
      tenantId: caseId.split('_')[0] || "default", // Ajustar según estructura real de caseId si es necesario
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "case_documents"), docMeta);

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      driveId: driveFile.id,
      url: driveFile.webViewLink 
    });

  } catch (error: any) {
    console.error("Vault Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
