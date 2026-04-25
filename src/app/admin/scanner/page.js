"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { AdminShell } from "@/components/admin-shell";
import { RequireAdmin } from "@/components/require-admin";
import { apiFetch } from "@/lib/api-client";

const QUEUE_KEY = "church_offline_scan_queue";
const LOCAL_DAY_KEY = "church_local_day_map";

function todayManila() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function readQueue() {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
}

function writeQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function readLocalDayMap() {
  return JSON.parse(localStorage.getItem(LOCAL_DAY_KEY) || "{}");
}

function writeLocalDayMap(map) {
  localStorage.setItem(LOCAL_DAY_KEY, JSON.stringify(map));
}

function getFeedItemStyle(status) {
  if (status === "Accepted" || status === "Synced") {
    return {
      borderColor: "#16A34A",
      background: "#F0FDF4",
      textColor: "#16A34A",
    };
  }
  if (status === "Already Recorded") {
    return {
      borderColor: "#D97706",
      background: "#FFFBEB",
      textColor: "#D97706",
    };
  }
  if (status === "Queued Offline" || status === "Already Queued") {
    return {
      borderColor: "#1E3A5F",
      background: "#EFF6FF",
      textColor: "#1E3A5F",
    };
  }
  return {
    borderColor: "#DC2626",
    background: "#FEF2F2",
    textColor: "#DC2626",
  };
}

export default function ScannerPage() {
  const scannerRef = useRef(null);
  const lastScanRef = useRef({ token: null, time: 0 });
  const audioRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const [feed, setFeed] = useState([]);
  const [scanFlash, setScanFlash] = useState(null);

  function ensureAudio() {
    if (typeof window === "undefined" || audioRef.current)
      return audioRef.current;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioRef.current = new AudioContextCtor();
    return audioRef.current;
  }

  async function playTone(
    frequency,
    duration = 0.08,
    gainValue = 0.04,
    type = "sine",
  ) {
    const context = ensureAudio();
    if (!context) return;
    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return;
      }
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = gainValue;
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + duration,
    );
    oscillator.stop(context.currentTime + duration + 0.02);
  }

  function triggerFeedback(kind) {
    setScanFlash(kind);
    window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => setScanFlash(null), 650);

    if (kind === "success") {
      void playTone(740, 0.06, 0.03, "triangle");
      window.navigator?.vibrate?.([30, 50, 30]);
      return;
    }

    if (kind === "duplicate") {
      void playTone(260, 0.1, 0.025, "sine");
      window.navigator?.vibrate?.([20, 30, 20]);
      return;
    }

    if (kind === "queued") {
      void playTone(520, 0.08, 0.03, "square");
      window.navigator?.vibrate?.(40);
      return;
    }

    void playTone(180, 0.12, 0.02, "sawtooth");
  }

  function log(item) {
    setFeed((prev) => [item, ...prev].slice(0, 15));
  }

  async function processScan(qrToken) {
    const now = Date.now();
    if (
      lastScanRef.current.token === qrToken &&
      now - lastScanRef.current.time < 3000
    ) {
      return; // Ignore rapid duplicate scans of the same code within 3 seconds
    }
    lastScanRef.current = { token: qrToken, time: now };

    const serviceDate = todayManila();

    if (isOnline) {
      try {
        const response = await apiFetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entries: [{ qrToken, serviceDate, source: "online" }],
          }),
        });
        const result = response.results?.[0];
        if (result?.status === "ok") {
          log({
            status: "Accepted",
            text: `${result.member.last_name}, ${result.member.first_name}`,
          });
          triggerFeedback("success");
        } else if (result?.status === "duplicate") {
          log({
            status: "Already Recorded",
            text: `${result.member.last_name}, ${result.member.first_name}`,
          });
          triggerFeedback("duplicate");
          Swal.fire({
            icon: "warning",
            title: "Already Recorded",
            html: `<b>${result.member.first_name} ${result.member.last_name}</b> has already been scanned for today's service.`,
            showConfirmButton: false,
            timer: 3000,
            customClass: {
              popup:
                "!rounded-[32px] border-2 border-[#e6dbdb] bg-white shadow-2xl p-4",
              title: "text-2xl font-black text-[#8a2424]",
            },
          });
        } else {
          log({ status: "Unknown QR", text: qrToken });
        }
        return;
      } catch {
        setIsOnline(false);
      }
    }

    const dayMap = readLocalDayMap();
    const localKey = `${serviceDate}:${qrToken}`;
    if (dayMap[localKey]) {
      log({ status: "Already Queued", text: qrToken });
      Swal.fire({
        icon: "warning",
        title: "Already Queued",
        text: "This QR code is already in the offline queue for today.",
        showConfirmButton: false,
        timer: 3000,
        customClass: {
          popup:
            "!rounded-[32px] border-2 border-[#e6dbdb] bg-white shadow-2xl p-4",
          title: "text-2xl font-black text-[#8a2424]",
        },
      });
      return;
    }

    const queue = readQueue();
    queue.push({
      qrToken,
      serviceDate,
      scannedAt: new Date().toISOString(),
      source: "offline-sync",
    });
    dayMap[localKey] = true;
    writeQueue(queue);
    writeLocalDayMap(dayMap);
    setQueueSize(queue.length);
    log({ status: "Queued Offline", text: qrToken });
    triggerFeedback("queued");
  }

  async function syncNow() {
    const queue = readQueue();
    if (!queue.length) return;

    try {
      const response = await apiFetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: queue }),
      });

      const nextQueue = [];
      for (let i = 0; i < response.results.length; i += 1) {
        const result = response.results[i];
        const original = queue[i];
        if (result.status === "ok" || result.status === "duplicate") {
          log({ status: "Synced", text: original.qrToken });
        } else {
          nextQueue.push(original);
        }
      }
      writeQueue(nextQueue);
      setQueueSize(nextQueue.length);
      if (!nextQueue.length) writeLocalDayMap({});
      setIsOnline(true);
    } catch {
      setIsOnline(false);
      log({
        status: "Sync Failed",
        text: "Still offline or server unreachable.",
      });
      triggerFeedback("error");
    }
  }

  useEffect(() => {
    setQueueSize(readQueue().length);
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => null);
          }
        } catch (error) {
          // Ignore synchronous stop errors during unmount
        }
      }
      if (audioRef.current) {
        audioRef.current.close?.().catch(() => null);
      }
      window.clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  async function startScanner() {
    if (started) return;
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      async (decodedText) => {
        await processScan(decodedText.trim());
      },
      () => null,
    );
    setStarted(true);
  }

  async function stopScanner() {
    if (!scannerRef.current) return;
    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
    } catch (error) {
      console.warn("Failed to stop scanner:", error);
    }
    setStarted(false);
  }

  return (
    <RequireAdmin>
      <AdminShell title="QR Scanner">
        <div className="w-full space-y-6">
          {/* ── Page Header ── */}
          <section className="surface px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "#9D7B32" }}
                >
                  Live Operations
                </p>
                <h2
                  className="mt-1 font-(family-name:--font-display) text-[32px] leading-tight"
                  style={{ color: "#1A1A2E" }}
                >
                  QR Scanner
                </h2>
                <p
                  className="mt-2 max-w-xl text-sm leading-relaxed"
                  style={{ color: "#6B7280" }}
                >
                  Keep the camera centered, scan one member at a time, and use
                  sync when the connection recovers.
                </p>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={
                    isOnline
                      ? { background: "#F0FDF4", color: "#16A34A" }
                      : { background: "#FEF2F2", color: "#DC2626" }
                  }
                >
                  {isOnline ? "● Online" : "● Offline"}
                </span>
                <span
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{ background: "#FDF6E3", color: "#9D7B32" }}
                >
                  Queue&nbsp;{queueSize}
                </span>
              </div>
            </div>
          </section>

          {/* ── Main Two-Column Layout ── */}
          <div className="grid gap-6 xl:grid-cols-[11fr_9fr]">
            {/* ── Camera Section ── */}
            <section className="surface p-5 lg:p-6">
              {/* Camera viewport */}
              <div
                className="relative overflow-hidden rounded-2xl"
                style={{ background: "#F5F2EC" }}
              >
                {/* Scan-result flash overlay */}
                <div
                  className={`pointer-events-none absolute inset-0 z-10 rounded-2xl transition-all duration-300 ${
                    scanFlash === "success"
                      ? "opacity-100 border border-[#16A34A]/30 bg-[radial-gradient(circle_at_center,rgba(22,163,74,0.15),transparent_70%)]"
                      : scanFlash === "duplicate"
                        ? "opacity-100 border border-[#D97706]/30 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.15),transparent_70%)]"
                        : scanFlash === "queued"
                          ? "opacity-100 border border-[#1E3A5F]/30 bg-[radial-gradient(circle_at_center,rgba(30,58,95,0.15),transparent_70%)]"
                          : scanFlash === "error"
                            ? "opacity-100 border border-[#DC2626]/30 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15),transparent_70%)]"
                            : "opacity-0"
                  }`}
                />
                <div id="reader" className="relative z-0 overflow-hidden" />
              </div>

              {/* Button row */}
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button
                  className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
                  onClick={() => {
                    ensureAudio();
                    void startScanner();
                  }}
                >
                  {/* Camera icon */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Start Camera
                </button>

                <button
                  className="btn-ghost px-5 py-2.5 text-sm font-semibold"
                  onClick={stopScanner}
                >
                  Stop
                </button>

                <button
                  className="btn-ghost inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
                  onClick={syncNow}
                >
                  {/* Sync icon */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Sync Now ({queueSize})
                </button>
              </div>
            </section>

            {/* ── Scan Feed Section ── */}
            <section className="surface p-5 lg:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3
                  className="font-(family-name:--font-display) text-xl"
                  style={{ color: "#1A1A2E" }}
                >
                  Scan Feed
                </h3>
                <p className="text-xs" style={{ color: "#9D7B32" }}>
                  Latest 15 events
                </p>
              </div>

              <div className="space-y-2">
                {feed.length ? (
                  feed.map((row, idx) => {
                    const s = getFeedItemStyle(row.status);
                    return (
                      <div
                        key={`${row.status}-${idx}`}
                        className="rounded-xl px-4 py-3"
                        style={{
                          borderLeft: `3px solid ${s.borderColor}`,
                          background: s.background,
                        }}
                      >
                        <p
                          className="text-sm font-bold"
                          style={{ color: s.textColor }}
                        >
                          {row.status}
                        </p>
                        <p
                          className="mt-0.5 break-all text-[13px]"
                          style={{ color: "#4A5568" }}
                        >
                          {row.text}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div
                    className="rounded-2xl border-2 border-dashed px-4 py-10 text-center text-sm"
                    style={{ borderColor: "#E8E2D9", color: "#6B7280" }}
                  >
                    Waiting for the first scan 🙏
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
