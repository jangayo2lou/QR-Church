"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { RequireAdmin } from "@/components/require-admin";
import { apiFetch } from "@/lib/api-client";
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { CustomSelect } from "@/components/ui/custom-select";

const PAGE_SIZE = 12;

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array(b.length + 1).fill(0);
  const curr = new Array(b.length + 1).fill(0);

  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }

  return prev[b.length];
}

function fuzzyIncludes(haystack, needle) {
  if (!needle) return true;
  if (haystack.includes(needle)) return true;

  const maxDistance = needle.length <= 4 ? 1 : 2;
  const words = haystack.split(" ").filter(Boolean);

  return words.some((word) => {
    if (Math.abs(word.length - needle.length) > maxDistance) return false;
    return levenshteinDistance(word, needle) <= maxDistance;
  });
}

function matchesQuery(values, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;

  const terms = normalizedQuery.split(" ").filter(Boolean);
  const normalizedValues = values.map(normalizeText).filter(Boolean);
  if (!normalizedValues.length) return false;

  return terms.every((term) =>
    normalizedValues.some((value) => fuzzyIncludes(value, term)),
  );
}

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
  const [dayScope, setDayScope] = useState("selected");
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [sexFilter, setSexFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    const dateParam = dayScope === "all" ? "all" : date;
    apiFetch(`/api/attendance?date=${encodeURIComponent(dateParam)}`)
      .then((data) => {
        if (mounted) {
          setRows(data.attendance || []);
          setPage(1);
        }
      })
      .catch(() => null);

    return () => {
      mounted = false;
    };
  }, [date, dayScope]);

  const sourceOptions = useMemo(() => {
    const sources = Array.from(new Set(rows.map((row) => row.source).filter(Boolean)));
    return sources.sort();
  }, [rows]);

  const sourceFilterOptions = useMemo(
    () => [
      { label: "All Sources", value: "all" },
      ...sourceOptions.map((source) => ({ label: source, value: source })),
    ],
    [sourceOptions],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (sexFilter !== "all" && row.member?.sex !== sexFilter) return false;
      if (sourceFilter !== "all" && row.source !== sourceFilter) return false;

      return matchesQuery(
        [
          `${row.member?.last_name || ""}, ${row.member?.first_name || ""} ${row.member?.middle_name || ""}`,
          row.member?.sex,
          row.source,
          String(row.member?.age || ""),
        ],
        search,
      );
    });
  }, [rows, search, sexFilter, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, sexFilter, sourceFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  return (
    <RequireAdmin>
      <AdminShell title="Attendance Logs">
        <div className="w-full space-y-5 lg:space-y-6">
          {/* ── Page Header ── */}
          <section className="surface border-l-4 border-[#C9A84C] px-5 py-5 lg:px-6 lg:py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9D7B32]">
                  Records
                </p>
                <h2
                  className="mt-1 text-[24px] font-semibold leading-tight text-[#1A1A2E] sm:text-[30px]"
                  style={{ fontFamily: "var(--font-display), serif" }}
                >
                  Attendance by Service Date
                </h2>
              </div>

              <div className="surface-soft rounded-2xl p-3">
                {dayScope === "selected" ? (
                  <CustomCalendar
                    label="Select Service Date"
                    value={date}
                    onChange={setDate}
                    align="right"
                  />
                ) : (
                  <div className="flex min-h-[64px] items-center rounded-2xl border border-[#E8E2D9] bg-white px-4 text-sm font-semibold text-[#9D7B32]">
                    Showing attendance from all service days
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Attendance Table ── */}
          <section className="surface overflow-hidden">
            <div className="border-b border-[#E8E2D9] bg-[#FCFAF6] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <div className="relative min-w-0 basis-full md:flex-1">
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9D7B32]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="m21 21-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search records (typo-friendly)"
                    className="h-[44px] w-full rounded-xl border border-[#E8E2D9] bg-white py-2 pl-9 pr-3 text-sm font-medium text-[#1A1A2E] outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/25"
                  />
                </div>

                <div className="w-full sm:w-[48%] md:w-[190px]">
                  <CustomSelect
                    value={dayScope}
                    options={[
                      { label: "Selected Day", value: "selected" },
                      { label: "All Days", value: "all" },
                    ]}
                    onChange={setDayScope}
                    compact
                  />
                </div>
                <div className="w-full sm:w-[48%] md:w-[170px]">
                  <CustomSelect
                    value={sexFilter}
                    options={[
                      { label: "All Sexes", value: "all" },
                      { label: "Male", value: "Male" },
                      { label: "Female", value: "Female" },
                    ]}
                    onChange={setSexFilter}
                    compact
                  />
                </div>
                <div className="w-full sm:w-[48%] md:w-[210px]">
                  <CustomSelect
                    value={sourceFilter}
                    options={sourceFilterOptions}
                    onChange={setSourceFilter}
                    compact
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#F5F2EC] text-left">
                  <tr>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
                      Name
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
                      Sex
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
                      Age
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
                      Scanned At
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length ? (
                    paginatedRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-[#E8E2D9] text-[#4A5568] transition-colors hover:bg-[#FDFCF8]"
                      >
                        {/* Name */}
                        <td className="px-5 py-3.5 font-semibold text-[#1A1A2E]">
                          {row.member.last_name}, {row.member.first_name}{" "}
                          {row.member.middle_name}
                        </td>

                        {/* Sex */}
                        <td className="px-5 py-3.5">{row.member.sex}</td>

                        {/* Age */}
                        <td className="px-5 py-3.5">{row.member.age}</td>

                        {/* Scanned At */}
                        <td className="px-5 py-3.5 text-xs">
                          {new Date(row.scanned_at).toLocaleString()}
                        </td>

                        {/* Source Badge */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              row.source === "offline-sync"
                                ? "bg-[#FDF6E3] text-[#9D7B32]"
                                : "bg-[#F0FDF4] text-[#16A34A]"
                            }`}
                          >
                            {row.source}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#E8E2D9] py-10">
                          <svg
                            className="h-10 w-10 text-[#C9A84C] opacity-40"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          <p className="text-sm font-semibold text-[#4A5568]">
                            No records match your current search/filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Count Footer ── */}
            {filteredRows.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E2D9] px-5 py-3">
                <span className="text-xs font-semibold text-[#9D7B32]">
                  Showing {paginatedRows.length} of {filteredRows.length}{" "}
                  {filteredRows.length === 1 ? "record" : "records"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-[#E8E2D9] px-3 py-1.5 text-xs font-semibold text-[#4A5568] transition enabled:hover:bg-[#FDF6E3] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold text-[#4A5568]">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-[#E8E2D9] px-3 py-1.5 text-xs font-semibold text-[#4A5568] transition enabled:hover:bg-[#FDF6E3] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
