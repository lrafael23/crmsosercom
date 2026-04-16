/**
 * Utilidades para la gestión de cookies de sesión compartidas entre 
 * el cliente (React) y el servidor (Middleware).
 */

export const SESSION_COOKIE_NAME = "portal360-session";
export const ROLE_COOKIE_NAME = "portal360-role";

/**
 * Establece las cookies necesarias para que el Middleware reconozca la sesión.
 * @param role El rol del usuario para redirecciones inteligentes.
 * @param expireDays Días de duración de la cookie (default 1).
 */
export function setAuthCookies(role: string, expireDays = 1) {
  if (typeof document === "undefined") return;

  const maxAge = expireDays * 24 * 60 * 60;
  
  // Establecer cookie de sesión activa
  document.cookie = `${SESSION_COOKIE_NAME}=true; path=/; max-age=${maxAge}; samesite=lax`;
  
  // Establecer cookie de rol
  document.cookie = `${ROLE_COOKIE_NAME}=${role}; path=/; max-age=${maxAge}; samesite=lax`;
  
  console.log(`[Session] Cookies sincronizadas para rol: ${role}`);
}

/**
 * Elimina las cookies de sesión.
 */
export function clearAuthCookies() {
  if (typeof document === "undefined") return;

  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${ROLE_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  
  console.log("[Session] Cookies de sesión eliminadas.");
}
