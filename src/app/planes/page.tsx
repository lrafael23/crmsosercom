"use client";

import Link from "next/link";
import { Check, Star, Zap, Shield } from "lucide-react";
import { PLANS_ARRAY, formatCLP, type Plan } from "@/lib/plans";

// ─── Features con íconos por plan ─────────────────────────────────────────────

function PlanCard({ plan }: { plan: Plan }) {
  const isHighlighted = plan.highlighted;

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${
        isHighlighted
          ? "bg-gradient-to-b from-emerald-600 to-emerald-800 text-white shadow-2xl shadow-emerald-500/30 scale-105 border-0"
          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-1"
      }`}
    >
      {isHighlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
            <Star className="w-3 h-3 fill-amber-900" />
            MÁS POPULAR
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
            isHighlighted
              ? "bg-white/20"
              : "bg-emerald-50 dark:bg-emerald-900/20"
          }`}
        >
          {plan.id === "basico" && <Zap className={`w-6 h-6 ${isHighlighted ? "text-white" : "text-emerald-600"}`} />}
          {plan.id === "full" && <Star className={`w-6 h-6 ${isHighlighted ? "text-white" : "text-emerald-600"}`} />}
          {plan.id === "premium" && <Shield className={`w-6 h-6 ${isHighlighted ? "text-white" : "text-emerald-600"}`} />}
        </div>
        <h3
          className={`text-2xl font-bold mb-1 ${
            isHighlighted ? "text-white" : "text-slate-900 dark:text-white"
          }`}
        >
          {plan.name}
        </h3>
        <p
          className={`text-sm ${
            isHighlighted ? "text-emerald-100" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {plan.tagline}
        </p>
      </div>

      {/* Precio */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span
            className={`text-4xl font-extrabold tracking-tight ${
              isHighlighted ? "text-white" : "text-slate-900 dark:text-white"
            }`}
          >
            {formatCLP(plan.priceCLP)}
          </span>
        </div>
        <p
          className={`text-sm mt-1 ${
            isHighlighted ? "text-emerald-200" : "text-slate-400"
          }`}
        >
          / mes · Pago mensual
        </p>
      </div>

      {/* Métricas clave */}
      <div
        className={`grid grid-cols-2 gap-3 p-4 rounded-xl mb-6 ${
          isHighlighted ? "bg-white/10" : "bg-slate-50 dark:bg-slate-800/50"
        }`}
      >
        <div className="text-center">
          <p
            className={`text-2xl font-bold ${
              isHighlighted ? "text-white" : "text-slate-900 dark:text-white"
            }`}
          >
            {plan.maxActiveCases === null ? "∞" : plan.maxActiveCases}
          </p>
          <p
            className={`text-xs mt-0.5 ${
              isHighlighted ? "text-emerald-200" : "text-slate-500"
            }`}
          >
            Causas activas
          </p>
        </div>
        <div className="text-center">
          <p
            className={`text-2xl font-bold ${
              isHighlighted ? "text-white" : "text-slate-900 dark:text-white"
            }`}
          >
            {plan.includedSeats}
          </p>
          <p
            className={`text-xs mt-0.5 ${
              isHighlighted ? "text-emerald-200" : "text-slate-500"
            }`}
          >
            {plan.allowExtraSeats ? "Usuarios (+extras)" : "Usuarios internos"}
          </p>
        </div>
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-8">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <div
              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                isHighlighted ? "bg-white/20" : "bg-emerald-100 dark:bg-emerald-900/30"
              }`}
            >
              <Check
                className={`w-3 h-3 font-bold ${
                  isHighlighted ? "text-white" : "text-emerald-600"
                }`}
              />
            </div>
            <span
              className={`text-sm leading-relaxed ${
                isHighlighted ? "text-emerald-50" : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link href={`/registro/estudio?plan=${plan.id}`}>
        <button
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
            isHighlighted
              ? "bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg"
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          }`}
        >
          Seleccionar {plan.name}
        </button>
      </Link>
    </div>
  );
}

// ─── Página Principal de Planes ───────────────────────────────────────────────

export default function PlanesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/10">
      {/* Header simple */}
      <header className="border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Portal <span className="text-emerald-600">360</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 tracking-widest uppercase">
              Sosercom SaaS
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 font-medium transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/registro/cliente"
              className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Soy cliente final
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-16 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-emerald-200 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Planes para Estudios Jurídicos
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
          Elige el plan que{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
            impulsa tu estudio
          </span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Gestiona causas, clientes, equipo y pagos desde una sola plataforma.
          Cancela cuando quieras, sin contratos de permanencia.
        </p>
      </section>

      {/* Tarjetas de Planes */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {PLANS_ARRAY.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* Nota comparative */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Todos los planes incluyen: acceso ilimitado al Portal del Cliente,
            timeline de causas, gestión de documentos y soporte por ticket.
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            Precios en CLP (Pesos Chilenos) · IVA no incluido · Prueba 14 días gratis
          </p>
        </div>

        {/* Sección de cliente final */}
        <div className="mt-12 p-8 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-center max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-2">
            ¿Buscas servicios jurídicos como persona particular?
          </h2>
          <p className="text-slate-300 text-sm mb-6">
            Si necesitas asesoría jurídica, contable o tributaria directamente con Sosercom,
            el registro como cliente final es gratuito.
          </p>
          <Link
            href="/registro/cliente"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Registrarme como cliente particular
          </Link>
        </div>
      </section>
    </div>
  );
}
