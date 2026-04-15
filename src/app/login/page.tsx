"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth, getDefaultRouteForRole, resolveAppUserFromAuth } from "@/lib/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Mail, ArrowRight, Scale, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const appUser = await resolveAppUserFromAuth(userCredential.user.uid, userCredential.user.email, userCredential.user.displayName);
      
      if (!appUser) {
        toast.error("Tu perfil no está configurado correctamente. Contacta a soporte.");
        setIsLoading(false);
        return;
      }

      toast.success(`Bienvenido, ${appUser.displayName || "Usuario"}`);
      router.replace(getDefaultRouteForRole(appUser.role));
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === "auth/invalid-credential") {
        toast.error("Credenciales incorrectas. Verifica tu email y contraseña.");
      } else if (error.code === "auth/network-request-failed") {
        toast.error("Error de red. Verifica tu conexión a internet.");
      } else {
        toast.error("Ocurrió un error al intentar iniciar sesión.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white overflow-hidden">
      {/* Lado Izquierdo: Formulario */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-20 z-10 bg-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="flex flex-col items-start gap-2">
            <Link href="/" className="flex items-center gap-2 group mb-4">
               <div className="bg-emerald-600 p-2 rounded-xl text-white group-hover:scale-110 transition-transform">
                <Scale className="w-6 h-6" />
               </div>
               <span className="text-xl font-bold tracking-tight text-slate-900">Portal 360</span>
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Bienvenido de nuevo
            </h1>
            <p className="text-slate-500">
              Ingresa tus credenciales corporativas para acceder al panel.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all ring-offset-0 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Button variant="link" className="text-xs text-emerald-600 px-0 h-auto">
                    ¿Olvidaste tu contraseña?
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all ring-offset-0 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Autenticando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Ingresar al sistema
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              ¿No tienes una cuenta?{" "}
              <Link href="/planes" className="text-emerald-600 font-bold hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </motion.div>

        <div className="mt-20 flex items-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
          {/* Logo Placeholders for Trust */}
          <div className="text-xs font-bold text-slate-400 tracking-widest uppercase">Seguridad SSL 256-bit</div>
          <div className="text-xs font-bold text-slate-400 tracking-widest uppercase">Cloud Secured</div>
        </div>
      </div>

      {/* Lado Derecho: Visual/Marketing */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,_rgba(16,185,129,0.15),_transparent_40%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(59,130,246,0.1),_transparent_40%)]"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-20">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest">
              <Shield className="w-3 h-3" />
              Acceso Restringido y Auditado
            </div>
            
            <h2 className="text-5xl font-black text-white leading-tight">
              Ecosistema Digital <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Legal y Tributario.
              </span>
            </h2>
            
            <div className="space-y-6">
              {[
                "Seguimiento de causas en tiempo real",
                "Gestión documental con validez jurídica",
                "Cálculos tributarios y reportes ejecutivos",
                "Comunicación directa con tu equipo experto"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-lg">{text}</span>
                </div>
              ))}
            </div>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm shadow-2xl mt-10">
              <CardContent className="p-6">
                <blockquote className="text-slate-400 italic">
                  "Portal 360 ha transformado la manera en que gestionamos nuestras obligaciones tributarias, dándonos claridad y seguridad en cada paso."
                </blockquote>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-white text-xs">
                    JD
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Juan Delgado</p>
                    <p className="text-xs text-slate-500">Gerente de Finanzas, Tech Corp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Floating Decorative Elements */}
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl"
        />
      </div>
    </div>
  );
}
