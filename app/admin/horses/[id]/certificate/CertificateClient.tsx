"use client";
import { useRef, useState, useLayoutEffect } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import PedigreeTree from "@/components/PedigreeTree";
import type { HorseNode } from "@/lib/pedigree";
import { pruneFoundationNodes } from "@/lib/pedigree";

// Certificate canvas matches the template aspect ratio (3500 x 2550).
const CERT_W = 1500;
const CERT_H = Math.round((CERT_W * 2550) / 3500); // ~1093

// Pedigree placement inside the certificate (fractions of the canvas).
const AREA = { left: 0.05, top: 0.27, width: 0.9, height: 0.5 };

export default function CertificateClient({
  horseId, name, regNumber, tree, dupes, allHorses,
}: {
  horseId: string; name: string; regNumber: string;
  tree: HorseNode | null; dupes: string[]; allHorses: string;
}) {
  const [DEPTH, setDepth] = useState<4 | 5>(4);
  const [trimFoundation, setTrimFoundation] = useState(false);
  const [busy, setBusy] = useState<"" | "cert" | "ped">("");
  const [captureKey, setCaptureKey] = useState(0);
  const certRef = useRef<HTMLDivElement>(null);
  const pedRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const dupeSet = new Set(dupes);
  const activeTree = trimFoundation ? pruneFoundationNodes(tree) : tree;

  // Fit the certificate's pedigree into its area.
  useLayoutEffect(() => {
    const grid = certRef.current?.querySelector<HTMLElement>(".ped-export");
    if (!grid) return;
    const w = grid.scrollWidth, h = grid.scrollHeight;
    const aw = CERT_W * AREA.width, ah = CERT_H * AREA.height;
    setScale(Math.min(aw / w, ah / h, 1.5));
  }, [tree, DEPTH, trimFoundation]);

  async function downloadCertificate() {
    if (!certRef.current) return;
    setBusy("cert");
    // Force the hidden tree to remount with fresh state
    setCaptureKey((k) => k + 1);
    // Wait two animation frames so React commits the remount and the browser paints
    await new Promise<void>((r) => requestAnimationFrame(() => { requestAnimationFrame(() => r()); }));
    try {
      // First call warms up html-to-image's internal font/resource cache
      await toPng(certRef.current, { pixelRatio: 2, width: CERT_W, height: CERT_H, cacheBust: true });
      // Second call captures the actual current DOM state
      const dataUrl = await toPng(certRef.current, { pixelRatio: 2, width: CERT_W, height: CERT_H, cacheBust: true });
      const a = document.createElement("a");
      a.download = `${slug(name)}-certificate.png`;
      a.href = dataUrl; a.click();
    } catch { alert("Could not generate the certificate. Please try again."); }
    setBusy("");
  }

  async function downloadPedigree() {
    const el = pedRef.current?.querySelector<HTMLElement>(".ped-export");
    if (!el) return;
    setBusy("ped");
    try {
      const dataUrl = await toPng(el, { pixelRatio: 2, width: el.scrollWidth + 24, height: el.scrollHeight + 24, style: { background: "transparent" }, cacheBust: true });
      const a = document.createElement("a");
      a.download = `${slug(name)}-pedigree.png`;
      a.href = dataUrl; a.click();
    } catch { alert("Could not generate the image."); }
    setBusy("");
  }

  const btn = (active: boolean): React.CSSProperties => ({
    background: "var(--teal)", color: "white", border: "none", borderRadius: 8,
    padding: "11px 22px", fontSize: 14, fontWeight: 700, cursor: active ? "wait" : "pointer",
    fontFamily: "var(--font-lato)", opacity: active ? 0.7 : 1,
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Link href={`/registry/${horseId}`} style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>← Back to horse</Link>
      </div>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 30, color: "var(--teal-dark)", marginBottom: 4 }}>Pedigree Certificate</h1>
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14, marginBottom: 20 }}>{name}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 24 }}>
        <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)" }}>Generations:</span>
        {[4, 5].map((d) => (
          <button key={d} onClick={() => setDepth(d as 4 | 5)} style={{
            padding: "6px 14px", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-lato)", cursor: "pointer",
            border: `1px solid ${DEPTH === d ? "var(--teal)" : "var(--border)"}`,
            background: DEPTH === d ? "var(--teal)" : "var(--white)",
            color: DEPTH === d ? "white" : "var(--text-muted)",
            fontWeight: DEPTH === d ? 700 : 400,
          }}>{d}</button>
        ))}
        {/* Trim Foundation toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={trimFoundation}
            onChange={(e) => setTrimFoundation(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: "var(--teal)", cursor: "pointer" }}
          />
          Hide Foundation / Unknown
        </label>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={downloadCertificate} disabled={!!busy} style={btn(busy === "cert")}>{busy === "cert" ? "Generating…" : "↓ Download certificate (PNG)"}</button>
          <button onClick={downloadPedigree} disabled={!!busy} style={{ ...btn(busy === "ped"), background: "var(--white)", color: "var(--teal-dark)", border: "1px solid var(--teal)" }}>{busy === "ped" ? "Generating…" : "↓ Pedigree only (PNG)"}</button>
        </div>
      </div>

      {/* On-screen preview: just the pedigree (no certificate background) */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, overflowX: "auto" }} ref={pedRef}>
        <PedigreeTree node={activeTree} dupes={dupeSet} allHorses={allHorses} bare fixedDepth={DEPTH} />
      </div>

      {/* Hidden full certificate — rendered off-screen, used only for the export */}
      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
        <div ref={certRef} style={{ width: CERT_W, height: CERT_H, position: "relative", background: "#EEF1ED" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/certificate-bg.png" alt="" crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          {/* Horse name */}
          <div style={{ position: "absolute", top: "16%", left: "6%", width: "88%", textAlign: "center", fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 36, color: "#3F5F5F", fontWeight: 600 }}>
            {name}
          </div>
          {/* Registration number — centered just above the blank line bottom-right */}
          {regNumber && (
            <div style={{ position: "absolute", top: "87.5%", left: "68%", width: "24%", textAlign: "center", fontFamily: "var(--font-lato), sans-serif", fontSize: 15, color: "#3F5F5F", letterSpacing: "0.05em" }}>
              {regNumber}
            </div>
          )}
          {/* Pedigree, scaled to fit, centered in the area */}
          <div style={{ position: "absolute", left: `${AREA.left * 100}%`, top: `${AREA.top * 100}%`, width: `${AREA.width * 100}%`, height: `${AREA.height * 100}%`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
              <PedigreeTree key={captureKey} node={activeTree} dupes={dupeSet} allHorses={allHorses} bare compact fixedDepth={DEPTH} bareBg="transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function slug(s: string) {
  return s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "horse";
}
