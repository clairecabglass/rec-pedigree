"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import { parseHorseCoat } from "@/lib/horseCoat";
import type { HorseNode } from "@/lib/pedigree";
import { pruneFoundationNodes, isPlaceholderAncestor } from "@/lib/pedigree";

interface Props {
  node: HorseNode | null;
  dupes: Set<string>;
  allHorses: string;
  isAdmin?: boolean;
  title?: string;
  bare?: boolean;
  fixedDepth?: number;
  compact?: boolean;
  availableDepth?: number;
  bareBg?: string;
  coi?: number;
}

interface HorseRef { id: string; name: string; }

/* ---- Colors keyed by PEDIGREE POSITION ----
   In a pedigree, the upper horse of every pair is the sire (stallion → blue),
   the lower horse is the dam (mare → pink). Position determines this, not the
   recorded gender field (which may be missing or wrong). */
const SIRE_CLR  = { bg: "var(--sire-bg)",    border: "var(--sire-border)",    text: "var(--sire-text)",    muted: "#7A9BB0" };
const DAM_CLR   = { bg: "var(--dam-bg)",      border: "var(--dam-border)",     text: "var(--dam-text)",     muted: "#AE8099" };
// Root = the subject horse — sage green-grey "selected horse" treatment.
const ROOT_CLR  = { bg: "#E4E7E1",            border: "#BFC3BD",               text: "#3F5F5F",             muted: "#71807A" };
const INBREED   = { bg: "var(--inbreed-bg)",  border: "var(--inbreed-border)", text: "var(--inbreed-text)", muted: "var(--inbreed-text)" };

type Slot = "root" | "sire" | "dam";

function cardColors(slot: Slot, inbreed: boolean, showInbreeding = true) {
  if (inbreed && showInbreeding) return INBREED;
  if (slot === "sire") return SIRE_CLR;
  if (slot === "dam")  return DAM_CLR;
  return ROOT_CLR;
}

/* ---- Grid cell ---- */
interface GridCell { col: number; rowStart: number; rowSpan: number; node: HorseNode | null; inbreed: boolean; slot: Slot; }

function buildGrid(
  node: HorseNode | null, col: number, rowStart: number, rowSpan: number,
  maxDepth: number, dupes: Set<string>, slot: Slot, cells: GridCell[],
) {
  cells.push({ col, rowStart, rowSpan, node, slot, inbreed: !!node && dupes.has(node.name.toLowerCase()) });
  if (col >= maxDepth + 1) return;
  const half = rowSpan / 2;
  // Upper child is always the sire slot, lower child always the dam slot.
  buildGrid(node?.sire ?? null, col + 1, rowStart,        half, maxDepth, dupes, "sire", cells);
  buildGrid(node?.dam  ?? null, col + 1, rowStart + half, half, maxDepth, dupes, "dam",  cells);
}

const NAME_SZ = [15, 13, 12, 11, 10,  9, 8, 8, 8, 8, 8];
const META_SZ = [12, 11, 10,  9,  9,  8, 7, 7, 7, 7, 7];

function GridCard({ cell, idMap, rowUnitH, showInbreeding = true, hideFoundation = false }: { cell: GridCell; idMap: Map<string, string>; rowUnitH: number; showInbreeding?: boolean; hideFoundation?: boolean }) {
  const { col, rowStart, rowSpan, node, inbreed, slot } = cell;

  // When hiding foundation: null / Foundation / Unknown → invisible gap
  if (hideFoundation && (!node || isPlaceholderAncestor(node.name))) {
    return (
      <div style={{ gridColumn: col, gridRow: `${rowStart} / span ${rowSpan}`, background: "transparent" }} />
    );
  }

  const s = cardColors(slot, inbreed, showInbreeding);
  const nameSize = NAME_SZ[col - 1] ?? 8;
  const metaSize = META_SZ[col - 1] ?? 7;
  const isUnknown = !node || node.name.toLowerCase() === "unknown" || isPlaceholderAncestor(node.name);
  const parsedCoat = node?.coat ? parseHorseCoat(node.coat) : null;
  const coatName = parsedCoat?.cleanName || null;
  const genotypeCode = node?.genotype || parsedCoat?.genotype || null;
  const coat = coatName && genotypeCode ? `${coatName} - ${genotypeCode}` : coatName ?? genotypeCode;
  const horseId = node ? idMap.get(node.name.toLowerCase()) : null;
  const dupeKey = inbreed && node ? node.name.toLowerCase() : undefined;

  // Available unzoomed cell height drives how many lines we can show without
  // clipping. The name always shows; breed/coat appear only when there's room.
  const cellH    = rowUnitH * rowSpan;
  const showBreed = !isUnknown && !!node?.breed && cellH >= 30;
  const showCoat  = !isUnknown && !!coat && cellH >= 46;
  const showFlag  = inbreed && showInbreeding && cellH >= 60;

  // Shrink vertical padding on tiny cells so the name isn't clipped
  const vPad = col === 1 ? 10 : cellH < 18 ? 1 : cellH < 28 ? 2 : 4;
  const inner = (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: col === 1 ? `10px 14px` : `${vPad}px 8px`, height: "100%", gap: 1, overflow: "hidden" }}>
      <div style={{ fontFamily: "var(--font-playfair)", fontSize: nameSize, fontWeight: 700, color: s.text, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {node?.name ?? "Unknown"}
      </div>
      {showBreed && (
        <div style={{ fontFamily: "var(--font-lato)", fontSize: metaSize, color: s.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25 }}>
          {slot === "sire" ? "Stallion · " : slot === "dam" ? "Mare · " : node!.gender ? `${node!.gender} · ` : ""}{node!.breed}
        </div>
      )}
      {showCoat && (
        <div style={{ fontFamily: "var(--font-lato)", fontSize: metaSize - 1, color: s.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.85, lineHeight: 1.2 }}>
          {coat}
        </div>
      )}
      {showFlag && <div style={{ fontFamily: "var(--font-lato)", fontSize: 9, color: "var(--inbreed-text)", fontWeight: 700 }}>⚠ Inbreeding</div>}
    </div>
  );

  const style: React.CSSProperties = {
    gridColumn: col, gridRow: `${rowStart} / span ${rowSpan}`,
    background: s.bg, border: `1px solid ${s.border}`, borderRadius: 4,
    overflow: "hidden", textDecoration: "none",
    minWidth: 0, minHeight: 0, // grid cells need this for text-overflow: ellipsis to work
    ...(col === 1 ? { borderLeft: "4px solid #9AA396" } : {}),
  };

  if (horseId) return <Link href={`/registry/${horseId}`} style={style} data-dupe={dupeKey} title={dupeKey ? `${node?.name} appears more than once — hover to highlight all copies` : undefined}>{inner}</Link>;
  return <div style={style} data-dupe={dupeKey}>{inner}</div>;
}

/* ---- Main component ---- */
const DESKTOP_CANVAS_H = 780;
const MOBILE_CANVAS_H  = 420;
// Minimum px per row. Smaller for deep generations so the tall ancestor
// cells don't balloon into big empty blocks. Gen 3–4 keep the roomy 28px.
function minRowH(depth: number) {
  if (depth >= 7) return 15;
  if (depth >= 5) return 20;
  return 28;
}

export default function PedigreeTree({ node, dupes, allHorses, isAdmin, title, bare, fixedDepth, compact, availableDepth, bareBg, coi }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const DEFAULT_CANVAS_H = isMobile ? MOBILE_CANVAS_H : DESKTOP_CANVAS_H;

  const [depthState, setDepthState]         = useState(4);
  const [zoom, setZoom]                     = useState(1);
  const [showInbreeding, setShowInbreeding] = useState(true);
  const [hideFoundation, setHideFoundation] = useState(false);
  const [containerW, setContainerW] = useState(1380);
  const [canvasH, setCanvasH]       = useState(DESKTOP_CANVAS_H);
  const [isFs, setIsFs]             = useState(false);
  const [downloading, setDownloading] = useState(false);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef   = useRef<HTMLDivElement>(null);
  // Touch pan tracking
  const touchRef = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);
  // Touch pinch tracking
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const cap      = availableDepth != null && availableDepth > 0 ? availableDepth : Infinity;
  const maxDepth = bare ? (fixedDepth ?? 4) : Math.min(depthState, cap);
  const totalRows = Math.pow(2, maxDepth);

  // naturalH: at least canvasH so gen 3–4 fill the block at zoom=1.
  // For deeper gens, grows with a minimum row height.
  const naturalH = Math.max(canvasH, totalRows * minRowH(maxDepth));

  const clampZoom = (z: number) => Math.min(3, Math.max(0.08, z));
  const calcFit   = (d: number, h = canvasH) => {
    const nh = Math.max(h, Math.pow(2, d) * minRowH(d));
    return clampZoom(Math.min(1, h / nh));
  };

  // Sync canvas height when mobile state changes
  useEffect(() => {
    setCanvasH(isMobile ? MOBILE_CANVAS_H : DESKTOP_CANVAS_H);
  }, [isMobile]); // eslint-disable-line

  // Default to gen 3 on mobile for readability
  useEffect(() => {
    if (isMobile) setDepthState(3);
  }, [isMobile]);

  // Measure scroll container width on mount and window resize only.
  // Fullscreen transitions are handled separately below.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      // Skip during fullscreen transitions — handled by fullscreenchange
      if (document.fullscreenElement) return;
      setContainerW(el.clientWidth);
      setCanvasH(el.clientHeight);
    });
    obs.observe(el);
    setContainerW(el.clientWidth);
    setCanvasH(el.clientHeight);
    return () => obs.disconnect();
  }, []);

  // Auto-fit when depth changes — default to 100% so the tree fills the
  // container width. For small gens (3–5) naturalH ≤ canvasH so this is fine.
  // For large gens the user scrolls vertically; click "%" to zoom-to-height.
  useEffect(() => { setZoom(1); }, [depthState]); // eslint-disable-line

  // Fullscreen: wait for the browser animation to finish (~250ms) before
  // measuring and refitting — avoids jitter from cascading mid-animation renders.
  useEffect(() => {
    const onChange = () => {
      const fs = document.fullscreenElement === wrapRef.current;
      setIsFs(fs);
      setTimeout(() => {
        const el = scrollRef.current;
        if (!el) return;
        const w = el.clientWidth;
        const h = el.clientHeight;
        setContainerW(w);
        setCanvasH(h);
        setZoom(calcFit(depthState, h));
      }, 260);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [depthState]); // eslint-disable-line

  if (!node) return <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>No pedigree data available.</p>;

  const refs: HorseRef[] = JSON.parse(allHorses);
  const idMap = new Map(refs.map((h) => [h.name.toLowerCase(), h.id]));

  const activeNode = hideFoundation ? pruneFoundationNodes(node) : node;

  const cells: GridCell[] = [];
  buildGrid(activeNode, 1, 1, totalRows, maxDepth, dupes, "root", cells);

  // Unzoomed height of one row — drives per-cell text gating in GridCard.
  const rowUnitH = naturalH / totalRows;

  // Root col slightly wider; ancestors equal.
  const colTemplate = `1.2fr repeat(${maxDepth}, 1fr)`;
  // Rows use 1fr so they fill naturalH exactly — no gaps at the bottom.
  const rowTemplate = `repeat(${totalRows}, 1fr)`;

  /* ---- Bare mode (certificate PNG export) ---- */
  if (bare) {
    const bareRowH = compact ? minRowH(maxDepth) : 36;
    return (
      <div ref={gridRef} className="ped-export" style={{
        display: "grid", gridTemplateColumns: colTemplate,
        gridTemplateRows: `repeat(${totalRows}, ${bareRowH}px)`,
        gap: 2, padding: compact ? 4 : 6,
        width: compact ? 180 * (maxDepth + 1) : 1100, background: bareBg ?? "#FBF8F4",
      }}>
        {cells.map((cell, i) => <GridCard key={i} cell={cell} idMap={idMap} rowUnitH={bareRowH} showInbreeding={showInbreeding} hideFoundation={hideFoundation} />)}
      </div>
    );
  }

  /* ---- Interactive mode ---- */
  const scaledW = containerW * zoom;
  const scaledH = naturalH * zoom;
  const scrollAreaW = Math.max(scaledW, containerW);
  const scrollAreaH = Math.max(scaledH, canvasH);

  function onWheel(e: React.WheelEvent) {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom((z) => clampZoom(z - e.deltaY * 0.002)); }
  }

  function onPanStart(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("a")) return;
    const sc = scrollRef.current;
    if (!sc) return;
    const sx = e.clientX, sy = e.clientY, sl = sc.scrollLeft, st = sc.scrollTop;
    sc.style.cursor = "grabbing";
    const move = (ev: MouseEvent) => { sc.scrollLeft = sl - (ev.clientX - sx); sc.scrollTop = st - (ev.clientY - sy); };
    const up = () => { sc.style.cursor = "grab"; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const sc = scrollRef.current;
      if (!sc) return;
      touchRef.current = { x: t.clientX, y: t.clientY, sl: sc.scrollLeft, st: sc.scrollTop };
      pinchRef.current = null;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), zoom };
      touchRef.current = null;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 1 && touchRef.current) {
      const sc = scrollRef.current;
      if (!sc) return;
      const t = e.touches[0];
      sc.scrollLeft = touchRef.current.sl - (t.clientX - touchRef.current.x);
      sc.scrollTop  = touchRef.current.st  - (t.clientY - touchRef.current.y);
    } else if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchRef.current.dist;
      setZoom(clampZoom(pinchRef.current.zoom * ratio));
    }
  }

  function onTouchEnd() {
    touchRef.current = null;
    pinchRef.current = null;
  }

  function onHover(e: React.MouseEvent) {
    const card = (e.target as HTMLElement).closest<HTMLElement>("[data-dupe]");
    const sc = scrollRef.current;
    if (!sc) return;
    sc.querySelectorAll(".dupe-active").forEach((el) => el.classList.remove("dupe-active"));
    if (!card) return;
    const name = card.getAttribute("data-dupe");
    if (name) sc.querySelectorAll(`[data-dupe="${CSS.escape(name)}"]`).forEach((el) => el.classList.add("dupe-active"));
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await wrapRef.current?.requestFullscreen?.();
  }

  async function download() {
    if (!gridRef.current) return;
    setDownloading(true);
    try {
      const url = await toPng(gridRef.current, { backgroundColor: hideFoundation ? undefined : "#FBF8F4", pixelRatio: 2, skipFonts: true });
      const a = document.createElement("a");
      a.download = `${(title ?? "pedigree").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-pedigree.png`;
      a.href = url; a.click();
    } catch { alert("Could not generate image. Try a smaller generation count."); }
    finally { setDownloading(false); }
  }

  const toolBtn: React.CSSProperties = {
    padding: "5px 12px", border: "1px solid var(--border)", borderRadius: 4,
    background: "white", color: "var(--teal-dark)", cursor: "pointer",
    fontSize: 12, fontFamily: "var(--font-lato)",
  };

  return (
    <div ref={wrapRef} style={isFs ? { background: "var(--cream)", height: "100vh", display: "flex", flexDirection: "column", padding: 16 } : { background: "var(--cream)" }}>

      {/* ---- Mobile toolbar ---- */}
      {isMobile ? (
        <div style={{ marginBottom: 8, fontFamily: "var(--font-lato)" }}>
          {/* Row 1: COI + gen buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            {coi !== undefined && showInbreeding && (
              <span style={{ fontSize: 11, fontWeight: 700, color: coi >= 0.125 ? "var(--inbreed-text)" : "var(--text-muted)", background: coi >= 0.125 ? "var(--inbreed-bg)" : "var(--cream)", border: `1px solid ${coi >= 0.125 ? "var(--inbreed-border)" : "var(--border)"}`, borderRadius: 10, padding: "2px 8px" }}>
                COI {(coi * 100).toFixed(1)}%
              </span>
            )}
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Gen:</span>
            {[3, 4, 5, 6, 7].map((d) => {
              const beyond = d > cap;
              const active = maxDepth === d;
              return (
                <button key={d} onClick={() => { if (!beyond) setDepthState(d); }} disabled={beyond}
                  style={{ ...toolBtn, padding: "4px 9px", fontSize: 11, background: active ? "var(--teal)" : "white", color: active ? "white" : beyond ? "var(--border)" : "var(--text-muted)", fontWeight: active ? 700 : 400, opacity: beyond ? 0.4 : 1, cursor: beyond ? "not-allowed" : "pointer" }}
                >{d}</button>
              );
            })}
          </div>
          {/* Row 2: inbreeding + foundation + fit */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setShowInbreeding((v) => !v)} style={{ ...toolBtn, fontSize: 11, padding: "4px 10px", background: showInbreeding ? "var(--inbreed-bg)" : "white", color: showInbreeding ? "var(--inbreed-text)" : "var(--text-muted)", border: showInbreeding ? "1px solid var(--inbreed-border)" : "1px solid var(--border)" }}>
              ⚠ {showInbreeding ? "ON" : "OFF"}
            </button>
            <button onClick={() => setHideFoundation((v) => !v)} style={{ ...toolBtn, fontSize: 11, padding: "4px 10px", background: hideFoundation ? "var(--sand-bg)" : "white", color: hideFoundation ? "var(--sand-text)" : "var(--text-muted)", border: hideFoundation ? "1px solid var(--sand-border)" : "1px solid var(--border)" }}>
              {hideFoundation ? "Fnd. hidden" : "Fnd. shown"}
            </button>
            <button onClick={() => setZoom(calcFit(maxDepth, canvasH))} style={{ ...toolBtn, fontSize: 11, padding: "4px 10px" }}>Fit {Math.round(zoom * 100)}%</button>
            <button onClick={() => setZoom((z) => clampZoom(z - 0.15))} style={{ ...toolBtn, padding: "4px 9px", fontWeight: 700, fontSize: 13 }}>−</button>
            <button onClick={() => setZoom((z) => clampZoom(z + 0.15))} style={{ ...toolBtn, padding: "4px 9px", fontWeight: 700, fontSize: 13 }}>+</button>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 10, color: "var(--text-muted)" }}>Drag to scroll · pinch to zoom</p>
        </div>
      ) : (
        /* ---- Desktop toolbar ---- */
        <>
          <div style={{ marginBottom: 10, display: "flex", gap: 8, alignItems: "center", fontFamily: "var(--font-lato)", fontSize: 13, flexWrap: "wrap" }}>
            {coi !== undefined && showInbreeding && (
              <span style={{ fontSize: 12, fontFamily: "var(--font-lato)", fontWeight: 700, color: coi >= 0.125 ? "var(--inbreed-text)" : "var(--text-muted)", background: coi >= 0.125 ? "var(--inbreed-bg)" : "var(--cream)", border: `1px solid ${coi >= 0.125 ? "var(--inbreed-border)" : "var(--border)"}`, borderRadius: 10, padding: "2px 10px", marginRight: 4 }}>
                COI {(coi * 100).toFixed(1)}%
              </span>
            )}
            <span style={{ color: "var(--text-muted)" }}>Generations:</span>
            {[3, 4, 5, 6, 7, 8, 9, 10].map((d) => {
              const beyond = d > cap;
              const active = maxDepth === d;
              return (
                <button key={d} onClick={() => { if (!beyond) setDepthState(d); }} disabled={beyond}
                  title={beyond ? `Only ${cap} generation${cap !== 1 ? "s" : ""} of data available` : undefined}
                  style={{ ...toolBtn, background: active ? "var(--teal)" : "white", color: active ? "white" : beyond ? "var(--border)" : "var(--text-muted)", fontWeight: active ? 700 : 400, opacity: beyond ? 0.5 : 1, cursor: beyond ? "not-allowed" : "pointer" }}
                >{d}</button>
              );
            })}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setShowInbreeding((v) => !v)} style={{ ...toolBtn, background: showInbreeding ? "var(--inbreed-bg)" : "white", color: showInbreeding ? "var(--inbreed-text)" : "var(--text-muted)", border: showInbreeding ? "1px solid var(--inbreed-border)" : "1px solid var(--border)" }} title={showInbreeding ? "Hide inbreeding highlights" : "Show inbreeding highlights"}>
                {showInbreeding ? "⚠ Inbreeding ON" : "⚠ Inbreeding OFF"}
              </button>
              <button onClick={() => setHideFoundation((v) => !v)} style={{ ...toolBtn, background: hideFoundation ? "var(--sand-bg)" : "white", color: hideFoundation ? "var(--sand-text)" : "var(--text-muted)", border: hideFoundation ? "1px solid var(--sand-border)" : "1px solid var(--border)" }} title={hideFoundation ? "Show Foundation/Unknown ancestors" : "Hide Foundation/Unknown ancestors"}>
                {hideFoundation ? "Foundation hidden" : "Foundation shown"}
              </button>
              <button onClick={() => setZoom((z) => clampZoom(z - 0.15))} style={{ ...toolBtn, padding: "5px 11px", fontWeight: 700 }}>−</button>
              <button onClick={() => setZoom(calcFit(maxDepth, canvasH))} style={{ ...toolBtn, minWidth: 52, textAlign: "center" }} title="Click to fit view">{Math.round(zoom * 100)}%</button>
              <button onClick={() => setZoom((z) => clampZoom(z + 0.15))} style={{ ...toolBtn, padding: "5px 11px", fontWeight: 700 }}>+</button>
              <button onClick={toggleFullscreen} style={toolBtn}>{isFs ? "✕ Exit" : "⛶ Fullscreen"}</button>
              {isAdmin && (
                <button onClick={download} disabled={downloading} style={{ ...toolBtn, opacity: downloading ? 0.6 : 1 }}>
                  ↓ {downloading ? "Saving…" : "Download"}
                </button>
              )}
            </div>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
            Drag to pan · ⌘/Ctrl + scroll to zoom · click % to fit · hover an inbred ancestor to highlight all copies
          </p>
        </>
      )}

      {/* Scroll container — flex:1 in fullscreen so it fills the screen */}
      <div ref={scrollRef} onWheel={onWheel} onMouseDown={onPanStart}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onMouseOver={onHover} onMouseOut={onHover}
        style={{
          overflow: "auto", cursor: isMobile ? "default" : "grab",
          border: "1px solid var(--border)", borderRadius: 8, background: "var(--cream-dark)",
          touchAction: "none",
          ...(isFs ? { flex: 1, minHeight: 0 } : { height: isMobile ? MOBILE_CANVAS_H : DESKTOP_CANVAS_H }),
        }}>

        {/* Scroll area — sized to the scaled grid so scroll bars appear correctly */}
        <div style={{ width: scrollAreaW, height: scrollAreaH, position: "relative", flexShrink: 0 }}>

          {/* Grid — natural size, scaled via transform */}
          <div style={{ position: "absolute", top: 0, left: 0, width: containerW, height: naturalH, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
            <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: colTemplate, gridTemplateRows: rowTemplate, gap: 2, width: "100%", height: "100%", padding: 4, boxSizing: "border-box" }}>
              {cells.map((cell, i) => <GridCard key={i} cell={cell} idMap={idMap} rowUnitH={rowUnitH} showInbreeding={showInbreeding} hideFoundation={hideFoundation} />)}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
