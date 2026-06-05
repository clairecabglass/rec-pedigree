"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import type { HorseNode } from "@/lib/pedigree";

interface Props {
  node: HorseNode | null;
  dupes: Set<string>;
  allHorses: string; // JSON: {id, name}[]
  isAdmin?: boolean;  // download is admin-only
  title?: string;     // used for the downloaded filename
  bare?: boolean;     // no toolbar, transparent bg (for the certificate)
  fixedDepth?: number;
  compact?: boolean;  // tighter rows (certificate)
}

interface HorseRef { id: string; name: string; }

function Card({
  node, role, dupes, idMap, depth,
}: {
  node: HorseNode;
  role: "root" | "sire" | "dam";
  dupes: Set<string>;
  idMap: Map<string, string>;
  depth: number;
}) {
  const isInbreeding = dupes.has(node.name.toLowerCase());
  const isUnknown = node.name.toLowerCase() === "unknown";
  const horseId = idMap.get(node.name.toLowerCase());

  const cls = [
    "ped-card",
    role,
    isInbreeding ? "inbreeding" : "",
    isUnknown && !isInbreeding ? "unknown" : "",
    horseId ? "" : "no-link",
  ].filter(Boolean).join(" ");

  const inner = (
    <>
      <div className="pc-name">{node.name}</div>
      {node.breed && <div className="pc-breed">{node.breed}</div>}
      {node.coat && depth < 2 && <div className="pc-coat">{node.coat}</div>}
      {isInbreeding && <div className="pc-flag">⚠ Inbreeding</div>}
    </>
  );

  // data-dupe lets us highlight every copy of the same ancestor on hover, so
  // it's clear WHICH cards are the matching pair (not the card beside it).
  const dupeAttr = isInbreeding ? node.name.toLowerCase() : undefined;
  const dupeTitle = isInbreeding
    ? `${node.name} appears more than once in this pedigree — hover to see every copy.`
    : undefined;

  return horseId ? (
    <Link href={`/registry/${horseId}`} className={cls} data-dupe={dupeAttr} title={dupeTitle}>{inner}</Link>
  ) : (
    <div className={cls} data-dupe={dupeAttr} title={dupeTitle}>{inner}</div>
  );
}

function Node({
  node, role, depth, maxDepth, dupes, idMap,
}: {
  node: HorseNode;
  role: "root" | "sire" | "dam";
  depth: number;
  maxDepth: number;
  dupes: Set<string>;
  idMap: Map<string, string>;
}) {
  const showParents = depth < maxDepth && (node.sire || node.dam) && !node.inbreeding;
  const sire = node.sire ?? null;
  const dam = node.dam ?? null;
  const bothPresent = !!sire && !!dam;

  return (
    <div className="ped-node">
      <Card node={node} role={role} dupes={dupes} idMap={idMap} depth={depth} />

      {showParents && (
        <div className="ped-parents">
          {sire && (
            <div className={`ped-branch sire ${bothPresent ? "has-sibling" : ""}`}>
              <Node node={sire} role="sire" depth={depth + 1} maxDepth={maxDepth} dupes={dupes} idMap={idMap} />
            </div>
          )}
          {dam && (
            <div className={`ped-branch dam ${bothPresent ? "has-sibling" : ""}`}>
              <Node node={dam} role="dam" depth={depth + 1} maxDepth={maxDepth} dupes={dupes} idMap={idMap} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PedigreeTree({ node, dupes, allHorses, isAdmin, title, bare, fixedDepth, compact }: Props) {
  const [maxDepthState, setMaxDepth] = useState(5);
  const maxDepth = bare ? (fixedDepth ?? 5) : maxDepthState;
  const [downloading, setDownloading] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const [zoom, setZoom] = useState(1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track fullscreen state so we can switch to the pan/zoom canvas layout.
  useEffect(() => {
    const onChange = () => {
      const fs = document.fullscreenElement === wrapRef.current;
      setIsFs(fs);
      if (!fs) setZoom(1); // reset when leaving fullscreen
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (!node) return <p style={{ color: "var(--text-muted)" }}>No pedigree data available.</p>;

  const refs: HorseRef[] = JSON.parse(allHorses);
  const idMap = new Map(refs.map((h) => [h.name.toLowerCase(), h.id]));

  const clampZoom = (z: number) => Math.min(2.5, Math.max(0.3, z));

  async function goFullscreen() {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen?.();
  }

  // Ctrl/⌘ + wheel zooms; plain wheel scrolls normally.
  function onWheel(e: React.WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => clampZoom(z - e.deltaY * 0.002));
    }
  }

  // Drag anywhere on empty canvas to pan (grab/grabbing cursor).
  function onPanStart(e: React.MouseEvent) {
    // Don't hijack clicks on the cards themselves (they're links).
    if ((e.target as HTMLElement).closest(".ped-card")) return;
    const sc = scrollRef.current;
    if (!sc) return;
    const startX = e.clientX, startY = e.clientY;
    const startL = sc.scrollLeft, startT = sc.scrollTop;
    sc.style.cursor = "grabbing";
    const move = (ev: MouseEvent) => {
      sc.scrollLeft = startL - (ev.clientX - startX);
      sc.scrollTop = startT - (ev.clientY - startY);
    };
    const up = () => {
      sc.style.cursor = "grab";
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  // Hover a repeated ancestor → outline every other copy of it in the tree.
  function onHover(e: React.MouseEvent) {
    const card = (e.target as HTMLElement).closest<HTMLElement>("[data-dupe]");
    const sc = scrollRef.current;
    if (!sc) return;
    sc.querySelectorAll(".dupe-active").forEach((el) => el.classList.remove("dupe-active"));
    if (!card) return;
    const name = card.getAttribute("data-dupe");
    if (!name) return;
    sc.querySelectorAll(`[data-dupe="${CSS.escape(name)}"]`).forEach((el) => el.classList.add("dupe-active"));
  }

  async function download() {
    if (!treeRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(treeRef.current, {
        backgroundColor: "#FBF8F4",
        pixelRatio: 2,
        style: { overflow: "visible" },
        width: treeRef.current.scrollWidth + 32,
        height: treeRef.current.scrollHeight + 32,
      });
      const a = document.createElement("a");
      a.download = `${(title ?? "pedigree").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-pedigree.png`;
      a.href = dataUrl;
      a.click();
    } catch {
      alert("Could not generate the image. Try a smaller generation count.");
    } finally {
      setDownloading(false);
    }
  }

  const toolBtn: React.CSSProperties = {
    padding: "5px 12px", border: "1px solid var(--border)", borderRadius: 4,
    background: "var(--white)", color: "var(--teal-dark)", cursor: "pointer",
    fontSize: 12, fontFamily: "var(--font-lato)", display: "inline-flex", alignItems: "center", gap: 5,
  };

  if (bare) {
    return (
      <div className={`ped-root${compact ? " cert" : ""}`} ref={treeRef} style={{ background: "transparent" }}>
        <Node node={node} role="root" depth={0} maxDepth={maxDepth} dupes={dupes} idMap={idMap} />
      </div>
    );
  }

  const zoomBtn: React.CSSProperties = { ...toolBtn, padding: "5px 11px", fontWeight: 700, minWidth: 34, justifyContent: "center" };

  return (
    <div
      ref={wrapRef}
      style={{
        background: "var(--cream)",
        ...(isFs ? { height: "100vh", display: "flex", flexDirection: "column", padding: 16 } : {}),
      }}
    >
      <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center", fontFamily: "var(--font-lato)", fontSize: 13, flexWrap: "wrap" }}>
        <span style={{ color: "var(--text-muted)" }}>Generations:</span>
        {[3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
          <button
            key={d}
            onClick={() => setMaxDepth(d)}
            style={{
              padding: "5px 13px",
              border: "1px solid var(--border)",
              borderRadius: 4,
              background: maxDepth === d ? "var(--teal)" : "var(--white)",
              color: maxDepth === d ? "var(--white)" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: maxDepth === d ? 700 : 400,
              fontFamily: "var(--font-lato)",
            }}
          >
            {d}
          </button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setZoom((z) => clampZoom(z - 0.2))} style={zoomBtn} title="Zoom out">−</button>
          <button onClick={() => setZoom(1)} style={{ ...toolBtn, minWidth: 52, justifyContent: "center" }} title="Reset zoom">{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom((z) => clampZoom(z + 0.2))} style={zoomBtn} title="Zoom in">+</button>
          <button onClick={goFullscreen} style={toolBtn} title="Fullscreen">
            {isFs ? "✕ Exit" : "⛶ Fullscreen"}
          </button>
          {isAdmin && (
            <button onClick={download} disabled={downloading} style={{ ...toolBtn, opacity: downloading ? 0.6 : 1 }} title="Download as image">
              ↓ {downloading ? "Saving…" : "Download"}
            </button>
          )}
        </div>
      </div>

      {isFs && (
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
          Drag to pan · ⌘/Ctrl + scroll to zoom · hover a repeated ancestor to highlight its copies
        </p>
      )}

      <div
        ref={scrollRef}
        onWheel={onWheel}
        onMouseDown={onPanStart}
        onMouseOver={onHover}
        onMouseOut={onHover}
        style={{
          overflow: "auto",
          paddingBottom: 12,
          cursor: "grab",
          ...(isFs ? { flex: 1, minHeight: 0 } : {}),
        }}
      >
        <div style={{ zoom, width: "max-content" }}>
          <div className="ped-root" ref={treeRef}>
            <Node node={node} role="root" depth={0} maxDepth={maxDepth} dupes={dupes} idMap={idMap} />
          </div>
        </div>
      </div>
    </div>
  );
}
