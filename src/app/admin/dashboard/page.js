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

  const peakAttendance = Math.max(...(stats.weeklyAttendance || []).map((item) => item.count || 0), 1);

  useEffect(() => {
    apiFetch("/api/stats")
      .then(setStats)
      .catch(() => null);
  }, []);

  return (
    <RequireAdmin>
      <AdminShell title="Church QR Attendance Dashboard">
        <div className="w-full space-y-6">
          <section className="surface px-5 py-5 lg:px-6 lg:py-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8a2424]">Overview</p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-semibold text-[#4f3030]">Attendance overview</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#685757]">
                  A fast snapshot of active members, today&apos;s attendance, and queued sync work.
                </p>
              </div>
              <div className="rounded-full bg-[#f6ebeb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#7a1f1f]">
                Service date {stats.today}
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="surface p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8a2424]">Active Members</p>
              <p className="mt-3 text-4xl font-semibold text-[#4f3030]">{stats.memberCount}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#6f6060]">Members ready for scanning and card generation.</p>
            </div>
            <div className="surface p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8a2424]">Attendance Today</p>
              <p className="mt-3 text-4xl font-semibold text-[#4f3030]">{stats.todayCount}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#6f6060]">Live records captured on the selected service date.</p>
            </div>
            <div className="surface p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8a2424]">Queued Syncs</p>
              <p className="mt-3 text-4xl font-semibold text-[#4f3030]">{stats.queuedCount}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#6f6060]">Offline recoveries and pending uploads cleared today.</p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <section className="surface p-5 lg:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a2424]">Weekly Pulse</p>
                  <h3 className="mt-1 text-2xl font-semibold text-[#4f3030]">Attendance last 7 services</h3>
                </div>
                <p className="text-xs text-[#6f6060]">Peak {peakAttendance}</p>
              </div>

              <div className="mt-5 grid grid-cols-7 gap-2 sm:gap-3">
                {(stats.weeklyAttendance || []).map((item) => {
                  const height = Math.max(14, Math.round((item.count / peakAttendance) * 132));
                  return (
                    <div key={item.date} className="flex flex-col items-center gap-2 rounded-2xl bg-[#fbf7f7] px-2 py-3 ring-1 ring-[#efe3e3]">
                      <div className="flex h-36 w-full items-end justify-center">
                        <div
                          className="w-full max-w-[30px] rounded-full bg-[linear-gradient(180deg,#8a2424_0%,#5e1313_100%)] shadow-[0_10px_20px_rgba(122,31,31,0.18)] transition-all"
                          style={{ height: `${height}px` }}
                          title={`${item.date}: ${item.count}`}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a1f1f]">{formatTrendLabel(item.date)}</p>
                        <p className="mt-1 text-sm font-semibold text-[#4f3030]">{item.count}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="surface p-5 lg:p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a2424]">Attention Needed</p>
              <h3 className="mt-1 text-2xl font-semibold text-[#4f3030]">Follow-up watchlist</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6f6060]">
                Members with repeated recent attendance who have gone quiet should be checked in.
              </p>

              <div className="mt-4 space-y-3">
                {(stats.attentionNeeded || []).length ? stats.attentionNeeded.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-[#ebe0e0] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(122,31,31,0.05)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#4f3030]">{member.name}</p>
                        <p className="mt-1 text-xs text-[#6f6060]">Last scan {new Date(member.lastScannedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                      </div>
                      <span className="rounded-full bg-[#f6ebeb] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a1f1f]">
                        {member.recentCount} recent
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-[#e5d8d8] bg-[#fbf7f7] px-4 py-8 text-sm text-[#6f6060]">
                    No follow-up watchlist yet. Strong attendance signal across the last month.
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
