"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clearAdminSessionToken, getAdminSessionToken } from "@/lib/client-session";

const navGroups = [
  {
    heading: "Operations",
    items: [
      { href: "/admin/scanner", label: "Scanner", description: "Default live check-in" },
      { href: "/admin/attendance", label: "Attendance", description: "Service records" },
    ],
  },
  {
    heading: "Records",
    items: [
      { href: "/admin/members", label: "Directory", description: "Browse profiles" },
      { href: "/admin/members/add", label: "Add Member", description: "Create new profile" },
      { href: "/admin/cards", label: "Cards", description: "Printable QR cards" },
      { href: "/admin/dashboard", label: "Overview", description: "Quick summary" },
    ],
  },
];

export function AdminShell({ title, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <div className="min-h-screen text-[#2b2222]">
      <div className="grid min-h-screen w-full gap-0 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#ece3e3] bg-[linear-gradient(180deg,#fffdfd_0%,#fbf6f6_100%)] lg:block">
          <div className="sticky top-0 flex h-screen flex-col p-5 xl:p-6">
            <div className="surface border-[#ece3e3] bg-white/90 px-5 py-5 shadow-[0_10px_30px_rgba(85,30,30,0.06)]">
              <p className="text-[11px] uppercase tracking-[0.32em] text-[#8a2424]">Church Attendance</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#4a2e2e]">Admin Console</h1>
              <p className="mt-2 text-sm leading-relaxed text-[#685757]">Scanner-first operations with management tools separated for faster admin work.</p>
            </div>

            <nav className="mt-5 space-y-4">
              {navGroups.map((group) => (
                <section key={group.heading} className="surface-soft p-3 xl:p-4">
                  <h2 className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7a1f1f]">{group.heading}</h2>
                  <div className="mt-3 grid gap-2">
                    {group.items.map((item) => {
                      const active = isItemActive(item);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`rounded-2xl border px-4 py-3 transition ${
                            active
                              ? "border-[#8a2424] bg-white text-[#4f2525] shadow-[0_8px_18px_rgba(122,31,31,0.08)]"
                              : "border-transparent bg-transparent text-[#4f4141] hover:border-[#ece3e3] hover:bg-white"
                          }`}
                        >
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="mt-0.5 text-xs text-[#7f6d6d]">{item.description}</p>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </nav>

            <div className="mt-auto pt-5">
              <button type="button" onClick={handleLogout} className="btn-ghost w-full px-4 py-3 text-sm font-semibold">
                Logout
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
          <header data-admin-shell-header className="surface mb-5 overflow-hidden lg:hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[#ece3e3] px-4 py-4 md:px-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#8a2424]">Church Attendance</p>
                <h1 className="mt-1 text-2xl font-semibold text-[#5a3a3a]">Admin Console</h1>
              </div>

              <button
                type="button"
                className="btn-ghost inline-flex h-10 w-10 items-center justify-center p-0 lg:hidden"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label="Toggle menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>

            {mobileOpen ? (
              <nav className="space-y-3 px-4 py-4 lg:hidden">
                {navGroups.map((group) => (
                  <section key={group.heading} className="surface-soft p-3">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a1f1f]">{group.heading}</h2>
                    <div className="mt-2 grid gap-2">
                      {group.items.map((item) => {
                        const active = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`rounded-xl border px-3 py-2.5 transition ${
                              active
                                ? "border-[#8a2424] bg-[linear-gradient(145deg,#f4e6e6,#eadbdb)] text-[#4f2525]"
                                : "border-[#ece3e3] bg-white text-[#4f4141]"
                            }`}
                          >
                            <p className="text-sm font-semibold">{item.label}</p>
                            <p className="mt-0.5 text-xs text-[#7f6d6d]">{item.description}</p>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}

                <button type="button" onClick={handleLogout} className="btn-ghost w-full px-4 py-2.5 text-sm font-semibold">
                  Logout
                </button>
              </nav>
            ) : null}
          </header>

          <main className="w-full space-y-5 lg:space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
