export const ADMIN_SESSION_KEY = "church_admin_session";

export function getAdminSessionToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_SESSION_KEY);
}

export function setAdminSessionToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_SESSION_KEY, token);
}

export function clearAdminSessionToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
