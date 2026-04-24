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
    if (typeof window === "undefined" || audioRef.current) return audioRef.current;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioRef.current = new AudioContextCtor();
    return audioRef.current;
  }

  async function playTone(frequency, duration = 0.08, gainValue = 0.04, type = "sine") {
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
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
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
    if (lastScanRef.current.token === qrToken && now - lastScanRef.current.time < 3000) {
      return; // Ignore rapid duplicate scans of the same code within 3 seconds
    }
    lastScanRef.current = { token: qrToken, time: now };

    const serviceDate = todayManila();

    if (isOnline) {
      try {
        const response = await apiFetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: [{ qrToken, serviceDate, source: "online" }] }),
        });
        const result = response.results?.[0];
        if (result?.status === "ok") {
          log({ status: "Accepted", text: `${result.member.last_name}, ${result.member.first_name}` });
          triggerFeedback("success");
        } else if (result?.status === "duplicate") {
          log({ status: "Already Recorded", text: `${result.member.last_name}, ${result.member.first_name}` });
          triggerFeedback("duplicate");
          Swal.fire({
            icon: "warning",
            title: "Already Recorded",
            html: `<b>${result.member.first_name} ${result.member.last_name}</b> has already been scanned for today's service.`,
            showConfirmButton: false,
            timer: 3000,
            customClass: {
              popup: "!rounded-[32px] border-2 border-[#e6dbdb] bg-white shadow-2xl p-4",
              title: "text-2xl font-black text-[#8a2424]",
            }
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
          popup: "!rounded-[32px] border-2 border-[#e6dbdb] bg-white shadow-2xl p-4",
          title: "text-2xl font-black text-[#8a2424]",
        }
      });
      return;
    }

    const queue = readQueue();
    queue.push({ qrToken, serviceDate, scannedAt: new Date().toISOString(), source: "offline-sync" });
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
      log({ status: "Sync Failed", text: "Still offline or server unreachable." });
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
      () => null
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
          <section className="surface px-5 py-5 lg:px-6 lg:py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#8a2424]">Live Operations</p>
                <h2 className="mt-1 text-3xl font-semibold text-[#4f3030]">QR Scanner</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#685757]">
                  Keep the camera centered, scan one member at a time, and use sync when the connection recovers.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${isOnline ? "bg-[#edf7ee] text-[#2f6d3a]" : "bg-[#f8edea] text-[#9a4939]"}`}>
                  {isOnline ? "Online" : "Offline"}
                </div>
                <div className="rounded-full bg-[#f6efdf] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#8c6c33]">
                  Queue {queueSize}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="surface p-5 lg:p-6">
              <div className={`relative overflow-hidden rounded-[24px] border bg-[#f5f1e8] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-colors ${scanFlash === "success" ? "border-[#8fd29a]" : scanFlash === "duplicate" ? "border-[#e2c07e]" : scanFlash === "queued" ? "border-[#93b7ff]" : scanFlash === "error" ? "border-[#e4a1a1]" : "border-[#e7dcc8]"}`}>
                <div className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${scanFlash === "success" ? "opacity-100 bg-[radial-gradient(circle_at_center,rgba(47,109,58,0.16),transparent_70%)]" : scanFlash === "duplicate" ? "opacity-100 bg-[radial-gradient(circle_at_center,rgba(154,73,57,0.16),transparent_70%)]" : scanFlash === "queued" ? "opacity-100 bg-[radial-gradient(circle_at_center,rgba(47,77,140,0.14),transparent_70%)]" : scanFlash === "error" ? "opacity-100 bg-[radial-gradient(circle_at_center,rgba(154,73,57,0.14),transparent_70%)]" : "opacity-0"}`} />
                <div id="reader" className="relative z-10 overflow-hidden" />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-primary px-4 py-2.5" onClick={() => { ensureAudio(); void startScanner(); }}>
                  Start Camera
                </button>
                <button className="btn-ghost px-4 py-2.5" onClick={stopScanner}>
                  Stop
                </button>
                <button className="btn-ghost px-4 py-2.5" onClick={syncNow}>
                  Sync Now ({queueSize})
                </button>
              </div>
            </section>

            <section className="surface p-5 lg:p-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#8a2424]">Recent Activity</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#4f3030]">Scan Feed</h3>
                </div>
                <p className="text-xs text-[#6f6060]">Latest 15 events</p>
              </div>

              <div className="mt-4 space-y-2">
                {feed.length ? feed.map((row, idx) => (
                  <div key={`${row.status}-${idx}`} className="rounded-2xl border border-[#ebe0e0] bg-[#fbf7f7] px-4 py-3">
                    <p className="font-semibold text-[#4f3030]">{row.status}</p>
                    <p className="mt-1 break-all text-sm text-[#6f6060]">{row.text}</p>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-[#e5d8d8] bg-white px-4 py-8 text-center text-sm text-[#6f6060]">
                    Waiting for the first scan.
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
