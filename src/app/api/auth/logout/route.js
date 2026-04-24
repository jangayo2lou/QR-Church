import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(request) {
  const supabaseServer = getSupabaseServer();
  const auth = await requireAdminSession(request);
  if (auth.ok) {
    await supabaseServer.from("admin_sessions").delete().eq("token", auth.token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
