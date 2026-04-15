"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { PLANS, formatCLP, type PlanId } from "@/lib/plans";
import { Shield, Lock, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

// ─── Inicializar MP con PUBLIC KEY (solo frontend) ────────────────────────────

let mpInitialized = false;

function ensureMPInit() {
  if (!mpInitialized) {
    const pubKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
    if (pubKey && pubKey !== "TEST-REPLACE-WITH-YOUR-PUBLIC-KEY") {
      initMercadoPago(pubKey, { locale: "es-CL" });
      mpInitialized = true;
    }
  }
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const planId = params.planId as PlanId;
  const tenantId = searchParams.get("tenantId");

  const plan = planId ? PLANS[planId] : null;

  const [preferenceData, setPreferenceData] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mpReady, setMpReady] = useState(false);

  // Inicializar MP y crear preferencia en backend
  useEffect(() => {
    if (!plan || !tenantId) {
      setError("Parámetros de checkout inválidos.");
      setLoading(false);
      return;
    }

    ensureMPInit();
    setMpReady(mpInitialized);

    // Crear preferencia de suscripción en backend
    async function createPreference() {
      try {
        const res = await fetch("/api/mp/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, tenantId }),
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? "Error al crear la preferencia de pago.");
        }

        const data = await res.json();
        setPreferenceData({ id: data.preferenceId });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error desconocido.");
      } finally {
        setLoading(false);
      }
    }

    createPreference();
  }, [planId, tenantId, plan]);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Plan no encontrado.</p>
          <Link href="/planes" className="text-emerald-600 font-semibold mt-4 block">
            Ver todos los planes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/registro/estudio"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>Pago 100% seguro · Mercado Pago</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Resumen del plan */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Resumen de tu Suscripción
          </h1>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Plan</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</p>
                <p className="text-sm text-slate-500">{plan.tagline}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                  {formatCLP(plan.priceCLP)}
                </p>
                <p className="text-xs text-slate-400">/mes</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                `Hasta ${plan.maxActiveCases === null ? "ilimitadas" : plan.maxActiveCases} causas activas`,
                `${plan.includedSeats} usuarios internos incluidos`,
                "Portal del cliente final",
                "Timeline de causas",
                "Gestión documental",
                "Soporte por ticket",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Garantías */}
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <Shield className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Prueba 14 días sin cargo
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Cancela cuando quieras, sin contratos ni penalidades.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de pago */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Método de Pago
          </h2>

          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-sm text-slate-500">Preparando el formulario de pago...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              <p className="text-xs text-red-500 mt-2">
                Asegúrate de configurar{" "}
                <code className="font-mono">NEXT_PUBLIC_MP_PUBLIC_KEY</code> y{" "}
                <code className="font-mono">MP_ACCESS_TOKEN</code> en tus variables de entorno.
              </p>
              <Link
                href="/planes"
                className="block mt-4 text-sm text-emerald-600 font-semibold hover:underline"
              >
                ← Volver a los planes
              </Link>
            </div>
          )}

          {!loading && !error && mpReady && preferenceData && (
            <div id="mp-payment-brick" className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
              <Payment
                initialization={{
                  amount: plan.priceCLP,
                  preferenceId: preferenceData.id,
                }}
                customization={{
                  paymentMethods: {
                    creditCard: "all",
                    debitCard: "all",
                  },
                  visual: {
                    style: {
                      theme: "flat",
                    },
                  },
                }}
                onSubmit={async ({ selectedPaymentMethod, formData }) => {
                  console.log("Payment submitted:", selectedPaymentMethod, formData);
                  router.push(`/pago/resultado?status=pending&plan=${planId}`);
                }}
                onError={(error) => {
                  console.error("MP Payment error:", error);
                  setError("Error en el proceso de pago. Inténtalo nuevamente.");
                }}
              />
            </div>
          )}

          {!loading && !error && !mpReady && (
            <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                🔧 Mercado Pago no está configurado
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
                Configura las variables de entorno para habilitar el checkout real:
              </p>
              <pre className="text-xs bg-amber-100 dark:bg-amber-900/40 p-3 rounded-lg font-mono text-amber-900 dark:text-amber-200 overflow-auto">
{`NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-...
MP_ACCESS_TOKEN=TEST-...`}
              </pre>
              <p className="text-xs text-amber-600 mt-4">
                Por ahora, tu cuenta fue creada correctamente.{" "}
                <button
                  onClick={() => router.push("/firm")}
                  className="font-semibold underline"
                >
                  Ir al panel sin suscripción
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
