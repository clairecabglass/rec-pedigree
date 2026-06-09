"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import { parseHorseCoat } from "@/lib/horseCoat";
import type { HorseNode } from "@/lib/pedigree";

interface Props {
  node: HorseNode | null;
  dupes: Set<string>;
  allHorses: string; // JSON: {id, name}[]
  isAdmin?: boolean;
  title?: string;
  bare?: boolean;      // no toolbar — used for certificate PNG export
  fixedDepth?: number;
  compact?: boolean;   // tighter rows (certificate)
  availableDepth?: number;
}

interface HorseRef { id: string; name: string; }

/* ---- Layout constants ---- */
const ROW_H      = 44;   // px per row at zoom 1
const COL_ROOT   = 200;  // px — root (subject) column
const COL_ANC    = 155;  // px — each ancestor column
const CANVAS_H   = 580;  // px — visible scroll-container height

/* ---- Color tokens ---- */
type Side = "root" | "sire" | "dam";

const SIDE: Record<Side, { bg: string; border: string; text: string; muted: string }> = {
  root: { bg: "var(--cream)",    border: "var(--gold)",        text: "var(--teal-dark)",    muted: "var(--text-muted)" },
  sire: { bg: "var(--sire-bg)",  border: "var(--sire-border)", text: "var(--sire-text)",    muted: "#7A9BB0" },
  dam:  { bg: "var(--dam-bg)",   border: "var(--dam-border)",  text: "var(--dam-text)",     muted: "#AE8099" },
};
const INBREED = { bg: "var(--inbreed-bg)", border: "var(--inbreed-border)", text: "var(--inbreed-text)", muted: "var(--inbreed-text)" };

/* ---- Grid cell ---- */
interface GridCell {
  col: number;
  rowStart: number;
  rowSpan: number;
  node: HorseNode | null;
  side: Side;
  inbreed: boolean;
}

function buildGrid(
  node: HorseNode | null,
  col: number,
  rowStart: number,
  rowSpan: number,
  side: Side,
  maxDepth: number,
  dupes: Set<string>,
  cells: GridCell[],
) {
  const inbreed = !!node && dupes.has(node.name.toLowerCase());
  cells.push({ col, rowStart, rowSpan, node, side, inbreed });
  if (col >= maxDepth + 1) return; // deepest column — no further recursion
  const half = rowSpan / 2;
  buildGrid(node?.sire ?? null, col + 1, rowStart,        half, col === 1 ? "sire" : side, maxDepth, dupes, cells);
  buildGrid(node?.dam  ?? null, col + 1, rowStart + half, half, col === 1 ? "dam"  : side, maxDepth, dupes, cells);
}

/* ---- Font sizes by column (index = col - 1) ---- */
const NAME_SZ = [15, 13, 12, 11, 10,  9,  8, 8, 8, 8, 8];
const META_SZ = [12, 11, 10,  9,  9,  8,  7, 7, 7, 7, 7];

/* ---- Single grid card ---- */
function GridCard({
  cell, idMap,
}: {
  cell: GridCell;
  idMap: Map<string, string>;
}) {
  const { col, rowStart, rowSpan, node, side, inbreed } = cell;
  const s = inbreed ? INBREED : SIDE[side];
  const nameSize = NAME_SZ[col - 1] ?? 8;
  const metaSize = META_SZ[col - 1] ?? 7;

  const coat = node?.coat ? (parseHorseCoat(node.coat).cleanName || null) : null;
  const isUnknown = !node || node.name.toLowerCase() === "unknown";
  const horseId = node ? idMap.get(node.name.toLowerCase()) : null;
  const dupeKey = inbreed && node ? node.name.toLowerCase() : undefined;

  const inner = (
    <div style={{
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: col === 1 ? "10px 14px" : "4px 8px",
      height: "100%", gap: 1, overflow: "hidden",
    }}>
      <div style={{
        fontFamily: "var(--font-playfair)", fontSize: nameSize, fontWeight: 700,
        color: isUnknown ? "var(--text-muted)" : s.text,
        lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {node?.name ?? "Unknown"}
      </div>

      {node?.breed && (
        <div style={{
          fontFamily: "var(--font-lato)", fontSize: metaSize, color: s.muted,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3,
        }}>
          {node.gender ? `${node.gender} · ` : ""}{node.breed}
        </div>
      )}

      {coat && (
        <div style={{
          fontFamily: "var(--font-lato)", fontSize: metaSize - 1, color: s.muted,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.85,
        }}>
          {coat}
        </div>
      )}

      {inbreed && (
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 9, color: "var(--inbreed-text)", fontWeight: 700 }}>
          ⚠ Inbreeding
        </div>
      )}
    </div>
  );

  const cellStyle: React.CSSProperties = {
    gridColumn: col,
    gridRow: `${rowStart} / span ${rowSpan}`,
    background: isUnknown ? "var(--cream-dark)" : s.bg,
    border: `1px solid ${isUnknown ? "var(--border)" : s.border}`,
    borderRadius: 4,
    overflow: "hidden",
    textDecoration: "none",
    ...(col === 1 ? { borderLeft: "4px solid var(--gold)" } : {}),
  };

  if (horseId) {
    return (
      <Link href={`/registry/${horseId}`} style={cellStyle} data-dupe={dupeKey}
        title={dupeKey ? `${node?.name} appears more than once in this pedigree — hover to see every copy.` : undefined}>
        {inner}
      </Link>
    );
  }
  return <div style={cellStyle} data-dupe={dupeKey}>{inner}</div>;
}

/* ---- Main component ---- */
export default function PedigreeTree({
  node, dupes, allHorses, isAdmin, title, bare, fixedDepth, compact, availableDepth,
}: Props) {
  const [depthState, setDepthState] = useState(5);
  const [zoom, setZoom] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef  = useRef<HTMLDivElement>(null);

  const cap = availableDepth != null && availableDepth > 0 ? availableDepth : Infinity;
  const maxDepth = bare ? (fixedDepth ?? 4) : Math.min(depthState, cap);
  const totalRows = Math.pow(2, maxDepth);

  const clampZoom = (z: number) => Math.min(3, Math.max(0.08, z));

  function calcFitZoom(d: number) {
    const rows = Math.pow(2, d);
    return clampZoom(CANVAS_H / (rows * ROW_H + 16));
  }

  // Auto-fit on first render and on depth change
  useEffect(() => {
    setZoom(calcFitZoom(depthState));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depthState]);

  if (!node) return <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>No pedigree data available.</p>;

  const refs: HorseRef[] = JSON.parse(allHorses);
  const idMap = new Map(refs.map((h) => [h.name.toLowerCase(), h.id]));

  const cells: GridCell[] = [];
  buildGrid(node, 1, 1, totalRows, "root", maxDepth, dupes, cells);

  const colTemplate = `${COL_ROOT}px repeat(${maxDepth}, ${COL_ANC}px)`;
  const rowTemplate = `repeat(${totalRows}, ${ROW_H}px)`;

  /* ---- Bare mode (certificate PNG export) ---- */
  if (bare) {
    return (
      <div ref={gridRef} style={{
        display: "grid",
        gridTemplateColumns: colTemplate,
        gridTemplateRows: rowTemplate,
        gap: 2,
        padding: compact ? 6 : 8,
        width: "max-content",
        background: "#FBF8F4",
      }}>
        {cells.map((cell, i) => <GridCard key={i} cell={cell} idMap={idMap} />)}
      </div>
    );
  }

  /* ---- Ctrl/Cmd + scroll to zoom ---- */
  function onWheel(e: React.WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => clampZoom(z - e.deltaY * 0.002));
    }
  }

  /* ---- Drag to pan ---- */
  function onPanStart(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("a")) return;
    const sc = scrollRef.current;
    if (!sc) return;
    const sx = e.clientX, sy = e.clientY;
    const sl = sc.scrollLeft, st = sc.scrollTop;
    sc.style.cursor = "grabbing";
    const move = (ev: MouseEvent) => {
      sc.scrollLeft = sl - (ev.clientX - sx);
      sc.scrollTop  = st - (ev.clientY - sy);
    };
    const up = () => {
      sc.style.cursor = "grab";
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  /* ---- Hover to highlight inbred ancestor copies ---- */
  function onHover(e: React.MouseEvent) {
    const card = (e.target as HTMLElement).closest<HTMLElement>("[data-dupe]");
    const sc = scrollRef.current;
    if (!sc) return;
    sc.querySelectorAll(".dupe-active").forEach((el) => el.classList.remove("dupe-active"));
    if (!card) return;
    const name = card.getAttribute("data-dupe");
    if (name) sc.querySelectorAll(`[data-dupe="${CSS.escape(name)}"]`).forEach((el) => el.classList.add("dupe-active"));
  }

  async function download() {
    if (!gridRef.current) return;
    setDownloading(true);
    try {
      const url = await toPng(gridRef.current, {
        backgroundColor: "#FBF8F4", pixelRatio: 2, skipFonts: true,
      });
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
  const zoomBtn: React.CSSProperties = {
    ...toolBtn, padding: "5px 11px", fontWeight: 700, minWidth: 34, textAlign: "center" as const,
  };

  return (
    <div style={{ background: "var(--cream)" }}>

      {/* ---- Toolbar ---- */}
      <div style={{
        marginBottom: 10, display: "flex", gap: 8, alignItems: "center",
        fontFamily: "var(--font-lato)", fontSize: 13, flexWrap: "wrap",
      }}>
        <span style={{ color: "var(--text-muted)" }}>Generations:</span>
        {[3, 4, 5, 6, 7, 8, 9, 10].map((d) => {
          const beyond = d > cap;
          const active = maxDepth === d;
          return (
            <button key={d}
              onClick={() => { if (!beyond) setDepthState(d); }}
              disabled={beyond}
              title={beyond ? `Only ${cap} generation${cap !== 1 ? "s" : ""} of data available` : undefined}
              style={{
                ...toolBtn,
                background: active ? "var(--teal)" : "white",
                color: active ? "white" : beyond ? "var(--border)" : "var(--text-muted)",
                fontWeight: active ? 700 : 400,
                opacity: beyond ? 0.5 : 1,
                cursor: beyond ? "not-allowed" : "pointer",
              }}
            >{d}</button>
          );
        })}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setZoom((z) => clampZoom(z - 0.15))} style={zoomBtn} title="Zoom out">−</button>
          <button onClick={() => setZoom(calcFitZoom(maxDepth))} style={{ ...toolBtn, minWidth: 52, textAlign: "center" }} title="Click to fit view">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => setZoom((z) => clampZoom(z + 0.15))} style={zoomBtn} title="Zoom in">+</button>
          {isAdmin && (
            <button onClick={download} disabled={downloading}
              style={{ ...toolBtn, opacity: downloading ? 0.6 : 1 }}>
              ↓ {downloading ? "Saving…" : "Download"}
            </button>
          )}
        </div>
      </div>

      <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
        Drag to pan · ⌘/Ctrl + scroll to zoom · click % to fit view · hover an inbred ancestor to highlight all copies
      </p>

      {/* ---- Pan / zoom canvas ---- */}
      <div
        ref={scrollRef}
        onWheel={onWheel}
        onMouseDown={onPanStart}
        onMouseOver={onHover}
        onMouseOut={onHover}
        style={{
          overflow: "auto",
          height: CANVAS_H,
          cursor: "grab",
          border: "1px solid var(--border)",
          borderRadius: 8,
          background: "var(--cream-dark)",
        }}
      >
        <div style={{ zoom, padding: 8, width: "max-content" }}>
          <div
            ref={gridRef}
            style={{
              display: "grid",
              gridTemplateColumns: colTemplate,
              gridTemplateRows: rowTemplate,
              gap: 2,
            }}
          >
            {cells.map((cell, i) => <GridCard key={i} cell={cell} idMap={idMap} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
