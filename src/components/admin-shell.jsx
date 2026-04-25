"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearAdminSessionToken,
  getAdminSessionToken,
} from "@/lib/client-session";

const navGroups = [
  {
    heading: "Operations",
    items: [
      {
        href: "/admin/scanner",
        label: "Scanner",
        description: "Default live check-in",
      },
      {
        href: "/admin/attendance",
        label: "Attendance",
        description: "Service records",
      },
    ],
  },
  {
    heading: "Records",
    items: [
      {
        href: "/admin/members",
        label: "Directory",
        description: "Browse profiles",
      },
      {
        href: "/admin/members/add",
        label: "Add Member",
        description: "Create new profile",
      },
      {
        href: "/admin/cards",
        label: "Cards",
        description: "Printable QR cards",
      },
      {
        href: "/admin/dashboard",
        label: "Overview",
        description: "Quick summary",
      },
    ],
  },
];

export function AdminShell({ title, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function isItemActive(item) {
    return pathname === item.href;
  }

  async function handleLogout() {
    const token = getAdminSessionToken();
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: token ? { "x-admin-session": token } : {},
    });
    clearAdminSessionToken();
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen w-full gap-0 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* ── Desktop Sidebar ── */}
        <aside
          className="hidden lg:flex lg:flex-col"
          style={{
            background: "linear-gradient(180deg, #1E3A5F 0%, #0D1B2E 100%)",
          }}
        >
          <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
            {/* Branding */}
            <div className="px-5 pb-5 pt-6">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/80 shadow-md">
                  <Image
                    src="/logo_1.jpg"
                    alt="Church Logo"
                    fill
                    sizes="40px"
                    priority
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/80 shadow-md">
                  <Image
                    src="/logo_2.png"
                    alt="Ministry Logo"
                    fill
                    sizes="40px"
                    priority
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>

              <h2
                className="mt-3 text-[18px] font-semibold leading-snug text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Saint Anthony of Padua
              </h2>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-[#C9A84C]">
                Ministry of Lectors &amp; Commentators
              </p>
              <hr className="mt-4 border-[#C9A84C]/20" />
            </div>

            {/* Nav Groups */}
            <nav className="flex-1 overflow-y-auto px-3 pb-3">
              {navGroups.map((group) => (
                <section key={group.heading} className="mb-5">
                  <h3 className="mb-2 px-2 text-[9px] font-bold uppercase tracking-widest text-[#C9A84C]">
                    {group.heading}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isItemActive(item);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex flex-col rounded-xl px-4 py-3 transition-all ${
                            active
                              ? "bg-[rgba(201,168,76,0.15)]"
                              : "hover:bg-[rgba(255,255,255,0.08)]"
                          }`}
                          style={
                            active
                              ? {
                                  border: "1px solid rgba(201,168,76,0.4)",
                                  borderLeft: "3px solid #C9A84C",
                                }
                              : { border: "1px solid transparent" }
                          }
                        >
                          <p className="text-sm font-semibold text-white">
                            {item.label}
                          </p>
                          <p className="mt-0.5 text-xs text-white/60">
                            {item.description}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </nav>

            {/* Logout */}
            <div className="px-3 pb-5 pt-2">
              <hr className="mb-4 border-[#C9A84C]/20" />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main Content Column ── */}
        <div className="min-w-0 px-2 py-2 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
          {/* Mobile Header */}
          <header
            data-admin-shell-header
            className="sticky top-0 z-50 mb-4 overflow-visible rounded-2xl shadow-lg lg:hidden"
            style={{ background: "#1E3A5F" }}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-4 md:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-white/70">
                  <Image
                    src="/logo_1.jpg"
                    alt="Church Logo"
                    fill
                    sizes="32px"
                    priority
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#C9A84C]">
                    Ministry of Lectors &amp; Commentators
                  </p>
                  <h1
                    className="truncate text-[17px] font-semibold leading-tight text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {title || "Saint Anthony of Padua"}
                  </h1>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 text-white transition-all hover:bg-white/10 lg:hidden"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Toggle menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>

            {mobileOpen ? (
              <nav
                className="max-h-[70vh] overflow-y-auto px-3 pb-4 pt-2 lg:hidden"
                style={{ borderTop: "1px solid rgba(201,168,76,0.2)" }}
              >
                {navGroups.map((group) => (
                  <section key={group.heading} className="mb-4">
                    <h3 className="mb-2 px-2 text-[9px] font-bold uppercase tracking-widest text-[#C9A84C]">
                      {group.heading}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const active = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex flex-col rounded-xl px-3 py-2.5 transition-all ${
                              active
                                ? "bg-[rgba(201,168,76,0.15)]"
                                : "hover:bg-[rgba(255,255,255,0.08)]"
                            }`}
                            style={
                              active
                                ? {
                                    border: "1px solid rgba(201,168,76,0.4)",
                                    borderLeft: "3px solid #C9A84C",
                                  }
                                : { border: "1px solid transparent" }
                            }
                          >
                            <p className="text-sm font-semibold text-white">
                              {item.label}
                            </p>
                            <p className="mt-0.5 text-xs text-white/60">
                              {item.description}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}

                <hr className="mb-3 border-[#C9A84C]/20" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
                >
                  Logout
                </button>
              </nav>
            ) : null}
          </header>

          <main className="w-full space-y-4 pb-4 lg:space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
