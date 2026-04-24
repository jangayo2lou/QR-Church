import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-session";
import { getSupabaseServer } from "@/lib/supabase-server";
import { manilaDateKey } from "@/lib/time";

const entrySchema = z.object({
  qrToken: z.string().uuid(),
  scannedAt: z.string().optional(),
  serviceDate: z.string().optional(),
  source: z.enum(["online", "offline-sync"]).optional(),
});

const payloadSchema = z.object({
  entries: z.array(entrySchema).min(1),
});

async function processEntry(supabaseServer, entry, adminId) {
  const serviceDate = entry.serviceDate || manilaDateKey();
  const source = entry.source || "online";

  const { data: member } = await supabaseServer
    .from("members")
    .select("id, qr_token, last_name, first_name, middle_name, age, sex, avatar_path")
    .eq("qr_token", entry.qrToken)
    .eq("is_active", true)
    .single();

  if (!member) {
    return { status: "missing", qrToken: entry.qrToken };
  }

  const scanTime = entry.scannedAt || new Date().toISOString();
  const insertPayload = {
    member_id: member.id,
    service_date: serviceDate,
    scanned_at: scanTime,
    source,
    created_by_admin: adminId,
  };

  const { data, error } = await supabaseServer.from("attendance").insert(insertPayload).select("id").single();

  if (error && error.code === "23505") {
    return { status: "duplicate", member, serviceDate };
  }
  if (error) {
    return { status: "error", member, error: error.message };
  }

  return {
    status: "ok",
    member,
    attendanceId: data.id,
    serviceDate,
  };
}

export async function POST(request) {
  const supabaseServer = getSupabaseServer();
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid scan payload." }, { status: 400 });
    }

    const results = [];
    for (const entry of parsed.data.entries) {
      // Process scans serially to keep per-device ordering predictable.
      const result = await processEntry(supabaseServer, entry, auth.admin.id);
      results.push(result);
    }

    await supabaseServer.from("sync_audit").insert({
      action: parsed.data.entries.some((x) => x.source === "offline-sync") ? "offline_sync" : "live_scan",
      details: {
        total: parsed.data.entries.length,
        ok: results.filter((x) => x.status === "ok").length,
        duplicate: results.filter((x) => x.status === "duplicate").length,
      },
    });

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Scan failed." }, { status: 500 });
  }
}
