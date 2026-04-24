import { randomUUID } from "crypto";
import { getSupabaseServer } from "@/lib/supabase-server";

const DEFAULT_SESSION_DAYS = Number(process.env.ADMIN_SESSION_DAYS || 30);

export async function createAdminSession(adminId) {
  const supabaseServer = getSupabaseServer();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + DEFAULT_SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabaseServer
    .from("admin_sessions")
    .insert({ token, admin_id: adminId, expires_at: expiresAt });

  if (error) {
    throw new Error(`Could not create admin session: ${error.message}`);
  }

  return { token, expiresAt };
}

export async function requireAdminSession(request) {
  const supabaseServer = getSupabaseServer();
  const headerToken = request.headers.get("x-admin-session");
  const cookieToken = request.cookies.get("admin_session")?.value;
  const token = headerToken || cookieToken;

  if (!token) return { ok: false, status: 401, message: "Missing admin session." };

  const { data, error } = await supabaseServer
    .from("admin_sessions")
    .select("token, expires_at, admins(id, email)")
    .eq("token", token)
    .single();

  if (error || !data) return { ok: false, status: 401, message: "Invalid admin session." };
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { ok: false, status: 401, message: "Admin session expired." };
  }

  return {
    ok: true,
    token,
    admin: {
      id: data.admins.id,
      email: data.admins.email,
    },
  };
}
