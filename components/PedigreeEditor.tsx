"use client";
import { useState, useRef, useEffect } from "react";

/* ---- Types ---- */
export interface PedNode {
  name: string;
  breed?: string | null;
  gender?: string | null;
  coat?: string | null;
  genotype?: string | null;
  sire?: PedNode | null;
  dam?: PedNode | null;
  // id / inbreeding come from HorseNode — tolerated but ignored by editor
  id?: string;
  inbreeding?: boolean;
}

/* ---- Exact same palette as PedigreeTree.tsx ---- */
const SIRE_CLR = { bg: "var(--sire-bg)", border: "var(--sire-border)", text: "var(--sire-text)", muted: "#7A9BB0" };
const DAM_CLR  = { bg: "var(--dam-bg)",  border: "var(--dam-border)",  text: "var(--dam-text)",  muted: "#AE8099" };
const ROOT_CLR = { bg: "#E4E7E1",        border: "#BFC3BD",            text: "#3F5F5F",          muted: "#71807A" };

type Slot = "root" | "sire" | "dam";
type Step = "sire" | "dam";
type Path = Step[];

const NAME_SZ = [15, 13, 12, 11, 10,  9, 8, 8, 8, 8, 8, 8];
const META_SZ = [12, 11, 10,  9,  9,  8, 7, 7, 7, 7, 7, 7];

const DESKTOP_H = 780;
const MOBILE_H  = 420;
function minRowH(depth: number) {
  if (depth >= 7) return 15;
  if (depth >= 5) return 20;
  return 28;
}

function clr(slot: Slot) {
  if (slot === "sire") return SIRE_CLR;
  if (slot === "dam")  return DAM_CLR;
  return ROOT_CLR;
}

/* ---- Tree helpers ---- */
function getAt(root: PedNode | null, path: Path): PedNode | null {
  let cur: PedNode | null = root;
  for (const s of path) { if (!cur) return null; cur = (cur[s] as PedNode | null | undefined) ?? null; }
  return cur;
}

function setAt(root: PedNode | null, path: Path, value: PedNode | null): PedNode | null {
  if (path.length === 0) return value;
  const [head, ...tail] = path;
  const base: PedNode = root ?? { name: "" };
  return { ...base, [head]: setAt((base[head] as PedNode | null | undefined) ?? null, tail, value) };
}

/* ---- Grid ---- */
interface PedCell { col: number; rowStart: number; rowSpan: number; node: PedNode | null; slot: Slot; relPath: Path; }

function buildGrid(
  node: PedNode | null, col: number, rowStart: number, rowSpan: number,
  maxDepth: number, slot: Slot, relPath: Path, cells: PedCell[],
) {
  cells.push({ col, rowStart, rowSpan, node, slot, relPath });
  if (col >= maxDepth + 1) return;
  const half = rowSpan / 2;
  buildGrid((node?.sire as PedNode | null | undefined) ?? null, col + 1, rowStart,        half, maxDepth, "sire", [...relPath, "sire"], cells);
  buildGrid((node?.dam  as PedNode | null | undefined) ?? null, col + 1, rowStart + half, half, maxDepth, "dam",  [...relPath, "dam"],  cells);
}

function pathLabel(path: Path): string {
  if (path.length === 0) return "Root";
  return path.map((s) => (s === "sire" ? "Sire" : "Dam")).join(" → ");
}

/* ---- Props ---- */
interface Props {
  horseId: string;
  initialTree: PedNode | null;
}

/* ---- Component ---- */
export default function PedigreeEditor({ horseId, initialTree }: Props) {
  /* ---- state ---- */
  const [tree,         setTree]         = useState<PedNode>(() => initialTree ?? { name: "Unknown" });
  const [windowPath,   setWindowPath]   = useState<Path>([]);   // path to current view root
  const [depthState,   setDepthState]   = useState(4);
  const [zoom,         setZoom]         = useState(1);
  const [isMobile,     setIsMobile]     = useState(false);
  const [containerW,   setContainerW]   = useState(1380);
  const [canvasH,      setCanvasH]      = useState(DESKTOP_H);
  const [isFs,         setIsFs]         = useState(false);

  // edit state
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  const [editName,     setEditName]     = useState("");
  const [editBreed,    setEditBreed]    = useState("");
  const [editGender,   setEditGender]   = useState("");
  const [editCoat,     setEditCoat]     = useState("");
  const [editGenotype, setEditGenotype] = useState("");
  const [saving,       setSaving]       = useState(false);
  const [savedMsg,     setSavedMsg]     = useState(false);

  const wrapRef   = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchRef  = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);
  const pinchRef  = useRef<{ dist: number; zoom: number } | null>(null);

  /* ---- effects ---- */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      if (document.fullscreenElement) return;
      setContainerW(el.clientWidth);
      setCanvasH(el.clientHeight);
    });
    obs.observe(el);
    setContainerW(el.clientWidth);
    setCanvasH(el.clientHeight);
    return () => obs.disconnect();
  }, []);

  useEffect(() => { setZoom(1); }, [depthState]); // eslint-disable-line

  useEffect(() => {
    if (isMobile) { setDepthState(3); setCanvasH(MOBILE_H); }
    else          { setCanvasH(DESKTOP_H); }
  }, [isMobile]);

  useEffect(() => {
    const onChange = () => {
      const fs = document.fullscreenElement === wrapRef.current;
      setIsFs(fs);
      setTimeout(() => {
        const el = scrollRef.current;
        if (!el) return;
        setContainerW(el.clientWidth);
        setCanvasH(el.clientHeight);
        setZoom(calcFit(depthState, el.clientHeight));
      }, 260);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [depthState]); // eslint-disable-line

  /* ---- grid math ---- */
  const windowRoot = getAt(tree, windowPath);
  const maxDepth   = depthState;
  const totalRows  = Math.pow(2, maxDepth);
  const naturalH   = Math.max(canvasH, totalRows * minRowH(maxDepth));
  const rowUnitH   = naturalH / totalRows;

  const clampZoom = (z: number) => Math.min(3, Math.max(0.08, z));
  const calcFit   = (d: number, h = canvasH) => {
    const nh = Math.max(h, Math.pow(2, d) * minRowH(d));
    return clampZoom(Math.min(1, h / nh));
  };

  const cells: PedCell[] = [];
  buildGrid(windowRoot, 1, 1, totalRows, maxDepth, "root", [], cells);

  const colTemplate = `1.2fr repeat(${maxDepth}, 1fr)`;
  const rowTemplate = `repeat(${totalRows}, 1fr)`;
  const scaledW     = containerW * zoom;
  const scaledH     = naturalH   * zoom;

  /* ---- interaction handlers (same as PedigreeTree) ---- */
  function onWheel(e: React.WheelEvent) {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom((z) => clampZoom(z - e.deltaY * 0.002)); }
  }

  function onPanStart(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    const sc = scrollRef.current;
    if (!sc) return;
    const sx = e.clientX, sy = e.clientY, sl = sc.scrollLeft, st = sc.scrollTop;
    sc.style.cursor = "grabbing";
    const move = (ev: MouseEvent) => { sc.scrollLeft = sl - (ev.clientX - sx); sc.scrollTop = st - (ev.clientY - sy); };
    const up   = () => { sc.style.cursor = "grab"; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      const t = e.touches[0], sc = scrollRef.current;
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
      const sc = scrollRef.current; if (!sc) return;
      const t = e.touches[0];
      sc.scrollLeft = touchRef.current.sl - (t.clientX - touchRef.current.x);
      sc.scrollTop  = touchRef.current.st - (t.clientY - touchRef.current.y);
    } else if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setZoom(clampZoom(pinchRef.current.zoom * Math.hypot(dx, dy) / pinchRef.current.dist));
    }
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await wrapRef.current?.requestFullscreen?.();
  }

  /* ---- edit actions ---- */
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
      sire:     (existing?.sire as PedNode | null | undefined) ?? null,
      dam:      (existing?.dam  as PedNode | null | undefined) ?? null,
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
    setZoom(1);
  }

  function navigateTo(path: Path) {
    setWindowPath(path);
    setSelectedPath(null);
    setZoom(1);
  }

  async function savePedigree() {
    setSaving(true);
    try {
      // Use the dedicated pedigree endpoint which upserts all ancestor DB records
      // so changes propagate to every other horse that shares the same ancestors.
      const res = await fetch(`/api/horses/${horseId}/pedigree`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tree: stripIds(tree) }),
      });
      if (!res.ok) throw new Error();
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
  const toolBtn: React.CSSProperties = {
    padding: "5px 12px", border: "1px solid var(--border)", borderRadius: 4,
    background: "white", color: "var(--teal-dark)", cursor: "pointer",
    fontSize: 12, fontFamily: "var(--font-lato)",
  };

  /* ---- render ---- */
  return (
    <div ref={wrapRef} style={isFs ? { background: "var(--cream)", height: "100vh", display: "flex", flexDirection: "column", padding: 16 } : { background: "var(--cream)" }}>

      {/* Breadcrumb */}
      {crumbs.length > 1 && (
        <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
          {crumbs.map((crumb, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && <span style={{ color: "var(--text-muted)", fontSize: 13 }}>›</span>}
              <button
                onClick={() => navigateTo(crumb.path)}
                style={{
                  ...toolBtn,
                  background: i === crumbs.length - 1 ? "var(--teal)" : "white",
                  color:      i === crumbs.length - 1 ? "white"       : "var(--teal-dark)",
                  fontWeight: i === crumbs.length - 1 ? 700           : 400,
                  padding: "3px 10px",
                }}
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Toolbar — identical layout to PedigreeTree */}
      {isMobile ? (
        <div style={{ marginBottom: 8, fontFamily: "var(--font-lato)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Gen:</span>
            {[3, 4, 5, 6, 7].map((d) => (
              <button key={d} onClick={() => setDepthState(d)}
                style={{ ...toolBtn, padding: "4px 9px", fontSize: 11, background: depthState === d ? "var(--teal)" : "white", color: depthState === d ? "white" : "var(--text-muted)", fontWeight: depthState === d ? 700 : 400 }}
              >{d}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => setZoom((z) => clampZoom(z - 0.15))} style={{ ...toolBtn, padding: "4px 9px", fontWeight: 700, fontSize: 13 }}>−</button>
            <button onClick={() => setZoom(calcFit(maxDepth, canvasH))} style={{ ...toolBtn, fontSize: 11, padding: "4px 10px" }}>Fit {Math.round(zoom * 100)}%</button>
            <button onClick={() => setZoom((z) => clampZoom(z + 0.15))} style={{ ...toolBtn, padding: "4px 9px", fontWeight: 700, fontSize: 13 }}>+</button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 10, display: "flex", gap: 8, alignItems: "center", fontFamily: "var(--font-lato)", fontSize: 13, flexWrap: "wrap" }}>
          <span style={{ color: "var(--text-muted)" }}>Generations:</span>
          {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((d) => (
            <button key={d} onClick={() => setDepthState(d)}
              style={{ ...toolBtn, background: depthState === d ? "var(--teal)" : "white", color: depthState === d ? "white" : "var(--text-muted)", fontWeight: depthState === d ? 700 : 400 }}
            >{d}</button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setZoom((z) => clampZoom(z - 0.15))} style={{ ...toolBtn, padding: "5px 11px", fontWeight: 700 }}>−</button>
            <button onClick={() => setZoom(calcFit(maxDepth, canvasH))} style={{ ...toolBtn, minWidth: 52, textAlign: "center" }} title="Click to fit view">{Math.round(zoom * 100)}%</button>
            <button onClick={() => setZoom((z) => clampZoom(z + 0.15))} style={{ ...toolBtn, padding: "5px 11px", fontWeight: 700 }}>+</button>
            <button onClick={toggleFullscreen} style={toolBtn}>{isFs ? "✕ Exit" : "⛶ Fullscreen"}</button>
          </div>
        </div>
      )}
      <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
        Click a block to edit it · use → to zoom into a branch · drag to pan · ⌘/Ctrl + scroll to zoom
      </p>

      {/* Grid — same scroll container layout as PedigreeTree */}
      <div
        ref={scrollRef}
        onWheel={onWheel}
        onMouseDown={onPanStart}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => { touchRef.current = null; pinchRef.current = null; }}
        style={{
          overflow: "auto", cursor: isMobile ? "default" : "grab",
          border: "1px solid var(--border)", borderRadius: 8, background: "var(--cream-dark)",
          touchAction: "none",
          ...(isFs ? { flex: 1, minHeight: 0 } : { height: isMobile ? MOBILE_H : DESKTOP_H }),
        }}
      >
        <div style={{ width: Math.max(scaledW, containerW), height: Math.max(scaledH, canvasH), position: "relative", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: containerW, height: naturalH, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
            <div style={{ display: "grid", gridTemplateColumns: colTemplate, gridTemplateRows: rowTemplate, gap: 2, width: "100%", height: "100%", padding: 4, boxSizing: "border-box" }}>
              {cells.map((cell, i) => {
                const isSelected = selectedPath !== null && selectedPath.join(",") === cell.relPath.join(",");
                const isLeaf     = cell.col >= maxDepth + 1;
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
        </div>
      </div>

      {/* Edit panel */}
      {selectedPath !== null && (
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 20, marginTop: 12 }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 15, color: "var(--teal-dark)", marginBottom: 14 }}>
            {[...windowPath, ...selectedPath].length === 0 ? tree.name : pathLabel([...windowPath, ...selectedPath])}
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
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={applyEdit} disabled={!editName.trim()}
              style={{ ...toolBtn, background: "var(--teal)", color: "white", fontWeight: 700, opacity: editName.trim() ? 1 : 0.5 }}>
              Apply
            </button>
            {[...windowPath, ...selectedPath].length > 0 && (
              <button onClick={removeNode} style={{ ...toolBtn, color: "var(--inbreed-text)", borderColor: "var(--inbreed-border)" }}>
                Remove
              </button>
            )}
            <button onClick={() => setSelectedPath(null)} style={toolBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* Save */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 14 }}>
        <button onClick={savePedigree} disabled={saving}
          style={{ ...toolBtn, background: "var(--teal-dark)", color: "white", fontWeight: 700, padding: "8px 20px", fontSize: 13, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save Pedigree"}
        </button>
        {savedMsg && <span style={{ fontSize: 12, color: "var(--teal-dark)" }}>✓ Saved</span>}
      </div>
    </div>
  );
}

/* ---- Shared styles ---- */
const labelSt: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
const capSt:   React.CSSProperties = { fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" };
const inputSt: React.CSSProperties = {
  border: "1px solid var(--border)", borderRadius: 4, padding: "6px 10px",
  fontSize: 13, fontFamily: "var(--font-lato)", background: "white",
  color: "var(--text)", width: "100%", boxSizing: "border-box",
};

/* ---- Strip computed fields before saving ---- */
function stripIds(node: PedNode | null | undefined): PedNode | null {
  if (!node) return null;
  const { id: _id, inbreeding: _inb, ...rest } = node as PedNode & { id?: unknown; inbreeding?: unknown };
  return {
    ...rest,
    sire: stripIds((rest.sire as PedNode | null | undefined) ?? null),
    dam:  stripIds((rest.dam  as PedNode | null | undefined) ?? null),
  };
}

/* ---- EditorCard ---- */
interface CardProps {
  cell: PedCell; rowUnitH: number; isSelected: boolean; isLeaf: boolean;
  onSelect: () => void; onDiveIn?: () => void;
}

function EditorCard({ cell, rowUnitH, isSelected, isLeaf, onSelect, onDiveIn }: CardProps) {
  const { col, rowStart, rowSpan, node, slot } = cell;
  const s      = clr(slot);
  const nameSz = NAME_SZ[col - 1] ?? 8;
  const metaSz = META_SZ[col - 1] ?? 7;
  const cellH  = rowUnitH * rowSpan;
  const isEmpty = !node;
  const vPad   = col === 1 ? 10 : cellH < 18 ? 1 : cellH < 28 ? 2 : 4;

  const style: React.CSSProperties = {
    gridColumn: col, gridRow: `${rowStart} / span ${rowSpan}`,
    background: isEmpty ? "transparent" : s.bg,
    border: isSelected
      ? "2px solid var(--teal)"
      : isEmpty
      ? "1px dashed var(--border)"
      : `1px solid ${s.border}`,
    borderRadius: 4, overflow: "hidden", cursor: "pointer",
    minWidth: 0, minHeight: 0, position: "relative", boxSizing: "border-box",
    ...(col === 1 && !isEmpty ? { borderLeft: "4px solid #9AA396" } : {}),
  };

  return (
    <div style={style} onClick={onSelect} title={isEmpty ? "Click to add ancestor" : "Click to edit"}>
      {isEmpty ? (
        cellH >= 12 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--border)", fontSize: Math.min(nameSz, 11) }}>+</div>
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

      {/* Dive-in arrow */}
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
