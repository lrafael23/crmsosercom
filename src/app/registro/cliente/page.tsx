"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { setAuthCookies } from "@/lib/auth/session";
import { ArrowLeft, User, Mail, Lock, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function RegistroClientePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Crear usuario en Firebase Auth
      const credential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const { user } = credential;

      // 2. Actualizar perfil
      await updateProfile(user, { displayName: formData.nombre });

      // 3. Crear documento de usuario (rol: cliente_final)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: formData.email,
        displayName: formData.nombre,
        role: "cliente_final",
        status: "active",
        tenantId: null,
        companyId: null,
        department: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("¡Cuenta creada exitosamente!");

      // 4. Sincronizar cookies inmediatamente
      setAuthCookies("cliente_final");

      // 5. Redirigir al portal del cliente
      router.push("/cliente");
    } catch (err: any) {
      console.error("Error en registro de cliente:", err);
      if (err.code === "auth/email-already-in-use") {
        toast.error("Este correo ya está registrado.");
      } else {
        toast.error("Ocurrió un error al crear tu cuenta.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex items-center justify-between">
          <Link href="/planes" className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            Portal <span className="text-emerald-600">360</span>
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-8 border border-slate-200 dark:border-slate-800">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Crear Cuenta de Cliente
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Regístrate para gestionar tus causas y comunicarte con tu abogado.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: María González"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  Registrarme Ahora
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-emerald-600 font-bold hover:underline">
              Inicia Sesión
            </Link>
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-6 opacity-40">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
             <CheckCircle2 className="w-3 h-3" />
             CONEXIÓN SEGURA
           </div>
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
             <CheckCircle2 className="w-3 h-3" />
             DATOS ENCRIPTADOS
           </div>
        </div>
      </motion.div>
    </div>
  );
}
