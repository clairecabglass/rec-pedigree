"use client";
import { useState } from "react";

// Sparse ancestor node — mirrors HorseNode but without id/inbreeding (those are computed)
export interface PedNode {
  name: string;
  breed?: string | null;
  gender?: string | null;
  coat?: string | null;
  genotype?: string | null;
  sire?: PedNode | null;
  dam?: PedNode | null;
}

// Exact same palette as PedigreeTree.tsx
const SIRE_CLR  = { bg: "var(--sire-bg)",  border: "var(--sire-border)",  text: "var(--sire-text)",  muted: "#7A9BB0" };
const DAM_CLR   = { bg: "var(--dam-bg)",   border: "var(--dam-border)",   text: "var(--dam-text)",   muted: "#AE8099" };
const ROOT_CLR  = { bg: "#E4E7E1",         border: "#BFC3BD",             text: "#3F5F5F",           muted: "#71807A" };

type Slot = "root" | "sire" | "dam";
type Step = "sire" | "dam";
type Path = Step[];

// Exact same size tables as PedigreeTree.tsx
const NAME_SZ = [15, 13, 12, 11, 10, 9, 8, 8, 8, 8, 8];
const META_SZ = [12, 11, 10,  9,  9, 8, 7, 7, 7, 7, 7];

const WINDOW_DEPTH = 5; // gens shown at one time
const GRID_H = 600;     // px

function clr(slot: Slot) {
  if (slot === "sire") return SIRE_CLR;
  if (slot === "dam")  return DAM_CLR;
  return ROOT_CLR;
}

/* ---- tree helpers ---- */
function getAt(root: PedNode | null, path: Path): PedNode | null {
  let cur: PedNode | null = root;
  for (const s of path) { if (!cur) return null; cur = cur[s] ?? null; }
  return cur;
}

function setAt(root: PedNode | null, path: Path, value: PedNode | null): PedNode | null {
  if (path.length === 0) return value;
  const [head, ...tail] = path;
  const base: PedNode = root ?? { name: "" };
  return { ...base, [head]: setAt(base[head] ?? null, tail, value) };
}

/* ---- grid ---- */
interface PedCell {
  col: number; rowStart: number; rowSpan: number;
  node: PedNode | null; slot: Slot; relPath: Path;
}

function buildGrid(
  node: PedNode | null, col: number, rowStart: number, rowSpan: number,
  maxDepth: number, slot: Slot, relPath: Path, cells: PedCell[],
) {
  cells.push({ col, rowStart, rowSpan, node, slot, relPath });
  if (col >= maxDepth + 1) return;
  const half = rowSpan / 2;
  buildGrid(node?.sire ?? null, col + 1, rowStart,        half, maxDepth, "sire", [...relPath, "sire"], cells);
  buildGrid(node?.dam  ?? null, col + 1, rowStart + half, half, maxDepth, "dam",  [...relPath, "dam"],  cells);
}

function pathLabel(path: Path): string {
  if (path.length === 0) return "Root";
  const map: Record<Step, string> = { sire: "Sire", dam: "Dam" };
  return path.map((s) => map[s]).join(" → ");
}

/* ---- props ---- */
interface Props {
  horseId: string;
  horseName: string;
  horseBreed?: string | null;
  horseGender?: string | null;
  horseCoat?: string | null;
  horseGenotype?: string | null;
  horseSireName?: string | null;
  horseDamName?: string | null;
  initialTree?: unknown;
}

/* ---- component ---- */
export default function PedigreeEditor({
  horseId, horseName, horseBreed, horseGender, horseCoat, horseGenotype,
  horseSireName, horseDamName, initialTree,
}: Props) {
  const init = (): PedNode => {
    if (initialTree && typeof initialTree === "object" && !Array.isArray(initialTree)) {
      return initialTree as PedNode;
    }
    return {
      name: horseName, breed: horseBreed, gender: horseGender,
      coat: horseCoat, genotype: horseGenotype,
      sire: horseSireName ? { name: horseSireName } : null,
      dam:  horseDamName  ? { name: horseDamName  } : null,
    };
  };

  const [tree,           setTree]           = useState<PedNode>(init);
  const [windowPath,     setWindowPath]     = useState<Path>([]);
  const [selectedPath,   setSelectedPath]   = useState<Path | null>(null);
  const [editName,       setEditName]       = useState("");
  const [editBreed,      setEditBreed]      = useState("");
  const [editGender,     setEditGender]     = useState("");
  const [editCoat,       setEditCoat]       = useState("");
  const [editGenotype,   setEditGenotype]   = useState("");
  const [saving,         setSaving]         = useState(false);
  const [savedMsg,       setSavedMsg]       = useState(false);

  const windowRoot = getAt(tree, windowPath);
  const totalRows  = Math.pow(2, WINDOW_DEPTH);
  const rowUnitH   = GRID_H / totalRows;

  const cells: PedCell[] = [];
  buildGrid(windowRoot, 1, 1, totalRows, WINDOW_DEPTH, "root", [], cells);

  /* ---- actions ---- */
  function openCell(relPath: Path, node: PedNode | null) {
    setSelectedPath(relPath);
    setEditName(node?.name ?? "");
    setEditBreed(node?.breed ?? "");
    setEditGender(node?.gender ?? "");
    setEditCoat(node?.coat ?? "");
    setEditGenotype(node?.genotype ?? "");
  }

  function applyEdit() {
    if (selectedPath === null || !editName.trim()) return;
    const absPath: Path = [...windowPath, ...selectedPath];
    const existing = getAt(tree, absPath);
    const updated: PedNode = {
      name:     editName.trim().toUpperCase(),
      breed:    editBreed.trim()    || null,
      gender:   editGender.trim()   || null,
      coat:     editCoat.trim()     || null,
      genotype: editGenotype.trim() || null,
      sire:     existing?.sire ?? null,
      dam:      existing?.dam  ?? null,
    };
    if (absPath.length === 0) {
      setTree((prev) => ({ ...prev, ...updated, sire: prev.sire, dam: prev.dam }));
    } else {
      setTree((prev) => setAt(prev, absPath, updated) ?? prev);
    }
    setSelectedPath(null);
    setSavedMsg(false);
  }

  function removeNode() {
    if (selectedPath === null) return;
    const absPath: Path = [...windowPath, ...selectedPath];
    if (absPath.length === 0) return;
    setTree((prev) => setAt(prev, absPath, null) ?? prev);
    setSelectedPath(null);
    setSavedMsg(false);
  }

  function diveInto(relPath: Path) {
    setWindowPath([...windowPath, ...relPath]);
    setSelectedPath(null);
  }

  function navigateTo(path: Path) {
    setWindowPath(path);
    setSelectedPath(null);
  }

  async function savePedigree() {
    setSaving(true);
    try {
      // Also sync sireName/damName to top-level fields so existing DB queries still work
      const payload: Record<string, unknown> = { pedigreeTree: tree };
      if (windowPath.length === 0) {
        payload.sireName = tree.sire?.name ?? null;
        payload.damName  = tree.dam?.name  ?? null;
      }
      const res = await fetch(`/api/horses/${horseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedMsg(true);
    } catch {
      alert("Failed to save pedigree.");
    } finally {
      setSaving(false);
    }
  }

  /* ---- breadcrumbs ---- */
  const crumbs: { label: string; path: Path }[] = [{ label: tree.name, path: [] }];
  for (let i = 0; i < windowPath.length; i++) {
    const n = getAt(tree, windowPath.slice(0, i + 1));
    crumbs.push({ label: n?.name ?? (windowPath[i] === "sire" ? "Sire" : "Dam"), path: windowPath.slice(0, i + 1) });
  }

  /* ---- styles ---- */
  const btn: React.CSSProperties = {
    padding: "5px 12px", border: "1px solid var(--border)", borderRadius: 4,
    background: "white", color: "var(--teal-dark)", cursor: "pointer",
    fontSize: 12, fontFamily: "var(--font-lato)",
  };
  const colTemplate = `1.2fr repeat(${WINDOW_DEPTH}, 1fr)`;
  const rowTemplate  = `repeat(${totalRows}, 1fr)`;

  return (
    <div style={{ fontFamily: "var(--font-lato)" }}>

      {/* Breadcrumb navigation */}
      <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {i > 0 && <span style={{ color: "var(--text-muted)", fontSize: 13 }}>›</span>}
            <button
              onClick={() => navigateTo(crumb.path)}
              style={{
                ...btn,
                background: i === crumbs.length - 1 ? "var(--teal)" : "white",
                color:      i === crumbs.length - 1 ? "white"       : "var(--teal-dark)",
                fontWeight: i === crumbs.length - 1 ? 700           : 400,
                padding: "4px 10px",
              }}
            >
              {crumb.label}
            </button>
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
          Click a cell to edit · → to dive into ancestors · breadcrumb to go back
        </span>
      </div>

      {/* Pedigree grid — same look as PedigreeTree */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--cream-dark)", marginBottom: 12 }}>
        <div style={{
          display: "grid", gridTemplateColumns: colTemplate, gridTemplateRows: rowTemplate,
          gap: 2, padding: 4, height: GRID_H, boxSizing: "border-box",
        }}>
          {cells.map((cell, i) => {
            const isSelected = selectedPath !== null && selectedPath.join(",") === cell.relPath.join(",");
            const isLeaf     = cell.col >= WINDOW_DEPTH + 1;
            return (
              <EditorCard
                key={i}
                cell={cell}
                rowUnitH={rowUnitH}
                isSelected={isSelected}
                isLeaf={isLeaf}
                onSelect={() => openCell(cell.relPath, cell.node)}
                onDiveIn={!isLeaf ? () => diveInto(cell.relPath) : undefined}
              />
            );
          })}
        </div>
      </div>

      {/* Edit panel — appears when a cell is selected */}
      {selectedPath !== null && (
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 20, marginBottom: 12 }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 15, color: "var(--teal-dark)", marginBottom: 14 }}>
            {[...windowPath, ...selectedPath].length === 0 ? "Root horse" : pathLabel([...windowPath, ...selectedPath])}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={labelSt}>
              <span style={capSt}>Name *</span>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyEdit()} style={inputSt} placeholder="ANCESTOR NAME" />
            </label>
            <label style={labelSt}>
              <span style={capSt}>Breed</span>
              <input value={editBreed} onChange={(e) => setEditBreed(e.target.value)} style={inputSt} placeholder="e.g. Thoroughbred" />
            </label>
            <label style={labelSt}>
              <span style={capSt}>Gender</span>
              <select value={editGender} onChange={(e) => setEditGender(e.target.value)} style={inputSt}>
                <option value="">—</option>
                <option value="Stallion">Stallion</option>
                <option value="Mare">Mare</option>
                <option value="Gelding">Gelding</option>
              </select>
            </label>
            <label style={labelSt}>
              <span style={capSt}>Coat</span>
              <input value={editCoat} onChange={(e) => setEditCoat(e.target.value)} style={inputSt} placeholder="e.g. Bay" />
            </label>
            <label style={{ ...labelSt, gridColumn: "1 / -1" }}>
              <span style={capSt}>Genotype</span>
              <input value={editGenotype} onChange={(e) => setEditGenotype(e.target.value)} style={inputSt} placeholder="e.g. Ee Aa" />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
            <button
              onClick={applyEdit}
              disabled={!editName.trim()}
              style={{ ...btn, background: "var(--teal)", color: "white", fontWeight: 700, opacity: editName.trim() ? 1 : 0.5 }}
            >
              Apply
            </button>
            {[...windowPath, ...selectedPath].length > 0 && (
              <button onClick={removeNode} style={{ ...btn, color: "var(--inbreed-text)", borderColor: "var(--inbreed-border)" }}>
                Remove
              </button>
            )}
            <button onClick={() => setSelectedPath(null)} style={btn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Save */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={savePedigree}
          disabled={saving}
          style={{ ...btn, background: "var(--teal-dark)", color: "white", fontWeight: 700, padding: "8px 20px", fontSize: 13, opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : "Save Pedigree"}
        </button>
        {savedMsg && <span style={{ fontSize: 12, color: "var(--teal-dark)" }}>✓ Saved</span>}
      </div>
    </div>
  );
}

/* ---- shared input styles ---- */
const labelSt: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
const capSt:   React.CSSProperties = { fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" };
const inputSt: React.CSSProperties = {
  border: "1px solid var(--border)", borderRadius: 4, padding: "6px 10px",
  fontSize: 13, fontFamily: "var(--font-lato)", background: "white",
  color: "var(--text)", width: "100%", boxSizing: "border-box",
};

/* ---- EditorCard ---- */
interface CardProps {
  cell: PedCell; rowUnitH: number; isSelected: boolean; isLeaf: boolean;
  onSelect: () => void; onDiveIn?: () => void;
}

function EditorCard({ cell, rowUnitH, isSelected, isLeaf, onSelect, onDiveIn }: CardProps) {
  const { col, rowStart, rowSpan, node, slot } = cell;
  const s       = clr(slot);
  const nameSz  = NAME_SZ[col - 1] ?? 8;
  const metaSz  = META_SZ[col - 1] ?? 7;
  const cellH   = rowUnitH * rowSpan;
  const isEmpty = !node;
  const vPad    = col === 1 ? 10 : cellH < 18 ? 1 : cellH < 28 ? 2 : 4;

  const borderStyle = isSelected
    ? `2px solid var(--teal)`
    : isEmpty
    ? `1px dashed var(--border)`
    : `1px solid ${s.border}`;

  const style: React.CSSProperties = {
    gridColumn: col, gridRow: `${rowStart} / span ${rowSpan}`,
    background: isEmpty ? "transparent" : s.bg,
    border: borderStyle, borderRadius: 4,
    overflow: "hidden", cursor: "pointer",
    minWidth: 0, minHeight: 0, position: "relative",
    boxSizing: "border-box",
    ...(col === 1 && !isEmpty ? { borderLeft: `4px solid #9AA396` } : {}),
  };

  return (
    <div style={style} onClick={onSelect} title={isEmpty ? "Click to add ancestor" : "Click to edit"}>
      {isEmpty ? (
        cellH >= 12 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--border)", fontSize: Math.min(nameSz, 11) }}>
            +
          </div>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: col === 1 ? `${vPad}px 14px` : `${vPad}px 8px`, height: "100%", gap: 1, overflow: "hidden" }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: nameSz, fontWeight: 700, color: s.text, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {node.name || "…"}
          </div>
          {!!node.breed && cellH >= 30 && (
            <div style={{ fontFamily: "var(--font-lato)", fontSize: metaSz, color: s.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25 }}>
              {slot === "sire" ? "Stallion · " : slot === "dam" ? "Mare · " : ""}{node.breed}
            </div>
          )}
          {!!node.coat && cellH >= 46 && (
            <div style={{ fontFamily: "var(--font-lato)", fontSize: metaSz - 1, color: s.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.85, lineHeight: 1.2 }}>
              {node.coat}
            </div>
          )}
        </div>
      )}

      {/* Dive-in button — small arrow in the corner */}
      {!isLeaf && !isEmpty && onDiveIn && cellH >= 20 && (
        <button
          onClick={(e) => { e.stopPropagation(); onDiveIn(); }}
          title="Dive into this horse's ancestors"
          style={{
            position: "absolute", bottom: 2, right: 2,
            padding: "1px 5px", fontSize: 9, lineHeight: 1.5,
            background: "rgba(255,255,255,0.85)", border: `1px solid ${s.border}`,
            borderRadius: 3, cursor: "pointer", color: s.text,
            fontFamily: "var(--font-lato)",
          }}
        >
          →
        </button>
      )}
    </div>
  );
}
