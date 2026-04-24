"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminSessionToken, setAdminSessionToken } from "@/lib/client-session";

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
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl content-center items-center gap-6 md:grid-cols-[1.2fr_0.9fr]">
        <div className="surface overflow-hidden">
          <div className="bg-[linear-gradient(140deg,#f8f4ea_0%,#ffffff_55%,#f0e4cb_100%)] p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.3em] text-[#8f6a28]">Church Attendance</p>
            <h1 className="mt-3 text-4xl leading-tight text-[#5e4f35] md:text-5xl">QR Admin Control Center</h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#5f5543]">
              Elegant and reliable attendance operations with member creation, printable cards, and fast QR scanning with offline sync.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#987339]">Member Records</p>
                <p className="mt-2 text-sm text-[#605745]">Clean data capture for every church member profile.</p>
              </div>
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#987339]">Printable Cards</p>
                <p className="mt-2 text-sm text-[#605745]">High-contrast QR cards with two church logos.</p>
              </div>
              <div className="surface-soft p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#987339]">Offline Queue</p>
                <p className="mt-2 text-sm text-[#605745]">Scan now, sync later if internet goes down.</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="surface space-y-4 p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-[#5e4f35]">Admin Login</h2>
          <p className="text-sm text-[#6c6250]">Use your admin credentials to open the attendance workspace.</p>

          <label className="block text-sm font-medium text-[#4a4130]">
            Email
            <input
              className="input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-medium text-[#4a4130]">
            Password
            <input
              type="password"
              className="input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm text-[#a94438]">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full px-4 py-2.5 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login as Admin"}
          </button>
        </form>
      </section>
    </main>
  );
}
