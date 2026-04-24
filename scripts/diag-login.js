const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

async function diagnostic() {
  console.log("🔍 Starting Login Diagnostic...");

  // 1. Read .env.local
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env.local file NOT FOUND at " + envPath);
    return;
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const envVars = {};
  envContent.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join("=").trim();
    }
  });

  const url = envVars.SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
  const key = envVars.SUPABASE_SERVICE_ROLE_KEY;

  console.log("📡 Supabase URL:", url);
  console.log("📡 Service Role Key:", key ? "PRESENT" : "MISSING");

  if (!url || !key) {
    console.error("❌ Missing required environment variables.");
    return;
  }

  // 2. Initialize Supabase with Service Role
  console.log("🧪 Testing Service Role Key...");
  const supabaseAdmin = createClient(url, key);

  // 3. Test Service Role Connection
  const { data: admins, error: queryError } = await supabaseAdmin
    .from("admins")
    .select("id");

  if (queryError) {
    console.error("❌ Service Role Error:", queryError.message);
  } else {
    console.log("✅ Service Role Key works!");
  }

  // 4. Initialize Supabase with Anon Key
  const anonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || envVars.SUPABASE_ANON_KEY;
  console.log("🧪 Testing Anon Key:", anonKey ? "PRESENT" : "MISSING");
  if (anonKey) {
    const supabaseAnon = createClient(url, anonKey);
    const { error: anonError } = await supabaseAnon.from("admins").select("id").limit(1);
    if (anonError) {
      console.error("❌ Anon Key Error:", anonError.message);
    } else {
      console.log("✅ Anon Key works!");
    }
  }

  console.log(`✅ Connection successful. Found ${admins.length} record(s) in 'admins' table.`);

  const targetEmail = "admin@church.local";
  const admin = admins.find(a => a.email.toLowerCase() === targetEmail.toLowerCase());

  if (admin) {
    console.log(`✅ Admin found: ${admin.email}`);
    console.log(`✅ Password Hash: ${admin.password_hash}`);
    if (admin.password_hash === "$2b$10$V6i11VuBlookOWzv1S48Ke4tFgK5ZdSar02Xb7K05k7CNlnyvlheS") {
      console.log("✅ Hash matches seeded default for 'admin123'.");
    } else {
      console.warn("⚠️ Hash does NOT match default seeded hash. It might have been changed.");
    }
  } else {
    console.error(`❌ Admin record for '${targetEmail}' NOT FOUND.`);
    console.log("All emails in table:", admins.map(a => a.email).join(", ") || "(none)");
  }
}

diagnostic().catch(err => {
  console.error("💥 Unhandled Error:", err);
});
