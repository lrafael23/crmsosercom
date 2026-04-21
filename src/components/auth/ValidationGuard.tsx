"use client";

import { Clock3, ShieldAlert, ShieldX } from "lucide-react";

import { useAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pendingSteps = [
  "Registro recibido y vinculado a la estructura del tenant.",
  "Verificacion jerarquica por Sosercom o por el responsable principal del estudio.",
  "Habilitacion final de accesos, menus y operaciones delegadas.",
];

export function ValidationGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, isImpersonating, realUser } = useAuth();

  if (loading || !user) {
    return null;
  }

  if (user.status === "active" || (isImpersonating && realUser?.role === "super_admin_global")) {
    return <>{children}</>;
  }

  const isPending = user.status === "pending_validation";
  const title = isPending ? "Tu cuenta esta en validacion" : "Tu cuenta esta suspendida";
  const description = isPending
    ? user.role === "cliente"
      ? "Tu acceso fue registrado dentro del tenant de tu estudio o equipo responsable. Antes de habilitar el panel, Sosercom y la jefatura correspondiente deben validar tu alta."
      : "Tu acceso fue registrado dentro de la estructura multi-tenant. Sosercom valida desde la capa superior y luego habilita la operacion delegada del estudio y su equipo."
    : "La cuenta existe, pero su operacion esta detenida. Solo Sosercom o el administrador principal del tenant pueden rehabilitar el acceso segun el caso.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-10">
      <Card className="w-full max-w-3xl border-slate-200/80 bg-white/90 shadow-xl backdrop-blur">
        <CardHeader className="space-y-4 border-b border-slate-100 pb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            {isPending ? <ShieldAlert className="h-8 w-8" /> : <ShieldX className="h-8 w-8" />}
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">{title}</CardTitle>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-center gap-3 text-slate-900">
              <Clock3 className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-semibold">Estado del acceso</h2>
            </div>

            {isPending ? (
              <div className="space-y-3">
                {pendingSteps.map((step, index) => (
                  <div key={step} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{step}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
                Mientras la suspension siga activa, el sistema mantiene bloqueado el acceso a paneles, documentos y operaciones.
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-3xl border border-slate-200 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Identidad</p>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Rol</p>
                  <p className="mt-1 font-medium">{user.role}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Tenant</p>
                  <p className="mt-1 font-medium">{user.tenantId ?? "Pendiente de asignacion"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Estado</p>
                  <p className="mt-1 font-medium">{user.status}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
              Si tu cuenta pertenece a un estudio juridico, la activacion final puede depender de la validacion superior y de la asignacion interna de tu equipo.
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await logout();
                window.location.href = "/login";
              }}
            >
              Cerrar sesion
            </Button>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
