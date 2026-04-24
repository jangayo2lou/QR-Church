import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin-session";
import { getSupabaseServer } from "@/lib/supabase-server";

const memberSchema = z.object({
  last_name: z.string().min(1),
  first_name: z.string().min(1),
  middle_name: z.string().min(1),
  address: z.string().min(1),
  date_of_birth: z.string().min(1),
  sex: z.enum(["Male", "Female"]),
  age: z.coerce.number().int().min(0),
  contact_number: z.string().optional().nullable(),
});

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function normalizePayload(formData) {
  return {
    last_name: formData.get("last_name"),
    first_name: formData.get("first_name"),
    middle_name: formData.get("middle_name"),
    address: formData.get("address"),
    date_of_birth: formData.get("date_of_birth"),
    sex: formData.get("sex"),
    age: formData.get("age"),
    contact_number: formData.get("contact_number") || null,
  };
}

export async function GET(request) {
  const supabaseServer = getSupabaseServer();
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { data, error } = await supabaseServer
    .from("members")
    .select("id, qr_token, last_name, first_name, middle_name, address, date_of_birth, sex, age, contact_number, avatar_path, is_active, created_at")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data || [] });
}

export async function POST(request) {
  const supabaseServer = getSupabaseServer();
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const formData = await request.formData();
  const payload = normalizePayload(formData);
  const parsed = memberSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid member payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const avatarFile = formData.get("avatar");
  let avatarPath = null;

  if (avatarFile && typeof avatarFile === "object" && "arrayBuffer" in avatarFile) {
    if (!ALLOWED_TYPES.has(avatarFile.type)) {
      return NextResponse.json({ error: "Avatar must be JPG, PNG, or WebP." }, { status: 400 });
    }
    if (avatarFile.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Avatar file exceeds 5MB." }, { status: 400 });
    }

    const ext = avatarFile.type === "image/png" ? "png" : avatarFile.type === "image/webp" ? "webp" : "jpg";
    avatarPath = `avatars/${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await avatarFile.arrayBuffer();
    const { error: uploadError } = await supabaseServer.storage
      .from(process.env.SUPABASE_AVATAR_BUCKET || "member-avatars")
      .upload(avatarPath, Buffer.from(arrayBuffer), {
        contentType: avatarFile.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Avatar upload failed: ${uploadError.message}` }, { status: 500 });
    }
  }

  const { data, error } = await supabaseServer
    .from("members")
    .insert({ ...parsed.data, avatar_path: avatarPath })
    .select("id, qr_token, last_name, first_name, middle_name, avatar_path, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabaseServer.from("sync_audit").insert({
    action: "member_created",
    details: {
      member_id: data.id,
      qr_token: data.qr_token,
      admin_id: auth.admin.id,
    },
  });

  return NextResponse.json({ member: data });
}

export async function PATCH(request) {
  const supabaseServer = getSupabaseServer();
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const formData = await request.formData();
  const memberId = formData.get("id");
  if (!memberId) return NextResponse.json({ error: "Member ID is required." }, { status: 400 });

  const payload = normalizePayload(formData);
  const parsed = memberSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid updates.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const avatarFile = formData.get("avatar");
  let avatarPath = formData.get("avatar_path") || null;

  if (avatarFile && typeof avatarFile === "object" && "arrayBuffer" in avatarFile) {
    if (!ALLOWED_TYPES.has(avatarFile.type)) {
      return NextResponse.json({ error: "Avatar must be JPG, PNG, or WebP." }, { status: 400 });
    }
    const ext = avatarFile.type.split("/")[1];
    avatarPath = `avatars/${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await avatarFile.arrayBuffer();
    
    const { error: uploadError } = await supabaseServer.storage
      .from(process.env.SUPABASE_AVATAR_BUCKET || "member-avatars")
      .upload(avatarPath, Buffer.from(arrayBuffer), { contentType: avatarFile.type });

    if (uploadError) return NextResponse.json({ error: "Avatar upload failed." }, { status: 500 });
  }

  const { data, error } = await supabaseServer
    .from("members")
    .update({ ...parsed.data, avatar_path: avatarPath })
    .eq("id", memberId)
    .select("id, last_name, first_name, middle_name, avatar_path")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ member: data });
}

export async function DELETE(request) {
  const supabaseServer = getSupabaseServer();
  const auth = await requireAdminSession(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID is required." }, { status: 400 });

  // Soft Delete
  const { error } = await supabaseServer
    .from("members")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
