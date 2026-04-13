"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getDefaultRouteForRole, resolveAppUserFromAuth } from "@/lib/auth/AuthContext";
import { auth } from "@/lib/firebase/client";
import { logAuditAction } from "@/lib/firebase/audit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      const appUser = await resolveAppUserFromAuth(
        userCred.user.uid,
        userCred.user.email,
        userCred.user.displayName,
      );

      if (!appUser) {
        await auth.signOut();
        toast.error("Tu cuenta no tiene perfil habilitado en la plataforma");
        return;
      }

      await logAuditAction(appUser, "LOGIN", "auth", userCred.user.uid, {
        status: appUser.status,
        tenantId: appUser.tenantId,
      });

      toast.success("Login exitoso");
      router.replace(getDefaultRouteForRole(appUser.role));
    } catch (error) {
      console.error("Error al iniciar sesion:", error);
      toast.error("Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Portal 360</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@ejemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Iniciando sesion..." : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
