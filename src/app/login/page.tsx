"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/firebase/audit";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      // Let AuthContext handle user role fetching, then middleware or effect handles redirection.
      // For MVP, simply redirect to /dashboard which handles routing.
      toast.success("Inicio de sesión exitoso");
      router.push("/dashboard");

      // Optional manual audit call since auth context change might be late
      logAuditAction(
        { 
          uid: userCred.user.uid, 
          role: 'cliente', 
          companyId: null, 
          email: userCred.user.email || '',
          displayName: userCred.user.displayName || "Usuario",
          department: null,
        }, 
        "LOGIN", 
        "auth", 
        userCred.user.uid, 
        {}
      );

    } catch (error: any) {
      toast.error("Error al iniciar sesión: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80">
              Acceso seguro al Portal 360
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-tight text-white">
              Ingresa a tu espacio jurídico, contable y tributario
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral-300">
              Un acceso centralizado para clientes, equipo interno y dirección ejecutiva. Desde aquí podrás revisar documentos,
              trámites, tickets, honorarios, alertas y el estado general de la operación.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-neutral-400">Clientes</p>
                <p className="mt-2 text-xl font-semibold">Seguimiento claro</p>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  Consulta documentos, trámites, impuestos estimados y soporte por departamento.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-neutral-400">Equipo interno</p>
                <p className="mt-2 text-xl font-semibold">Operación ordenada</p>
                <p className="mt-2 text-sm leading-6 text-neutral-300">
                  Gestiona tickets, tareas, documentos pendientes y reuniones desde un solo panel.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[32px] border border-white/10 bg-white/8 p-2 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[28px] bg-white p-8 text-neutral-950">
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-2xl bg-neutral-950 p-3 text-white">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Portal 360</p>
                  <p className="font-semibold">Jurídico • Contable • Tributario</p>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-semibold tracking-tight">Iniciar sesión</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Accede a tu cuenta para revisar el estado de tu empresa, solicitudes y documentos.
                </p>
              </div>

              <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Correo electrónico</label>
                  <Input 
                    type="email"
                    className="h-12 rounded-2xl border-neutral-200" 
                    placeholder="nombre@empresa.cl" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Contraseña</label>
                  <Input 
                    type="password" 
                    className="h-12 rounded-2xl border-neutral-200" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-neutral-600">
                    <input type="checkbox" className="rounded border-neutral-300" defaultChecked />
                    Mantener sesión iniciada
                  </label>
                  <button type="button" className="font-medium text-neutral-900 hover:underline">Recuperar acceso</button>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="h-12 w-full rounded-2xl bg-neutral-950 text-base text-white hover:bg-neutral-800"
                >
                  {loading ? "Ingresando..." : "Ingresar al portal"}
                </Button>

                <div className="relative py-2 text-center text-sm text-neutral-400">
                  <span className="bg-white px-3 relative z-10">Accesos directos (Demo)</span>
                  <div className="absolute left-0 right-0 top-1/2 -z-0 border-t border-neutral-200" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                  <button 
                    type="button" 
                    onClick={() => { setEmail("cliente@gmail.com"); setPassword("Abc12345"); }}
                    className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Llenar: Cliente
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setEmail("superadmin@gmail.com"); setPassword("superadmin123"); }}
                    className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Llenar: Super Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
