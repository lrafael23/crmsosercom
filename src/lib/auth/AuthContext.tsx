"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase/client";
import { IMPERSONATION_COOKIE_NAME, IMPERSONATION_STORAGE_KEY, type StoredImpersonationSession } from "@/lib/auth/impersonation";
import { setAuthCookies, clearAuthCookies } from "./session";

export type UserRole =
  | "super_admin_global"
  | "admin"
  | "owner_firm"
  | "abogado"
  | "contador"
  | "tributario"
  | "staff"
  | "cliente_final"
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
  tenantId: string | null;
  companyId: string | null;
  department: string | null;
  planId: string | null;
  subscriptionStatus: SubscriptionStatus;
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
  if (role === "super_admin_global") return true;
  if (pathname.startsWith("/super-admin")) return false;
  if (pathname.startsWith("/admin")) return role === "admin";
  if (pathname.startsWith("/firm")) return isFirmRole(role);
  if (pathname.startsWith("/cliente")) return isClientRole(role);
  if (pathname.startsWith("/dashboard")) return isClientRole(role) || isFirmRole(role);
  return true;
}

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

function ensureString(value: unknown, fallback: string | null = null): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return fallback;
  return (value as string | null | undefined) || fallback;
}

async function getTenantAdjustedStatus(role: UserRole, tenantId: string | null, status: UserStatus) {
  if (!tenantId || role === "super_admin_global" || role === "admin") return status;
  const tenantDoc = await getDoc(doc(db, "tenants", tenantId)).catch(() => null);
  const tenantStatus = tenantDoc?.exists() ? tenantDoc.data()?.status : null;
  return tenantStatus === "suspended" ? "suspended" : status;
}

async function buildAppUser(uid: string, data: Record<string, unknown>, email: string | null, displayName: string | null): Promise<AppUser | null> {
  const rawRole = data.role;
  const role = isValidRole(rawRole) ? (rawRole as UserRole) : null;
  if (!role) return null;

  const tenantId = ensureString(data.tenantId);
  const status = await getTenantAdjustedStatus(
    role,
    tenantId,
    isValidStatus(data.status) ? (data.status as UserStatus) : "pending_validation",
  );

  return {
    uid,
    email: ensureString(data.email, email),
    displayName: ensureString(data.displayName, displayName),
    role,
    status,
    tenantId,
    companyId: ensureString(data.companyId),
    department: ensureString(data.department),
    planId: ensureString(data.planId),
    subscriptionStatus: (data.subscriptionStatus as SubscriptionStatus) ?? null,
    createdBy: ensureString(data.createdBy),
    validatedBy: ensureString(data.validatedBy),
    powers: Array.isArray(data.powers) ? (data.powers as string[]) : [],
    category: ensureString(data.category),
  };
}

async function getAppUser(uid: string, email: string | null, displayName: string | null): Promise<AppUser | null> {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return null;
  return buildAppUser(uid, userDoc.data() as Record<string, unknown>, email, displayName);
}

async function getUserByUid(targetUid: string): Promise<AppUser | null> {
  const targetSnap = await getDoc(doc(db, "users", targetUid));
  if (!targetSnap.exists()) return null;
  return buildAppUser(targetUid, targetSnap.data() as Record<string, unknown>, null, null);
}

function readStoredImpersonation(): StoredImpersonationSession | null {
  if (typeof window === "undefined") return null;
  const hasCookie = document.cookie.split(";").some((item) => item.trim().startsWith(`${IMPERSONATION_COOKIE_NAME}=`));
  if (!hasCookie) return null;
  const raw = window.localStorage.getItem(IMPERSONATION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredImpersonationSession;
  } catch {
    return null;
  }
}

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
        const appUser = await getAppUser(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName);
        setRealUser(appUser);

        if (appUser) {
          setAuthCookies(appUser.role);
          const stored = readStoredImpersonation();
          if (appUser.role === "super_admin_global" && stored?.targetUserId) {
            const targetUser = await getUserByUid(stored.targetUserId).catch(() => null);
            setUser(targetUser || appUser);
          } else {
            setUser(appUser);
          }
        } else {
          setUser(null);
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
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
      }
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
      const targetUser = await getUserByUid(targetUid);
      if (targetUser) {
        setUser(targetUser);
        document.cookie = `portal360-role=${targetUser.role}; path=/; max-age=3600`;
      }
    } catch (error) {
      console.error("Error impersonating:", error);
    } finally {
      setLoading(false);
    }
  };

  const stopImpersonating = async () => {
    const stored = readStoredImpersonation();
    if (stored?.sessionId && auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        await fetch("/api/super-admin/impersonation", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId: stored.sessionId }),
        });
      } catch (error) {
        console.error("Error ending impersonation:", error);
      }
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
    }

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

export function resolveAppUserFromAuth(uid: string, email: string | null, displayName: string | null) {
  return getAppUser(uid, email, displayName);
}

export const useAuth = () => useContext(AuthContext);
