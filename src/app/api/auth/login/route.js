import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession } from "@/lib/admin-session";
import { getSupabaseServer } from "@/lib/supabase-server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request) {
  try {
    const supabaseServer = getSupabaseServer();
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid login payload." }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const { data: admin, error } = await supabaseServer
      .from("admins")
      .select("id, email, password_hash")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !admin) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const session = await createAdminSession(admin.id);

    const response = NextResponse.json({
      token: session.token,
      admin: { id: admin.id, email: admin.email },
      expiresAt: session.expiresAt,
    });

    response.cookies.set("admin_session", session.token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(session.expiresAt),
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message || "Login failed." }, { status: 500 });
  }
}
