"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { canAccessRoute, getDefaultRouteForRole, UserRole, useAuth } from "@/lib/auth/AuthContext";

import { ValidationGuard } from "./ValidationGuard";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, logout, isImpersonating, realUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.status !== "active" && !(isImpersonating && realUser?.role === "super_admin_global")) {
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getDefaultRouteForRole(user.role));
      return;
    }

    if (!canAccessRoute(user.role, pathname)) {
      router.replace(getDefaultRouteForRole(user.role));
    }
  }, [allowedRoles, isImpersonating, loading, logout, pathname, realUser?.role, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.status !== "active" && !(isImpersonating && realUser?.role === "super_admin_global")) {
    return <ValidationGuard>{children}</ValidationGuard>;
  }

  if ((allowedRoles && !allowedRoles.includes(user.role)) || !canAccessRoute(user.role, pathname)) {
    return null;
  }

  return <>{children}</>;
}
