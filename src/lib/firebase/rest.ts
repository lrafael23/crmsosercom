/**
 * Portal 360 — Firestore REST API Helper
 * 
 * Usamos la REST API para escrituras desde el servidor (API Routes)
 * para evitar problemas de compatibilidad con symlinks en Windows/Firebase.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "sosercom-cb383";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * Obtiene un token de acceso para la Firestore REST API.
 * Intenta usar el metadata server de GCP o un fallback local si existe.
 */
async function getAccessToken(): Promise<string | null> {
  // En producción (Cloud Run), esto funciona automáticamente.
  // En local, podrías necesitar un Service Account Key.
  try {
    const res = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      { headers: { "Metadata-Flavor": "Google" }, signal: AbortSignal.timeout(2000) }
    );
    if (res.ok) {
      const data = (await res.json()) as { access_token: string };
      return data.access_token;
    }
  } catch {
    // No estamos en GCP
  }
  return null;
}

/**
 * Guarda o actualiza un documento vía REST.
 */
export async function setFirestoreDocREST(collection: string, docId: string, data: any) {
  const token = await getAccessToken();
  const url = `${FIRESTORE_BASE}/${collection}/${docId}`;
  
  // Convertimos data a Formato Firestore REST (simplificado para este caso específico)
  // Nota: Para un helper genérico, esto requeriría mapeo de tipos.
  // Aquí usaremos una versión básica que asume strings.
  
  const fields: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') fields[key] = { stringValue: value };
    else if (typeof value === 'object') fields[key] = { stringValue: JSON.stringify(value) };
  }

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Firestore REST Error: ${err}`);
  }

  return response.json();
}
