"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, ArrowRight, Loader2 } from "lucide-react";

// ─── Componente interno que usa useSearchParams ────────────────────────────────

function ResultadoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");

  useEffect(() => {
    if (status === "approved") {
      const timer = setTimeout(() => {
        router.push("/firm");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  const config = {
    approved: {
      icon: <CheckCircle2 className="w-16 h-16 text-emerald-500" />,
      title: "¡Pago Aprobado!",
      subtitle: "Tu suscripción está siendo activada.",
      message:
        "Recibirás un correo de confirmación en breve. Serás redirigido a tu panel en 5 segundos.",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      cta: { label: "Ir a mi Panel", href: "/firm" },
    },
    rejected: {
      icon: <XCircle className="w-16 h-16 text-red-500" />,
      title: "Pago Rechazado",
      subtitle: "No se pudo procesar tu pago.",
      message:
        "Verifica los datos de tu tarjeta e inténtalo nuevamente. Si el problema persiste, contáctanos.",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800",
      cta: { label: "Reintentar", href: `/checkout/${plan ?? "basico"}` },
    },
    pending: {
      icon: <Clock className="w-16 h-16 text-amber-500" />,
      title: "Pago Pendiente",
      subtitle: "Tu pago está siendo procesado.",
      message:
        "Mercado Pago está verificando tu pago. Recibirás una notificación cuando sea confirmado. Puedes acceder a tu panel en modo limitado.",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-200 dark:border-amber-800",
      cta: { label: "Ir a mi Panel", href: "/firm" },
    },
  } as const;

  const current = config[(status as keyof typeof config) ?? "pending"] ?? config.pending;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className={`${current.bgColor} ${current.borderColor} border rounded-2xl p-10 text-center`}>
          <div className="flex justify-center mb-6">{current.icon}</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {current.title}
          </h1>
          <p className="font-medium text-slate-600 dark:text-slate-300 mb-4">{current.subtitle}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            {current.message}
          </p>
          <Link
            href={current.cta.href}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            {current.cta.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">
          ¿Problemas?{" "}
          <Link href="/cliente/soporte" className="text-emerald-600 hover:underline">
            Contactar soporte
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Página de resultado con Suspense boundary ────────────────────────────────

export default function ResultadoPagoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      }
    >
      <ResultadoContent />
    </Suspense>
  );
}
