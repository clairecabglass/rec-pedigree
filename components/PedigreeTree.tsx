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

export default function PedigreeTree({ node, dupes, allHorses }: Props) {
  const [maxDepth, setMaxDepth] = useState(5);

  if (!node) return <p style={{ color: "var(--text-muted)" }}>No pedigree data available.</p>;

  const refs: HorseRef[] = JSON.parse(allHorses);
  const idMap = new Map(refs.map((h) => [h.name.toLowerCase(), h.id]));

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center", fontFamily: "var(--font-lato)", fontSize: 13, flexWrap: "wrap" }}>
        <span style={{ color: "var(--text-muted)" }}>Generations:</span>
        {[3, 4, 5, 6, 7].map((d) => (
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
      </div>

      <div style={{ overflowX: "auto", paddingBottom: 12 }}>
        <div className="ped-root">
          <Node node={node} role="root" depth={0} maxDepth={maxDepth} dupes={dupes} idMap={idMap} />
        </div>
      </div>
    </div>
  );
}
