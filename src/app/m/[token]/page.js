"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
}

function getInitials(firstName, lastName) {
  return `${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`.toUpperCase();
}

/* ─────────────────────────────────────────
   Loading Screen
───────────────────────────────────────── */
function LoadingScreen() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "#FDFCF8" }}
    >
      <div
        className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: "#1E3A5F", borderTopColor: "transparent" }}
      />
      <p className="font-semibold text-sm" style={{ color: "#1E3A5F" }}>
        Loading your profile…
      </p>
    </main>
  );
}

/* ─────────────────────────────────────────
   Not Found Screen
───────────────────────────────────────── */
function NotFoundScreen() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-3"
      style={{ background: "#FDFCF8" }}
    >
      <span className="text-5xl select-none">✝️</span>
      <h1
        className="text-2xl font-bold"
        style={{ color: "#1E3A5F", fontFamily: "var(--font-display)" }}
      >
        Profile Not Found
      </h1>
      <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#9CA3AF" }}>
        This QR code is not registered in our system.
      </p>
    </main>
  );
}

/* ─────────────────────────────────────────
   Main Page
───────────────────────────────────────── */
export default function MemberProfilePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/profile/${token}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const json = await res.json();
        if (json.error) {
          setNotFound(true);
          return;
        }
        setData(json);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingScreen />;
  if (notFound || !data) return <NotFoundScreen />;

  const { member, stats } = data;
  const initials = getInitials(member.firstName, member.lastName);
  const displayName = `${member.firstName}${member.middleName ? " " + member.middleName : ""} ${member.lastName}`;

  return (
    <main
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #1E3A5F 0%, #0D1B2E 35%, #FDFCF8 35%)",
      }}
    >
      {/* ── Church Header (navy section) ── */}
      <div className="px-4 pt-10 pb-24 text-center">
        {/* Logos */}
        <div className="flex justify-center items-center gap-4 mb-3">
          <div
            className="relative overflow-hidden bg-white shrink-0"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "2px solid white",
            }}
          >
            <Image
              src="/logo_1.jpg"
              alt="Parish Logo"
              fill
              sizes="36px"
              className="object-contain"
              unoptimized
            />
          </div>
          <div
            className="relative overflow-hidden bg-white shrink-0"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "2px solid white",
            }}
          >
            <Image
              src="/logo_2.png"
              alt="Ministry Logo"
              fill
              sizes="36px"
              className="object-contain"
              unoptimized
            />
          </div>
        </div>

        {/* Church Name */}
        <h1
          className="text-white text-[18px] font-semibold leading-snug"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Saint Anthony of Padua Parish
        </h1>

        {/* Ministry tag */}
        <p
          className="mt-1 font-bold"
          style={{
            color: "#C9A84C",
            fontSize: "9px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Ministry of Lectors &amp; Commentators
        </p>
      </div>

      {/* ── Profile Card (floats over the navy→cream boundary) ── */}
      <div className="px-4 -mt-16 pb-6">
        <div
          className="mx-auto max-w-sm"
          style={{
            background: "white",
            borderRadius: "28px",
            boxShadow: "0 20px 60px rgba(26,58,95,0.15)",
            overflow: "hidden",
          }}
        >
          {/* Navy accent stripe at top of card */}
          <div style={{ background: "#1E3A5F", height: "6px" }} />

          {/* ── Avatar + Identity Block ── */}
          <div className="px-6 pt-6 pb-5 text-center">
            {/* Avatar */}
            <div className="flex justify-center mb-3">
              {member.avatarUrl ? (
                <div
                  className="relative rounded-full overflow-hidden shrink-0"
                  style={{
                    width: 96,
                    height: 96,
                    outline: "4px solid #C9A84C",
                    outlineOffset: "2px",
                  }}
                >
                  <Image
                    src={member.avatarUrl}
                    alt={displayName}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div
                  className="rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
                  style={{
                    width: 96,
                    height: 96,
                    background: "#1E3A5F",
                    outline: "4px solid #C9A84C",
                    outlineOffset: "2px",
                  }}
                >
                  {initials}
                </div>
              )}
            </div>

            {/* Verified badge */}
            <div className="flex justify-center mb-3">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "#FDF6E3", color: "#9D7B32" }}
              >
                ✓ Verified Parish Member
              </span>
            </div>

            {/* Member name */}
            <h2
              className="text-[26px] font-bold leading-tight"
              style={{
                color: "#1A1A2E",
                fontFamily: "var(--font-display)",
              }}
            >
              {member.firstName} {member.lastName}
            </h2>

            {/* Ministry badge */}
            <div className="flex justify-center mt-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "#EFF6FF", color: "#1E3A5F" }}
              >
                Lectors &amp; Commentators
              </span>
            </div>

            {/* Member since */}
            <p className="mt-2 text-[12px]" style={{ color: "#9CA3AF" }}>
              Member since {member.memberSinceYear}
            </p>
          </div>

          {/* ── Stats: This Month / This Year ── */}
          <div className="px-6 pb-5">
            <div
              className="border-t pt-4"
              style={{ borderColor: "#E8E2D9" }}
            >
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p
                    className="font-semibold uppercase"
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.18em",
                      color: "#9D7B32",
                    }}
                  >
                    This Month
                  </p>
                  <p
                    className="font-bold leading-none mt-1"
                    style={{
                      fontSize: "32px",
                      fontFamily: "var(--font-display)",
                      color: "#1E3A5F",
                    }}
                  >
                    {stats.thisMonthCount}
                  </p>
                </div>
                <div>
                  <p
                    className="font-semibold uppercase"
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.18em",
                      color: "#9D7B32",
                    }}
                  >
                    This Year
                  </p>
                  <p
                    className="font-bold leading-none mt-1"
                    style={{
                      fontSize: "32px",
                      fontFamily: "var(--font-display)",
                      color: "#1E3A5F",
                    }}
                  >
                    {stats.thisYearCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Streak Banner ── */}
          <div className="px-6 pb-5">
            <div
              className="rounded-2xl px-4 py-3 flex items-center justify-between gap-2"
              style={{ background: "#FDF6E3" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg select-none">🔥</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "#4A5568" }}
                >
                  Current Streak
                </span>
              </div>
              {stats.streak > 0 ? (
                <span
                  className="text-sm font-bold"
                  style={{ color: "#1E3A5F" }}
                >
                  {stats.streak} service{stats.streak !== 1 ? "s" : ""}
                </span>
              ) : (
                <span
                  className="text-xs font-semibold text-right"
                  style={{ color: "#9D7B32" }}
                >
                  Keep attending to build your streak!
                </span>
              )}
            </div>
          </div>

          {/* ── Recent Services ── */}
          <div className="px-6 pb-7">
            <p
              className="font-semibold uppercase mb-3"
              style={{
                fontSize: "10px",
                letterSpacing: "0.2em",
                color: "#9D7B32",
              }}
            >
              Recent Services
            </p>

            {stats.recentAttendance.length > 0 ? (
              <div>
                {stats.recentAttendance.map((record, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2"
                    style={{
                      borderBottom:
                        i < stats.recentAttendance.length - 1
                          ? "1px solid #E8E2D9"
                          : "none",
                    }}
                  >
                    <span
                      className="text-[13px]"
                      style={{ color: "#4A5568" }}
                    >
                      {formatDate(record.date)}
                    </span>
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: "#16A34A" }}
                    >
                      ✅ Present
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="text-center text-sm py-5"
                style={{ color: "#9CA3AF" }}
              >
                No attendance records yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Bible Verse ── */}
      <div className="px-8 py-6 text-center">
        <p
          className="italic leading-relaxed"
          style={{ color: "#4A5568", fontSize: "13px" }}
        >
          &ldquo;For we are God&rsquo;s handiwork, created in Christ Jesus to
          do good works.&rdquo;
        </p>
        <p
          className="mt-1 font-semibold"
          style={{ color: "#9D7B32", fontSize: "11px" }}
        >
          — Ephesians 2:10
        </p>
      </div>

      {/* ── Footer ── */}
      <div className="px-4 pb-10 text-center space-y-0.5">
        <p style={{ color: "#9CA3AF", fontSize: "11px" }}>
          Saint Anthony of Padua Parish
        </p>
        <p style={{ color: "#9CA3AF", fontSize: "11px" }}>
          Barotac Nuevo, Iloilo, Philippines
        </p>
      </div>
    </main>
  );
}
