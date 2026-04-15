/**
 * Portal 360 — Proxy de Autenticación y Roles
 *
 * Ejecutado en cada request. Solo realiza verificaciones OPTIMISTAS
 * (sin llamadas a Firestore desde el proxy). La verificación completa
 * de roles y permisos ocurre en los layouts de server components.
 *
 * Según la arquitectura de Next.js 16: usa proxy.ts, no middleware.ts.
 */

import { NextRequest, NextResponse } from "next/server";

// ─── Rutas Públicas ───────────────────────────────────────────────────────────
// Estas rutas son accesibles sin autenticación

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/planes",
  "/registro/estudio",
  "/registro/cliente",
  "/pago/resultado",
];

// Prefijos de rutas públicas (dinamicas)
const PUBLIC_PREFIXES = [
  "/invitacion-equipo/",
  "/api/mp/webhook",
  "/_next",
  "/favicon.ico",
];

// ─── Rutas Protegidas y sus roles requeridos ──────────────────────────────────

const PROTECTED_PREFIXES: Record<string, string[]> = {
  "/super-admin": ["super_admin_global"],
  "/admin": ["super_admin_global", "admin"],
  "/firm": ["super_admin_global", "owner_firm", "abogado", "contador", "tributario", "staff"],
  "/cliente": ["super_admin_global", "cliente_final", "cliente"],
  "/dashboard": ["super_admin_global", "admin", "owner_firm", "abogado", "contador", "tributario", "staff", "cliente_final", "cliente"],
  "/checkout": [], // Solo autenticados
  "/pago": [],     // Solo autenticados
};

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Siempre pasar las rutas de API excepto las que están en PUBLIC_PREFIXES
  if (pathname.startsWith("/api/")) {
    // El webhook de MP es público (sin auth de Firebase)
    if (pathname.startsWith("/api/mp/webhook")) {
      return NextResponse.next();
    }
    // Las demás rutas de API se validan internamente con Firebase Admin
    return NextResponse.next();
  }

  // Las rutas estáticas siempre pasan
  if (
    pathname.startsWith("/_next/") ||
    pathname.includes(".") // archivos estáticos como .ico, .png, etc.
  ) {
    return NextResponse.next();
  }

  // Las rutas públicas siempre pasan
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Para rutas protegidas: verificamos si hay sesión de Firebase
  // Firebase usa el token en la cookie "__session" en producción o en
  // localStorage en dev. Para el proxy NO podemos hacer doble verificación
  // con Firestore, por lo que delegamos auth completa al layout de server components.
  // Solo verificamos si hay una cookie de sesión para redirigir a /login.

  const firebaseSession = req.cookies.get("__session")?.value;
  const appSession = req.cookies.get("portal360_session")?.value;

  const hasSession = !!firebaseSession || !!appSession;

  // Si no hay ninguna señal de sesión, redirigir a login
  if (!hasSession) {
    // Verificamos si es una ruta protegida
    const isProtected = Object.keys(PROTECTED_PREFIXES).some((prefix) =>
      pathname.startsWith(prefix)
    );

    if (isProtected) {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
