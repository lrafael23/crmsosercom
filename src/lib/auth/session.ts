/**
 * Cookie helpers shared by React and Next Proxy.
 */

export const SESSION_COOKIE_NAME = "portal360-session";
export const LEGACY_SESSION_COOKIE_NAME = "portal360_session";
export const ROLE_COOKIE_NAME = "portal360-role";

export function setAuthCookies(role: string, expireDays = 1) {
  if (typeof document === "undefined") return;

  const maxAge = expireDays * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${SESSION_COOKIE_NAME}=true; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
  document.cookie = `${ROLE_COOKIE_NAME}=${role}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;

  // Remove the old underscore cookie after deployments that used it.
  document.cookie = `${LEGACY_SESSION_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function clearAuthCookies() {
  if (typeof document === "undefined") return;

  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${LEGACY_SESSION_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${ROLE_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
