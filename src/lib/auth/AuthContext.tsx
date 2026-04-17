"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase/client";
import { setAuthCookies, clearAuthCookies } from "./session";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type UserRole =
  // Plataforma Sosercom
  | "super_admin_global"
  | "admin"
  // Estudio jurídico (tenant)
  | "owner_firm"      // Abogado jefe / dueño del estudio
  | "abogado"
  | "contador"
  | "tributario"
  | "staff"
  // Cliente final
  | "cliente_final"
  // Roles legacy (compatibilidad hacia atrás)
  | "cliente";

export type UserStatus = "pending_validation" | "active" | "suspended";

export type SubscriptionStatus =
  | "pending"
  | "authorized"
  | "active"
  | "paused"
  | "cancelled"
  | "past_due"
  | "rejected"
  | null;

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
  // Multi-tenancy
  tenantId: string | null;
  companyId: string | null;
  department: string | null;
  // Plan y suscripción (solo para owner_firm)
  planId: string | null;
  subscriptionStatus: SubscriptionStatus;
  // Trazabilidad
  createdBy?: string | null;
  validatedBy?: string | null;
  powers?: string[];
  category?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  impersonate: (targetUid: string) => Promise<void>;
  stopImpersonating: () => Promise<void>;
  isImpersonating: boolean;
  realUser: AppUser | null;
}

// ─── Constantes de Roles ─────────────────────────────────────────────────────

const FIRM_ROLES: UserRole[] = ["owner_firm", "abogado", "contador", "tributario", "staff"];
const CLIENT_ROLES: UserRole[] = ["cliente_final", "cliente"];
const SOSERCOM_ROLES: UserRole[] = ["super_admin_global", "admin"];

export function isFirmRole(role: UserRole | null | undefined): boolean {
  return !!role && FIRM_ROLES.includes(role);
}

export function isClientRole(role: UserRole | null | undefined): boolean {
  return !!role && CLIENT_ROLES.includes(role);
}

export function isSosercomRole(role: UserRole | null | undefined): boolean {
  return !!role && SOSERCOM_ROLES.includes(role);
}

export function isSuperAdmin(role: UserRole | null | undefined): boolean {
  return role === "super_admin_global";
}

export function isOwnerFirm(role: UserRole | null | undefined): boolean {
  return role === "owner_firm";
}

// ─── Rutas por Rol ────────────────────────────────────────────────────────────

export function getDefaultRouteForRole(role: UserRole | null | undefined): string {
  if (!role) return "/login";
  if (role === "super_admin_global") return "/super-admin";
  if (role === "admin") return "/admin";
  if (role === "owner_firm") return "/firm";
  if (isFirmRole(role)) return "/firm";
  if (isClientRole(role)) return "/cliente";
  return "/login";
}

export function canAccessRoute(role: UserRole | null | undefined, pathname: string): boolean {
  if (!role) return false;

  // Super admin puede acceder a todo
  if (role === "super_admin_global") return true;

  // Rutas de super-admin — solo super_admin_global
  if (pathname.startsWith("/super-admin")) return false;

  // Admin Sosercom
  if (pathname.startsWith("/admin")) {
    return role === "admin";
  }

  // Rutas del estudio
  if (pathname.startsWith("/firm")) {
    return isFirmRole(role);
  }

  // Portal del cliente final
  if (pathname.startsWith("/cliente")) {
    return isClientRole(role);
  }

  // Rutas legacy
  if (pathname.startsWith("/dashboard")) {
    return isClientRole(role) || isFirmRole(role);
  }

  return true;
}

// ─── Lecturas de Firestore ────────────────────────────────────────────────────

export type UserRole_Internal = UserRole;

function isValidRole(value: unknown): value is UserRole {
  const validRoles: UserRole[] = [
    "super_admin_global", "admin",
    "owner_firm", "abogado", "contador", "tributario", "staff",
    "cliente_final", "cliente",
  ];
  return validRoles.includes(String(value) as UserRole);
}

function isValidStatus(value: unknown): value is UserStatus {
  return ["pending_validation", "active", "suspended"].includes(String(value));
}

function ensureString(value: any, fallback: string | null = null): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    // Si es un objeto de Firestore accidental (como un mapa vacío), devolvemos el fallback
    return fallback;
  }
  return value || fallback;
}

async function getAppUser(
  uid: string,
  email: string | null,
  displayName: string | null
): Promise<AppUser | null> {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return null;

  const data = userDoc.data();
  const rawRole = data.role;
  const role = isValidRole(rawRole) ? (rawRole as UserRole) : null;
  
  if (!role) {
    console.warn(`Usuario ${uid} tiene un rol inválido o ausente:`, rawRole);
    return null;
  }

  return {
    uid,
    email: ensureString(data.email, email),
    displayName: ensureString(data.displayName, displayName),
    role,
    status: isValidStatus(data.status) ? (data.status as UserStatus) : "pending_validation",
    tenantId: ensureString(data.tenantId),
    companyId: ensureString(data.companyId),
    department: ensureString(data.department),
    planId: ensureString(data.planId),
    subscriptionStatus: data.subscriptionStatus ?? null,
    createdBy: ensureString(data.createdBy),
    validatedBy: ensureString(data.validatedBy),
    powers: Array.isArray(data.powers) ? data.powers : [],
    category: ensureString(data.category),
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  impersonate: async () => {},
  stopImpersonating: async () => {},
  isImpersonating: false,
  realUser: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [realUser, setRealUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (!firebaseUser) {
        setUser(null);
        setRealUser(null);
        setLoading(false);
        return;
      }
      try {
        const appUser = await getAppUser(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.displayName
        );
        setUser(appUser);
        setRealUser(appUser);

        if (appUser) {
          setAuthCookies(appUser.role);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(null);
        setRealUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      clearAuthCookies();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const impersonate = async (targetUid: string) => {
    if (realUser?.role !== "super_admin_global") return;
    setLoading(true);
    try {
      const targetSnap = await getDoc(doc(db, "users", targetUid));
      if (targetSnap.exists()) {
        const data = targetSnap.data();
        const targetUser: AppUser = {
          uid: targetUid,
          email: ensureString(data.email),
          displayName: ensureString(data.displayName),
          role: isValidRole(data.role) ? (data.role as UserRole) : "staff",
          status: isValidStatus(data.status) ? (data.status as UserStatus) : "active",
          tenantId: ensureString(data.tenantId),
          companyId: ensureString(data.companyId),
          department: ensureString(data.department),
          planId: ensureString(data.planId),
          subscriptionStatus: data.subscriptionStatus ?? null,
          powers: Array.isArray(data.powers) ? data.powers : [],
          category: ensureString(data.category),
        };
        setUser(targetUser);
        
        // Actualizar cookies durante impersonación
        document.cookie = `portal360-role=${targetUser.role}; path=/; max-age=3600`;
      }
    } catch (e) {
      console.error("Error impersonating:", e);
    } finally {
      setLoading(false);
    }
  };

  const stopImpersonating = async () => {
    setUser(realUser);
    if (realUser) {
      document.cookie = `portal360-role=${realUser.role}; path=/; max-age=3600`;
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      logout,
      impersonate,
      stopImpersonating,
      isImpersonating: !!user && !!realUser && user.uid !== realUser.uid,
      realUser,
    }),
    [user, realUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function resolveAppUserFromAuth(
  uid: string,
  email: string | null,
  displayName: string | null
) {
  return getAppUser(uid, email, displayName);
}

export const useAuth = () => useContext(AuthContext);
