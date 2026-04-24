import { getAdminSessionToken } from "@/lib/client-session";

export async function apiFetch(url, options = {}) {
  const token = getAdminSessionToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("x-admin-session", token);

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
}
