"use client";
import { useState } from "react";
import Link from "next/link";
import type { HorseNode } from "@/lib/pedigree";

interface Props {
  node: HorseNode | null;
  dupes: Set<string>;
  allHorses: string; // JSON: {id, name}[]
}

interface HorseRef { id: string; name: string; }

function getCardStyle(node: HorseNode, dupes: Set<string>, role: "root" | "sire" | "dam"): React.CSSProperties {
  const isUnknown = node.name.toLowerCase() === "unknown" || (!node.breed && !node.coat && !node.id.includes("c"));
  const isInbreeding = dupes.has(node.name.toLowerCase());

  if (isInbreeding) {
    return { background: "#FFF5F5", borderColor: "#E07070", borderLeft: `3px solid #E07070` };
  }
  if (isUnknown) {
    return { background: "#FFFBF0", borderColor: "var(--gold-light)" };
  }
  if (role === "sire") {
    return { borderLeft: "3px solid var(--teal-light)" };
  }
  if (role === "dam") {
    return { borderLeft: "3px solid var(--gold)" };
  }
  return { borderLeft: "4px solid var(--teal)" };
}

function PedigreeNode({
  node, dupes, allHorsesMap, role, depth, maxDepth,
}: {
  node: HorseNode | null;
  dupes: Set<string>;
  allHorsesMap: Map<string, string>;
  role: "root" | "sire" | "dam";
  depth: number;
  maxDepth: number;
}) {
  if (!node) return null;

  const horseId = allHorsesMap.get(node.name.toLowerCase());
  const hasSire = !!node.sire;
  const hasDam = !!node.dam;
  const hasAncestors = hasSire || hasDam;
  const cardStyle = getCardStyle(node, dupes, role);

  const card = (
    <div
      style={{
        background: "var(--white)",
        border: "1.5px solid var(--border)",
        borderRadius: 6,
        padding: depth === 0 ? "10px 14px" : "6px 10px",
        minWidth: depth === 0 ? 180 : 148,
        maxWidth: depth === 0 ? 220 : 180,
        cursor: horseId ? "pointer" : "default",
        transition: "border-color 0.15s, box-shadow 0.15s",
        ...cardStyle,
      }}
      onMouseEnter={(e) => {
        if (horseId) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(94,128,128,0.25)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--teal)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "";
        (e.currentTarget as HTMLDivElement).style.borderColor = "";
      }}
    >
      <div style={{
        fontSize: depth === 0 ? 13 : 11,
        fontWeight: 600,
        color: "var(--teal-dark)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontFamily: "var(--font-lato)",
      }}>
        {node.name}
      </div>
      {node.breed && (
        <div style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-lato)" }}>
          {node.breed}
        </div>
      )}
      {node.coat && depth < 2 && (
        <div style={{ fontSize: 10, color: "var(--gold)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-lato)" }}>
          {node.coat}
        </div>
      )}
    </div>
  );

  return horseId ? (
    <Link href={`/registry/${horseId}`} style={{ textDecoration: "none" }}>
      {card}
    </Link>
  ) : card;
}

function PedigreeColumn({
  nodes, dupes, allHorsesMap, depth, maxDepth,
}: {
  nodes: Array<{ node: HorseNode | null; role: "sire" | "dam" }>;
  dupes: Set<string>;
  allHorsesMap: Map<string, string>;
  depth: number;
  maxDepth: number;
}) {
  if (depth > maxDepth) return null;

  const nextNodes: Array<{ node: HorseNode | null; role: "sire" | "dam" }> = [];

  for (const { node } of nodes) {
    nextNodes.push({ node: node?.sire ?? null, role: "sire" });
    nextNodes.push({ node: node?.dam ?? null, role: "dam" });
  }

  const hasNext = nextNodes.some(n => n.node !== null);

  return (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      {/* Column of cards */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: 4 }}>
        {nodes.map(({ node, role }, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "3px 0" }}>
            {node ? (
              <PedigreeNode node={node} dupes={dupes} allHorsesMap={allHorsesMap} role={role} depth={depth} maxDepth={maxDepth} />
            ) : (
              <div style={{ minWidth: 148, height: 32, border: "1.5px dashed var(--border)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 10, color: "var(--border)", fontFamily: "var(--font-lato)" }}>—</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Connectors + next column */}
      {hasNext && depth < maxDepth && (
        <div style={{ display: "flex", alignItems: "stretch" }}>
          {/* SVG bracket connectors */}
          <svg
            width={32}
            style={{ flexShrink: 0 }}
            height={nodes.length * 40}
            viewBox={`0 0 32 ${nodes.length * 40}`}
            preserveAspectRatio="none"
          >
            {nodes.map((_, i) => {
              const y1 = i * 40 + 20;
              const y2_sire = (i * 2) * 20 + 10;
              const y2_dam = (i * 2 + 1) * 20 + 10;
              return (
                <g key={i}>
                  <line x1={0} y1={y1} x2={16} y2={y1} stroke="var(--border)" strokeWidth={1.5} />
                  <line x1={16} y1={y2_sire} x2={32} y2={y2_sire} stroke="var(--border)" strokeWidth={1.5} />
                  <line x1={16} y1={y2_dam} x2={32} y2={y2_dam} stroke="var(--border)" strokeWidth={1.5} />
                  <line x1={16} y1={y2_sire} x2={16} y2={y2_dam} stroke="var(--border)" strokeWidth={1.5} />
                </g>
              );
            })}
          </svg>

          <PedigreeColumn
            nodes={nextNodes}
            dupes={dupes}
            allHorsesMap={allHorsesMap}
            depth={depth + 1}
            maxDepth={maxDepth}
          />
        </div>
      )}
    </div>
  );
}

export default function PedigreeTree({ node, dupes, allHorses }: Props) {
  const [maxDepth, setMaxDepth] = useState(3);

  if (!node) return <p style={{ color: "var(--text-muted)" }}>No pedigree data available.</p>;

  const refs: HorseRef[] = JSON.parse(allHorses);
  const allHorsesMap = new Map(refs.map(h => [h.name.toLowerCase(), h.id]));

  const rootNodes = [{ node, role: "root" as const }];

  return (
    <div>
      <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center", fontFamily: "var(--font-lato)", fontSize: 13 }}>
        <span style={{ color: "var(--text-muted)" }}>Generations:</span>
        {[2, 3, 4, 5].map((d) => (
          <button
            key={d}
            onClick={() => setMaxDepth(d)}
            style={{
              padding: "4px 12px",
              border: "1px solid var(--border)",
              borderRadius: 4,
              background: maxDepth === d ? "var(--teal)" : "var(--white)",
              color: maxDepth === d ? "var(--white)" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "var(--font-lato)",
            }}
          >
            {d}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", overflowX: "auto", paddingBottom: 8 }}>
        {/* Root horse */}
        <div style={{ marginRight: 4 }}>
          <PedigreeNode node={node} dupes={dupes} allHorsesMap={allHorsesMap} role="root" depth={0} maxDepth={maxDepth} />
        </div>

        {/* Connector from root to sire/dam */}
        {(node.sire || node.dam) && maxDepth >= 1 && (
          <div style={{ display: "flex", alignItems: "stretch" }}>
            <svg width={32} height={80} viewBox="0 0 32 80" preserveAspectRatio="none" style={{ flexShrink: 0 }}>
              <line x1={0} y1={40} x2={16} y2={40} stroke="var(--border)" strokeWidth={1.5} />
              <line x1={16} y1={20} x2={32} y2={20} stroke="var(--border)" strokeWidth={1.5} />
              <line x1={16} y1={60} x2={32} y2={60} stroke="var(--border)" strokeWidth={1.5} />
              <line x1={16} y1={20} x2={16} y2={60} stroke="var(--border)" strokeWidth={1.5} />
            </svg>

            <PedigreeColumn
              nodes={[
                { node: node.sire ?? null, role: "sire" },
                { node: node.dam ?? null, role: "dam" },
              ]}
              dupes={dupes}
              allHorsesMap={allHorsesMap}
              depth={1}
              maxDepth={maxDepth}
            />
          </div>
        )}
      </div>
    </div>
  );
}
