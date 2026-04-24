"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { RequireAdmin } from "@/components/require-admin";
import { apiFetch } from "@/lib/api-client";
import { CustomCalendar } from "@/components/ui/custom-calendar";

function todayManila() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function AttendancePage() {
  const [date, setDate] = useState(todayManila());
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let mounted = true;
    apiFetch(`/api/attendance?date=${date}`)
      .then((data) => {
        if (mounted) setRows(data.attendance || []);
      })
      .catch(() => null);

    return () => {
      mounted = false;
    };
  }, [date]);

  return (
    <RequireAdmin>
      <AdminShell title="Attendance Logs">
        <div className="w-full space-y-6">
          <section className="surface px-5 py-5 lg:px-6 lg:py-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#9a7838]">Records</p>
                <h2 className="mt-1 text-3xl font-semibold text-[#4f4028]">Attendance by service date</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6f644f]">
                  Browse the day&apos;s scanned members and review the scan source in a clean, readable table.
                </p>
              </div>

              <div className="surface-soft p-3">
                <CustomCalendar 
                  label="Select Service Date" 
                  value={date} 
                  onChange={setDate} 
                  align="right"
                />
              </div>
            </div>
          </section>

          <section className="surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#f7f1e5] text-left text-[#483d2c]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Sex</th>
                    <th className="px-4 py-3 font-semibold">Age</th>
                    <th className="px-4 py-3 font-semibold">Scanned At</th>
                    <th className="px-4 py-3 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? rows.map((row) => (
                    <tr key={row.id} className="border-t border-[#efe5d4] text-[#655841]">
                      <td className="px-4 py-3">{row.member.last_name}, {row.member.first_name} {row.member.middle_name}</td>
                      <td className="px-4 py-3">{row.member.sex}</td>
                      <td className="px-4 py-3">{row.member.age}</td>
                      <td className="px-4 py-3">{new Date(row.scanned_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.source === "offline-sync" ? "bg-[#f6e9dc] text-[#8b5c36]" : "bg-[#edf7ee] text-[#2f6d3a]"}`}>
                          {row.source}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#7b6d53]">
                        No attendance records for this date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
