import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-session";
import { getSupabaseServer } from "@/lib/supabase-server";
import { manilaDateKey } from "@/lib/time";

function startOfManilaDay(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return formatted;
}

export async function GET(request) {
  const supabaseServer = getSupabaseServer();
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const today = manilaDateKey();
  const windowStart = startOfManilaDay(6);
  const reviewWindowStart = startOfManilaDay(29);

  const [{ count: memberCount }, { count: todayCount }, { count: queuedCount }, weeklyAttendanceResult, recentAttendanceResult] = await Promise.all([
    supabaseServer.from("members").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabaseServer.from("attendance").select("id", { count: "exact", head: true }).eq("service_date", today),
    supabaseServer
      .from("sync_audit")
      .select("id", { count: "exact", head: true })
      .eq("action", "offline_queue")
      .gte("created_at", `${today}T00:00:00+08:00`),
    supabaseServer
      .from("attendance")
      .select("service_date")
      .gte("service_date", windowStart)
      .order("service_date", { ascending: true }),
    supabaseServer
      .from("attendance")
      .select("member_id, scanned_at, service_date, members!inner(id, last_name, first_name, middle_name, avatar_path)")
      .gte("service_date", reviewWindowStart)
      .order("scanned_at", { ascending: false }),
  ]);

  const weeklyAttendance = Array.from({ length: 7 }, (_, index) => {
    const date = startOfManilaDay(6 - index);
    return { date, count: 0 };
  });

  for (const row of weeklyAttendanceResult.data || []) {
    const match = weeklyAttendance.find((item) => item.date === row.service_date);
    if (match) match.count += 1;
  }

  const attendanceByMember = new Map();
  for (const row of recentAttendanceResult.data || []) {
    if (!row.member_id) continue;
    if (!attendanceByMember.has(row.member_id)) {
      attendanceByMember.set(row.member_id, {
        member: row.members,
        lastScannedAt: row.scanned_at,
        count: 0,
      });
    }
    attendanceByMember.get(row.member_id).count += 1;
  }

  const attentionNeeded = Array.from(attendanceByMember.values())
    .filter((item) => item.count >= 3)
    .sort((a, b) => new Date(a.lastScannedAt) - new Date(b.lastScannedAt))
    .slice(0, 5)
    .map((item) => ({
      id: item.member.id,
      name: `${item.member.last_name}, ${item.member.first_name}`,
      lastScannedAt: item.lastScannedAt,
      recentCount: item.count,
    }));

  return NextResponse.json({
    today,
    memberCount: memberCount || 0,
    todayCount: todayCount || 0,
    queuedCount: queuedCount || 0,
    weeklyAttendance,
    attentionNeeded,
  });
}
