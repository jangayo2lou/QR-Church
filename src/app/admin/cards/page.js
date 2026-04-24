"use client";

import Image from "next/image";
import QRCode from "react-qr-code";
import { useEffect, useMemo, useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { AdminShell } from "@/components/admin-shell";
import { RequireAdmin } from "@/components/require-admin";
import { apiFetch } from "@/lib/api-client";

function getAvatarUrl(member) {
  if (!member.avatar_path || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET || "member-avatars";
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${member.avatar_path}`;
}

function fullName(member) {
  return `${member.last_name}, ${member.first_name} ${member.middle_name}`;
}

export default function CardsPage() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [flippedCards, setFlippedCards] = useState({});
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    apiFetch("/api/members")
      .then((data) => setMembers(data.members || []))
      .catch(() => null);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;
    return members.filter((m) => fullName(m).toLowerCase().includes(term));
  }, [members, search]);

  const toggleFlip = (id) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  async function captureCardDataUrl(element, pixelRatio = 3) {
    await document.fonts.ready;

    const previous = {
      transform: element.style.getPropertyValue("transform"),
      transformPriority: element.style.getPropertyPriority("transform"),
      backfaceVisibility: element.style.getPropertyValue("backface-visibility"),
      backfacePriority: element.style.getPropertyPriority("backface-visibility"),
      webkitBackfaceVisibility: element.style.getPropertyValue("-webkit-backface-visibility"),
      webkitBackfacePriority: element.style.getPropertyPriority("-webkit-backface-visibility"),
      position: element.style.getPropertyValue("position"),
      positionPriority: element.style.getPropertyPriority("position"),
      inset: element.style.getPropertyValue("inset"),
      insetPriority: element.style.getPropertyPriority("inset"),
    };

    // html-to-image cannot capture rotated/backface-hidden card faces reliably.
    element.style.setProperty("transform", "none", "important");
    element.style.setProperty("backface-visibility", "visible", "important");
    element.style.setProperty("-webkit-backface-visibility", "visible", "important");
    element.style.setProperty("position", "relative", "important");
    element.style.setProperty("inset", "auto", "important");

    try {
      return await toPng(element, {
        pixelRatio,
        backgroundColor: null,
      });
    } finally {
      if (previous.transform) element.style.setProperty("transform", previous.transform, previous.transformPriority);
      else element.style.removeProperty("transform");

      if (previous.backfaceVisibility) {
        element.style.setProperty("backface-visibility", previous.backfaceVisibility, previous.backfacePriority);
      } else {
        element.style.removeProperty("backface-visibility");
      }

      if (previous.webkitBackfaceVisibility) {
        element.style.setProperty("-webkit-backface-visibility", previous.webkitBackfaceVisibility, previous.webkitBackfacePriority);
      } else {
        element.style.removeProperty("-webkit-backface-visibility");
      }

      if (previous.position) element.style.setProperty("position", previous.position, previous.positionPriority);
      else element.style.removeProperty("position");

      if (previous.inset) element.style.setProperty("inset", previous.inset, previous.insetPriority);
      else element.style.removeProperty("inset");
    }
  }

  async function downloadAsImage(elementId, fileName) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
      const image = await captureCardDataUrl(element, 3);
      const link = document.createElement("a");
      link.href = image;
      link.download = `${fileName}.png`;
      link.click();
    } catch (err) {
      console.error("Download failed", err);
    }
  }

  async function downloadPdf() {
    setExporting(true);
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    let first = true;

    try {
      for (const member of filtered) {
        const frontEl = document.getElementById(`card-front-${member.id}`);
        if (!frontEl) continue;

        const imgData = await captureCardDataUrl(frontEl, 2);
        
        const width = pageWidth - 20;
        // Native card dimension ratio is 600h / 960w
        const height = (600 * width) / 960;

        if (!first) doc.addPage();
        doc.addImage(imgData, "PNG", 10, 10, width, height);
        
        // Also add the back side on the next page for each member
        const backEl = document.getElementById(`card-back-${member.id}`);
        if (backEl) {
          const backImgData = await captureCardDataUrl(backEl, 2);
          doc.addPage();
          doc.addImage(backImgData, "PNG", 10, 10, width, height);
        }
        
        first = false;
      }
      doc.save("church-attendance-cards.pdf");
    } finally {
      setExporting(false);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell title="Attendance Cards Optimization">
        <div className="surface mb-6 flex w-full flex-wrap items-center gap-4 p-5 no-print">
          <div className="flex-1 min-w-[300px]">
            <input 
              className="input text-lg py-3" 
              placeholder="Search member for card printing..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <button className="btn-primary flex items-center gap-2 px-6 py-3" onClick={() => window.print()}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
              Bulk Print
            </button>
            <button 
              disabled={exporting}
              className="btn-ghost flex items-center gap-2 px-6 py-3 disabled:opacity-50" 
              onClick={downloadPdf}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              {exporting ? "Generating PDF..." : "Export High-Res PDF"}
            </button>
          </div>
        </div>

        <div className="cards-grid grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-12 w-full overflow-x-auto pb-12 px-4 justify-items-center items-start">
          {filtered.map((member) => {
            const avatarUrl = getAvatarUrl(member);
            const isFlipped = flippedCards[member.id];
            
            return (
                <div 
                  key={member.id} 
                  className="print-member-sheet group relative w-[960px] shrink-0" 
                  style={{ zoom: "0.7" }}
              >
                {/* Individual Actions Overlay (Moved to Left Side Inside Bounds) */}
                <div className="no-print absolute top-4 left-6 z-30 flex gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <button 
                    onClick={(e) => { e.stopPropagation(); downloadAsImage(`card-front-${member.id}`, `Front_${member.last_name}`); }}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#8a2424] shadow-2xl ring-1 ring-[#e6dbdb] hover:bg-[#8a2424] hover:text-white transition-all transform hover:scale-110"
                    title="Download Front Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); downloadAsImage(`card-back-${member.id}`, `Back_${member.last_name}`); }}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#5e4f4f] shadow-2xl ring-1 ring-[#e6dbdb] hover:bg-[#5e4f4f] hover:text-white transition-all transform hover:scale-110"
                    title="Download Back Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  </button>
                </div>

                <div className="card-perspective h-[600px] w-[960px] min-w-[960px] shrink-0">
                  <div 
                    className={`card-inner ${isFlipped ? "is-flipped" : ""}`}
                    onClick={() => toggleFlip(member.id)}
                  >
                    {/* FRONT OF CARD */}
                    <div 
                      id={`card-front-${member.id}`} 
                      style={{ backgroundColor: "#fdfaf5", color: "#1a1610" }}
                      className="card-front print-card flex flex-col overflow-hidden rounded-[32px] shadow-premium relative border-2 border-[#dcc7a2]"
                    >
                      <div className="paper-texture absolute inset-0 rounded-[32px]" />
                      
                      {/* Header Branding */}
                      <header className="flex shrink-0 flex-col items-center pt-8 pb-2 relative z-10">
                        <div className="flex items-center justify-center gap-6 mb-3">
                          <div className="relative h-[64px] w-[64px] overflow-hidden rounded-full border-2 border-[#dcc7a2] shadow-sm bg-white">
                            <Image src="/logo_1.jpg" alt="Logo 1" fill sizes="64px" priority className="object-contain p-0.5" unoptimized />
                          </div>
                          <div className="relative h-[64px] w-[64px] overflow-hidden rounded-full border-2 border-[#dcc7a2] shadow-sm bg-white">
                            <Image src="/logo_2.png" alt="Logo 2" fill sizes="64px" priority className="object-contain p-0.5" unoptimized />
                          </div>
                        </div>

                        <h3 style={{ fontFamily: "var(--font-gothic)", color: "#2d2518" }} className="text-[36px] font-normal leading-none tracking-wide">
                          Saint Anthony of Padua Parish
                        </h3>
                        <h2 style={{ fontFamily: "var(--font-tech)", color: "#9d7b32" }} className="mt-2 text-[14px] font-bold tracking-[0.2em]">
                          MINISTRY OF LECTORS AND COMMENTATORS
                        </h2>
                      </header>

                      {/* Main Identity Area */}
                      <main className="px-14 flex flex-1 flex-row justify-between relative mt-2 pb-24 z-10">
                        {/* LEFT: Identity Stack */}
                        <div className="flex gap-8 items-center h-full pt-2">
                          {/* Photo Box */}
                          {avatarUrl ? (
                            <div className="relative shrink-0 h-[220px] w-[220px] overflow-hidden rounded-[36px] border-[6px] border-white shadow-xl ring-1 ring-[#dcc7a2]">
                              <Image src={avatarUrl} alt={fullName(member)} fill sizes="220px" className="object-cover" unoptimized />
                            </div>
                          ) : (
                            <div style={{ backgroundColor: "#fdfaf5", color: "#9d8351" }} className="flex shrink-0 h-[220px] w-[220px] items-center justify-center rounded-[36px] border-[3px] border-dashed border-[#dcc7a2] text-[13px] font-bold tracking-[0.1em] shadow-sm">
                              NO PHOTO
                            </div>
                          )}

                          {/* Detail Stack */}
                          <div className="flex flex-col justify-center text-left max-w-[420px] break-words">
                            <p style={{ color: "#9d8351" }} className="text-[13px] font-bold uppercase tracking-[0.25em] mb-2.5">Official Member</p>
                            <h4 style={{ color: "#1a1610", fontFamily: "var(--font-display), serif" }} className="text-[46px] font-bold tracking-tight leading-[1.1] break-words">
                              {member.last_name}
                            </h4>
                            <p style={{ color: "rgba(26, 22, 16, 0.8)", fontFamily: "var(--font-display), serif" }} className="text-[28px] font-bold tracking-tight mt-1 mb-6 break-words">
                              {member.first_name} {member.middle_name}
                            </p>
                            
                            <div className="space-y-1.5 border-l-[4px] border-[#dcc7a2] pl-5">
                              <p className="text-[20px] font-bold text-[#4a3f2c] tracking-tight">
                                {member.sex} &bull; {member.age} YRS
                              </p>
                              <p className="text-[14px] font-bold text-[#8c7a5c] tracking-wider uppercase">
                                {member.contact_number ? member.contact_number : "EMERGENCY CONTACT NOT SET"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT: QR Code Stack */}
                        <div className="flex flex-col justify-end items-center h-full pb-2 shrink-0">
                          <div className="rounded-[24px] bg-white p-4 shadow-md ring-1 ring-[#e2d2b2]">
                            <QRCode value={member.qr_token} size={180} bgColor="#ffffff" fgColor="#1a1610" level="H" />
                          </div>
                          <p style={{ color: "#9d8351" }} className="mt-4 text-[13px] font-bold tracking-[0.3em] uppercase">Valid Identity</p>
                        </div>
                      </main>

                      <footer style={{ background: "linear-gradient(90deg,#4d1111 0%,#7a1f1f 50%,#4d1111 100%)" }} className="absolute bottom-0 left-0 right-0 flex h-[58px] items-center justify-center z-20">
                        <p style={{ color: "#f4e7e7" }} className="text-[12px] font-bold tracking-[0.45em] uppercase text-center w-full">PARISH MEMBER ID</p>
                      </footer>
                    </div>

                    {/* BACK OF CARD */}
                    <div 
                      id={`card-back-${member.id}`} 
                      style={{ backgroundColor: "#eae2cf", color: "#2d2518" }}
                      className="card-back print-card flex flex-col overflow-hidden rounded-[32px] shadow-premium relative border-2 border-[#dcc7a2]"
                    >
                      <div className="paper-texture absolute inset-0 rounded-[32px] opacity-20" />
                      
                      <header className="px-16 pt-12 pb-3 text-center shrink-0 relative z-10">
                        <h4 style={{ color: "#9d7b32" }} className="text-[16px] font-bold uppercase tracking-[0.4em]">Ministry Covenant</h4>
                        <p style={{ color: "rgba(90, 80, 60, 0.95)" }} className="mt-6 text-[20px] italic leading-relaxed text-center px-4 font-normal">
                          &quot;Preach the word; be prepared in season and out of season; correct, rebuke and encourage-with great patience and careful instruction.&quot;
                          <span style={{ color: "#4a3f2c" }} className="block mt-5 text-[18px] font-bold not-italic">— 2 Timothy 4:2</span>
                        </p>
                      </header>

                      <main className="flex-1 flex flex-col justify-between px-16 pt-2 pb-[120px] gap-6 relative z-10">
                        <div className="space-y-5">
                          <h5 style={{ color: "#9d7b32" }} className="text-[14px] font-bold uppercase tracking-widest">Service Guidelines</h5>
                          <ul style={{ color: "#2d2518" }} className="text-[16px] font-bold leading-loose space-y-1">
                            <li className="flex items-center gap-3"><span>&raquo;</span> Proper Liturgical Attire is mandatory.</li>
                            <li className="flex items-center gap-3"><span>&raquo;</span> Arrival 20 mins prior to the celebration.</li>
                            <li className="flex items-center gap-3"><span>&raquo;</span> This card is strictly for official attendance.</li>
                          </ul>
                        </div>

                        <div className="mb-2 flex items-end justify-between gap-6">
                          <div style={{ backgroundColor: "rgba(255, 255, 255, 0.5)", borderColor: "#dcc7a2" }} className="w-[480px] rounded-[24px] p-6 border">
                            <p style={{ color: "#9d7b32" }} className="text-[12px] font-bold uppercase tracking-[0.1em] mb-1.5">Office of the Parish Priest</p>
                            <p className="text-[16px] font-bold text-[#2d2518]">Barotac Nuevo, Iloilo, Philippines</p>
                            <p style={{ color: "#665e50" }} className="text-[14px] mt-1.5">Tel: (033) 333-1234 &bull; church@local.com</p>
                          </div>

                          <div className="mb-1 shrink-0 rounded-[16px] bg-white p-2.5 shadow-sm ring-1 ring-[#d5c3a1]">
                            <QRCode value={member.qr_token} size={88} bgColor="#ffffff" fgColor="#1a1610" level="H" />
                          </div>
                        </div>
                      </main>

                      <footer style={{ backgroundColor: "#dcc7a2" }} className="absolute bottom-0 left-0 right-0 flex h-[56px] items-center justify-center z-20">
                        <p style={{ color: "#2d2518" }} className="text-[14px] font-bold tracking-[0.3em] uppercase text-center w-full">FOUND? PLEASE RETURN TO PARISH OFFICE</p>
                      </footer>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
