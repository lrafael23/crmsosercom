import { Resend } from "resend";

// Inicialización perezosa para evitar fallos en el build si no hay API Key
let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey && process.env.NODE_ENV === "production") {
       console.warn("[MAIL] Advertencia: RESEND_API_KEY no configurada.");
    }
    resendInstance = new Resend(apiKey || "dummy_key");
  }
  return resendInstance;
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  reply_to?: string;
}

/**
 * Envía un correo electrónico mediante Resend.
 * Por defecto usa el remitente de Portal 360.
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = "Portal 360 <notificaciones@portal360.com>",
  reply_to
}: SendEmailParams) {
  try {
    const { data, error } = await getResend().emails.send({
      from,
      to,
      subject,
      html,
      replyTo: reply_to
    });

    if (error) {
      console.error("[MAIL] Error de Resend:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("[MAIL] Error inesperado:", err);
    throw err;
  }
}
