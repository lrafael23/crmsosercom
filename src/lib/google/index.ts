import { google } from "googleapis";
import { Readable } from "stream";

/**
 * Portal 360 — Google Services Library
 * 
 * Centraliza la lógica de comunicación con Google (Calendar, Drive, Auth).
 */

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export function createOAuth2Client() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    throw new Error("Faltan variables de entorno de Google");
  }
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function getAuthUrl(state?: string) {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state,
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/drive", // Acceso completo para gestionar carpetas/permisos
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  });
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export function getAuthorizedClient(tokens: any) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

/**
 * GOOGLE CALENDAR
 */
export async function createGoogleEvent(tokens: any, eventData: any) {
  const auth = getAuthorizedClient(tokens);
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.insert({ calendarId: "primary", requestBody: eventData });
  return res.data;
}

export async function listGoogleEvents(tokens: any) {
  const auth = getAuthorizedClient(tokens);
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 20,
    singleEvents: true,
    orderBy: "startTime",
  });
  return res.data.items || [];
}

/**
 * GOOGLE DRIVE — Bóveda
 */

/**
 * Busca o crea una carpeta por nombre
 */
export async function findOrCreateFolder(auth: any, folderName: string, parentId?: string) {
  const drive = google.drive({ version: "v3", auth });
  
  // Buscar si existe
  let q = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) q += ` and '${parentId}' in parents`;

  const response = await drive.files.list({ q, fields: "files(id, name)" });
  const files = response.data.files;

  if (files && files.length > 0) {
    return files[0].id as string;
  }

  // Crear si no existe
  const fileMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: parentId ? [parentId] : [],
  };

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id",
  });

  const folderIdCreated = folder.data.id as string;

  if (!folderIdCreated) {
    throw new Error(`No se pudo crear o encontrar la carpeta: ${folderName}`);
  }

  // 4. Acceso de Emergencia: Añadir admin como editor
  try {
    await drive.permissions.create({
      fileId: folderIdCreated,
      requestBody: {
        role: "writer",
        type: "user",
        emailAddress: "admin@portal360.com",
      },
    });
  } catch (err) {
    console.error(`[Drive] No se pudo añadir acceso de emergencia a la carpeta ${folderIdCreated}:`, err);
  }

  return folderIdCreated;
}

/**
 * Sube un archivo a una carpeta específica y lo hace público (link sharing)
 */
export async function uploadFileToDrive(auth: any, folderId: string, file: { name: string, mimeType: string, buffer: Buffer }) {
  const drive = google.drive({ version: "v3", auth });

  // 1. Convertir buffer a stream
  const bufferStream = new Readable();
  bufferStream.push(file.buffer);
  bufferStream.push(null);

  // 2. Crear archivo
  const response = await drive.files.create({
    requestBody: {
      name: file.name,
      parents: [folderId],
    },
    media: {
      mimeType: file.mimeType,
      body: bufferStream,
    },
    fields: "id, webViewLink, webContentLink",
  });

  const fileId = response.data.id!;

  // 3. Permisos: "Cualquiera con el link puede leer"
  await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return response.data;
}
