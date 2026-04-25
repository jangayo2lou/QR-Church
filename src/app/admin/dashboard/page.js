"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { RequireAdmin } from "@/components/require-admin";
import { apiFetch } from "@/lib/api-client";

function formatTrendLabel(dateKey) {
  if (!dateKey || typeof dateKey !== "string") return "";
  const date = new Date(`${dateKey}T00:00:00+08:00`);
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    today: "-",
    memberCount: 0,
    todayCount: 0,
    queuedCount: 0,
    weeklyAttendance: [],
    attentionNeeded: [],
  });

  const peakAttendance = Math.max(
    ...(stats.weeklyAttendance || []).map((item) => item.count || 0),
    1,
  );

  useEffect(() => {
    apiFetch("/api/stats")
      .then(setStats)
      .catch(() => null);
  }, []);

  return (
    <RequireAdmin>
      <AdminShell title="Church QR Attendance Dashboard">
        <div className="w-full space-y-6">
          {/* ── Page Header ── */}
          <section
            className="surface px-6 py-6"
            style={{ borderLeft: "4px solid #C9A84C" }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "#9D7B32" }}
            >
              Overview
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <h2
                className="font-(family-name:--font-display) text-[32px] leading-tight"
                style={{ color: "#1A1A2E" }}
              >
                Attendance Overview
              </h2>
              <span
                className="rounded-full px-4 py-1.5 text-xs font-semibold"
                style={{ background: "#FDF6E3", color: "#9D7B32" }}
              >
                Service date&nbsp;{stats.today}
              </span>
            </div>
          </section>

          {/* ── KPI Stat Cards ── */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Active Members */}
            <div
              className="rounded-2xl border border-[#E8E2D9] bg-white p-6 shadow-sm"
              style={{ borderLeft: "4px solid #C9A84C" }}
            >
              <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-[#EFF6FF] p-2.5">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1E3A5F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#9D7B32" }}
              >
                Active Members
              </p>
              <p
                className="mt-2 font-semibold leading-none"
                style={{
                  fontSize: "40px",
                  color: "#1A1A2E",
                  fontFamily: "var(--font-display)",
                }}
              >
                {stats.memberCount}
              </p>
              <p className="mt-2 text-[13px]" style={{ color: "#6B7280" }}>
                Members ready for QR scanning
              </p>
            </div>

            {/* Attendance Today */}
            <div
              className="rounded-2xl border border-[#E8E2D9] bg-white p-6 shadow-sm"
              style={{ borderLeft: "4px solid #C9A84C" }}
            >
              <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-[#EFF6FF] p-2.5">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1E3A5F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#9D7B32" }}
              >
                Attendance Today
              </p>
              <p
                className="mt-2 font-semibold leading-none"
                style={{
                  fontSize: "40px",
                  color: "#1A1A2E",
                  fontFamily: "var(--font-display)",
                }}
              >
                {stats.todayCount}
              </p>
              <p className="mt-2 text-[13px]" style={{ color: "#6B7280" }}>
                Scanned records for today&apos;s service
              </p>
            </div>

            {/* Queued Syncs */}
            <div
              className="rounded-2xl border border-[#E8E2D9] bg-white p-6 shadow-sm"
              style={{ borderLeft: "4px solid #C9A84C" }}
            >
              <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-[#EFF6FF] p-2.5">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1E3A5F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </div>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#9D7B32" }}
              >
                Queued Syncs
              </p>
              <p
                className="mt-2 font-semibold leading-none"
                style={{
                  fontSize: "40px",
                  color: "#1A1A2E",
                  fontFamily: "var(--font-display)",
                }}
              >
                {stats.queuedCount}
              </p>
              <p className="mt-2 text-[13px]" style={{ color: "#6B7280" }}>
                Offline entries pending upload
              </p>
            </div>
          </div>

          {/* ── Bottom Grid: Weekly Pulse + Watchlist ── */}
          <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
            {/* Weekly Pulse Chart */}
            <section className="surface p-5 lg:p-6">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3
                    className="font-(family-name:--font-display) text-2xl"
                    style={{ color: "#1A1A2E" }}
                  >
                    Last 7 Services
                  </h3>
                  <p className="mt-1 text-[13px]" style={{ color: "#6B7280" }}>
                    Weekly attendance pulse
                  </p>
                </div>
                <p className="text-xs font-medium" style={{ color: "#9D7B32" }}>
                  Peak&nbsp;{peakAttendance}
                </p>
              </div>

              <div className="grid grid-cols-7 gap-2 sm:gap-3">
                {(stats.weeklyAttendance || []).map((item) => {
                  const height = Math.max(
                    14,
                    Math.round((item.count / peakAttendance) * 120),
                  );
                  return (
                    <div
                      key={item.date}
                      className="flex flex-col items-center gap-2"
                    >
                      {/* Track pill + bar */}
                      <div
                        className="relative flex h-33 w-7 items-end justify-center overflow-hidden rounded-full"
                        style={{ background: "#F5F2EC" }}
                      >
                        <div
                          className="w-7 rounded-full transition-all duration-500"
                          style={{
                            height: `${height}px`,
                            background:
                              "linear-gradient(180deg, #1E3A5F 0%, #0D1B2E 100%)",
                          }}
                          title={`${item.date}: ${item.count}`}
                        />
                      </div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: "#9D7B32" }}
                      >
                        {formatTrendLabel(item.date)}
                      </p>
                      <p
                        className="text-[13px] font-bold"
                        style={{ color: "#1A1A2E" }}
                      >
                        {item.count}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Follow-up Watchlist */}
            <section className="surface p-5 lg:p-6">
              <h3
                className="font-(family-name:--font-display) text-2xl"
                style={{ color: "#1A1A2E" }}
              >
                Follow-up Watchlist
              </h3>
              <p className="mb-5 mt-1 text-[13px]" style={{ color: "#6B7280" }}>
                Members who may need a check-in
              </p>

              <div className="space-y-3">
                {(stats.attentionNeeded || []).length ? (
                  stats.attentionNeeded.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-xl border bg-white px-4 py-3"
                      style={{ borderColor: "#E8E2D9" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            className="font-semibold"
                            style={{ color: "#1A1A2E" }}
                          >
                            {member.name}
                          </p>
                          <p
                            className="mt-0.5 text-xs"
                            style={{ color: "#6B7280" }}
                          >
                            Last scan&nbsp;
                            {new Date(member.lastScannedAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{
                            background: "#EFF6FF",
                            color: "#1E3A5F",
                          }}
                        >
                          {member.recentCount}&nbsp;recent
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className="rounded-2xl border-2 border-dashed px-4 py-8 text-center text-sm"
                    style={{ borderColor: "#E8E2D9", color: "#6B7280" }}
                  >
                    No follow-up needed. Strong attendance this month 🙏
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
