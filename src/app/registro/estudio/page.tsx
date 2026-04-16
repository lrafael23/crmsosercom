"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { PLANS, PLANS_ARRAY, formatCLP, type PlanId } from "@/lib/plans";
import { setAuthCookies } from "@/lib/auth/session";
import { ArrowLeft, ArrowRight, Building2, User, CreditCard, CheckCircle2, Loader2 } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface RegistroData {
  // Paso 1: Datos personales
  nombreAbogado: string;
  email: string;
  password: string;
  telefono: string;
  // Paso 2: Datos del estudio
  nombreEstudio: string;
  rut: string;
  ciudad: string;
  direccion: string;
  // Paso 3: Plan seleccionado
  planId: PlanId;
  aceptaTerminos: boolean;
}

const INITIAL_DATA: RegistroData = {
  nombreAbogado: "",
  email: "",
  password: "",
  telefono: "",
  nombreEstudio: "",
  rut: "",
  ciudad: "",
  direccion: "",
  planId: "basico",
  aceptaTerminos: false,
};

// ─── Indicador de pasos ───────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { label: "Tus Datos", icon: <User className="w-4 h-4" /> },
    { label: "Tu Estudio", icon: <Building2 className="w-4 h-4" /> },
    { label: "Plan", icon: <CreditCard className="w-4 h-4" /> },
    { label: "Confirmar", icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        return (
          <div key={idx} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isDone
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : isActive
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-400 dark:bg-slate-800"
              }`}
            >
              {step.icon}
              <span className="hidden sm:block">{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  isDone ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Campo de formulario ──────────────────────────────────────────────────────

function Field({
  label,
  type = "text",
  value,
  onChange,
  required = true,
  placeholder = "",
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
      />
    </div>
  );
}

// ─── Paso 1: Datos Personales ─────────────────────────────────────────────────

function Paso1({ data, update }: { data: RegistroData; update: (d: Partial<RegistroData>) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Datos del Responsable
      </h2>
      <Field
        label="Nombre completo"
        value={data.nombreAbogado}
        onChange={(v) => update({ nombreAbogado: v })}
        placeholder="Ej: Juan Pérez Rodríguez"
      />
      <Field
        label="Correo electrónico"
        type="email"
        value={data.email}
        onChange={(v) => update({ email: v })}
        placeholder="juan@miestudio.cl"
      />
      <Field
        label="Contraseña"
        type="password"
        value={data.password}
        onChange={(v) => update({ password: v })}
        placeholder="Mínimo 8 caracteres"
      />
      <Field
        label="Teléfono"
        type="tel"
        value={data.telefono}
        onChange={(v) => update({ telefono: v })}
        placeholder="+56 9 XXXX XXXX"
      />
    </div>
  );
}

// ─── Paso 2: Datos del Estudio ────────────────────────────────────────────────

function Paso2({ data, update }: { data: RegistroData; update: (d: Partial<RegistroData>) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Datos del Estudio Jurídico
      </h2>
      <Field
        label="Nombre del estudio o marca"
        value={data.nombreEstudio}
        onChange={(v) => update({ nombreEstudio: v })}
        placeholder="Ej: Estudio Jurídico Pérez & Asociados"
      />
      <Field
        label="RUT del estudio o persona natural"
        value={data.rut}
        onChange={(v) => update({ rut: v })}
        placeholder="12.345.678-9"
      />
      <Field
        label="Ciudad"
        value={data.ciudad}
        onChange={(v) => update({ ciudad: v })}
        placeholder="Santiago"
      />
      <Field
        label="Dirección"
        value={data.direccion}
        onChange={(v) => update({ direccion: v })}
        placeholder="Av. Providencia 1234, Oficina 56"
        required={false}
      />
    </div>
  );
}

// ─── Paso 3: Selección de Plan ────────────────────────────────────────────────

function Paso3({ data, update }: { data: RegistroData; update: (d: Partial<RegistroData>) => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Selecciona tu Plan
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {PLANS_ARRAY.map((plan) => {
          const selected = data.planId === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => update({ planId: plan.id })}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                selected
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{plan.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {plan.maxActiveCases === null ? "∞" : plan.maxActiveCases} causas ·{" "}
                    {plan.includedSeats} usuarios
                    {plan.allowExtraSeats && " (+extras)"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCLP(plan.priceCLP)}
                  </p>
                  <p className="text-xs text-slate-400">/mes</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.aceptaTerminos}
            onChange={(e) => update({ aceptaTerminos: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Acepto los{" "}
            <a href="#" className="text-emerald-600 underline hover:no-underline">
              Términos y Condiciones
            </a>{" "}
            y la{" "}
            <a href="#" className="text-emerald-600 underline hover:no-underline">
              Política de Privacidad
            </a>{" "}
            de Portal 360.
          </span>
        </label>
      </div>
    </div>
  );
}

// ─── Paso 4: Confirmación y Pago ──────────────────────────────────────────────

function Paso4({ data }: { data: RegistroData }) {
  const plan = PLANS[data.planId];
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Confirma tu Registro
      </h2>
      <div className="space-y-4 mb-8">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Responsable</p>
          <p className="font-medium text-slate-900 dark:text-white">{data.nombreAbogado}</p>
          <p className="text-sm text-slate-500">{data.email}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estudio</p>
          <p className="font-medium text-slate-900 dark:text-white">{data.nombreEstudio}</p>
          <p className="text-sm text-slate-500">{data.rut} · {data.ciudad}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Plan Seleccionado</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{plan.name}</p>
              <p className="text-xs text-slate-500">
                {plan.maxActiveCases === null ? "Ilimitadas" : plan.maxActiveCases} causas ·{" "}
                {plan.includedSeats} usuarios
              </p>
            </div>
            <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {formatCLP(plan.priceCLP)}<span className="text-sm font-medium text-slate-400">/mes</span>
            </p>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-400 text-center leading-relaxed">
        Al continuar, crearemos tu cuenta y te redirigiremos al proceso de pago
        de Mercado Pago para activar tu suscripción de forma segura.
      </p>
    </div>
  );
}

// ─── Contenido de Registro (requiere Suspense) ───────────────────────────────

function RegistroEstudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<RegistroData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-seleccionar plan desde la URL (?plan=full)
  useEffect(() => {
    const planParam = searchParams.get("plan") as PlanId | null;
    if (planParam && PLANS[planParam]) {
      setData((d) => ({ ...d, planId: planParam }));
    }
  }, [searchParams]);

  const update = (partial: Partial<RegistroData>) => {
    setData((d) => ({ ...d, ...partial }));
    setError(null);
  };

  // Validación por paso
  const validateStep = (): boolean => {
    if (step === 1) {
      if (!data.nombreAbogado || !data.email || data.password.length < 8 || !data.telefono) {
        setError("Completa todos los campos. La contraseña debe tener al menos 8 caracteres.");
        return false;
      }
    }
    if (step === 2) {
      if (!data.nombreEstudio || !data.rut || !data.ciudad) {
        setError("Completa los datos del estudio.");
        return false;
      }
    }
    if (step === 3) {
      if (!data.aceptaTerminos) {
        setError("Debes aceptar los Términos y Condiciones.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  // ─── Envío final ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Crear usuario en Firebase Auth
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const { user } = credential;

      // 2. Crear tenant en Firestore
      const tenantRef = doc(collection(db, "tenants"));
      const tenantId = tenantRef.id;

      await setDoc(tenantRef, {
        id: tenantId,
        nombreEstudio: data.nombreEstudio,
        rut: data.rut,
        ciudad: data.ciudad,
        direccion: data.direccion,
        ownerUid: user.uid,
        ownerEmail: data.email,
        ownerNombre: data.nombreAbogado,
        telefono: data.telefono,
        planId: data.planId,
        subscriptionStatus: "pending",
        mpPreapprovalId: null,
        nextBillingDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. Crear perfil de usuario en Firestore (owner_firm)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: data.email,
        displayName: data.nombreAbogado,
        role: "owner_firm",
        status: "active",
        tenantId: tenantId,
        companyId: null,
        department: null,
        planId: data.planId,
        subscriptionStatus: "pending",
        telefono: data.telefono,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 4. Crear orden de suscripción pendiente
      await addDoc(collection(db, "payment_orders"), {
        type: "subscription",
        tenantId,
        planId: data.planId,
        createdBy: user.uid,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Sincronizar cookies inmediatamente
      setAuthCookies("owner_firm");

      // 5. Redirigir al checkout de Mercado Pago
      router.push(`/checkout/${data.planId}?tenantId=${tenantId}`);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado. ¿Querés iniciar sesión?");
      } else if (firebaseError.code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError("Ocurrió un error al crear la cuenta. Inténtalo nuevamente.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="w-full max-w-lg mb-8 flex items-center justify-between">
        <Link href="/planes" className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Ver planes
        </Link>
        <Link href="/" className="flex flex-col items-end">
          <span className="text-base font-bold text-slate-900 dark:text-white">
            Portal <span className="text-emerald-600">360</span>
          </span>
        </Link>
      </div>

      {/* Card principal */}
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800">
        <StepIndicator currentStep={step} />

        {/* Contenido del paso actual */}
        {step === 1 && <Paso1 data={data} update={update} />}
        {step === 2 && <Paso2 data={data} update={update} />}
        {step === 3 && <Paso3 data={data} update={update} />}
        {step === 4 && <Paso4 data={data} />}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Atrás
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm disabled:opacity-70 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  Continuar al Pago
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-slate-400 text-center">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
          Iniciar Sesión
        </Link>
      </p>
    </div>
  );
}

// ─── Página exportada con Suspense ────────────────────────────────────────────

export default function RegistroEstudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      }
    >
      <RegistroEstudioContent />
    </Suspense>
  );
}
