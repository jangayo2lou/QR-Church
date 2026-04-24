import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { getSupabaseServer } from "@/lib/supabase-server";
import { manilaDateKey } from "@/lib/time";

export async function GET(request) {
  const supabaseServer = getSupabaseServer();
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const date = request.nextUrl.searchParams.get("date") || manilaDateKey();

  const { data, error } = await supabaseServer
    .from("attendance")
    .select(
      "id, service_date, scanned_at, source, members(id, qr_token, last_name, first_name, middle_name, sex, age, avatar_path)"
    )
    .eq("service_date", date)
    .order("scanned_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    date,
    attendance: (data || []).map((row) => ({
      id: row.id,
      service_date: row.service_date,
      scanned_at: row.scanned_at,
      source: row.source,
      member: row.members,
    })),
  });
}
