"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase/client";

export type UserRole =
  | "super_admin_global"
  | "admin"
  | "abogado"
  | "contador"
  | "tributario"
  | "staff"
  | "cliente";

export type UserStatus = "pending_validation" | "active" | "suspended";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
  tenantId: string | null;
  companyId: string | null;
  department: string | null;
  createdBy?: string | null;
  validatedBy?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const ADMIN_ROLES: UserRole[] = ["admin", "abogado", "contador", "tributario", "staff"];
const CLIENT_ROLES: UserRole[] = ["cliente"];

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

function isUserRole(value: unknown): value is UserRole {
  return ["super_admin_global", "admin", "abogado", "contador", "tributario", "staff", "cliente"].includes(
    String(value),
  );
}

function isUserStatus(value: unknown): value is UserStatus {
  return ["pending_validation", "active", "suspended"].includes(String(value));
}

export function isAdminRole(role: UserRole | null | undefined) {
  return !!role && ADMIN_ROLES.includes(role);
}

export function isClientRole(role: UserRole | null | undefined) {
  return !!role && CLIENT_ROLES.includes(role);
}

export function getDefaultRouteForRole(role: UserRole | null | undefined) {
  if (!role) return "/login";
  if (role === "super_admin_global") return "/super-admin";
  if (isAdminRole(role)) return "/admin";
  return "/dashboard";
}

export function canAccessRoute(role: UserRole | null | undefined, pathname: string) {
  if (!role) return false;

  if (pathname.startsWith("/super-admin")) {
    return role === "super_admin_global";
  }

  if (pathname.startsWith("/admin")) {
    return role === "super_admin_global" || isAdminRole(role);
  }

  if (pathname.startsWith("/dashboard")) {
    return role === "super_admin_global" || isClientRole(role);
  }

  return true;
}

async function getAppUser(uid: string, email: string | null, displayName: string | null) {
  const userDoc = await getDoc(doc(db, "users", uid));

  if (!userDoc.exists()) {
    return null;
  }

  const userData = userDoc.data();
  const role = isUserRole(userData.role) ? userData.role : null;

  if (!role) {
    return null;
  }

  return {
    uid,
    email,
    displayName: userData.displayName ?? displayName,
    role,
    status: isUserStatus(userData.status) ? userData.status : "pending_validation",
    tenantId: userData.tenantId ?? null,
    companyId: userData.companyId ?? null,
    department: userData.department ?? null,
    createdBy: userData.createdBy ?? null,
    validatedBy: userData.validatedBy ?? null,
  } satisfies AppUser;
}

export async function resolveAppUserFromAuth(uid: string, email: string | null, displayName: string | null) {
  return getAppUser(uid, email, displayName);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const appUser = await getAppUser(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName);
        setUser(appUser);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      logout,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
