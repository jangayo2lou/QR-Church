"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getAdminSessionToken,
  setAdminSessionToken,
} from "@/lib/client-session";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@church.local");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAdminSessionToken();
    if (token) router.replace("/admin/scanner");
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed.");
      setAdminSessionToken(data.token);
      router.push("/admin/scanner");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[45%_55%]">
      {/* ═══════════════════════════════════════════
          LEFT PANEL — desktop only
      ═══════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex flex-col items-center justify-center gap-8 px-12 py-16 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #1E3A5F 0%, #0D1B2E 100%)",
        }}
      >
        {/* Subtle dot-grid texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Soft radial glow at top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: 340,
            height: 200,
            background:
              "radial-gradient(ellipse at center top, rgba(201,168,76,0.12) 0%, transparent 70%)",
          }}
        />

        {/* ── Dual parish logos ── */}
        <div className="relative z-10 flex items-center gap-5">
          {["/logo_1.jpg", "/logo_2.png"].map((src, i) => (
            <div
              key={i}
              className="rounded-full overflow-hidden bg-white"
              style={{
                width: 80,
                height: 80,
                flexShrink: 0,
                boxShadow: "0 0 0 3px #ffffff, 0 6px 20px rgba(0,0,0,0.35)",
              }}
            >
              <Image
                src={src}
                alt={`Parish Logo ${i + 1}`}
                width={80}
                height={80}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </div>

        {/* ── Church identity ── */}
        <div className="relative z-10 text-center px-2">
          <h1
            className="text-white leading-snug"
            style={{
              fontFamily: "var(--font-display), serif",
              fontSize: 34,
              fontWeight: 600,
            }}
          >
            Saint Anthony of Padua Parish
          </h1>
          <p
            className="mt-2.5 uppercase"
            style={{
              color: "#C9A84C",
              fontSize: 11,
              letterSpacing: "0.28em",
              fontWeight: 600,
            }}
          >
            Ministry of Lectors &amp; Commentators
          </p>
        </div>

        {/* ── Gold gradient divider ── */}
        <div
          className="relative z-10 w-full"
          style={{
            height: 1,
            background:
              "linear-gradient(to right, transparent, rgba(201,168,76,0.45), transparent)",
          }}
        />

        {/* ── Frosted glass stats card ── */}
        <div
          className="relative z-10 w-full"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 20,
            padding: 24,
          }}
        >
          <p
            className="text-white font-bold mb-4"
            style={{ fontSize: 14, letterSpacing: "0.01em" }}
          >
            Attendance System
          </p>
          <div className="flex flex-wrap gap-2">
            {["📋 Member Records", "📱 QR Scanning", "📊 Reports"].map(
              (label) => (
                <span
                  key={label}
                  style={{
                    display: "inline-block",
                    background: "rgba(201,168,76,0.15)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    color: "#C9A84C",
                    borderRadius: 9999,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </span>
              ),
            )}
          </div>
        </div>

        {/* ── Bottom quote ── */}
        <p
          className="relative z-10 text-center italic leading-relaxed"
          style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}
        >
          "Every soul counted. Every presence matters."
        </p>
      </aside>

      {/* ═══════════════════════════════════════════
          RIGHT PANEL
      ═══════════════════════════════════════════ */}
      <main className="flex flex-col" style={{ background: "#FDFCF8" }}>
        {/* Mobile-only: navy header strip */}
        <div
          className="lg:hidden flex flex-col items-center justify-center gap-3 px-6 relative overflow-hidden"
          style={{
            minHeight: 160,
            background: "linear-gradient(145deg, #1E3A5F 0%, #0D1B2E 100%)",
          }}
        >
          {/* Dot texture on mobile header */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="relative z-10 flex items-center gap-3">
            {["/logo_1.jpg", "/logo_2.png"].map((src, i) => (
              <div
                key={i}
                className="rounded-full overflow-hidden bg-white"
                style={{
                  width: 52,
                  height: 52,
                  flexShrink: 0,
                  boxShadow: "0 0 0 2px #ffffff, 0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                <Image
                  src={src}
                  alt={`Parish Logo ${i + 1}`}
                  width={52}
                  height={52}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
          <p
            className="relative z-10 text-white text-center leading-tight"
            style={{
              fontFamily: "var(--font-display), serif",
              fontSize: 19,
              fontWeight: 600,
            }}
          >
            Saint Anthony of Padua Parish
          </p>
        </div>

        {/* ── Form area — fills remaining height, vertically centered ── */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 lg:py-16">
          {/*
            Mobile: white card with shadow sits on the cream bg.
            Desktop: transparent — the cream right panel is the "canvas".
          */}
          <div className="w-full max-w-[390px] bg-white lg:bg-transparent rounded-2xl lg:rounded-none shadow-xl lg:shadow-none px-7 py-8 lg:px-0 lg:py-0">
            {/* Heading */}
            <h2
              className="text-center leading-tight"
              style={{
                fontFamily: "var(--font-display), serif",
                color: "#1A1A2E",
                fontSize: 38,
                fontWeight: 600,
              }}
            >
              Welcome back 🙏
            </h2>
            <p
              className="text-center mt-2 mb-8"
              style={{ color: "#4A5568", fontSize: 14 }}
            >
              Sign in to your account
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block mb-1.5"
                  style={{
                    fontSize: 10,
                    color: "#9D7B32",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                  }}
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block mb-1.5"
                  style={{
                    fontSize: 10,
                    color: "#9D7B32",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                  }}
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Error */}
              {error && (
                <p
                  className="leading-snug"
                  style={{ color: "#DC2626", fontSize: 13 }}
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>

              {/* Footer note */}
              <p
                className="text-center"
                style={{ color: "#9CA3AF", fontSize: 12 }}
              >
                Admin access only
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
