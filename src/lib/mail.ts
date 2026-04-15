import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { data, error } = await resend.emails.send({
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
