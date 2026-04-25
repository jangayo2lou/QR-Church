import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET(request, { params }) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "Token required." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // Get member by qr_token (safe fields only — no address, contact)
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, first_name, last_name, middle_name, avatar_path, created_at, is_active")
      .eq("qr_token", token)
      .eq("is_active", true)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    // Get all attendance records for this member
    const { data: allAttendance } = await supabase
      .from("attendance")
      .select("service_date, scanned_at")
      .eq("member_id", member.id)
      .order("service_date", { ascending: false });

    const attendance = allAttendance || [];

    // This month stats
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7); // "YYYY-MM"
    const thisYear = now.getFullYear().toString();

    const thisMonthCount = attendance.filter(a => a.service_date.startsWith(thisMonth)).length;
    const thisYearCount = attendance.filter(a => a.service_date.startsWith(thisYear)).length;
    const totalCount = attendance.length;

    // Calculate streak (consecutive most-recent records)
    // Simple approach: count from the most recent record how many are within 14 days of each other
    let streak = 0;
    if (attendance.length > 0) {
      streak = 1;
      for (let i = 1; i < attendance.length; i++) {
        const prev = new Date(attendance[i - 1].service_date);
        const curr = new Date(attendance[i].service_date);
        const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
        if (diffDays <= 14) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Recent 8 attendance records
    const recentAttendance = attendance.slice(0, 8).map(a => ({
      date: a.service_date,
      scannedAt: a.scanned_at,
    }));

    // Member since year
    const memberSinceYear = new Date(member.created_at).getFullYear();

    // Avatar URL (public bucket)
    const avatarUrl = member.avatar_path && process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET || "member-avatars"}/${member.avatar_path}`
      : null;

    return NextResponse.json({
      member: {
        firstName: member.first_name,
        lastName: member.last_name,
        middleName: member.middle_name,
        avatarUrl,
        memberSinceYear,
      },
      stats: {
        thisMonthCount,
        thisYearCount,
        totalCount,
        streak,
        recentAttendance,
      },
    });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
