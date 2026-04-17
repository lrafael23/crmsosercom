"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  CreditCard,
  User,
  AlertCircle,
  Loader2,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  format, 
  addDays, 
  startOfDay, 
  isSameDay, 
  eachDayOfInterval, 
  addMonths,
  isBefore,
  isEqual
} from "date-fns";
import { es } from "date-fns/locale";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth/AuthContext";
import { generateSlots, filterAvailableSlots, DEFAULT_AVAILABILITY } from "@/lib/availability";

// ─── Configuración ─────────────────────────────────────────────────────────────
const CONSULTATION_PRICE = 25000;
const DEFAULT_MEET_LINK =
  process.env.NEXT_PUBLIC_DEFAULT_MEET_LINK || "https://meet.google.com/nyz-vuxh-xmu";

export default function AgendarClientePage() {
  const { lawyerId } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [lawyer, setLawyer] = useState<any>(null);
  const [availability, setAvailability] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState<"calendar" | "confirm" | "success">("calendar");
  
  const [isExistingClient, setIsExistingClient] = useState(false);
  const [planUsage, setPlanUsage] = useState<any>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [lawyerContact, setLawyerContact] = useState<{ email?: string; whatsapp?: string }>({});

  // 1. Cargar datos del abogado y su disponibilidad
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const lawyerRef = doc(db, "users", lawyerId as string);
        const lSnap = await getDoc(lawyerRef);
        const lawyerData = lSnap.data();
        if (lSnap.exists()) setLawyer(lawyerData);

        const settingsRef = doc(db, "lawyer_settings", lawyerId as string);
        const sSnap = await getDoc(settingsRef);
        setAvailability(sSnap.exists() ? sSnap.data().availability : DEFAULT_AVAILABILITY);

        if (lawyerData?.tenantId) {
          // 1. Verificar si es cliente existente
          const casesQ = query(
            collection(db, "cases"),
            where("tenantId", "==", lawyerData.tenantId),
            where("clientId", "==", user.uid),
            where("status", "==", "active")
          );
          const casesSnap = await getDocs(casesQ);
          setIsExistingClient(!casesSnap.empty);

          // 2. Verificar uso del plan y contacto
          const usageRef = doc(collection(db, "tenant_plan_usage"), lawyerData.tenantId);
          const uSnap = await getDoc(usageRef);
          if (uSnap.exists()) {
            const usageData = uSnap.data();
            setPlanUsage(usageData);
            
            // Validar cuota
            const planRef = doc(collection(db, "mp_subscription_plans"), usageData.planId); // O usar PLANS local
            const planLimit = usageData.planId === 'basico' ? 5 : usageData.planId === 'full' ? 25 : null;
            if (planLimit !== null && usageData.monthlyConferences >= planLimit) {
              setIsQuotaExceeded(true);
            }
          }

          // 3. Obtener contacto de lawyer_settings
          if (sSnap.exists()) {
            const sData = sSnap.data();
            setLawyerContact({
              email: lawyerData.email,
              whatsapp: sData.whatsapp || lawyerData.phone
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setUsageLoading(false);
      }
    }
    loadData();
  }, [lawyerId, user]);

  // 2. Calcular slots disponibles cuando cambia la fecha o disponibilidad
  useEffect(() => {
    if (!availability || !selectedDate) return;

    async function calculateSlots() {
      const dayKey = format(selectedDate, "eee", { locale: es }).toLowerCase().substring(0, 3)
        .replace("mié", "wed").replace("jue", "thu").replace("vie", "fri")
        .replace("sáb", "sat").replace("dom", "sun").replace("lun", "mon").replace("mar", "tue");
      
      const dayConfig = availability[dayKey];
      if (!dayConfig || !dayConfig.enabled) {
        setAvailableSlots([]);
        return;
      }

      // Generar todos los slots posibles (45 min)
      const allPossible = dayConfig.slots.flatMap((range: any) => 
        generateSlots(range.start, range.end, 45)
      );

      // Fetch citas existentes para este abogado en este día
      const q = query(
        collection(db, "appointments"),
        where("lawyerId", "==", lawyerId),
        where("start", ">=", startOfDay(selectedDate)),
        where("start", "<", addDays(startOfDay(selectedDate), 1))
      );
      const snap = await getDocs(q);
      const existing = snap.docs.map(d => ({
        date: d.data().start.toDate(),
        time: format(d.data().start.toDate(), "HH:mm")
      }));

      const filtered = filterAvailableSlots(selectedDate, allPossible, existing);
      setAvailableSlots(filtered);
    }

    calculateSlots();
  }, [selectedDate, availability, lawyerId]);

  // 3. Manejar Reserva
  const handleBooking = async () => {
    if (!selectedSlot || !user) return;
    setBooking(true);

    try {
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      const startDate = new Date(selectedDate);
      startDate.setHours(hours, minutes, 0, 0);

      // 1. Crear entrada en appointments con status inicial 'pending'
      const aptData = {
        title: `Conferencia: ${user.displayName || user.email}`,
        titulo: `Conferencia: ${user.displayName || user.email}`,
        lawyerId,
        clientId: user.uid,
        tenantId: lawyer.tenantId,
        start: startDate,
        end: new Date(startDate.getTime() + 45 * 60 * 1000), // 45 min
        fecha: format(startDate, "yyyy-MM-dd"),
        hora: selectedSlot,
        status: isExistingClient ? "confirmed" : "pending_payment", 
        type: "meeting",
        tipo: "Videollamada",
        source: "local",
        location: DEFAULT_MEET_LINK,
        meetingUrl: DEFAULT_MEET_LINK,
        createdAt: new Date(),
        needsReminder: true,
        reminderSent: false
      };

      const docRef = await addDoc(collection(db, "appointments"), aptData);
      const appointmentId = docRef.id;

      if (isExistingClient) {
        setStep("success");
      } else {
        const paymentRes = await fetch("/api/mp/consultation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            lawyerId,
            appointmentId,
            price: CONSULTATION_PRICE,
          }),
        });

        if (!paymentRes.ok) {
          const errData = await paymentRes.json();
          throw new Error(errData.error || "No se pudo crear el pago de la consulta");
        }

        const paymentData = await paymentRes.json();
        if (paymentData.initPoint) {
          window.location.href = paymentData.initPoint;
          return;
        }

        setStep("success");
      }

    } catch (err) {
      console.error(err);
      alert("Error al procesar la reserva. Intenta de nuevo.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  );

  const nextDays = eachDayOfInterval({
    start: addDays(new Date(), 1), // Mínimo 24h
    end: addDays(new Date(), 15)
  });

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen bg-slate-50 dark:bg-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 h-full">
          {/* Info del Abogado */}
          <div className="md:col-span-2 bg-slate-900 p-10 text-white flex flex-col justify-between">
            <div>
              <div className="w-20 h-20 bg-emerald-500 rounded-3xl mb-6 flex items-center justify-center text-3xl font-black">
                {lawyer?.displayName?.[0] || "A"}
              </div>
              <h1 className="text-3xl font-black tracking-tighter mb-2">
                Agendar con <span className="text-emerald-400">{lawyer?.displayName?.split(" ")[0]}</span>
              </h1>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                Selecciona una fecha y hora para tu conferencia telemática. Recuerda que coordinamos con 24h de anticipación para asegurar calidad en el servicio.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm font-bold opacity-80">
                   <Clock className="w-4 h-4 text-emerald-400" /> 45 Minutos de Sesión
                </div>
                <div className="flex items-center gap-3 text-sm font-bold opacity-80">
                   <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Google Meet Incluido
                </div>
              </div>
            </div>

            <div className="mt-20 pt-10 border-t border-white/10">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">
                 {isExistingClient ? "Beneficio Cliente Activo" : "Tarifa Piloto"}
               </p>
               <h3 className="text-2xl font-black">
                 {isExistingClient ? "Gratis" : `$${CONSULTATION_PRICE.toLocaleString("es-CL")}`}
                 {!isExistingClient && <span className="text-sm font-medium text-slate-500"> / sesión</span>}
               </h3>
            </div>
          </div>

          {/* Agenda / Calendario */}
          <div className="md:col-span-3 p-10">
            {isQuotaExceeded ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-[32px] flex items-center justify-center mb-8">
                  <AlertCircle className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Límite Mensual Alcanzado</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                  Lo sentimos, el abogado ha alcanzado su límite de agendamientos mensuales para este periodo. 
                  Para coordinar tu cita, por favor contáctalo directamente.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-sm">
                  {lawyer?.email && (
                    <a href={`mailto:${lawyer.email}`} className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm hover:border-emerald-500 transition-all">
                      Enviar Email
                    </a>
                  )}
                  {lawyerContact.whatsapp && (
                    <a href={`https://wa.me/${lawyerContact.whatsapp.replace(/\D/g, "")}`} target="_blank" className="flex items-center justify-center gap-2 p-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all">
                      WhatsApp
                    </a>
                  )}
                </div>
                <button onClick={() => router.push("/cliente")} className="mt-8 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Volver al Panel</button>
              </motion.div>
            ) : step === "calendar" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Paso 1: ¿Cuándo?</h3>
                
                {/* Selector de Fecha */}
                <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                  {nextDays.map(date => (
                    <button
                      key={date.toString()}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 w-24 p-4 rounded-2xl border transition-all flex flex-col items-center gap-1 ${
                        isSameDay(date, selectedDate)
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-emerald-500/50"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">{format(date, "eee", { locale: es })}</span>
                      <span className="text-xl font-black">{format(date, "d")}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-8 flex-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Horas Disponibles</p>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-4 rounded-2xl border font-bold text-sm transition-all ${
                            selectedSlot === slot
                            ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[32px]">
                      <AlertCircle className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400 italic">No hay horarios para este día.</p>
                    </div>
                  )}
                </div>

                <button 
                  disabled={!selectedSlot}
                  onClick={() => setStep("confirm")}
                  className="w-full mt-10 py-5 bg-emerald-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
                >
                  Continuar <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col justify-center">
                <div className="text-center mb-10">
                   <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                      <CreditCard className="w-10 h-10 text-emerald-600" />
                   </div>
                   <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Resumen de Reserva</h2>
                   <p className="text-sm font-medium text-slate-500">Confirma los detalles antes de agendar</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4 mb-10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hora</span>
                    <span className="font-black text-slate-800 dark:text-slate-200 text-xl">{selectedSlot}</span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-800" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
                    <span className="font-black text-emerald-600 text-2xl">
                      {isExistingClient ? "GRATIS" : `$${CONSULTATION_PRICE.toLocaleString("es-CL")}`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleBooking}
                    className="w-full py-5 bg-slate-900 dark:bg-emerald-600 text-white font-black rounded-2xl shadow-xl transition-all"
                  >
                    {booking ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isExistingClient ? "Confirmar Reserva" : "Pagar y Agendar Ahora")}
                  </button>
                  <button onClick={() => setStep("calendar")} className="text-xs font-black text-slate-400 uppercase tracking-widest py-3">Volver al calendario</button>
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center">
                 <div className="w-24 h-24 bg-emerald-500 rounded-[40px] flex items-center justify-center text-white mb-8 shadow-2xl shadow-emerald-500/40">
                    <CheckCircle2 className="w-12 h-12" />
                 </div>
                 <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">¡Cita Confirmada!</h2>
                 <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 px-10">
                   Hemos reservado tu espacio para el <span className="font-black text-slate-900 dark:text-white">{format(selectedDate, "d 'de' MMMM", { locale: es })}</span> a las <span className="font-black text-slate-900 dark:text-white">{selectedSlot}</span>. 
                   Usaremos el enlace seguro de Google Meet de Sosercom.
                 </p>
                 <a
                  href={DEFAULT_MEET_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-5 px-8 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest"
                 >
                   Abrir Google Meet
                 </a>
                 <button 
                  onClick={() => router.push("/cliente")}
                  className="px-10 py-4 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-2xl shadow-xl"
                 >
                   Regresar a mi Panel
                 </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
