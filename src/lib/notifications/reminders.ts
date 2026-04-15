import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { sendEmail } from "@/lib/mail";

/**
 * Busca citas que ocurran en las próximas 2 horas y que no hayan recibido recordatorio.
 */
export async function processReminders() {
  const now = new Date();
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  console.log(`[Reminders] Ejecutando escaneo: ${now.toISOString()}`);

  const q = query(
    collection(db, "appointments"),
    where("status", "==", "confirmed"),
    where("reminderSent", "==", false),
    where("start", ">=", Timestamp.fromDate(now)),
    where("start", "<=", Timestamp.fromDate(inTwoHours))
  );

  const snapshot = await getDocs(q);
  console.log(`[Reminders] Encontradas ${snapshot.size} citas para recordar.`);

  for (const appointmentDoc of snapshot.docs) {
    const data = appointmentDoc.data();
    
    try {
      // 1. Obtener datos extra si es necesario (ej: nombre del abogado)
      // Por ahora usamos lo que viene en la cita
      
      // 2. Enviar Email
      await sendEmailReminder(data.clientEmail || data.email, {
        ...data,
        id: appointmentDoc.id
      });
      
      // 3. Marcar como enviado
      await updateDoc(doc(db, "appointments", appointmentDoc.id), {
        reminderSent: true,
        remindedAt: Timestamp.now()
      });
      
      console.log(`[Reminders] Recordatorio enviado exitosamente a ${data.clientEmail || data.email}`);
      
    } catch (error) {
      console.error(`[Reminders] Error en cita ${appointmentDoc.id}:`, error);
    }
  }
}

/**
 * Genera y envía el correo con formato premium.
 */
async function sendEmailReminder(email: string, appointment: any) {
  const dateStr = appointment.start.toDate().toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  
  const timeStr = appointment.start.toDate().toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4f46e5; font-size: 24px; font-weight: 800; margin: 0;">PORTAL 360</h1>
        <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 5px;">Recordatorio de Conferencia</p>
      </div>

      <div style="background-color: #f8fafc; padding: 30px; border-radius: 20px; margin-bottom: 30px;">
        <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">Hola,</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Te recordamos que tienes una conferencia programada en breve. Los detalles se muestran a continuación:
        </p>
        
        <div style="margin-top: 20px; border-left: 4px solid #4f46e5; padding-left: 15px;">
          <p style="margin: 0; font-size: 14px; font-weight: 800; color: #0f172a;">${appointment.title || 'Consulta Legal'}</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #64748b;">${dateStr} a las ${timeStr}</p>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/cliente" 
           style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 700;">
          Acceder al Portal
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 40px 0;">
      
      <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.5;">
        Este es un mensaje automático del Portal 360.<br>
        Por favor, asegúrate de estar en un lugar tranquilo y con buena conexión a internet.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: `🕒 Recordatorio: Tu cita es en menos de 2 horas`,
    html
  });
}
