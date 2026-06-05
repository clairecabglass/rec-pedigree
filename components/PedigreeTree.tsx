"use client";
import { useState, useRef } from "react";
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

  return horseId ? (
    <Link href={`/registry/${horseId}`} className={cls}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  if (!node) return <p style={{ color: "var(--text-muted)" }}>No pedigree data available.</p>;

  const refs: HorseRef[] = JSON.parse(allHorses);
  const idMap = new Map(refs.map((h) => [h.name.toLowerCase(), h.id]));

  async function goFullscreen() {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen?.();
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

  return (
    <div ref={wrapRef} style={{ background: "var(--cream)" }}>
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

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={goFullscreen} style={toolBtn} title="Fullscreen">
            ⛶ Fullscreen
          </button>
          {isAdmin && (
            <button onClick={download} disabled={downloading} style={{ ...toolBtn, opacity: downloading ? 0.6 : 1 }} title="Download as image">
              ↓ {downloading ? "Saving…" : "Download"}
            </button>
          )}
        </div>
      </div>

      <div style={{ overflowX: "auto", paddingBottom: 12 }}>
        <div className="ped-root" ref={treeRef}>
          <Node node={node} role="root" depth={0} maxDepth={maxDepth} dupes={dupes} idMap={idMap} />
        </div>
      </div>
    </div>
  );
}
