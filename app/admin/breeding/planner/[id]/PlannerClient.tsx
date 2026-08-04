"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { PlanNode, PlanGoal, NodeType, NodeStatus, BreedingStep } from "@/lib/breedingPlanner";
import { extractBreedingSteps, formatRole, crossGenotypes } from "@/lib/breedingPlanner";

export type { PlanNode, NodeType, NodeStatus };

/* ─────────────────────────── Horse option (from server) ─────────────────────────── */

interface HorseOption {
  id: string; name: string; breed: string | null; gender: string | null;
  coat: string | null; genotype: string | null; sireName: string | null;
  damName: string | null; ownership: string | null; availableForBreeding: boolean;
  lastBredDateTime: string | null; generations: number; tree: string;
}

/* ─────────────────────────── Tree helpers ─────────────────────────── */

type Step = "sire" | "dam";
type Path = Step[];

function uid() { return Math.random().toString(36).slice(2, 10); }

function makeNode(generation: number, type: NodeType = "planned"): PlanNode {
  return { nodeId: uid(), type, status: "planned", generation };
}

function getAt(root: PlanNode | null, path: Path): PlanNode | null {
  let cur: PlanNode | null = root;
  for (const s of path) { if (!cur) return null; cur = cur[s] ?? null; }
  return cur;
}

function setAt(root: PlanNode | null, path: Path, value: PlanNode | null): PlanNode | null {
  if (path.length === 0) return value;
  const [h, ...tail] = path;
  const base = root ?? makeNode(0);
  return { ...base, [h]: setAt(base[h] ?? null, tail, value) };
}

function collectAcquisitions(node: PlanNode | null, path: Path, out: Array<{ path: Path; node: PlanNode }>) {
  if (!node) return;
  if (node.type === "stud" || node.type === "acquire") out.push({ path, node });
  if (node.sire) collectAcquisitions(node.sire, [...path, "sire"], out);
  if (node.dam)  collectAcquisitions(node.dam,  [...path, "dam"],  out);
}

/* ─────────────── COI ─────────────── */

interface SimpleNode { name: string; sire?: SimpleNode | null; dam?: SimpleNode | null; }

function toSimple(n: PlanNode | null): SimpleNode | null {
  if (!n) return null;
  const name = n.horseName ?? `_planned_${n.nodeId}`;
  return { name, sire: toSimple(n.sire ?? null), dam: toSimple(n.dam ?? null) };
}

function collectPaths(n: SimpleNode | null, depth: number, map: Map<string, number[]>) {
  if (!n) return;
  if (!n.name.startsWith("_planned_")) {
    const arr = map.get(n.name) ?? [];
    arr.push(depth);
    map.set(n.name, arr);
  }
  collectPaths(n.sire ?? null, depth + 1, map);
  collectPaths(n.dam  ?? null, depth + 1, map);
}

function calcCOI(root: PlanNode | null): number {
  const s = toSimple(root);
  if (!s?.sire || !s?.dam) return 0;
  const sireA = new Map<string, number[]>();
  const damA  = new Map<string, number[]>();
  collectPaths(s.sire ?? null, 0, sireA);
  collectPaths(s.dam  ?? null, 0, damA);
  let F = 0;
  for (const [name, n1s] of sireA) {
    const n2s = damA.get(name);
    if (!n2s) continue;
    for (const n1 of n1s) for (const n2 of n2s) F += Math.pow(0.5, n1 + n2 + 1);
  }
  return Math.min(F, 1);
}

/* ─────────────────────────── Grid ─────────────────────────── */

interface PedCell { col: number; rowStart: number; rowSpan: number; node: PlanNode | null; slot: "root" | "sire" | "dam"; relPath: Path; }

function buildGrid(node: PlanNode | null, col: number, rowStart: number, rowSpan: number, maxDepth: number, slot: "root" | "sire" | "dam", relPath: Path, cells: PedCell[]) {
  cells.push({ col, rowStart, rowSpan, node, slot, relPath });
  if (col >= maxDepth + 1) return;
  const half = rowSpan / 2;
  buildGrid(node?.sire ?? null, col + 1, rowStart,        half, maxDepth, "sire", [...relPath, "sire"], cells);
  buildGrid(node?.dam  ?? null, col + 1, rowStart + half, half, maxDepth, "dam",  [...relPath, "dam"],  cells);
}

/* ─────────────── Colours ─────────────── */

const SIRE_CLR    = { bg: "var(--sire-bg)",    border: "var(--sire-border)",    text: "var(--sire-text)" };
const DAM_CLR     = { bg: "var(--dam-bg)",      border: "var(--dam-border)",     text: "var(--dam-text)" };
const ROOT_CLR    = { bg: "#E4E7E1",            border: "#BFC3BD",               text: "#3F5F5F" };
const STUD_CLR    = { bg: "var(--sand-bg)",     border: "var(--sand-border)",    text: "var(--sand-text)" };
const ACQUIRE_CLR = { bg: "var(--sage-bg)",     border: "var(--sage-border)",    text: "var(--sage-text)" };
const PLANNED_CLR = { bg: "var(--cream)",       border: "var(--border)",         text: "var(--text-muted)" };

function nodeClr(type: NodeType, slot: "root" | "sire" | "dam") {
  if (type === "stud")     return STUD_CLR;
  if (type === "acquire")  return ACQUIRE_CLR;
  if (type === "existing") return slot === "sire" ? SIRE_CLR : slot === "dam" ? DAM_CLR : ROOT_CLR;
  return PLANNED_CLR;
}

const STATUS_DOT: Record<NodeStatus, string> = {
  planned: "var(--text-muted)", secured: "var(--teal)",
  in_progress: "var(--sand-text)", born: "var(--sage-text)", acquired: "var(--sage-text)",
};

function COIBadge({ coi, ceiling, small }: { coi: number; ceiling: number; small?: boolean }) {
  const pct   = +(coi * 100).toFixed(2);
  const ok    = pct < ceiling;
  const warn  = pct >= ceiling && pct < ceiling * 1.5;
  const color = ok ? "var(--sage-text)"   : warn ? "var(--sand-text)"   : "var(--inbreed-text)";
  const bg    = ok ? "var(--sage-bg)"     : warn ? "var(--sand-bg)"     : "var(--inbreed-bg)";
  const bdr   = ok ? "var(--sage-border)" : warn ? "var(--sand-border)" : "var(--inbreed-border)";
  return (
    <span style={{ fontSize: small ? 11 : 12, fontFamily: "var(--font-lato)", fontWeight: 700, padding: small ? "2px 7px" : "3px 10px", borderRadius: 10, background: bg, color, border: `1px solid ${bdr}` }}>
      COI {pct}% {ok ? "✓" : warn ? "⚠" : "✗"}
    </span>
  );
}

const NAME_SZ = [15, 13, 12, 11, 10, 9, 8, 8, 8, 8, 8];
const META_SZ = [12, 11, 10,  9,  9, 8, 7, 7, 7, 7, 7];
const CANVAS_H = 700;
function minRowH(d: number) { return d >= 7 ? 15 : d >= 5 ? 20 : 28; }

/* ─────────────────────────── Main component ─────────────────────────── */

interface Props {
  planId: string; initialTitle: string; initialStatus: string;
  initialGoal: Record<string, unknown>; initialTree: Record<string, unknown> | null;
  initialNotes: string; horses: HorseOption[];
}

export default function PlannerClient({ planId, initialTitle, initialStatus, initialGoal, initialTree, initialNotes, horses }: Props) {
  /* ── plan meta ── */
  const [title,    setTitle]    = useState(initialTitle);
  const [status,   setStatus]   = useState(initialStatus);
  const [goal,     setGoal]     = useState<PlanGoal>({
    breed:      (initialGoal.breed      as string)  ?? "",
    targetGen:  (initialGoal.targetGen  as number)  ?? 8,
    coiCeiling: (initialGoal.coiCeiling as number)  ?? 6.25,
    discipline: (initialGoal.discipline as string)  ?? "",
    notes:      (initialGoal.notes      as string)  ?? "",
  });
  const [planNotes, setPlanNotes] = useState(initialNotes);
  const [editGoal,  setEditGoal]  = useState(false);

  /* ── tree ── */
  const initTree = (): PlanNode => {
    if (initialTree && typeof initialTree === "object" && "nodeId" in initialTree) return initialTree as unknown as PlanNode;
    return { ...makeNode(0, "planned"), targetBreed: (initialGoal.breed as string) ?? "" };
  };
  const [tree, setTree] = useState<PlanNode>(initTree);
  const hasTree = !!(tree.sire || tree.dam);

  /* ── view ── */
  const [view, setView] = useState<"tree" | "steps">("tree");

  /* ── generate ── */
  const [generating, setGenerating] = useState(false);

  async function generatePlan() {
    setGenerating(true);
    try {
      const res = await fetch("/api/herd-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, goal }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const { tree: newTree } = await res.json();
      setTree(newTree as PlanNode);
      setSavedMsg(true);
      setView("tree");
    } catch {
      alert("Failed to generate plan. Check goal settings and try again.");
    } finally {
      setGenerating(false);
    }
  }

  /* ── viewport ── */
  const [depthState,  setDepthState]  = useState(4);
  const [zoom,        setZoom]        = useState(1);
  const [containerW,  setContainerW]  = useState(900);
  const [canvasH,     setCanvasH]     = useState(CANVAS_H);
  const [isFs,        setIsFs]        = useState(false);
  const [windowPath,  setWindowPath]  = useState<Path>([]);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchRef  = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);
  const pinchRef  = useRef<{ dist: number; zoom: number } | null>(null);

  /* ── edit state ── */
  const [selPath,       setSelPath]       = useState<Path | null>(null);
  const [editType,      setEditType]      = useState<NodeType>("planned");
  const [editHorseId,   setEditHorseId]   = useState("");
  const [editBrHorse,   setEditBrHorse]   = useState("");
  const [editTgtBreed,  setEditTgtBreed]  = useState("");
  const [editTgtGender, setEditTgtGender] = useState("");
  const [editTgtCoat,   setEditTgtCoat]   = useState("");
  const [editTgtGeno,   setEditTgtGeno]   = useState("");
  const [editMinGens,   setEditMinGens]   = useState("");
  const [editStatus,    setEditStatus]    = useState<NodeStatus>("planned");
  const [editAcqNotes,  setEditAcqNotes]  = useState("");
  const [editNodeNotes, setEditNodeNotes] = useState("");

  /* ── save ── */
  const [saving,   setSaving]   = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  /* ── resize observer ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      if (document.fullscreenElement) return;
      setContainerW(el.clientWidth); setCanvasH(el.clientHeight);
    });
    obs.observe(el);
    setContainerW(el.clientWidth); setCanvasH(el.clientHeight);
    return () => obs.disconnect();
  }, []);

  useEffect(() => { setZoom(1); }, [depthState]); // eslint-disable-line

  useEffect(() => {
    const onChange = () => {
      const fs = document.fullscreenElement === wrapRef.current;
      setIsFs(fs);
      setTimeout(() => {
        const el = scrollRef.current; if (!el) return;
        setContainerW(el.clientWidth); setCanvasH(el.clientHeight);
        setZoom(clampZoom(Math.min(1, el.clientHeight / Math.max(el.clientHeight, Math.pow(2, depthState) * minRowH(depthState)))));
      }, 260);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [depthState]); // eslint-disable-line

  /* ── grid math ── */
  const windowRoot = getAt(tree, windowPath);
  const totalRows  = Math.pow(2, depthState);
  const naturalH   = Math.max(canvasH, totalRows * minRowH(depthState));
  const rowUnitH   = naturalH / totalRows;
  const clampZoom  = (z: number) => Math.min(3, Math.max(0.08, z));
  const calcFit    = useCallback((d: number, h = canvasH) => clampZoom(Math.min(1, h / Math.max(h, Math.pow(2, d) * minRowH(d)))), [canvasH]); // eslint-disable-line

  const cells: PedCell[] = [];
  buildGrid(windowRoot, 1, 1, totalRows, depthState, "root", [], cells);

  /* ── pan/zoom handlers ── */
  function onWheel(e: React.WheelEvent) {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(z => clampZoom(z - e.deltaY * 0.002)); }
  }
  function onPanStart(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("button,select,input")) return;
    const sc = scrollRef.current; if (!sc) return;
    const sx = e.clientX, sy = e.clientY, sl = sc.scrollLeft, st = sc.scrollTop;
    sc.style.cursor = "grabbing";
    const move = (ev: MouseEvent) => { sc.scrollLeft = sl - (ev.clientX - sx); sc.scrollTop = st - (ev.clientY - sy); };
    const up   = () => { sc.style.cursor = "grab"; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  }
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      const t = e.touches[0], sc = scrollRef.current; if (!sc) return;
      touchRef.current = { x: t.clientX, y: t.clientY, sl: sc.scrollLeft, st: sc.scrollTop }; pinchRef.current = null;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), zoom }; touchRef.current = null;
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
      const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
      setZoom(clampZoom(pinchRef.current.zoom * Math.hypot(dx, dy) / pinchRef.current.dist));
    }
  }
  async function toggleFs() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await wrapRef.current?.requestFullscreen?.();
  }

  /* ── node editing ── */
  function openNode(relPath: Path, node: PlanNode | null) {
    setSelPath(relPath);
    const n = node ?? makeNode(relPath.length, "planned");
    setEditType(n.type);
    setEditHorseId(n.horseId ?? "");
    setEditBrHorse("");
    setEditTgtBreed(n.targetBreed ?? goal.breed ?? "");
    setEditTgtGender(n.targetGender ?? (relPath.length > 0 ? (relPath[relPath.length - 1] === "sire" ? "Stallion" : "Mare") : ""));
    setEditTgtCoat(n.targetCoat ?? "");
    setEditTgtGeno(n.targetGenotype ?? "");
    setEditMinGens(n.minGenerations != null ? String(n.minGenerations) : "");
    setEditStatus(n.status);
    setEditAcqNotes(n.acquisitionNotes ?? "");
    setEditNodeNotes(n.notes ?? "");
  }

  function applyNode() {
    if (selPath === null) return;
    const absPath: Path = [...windowPath, ...selPath];
    const existing = getAt(tree, absPath);
    const minG = editMinGens ? parseInt(editMinGens) : null;
    const horse = editType === "existing" ? horses.find(h => h.id === editHorseId) : null;
    const updated: PlanNode = {
      nodeId: existing?.nodeId ?? uid(), type: editType, status: editStatus,
      generation: absPath.length,
      horseId: horse?.id ?? null, horseName: horse?.name ?? null,
      horseBreed: horse?.breed ?? null, horseCoat: horse?.coat ?? null,
      horseGenotype: horse?.genotype ?? null, horseGender: horse?.gender ?? null,
      horseGenerations: horse?.generations ?? null,
      targetBreed: editType !== "existing" ? editTgtBreed || null : null,
      targetGender: editType !== "existing" ? editTgtGender || null : null,
      targetCoat: editType !== "existing" ? editTgtCoat || null : null,
      targetGenotype: editType !== "existing" ? editTgtGeno || null : null,
      minGenerations: editType !== "existing" ? minG : null,
      unrealistic: editType !== "existing" && minG != null && minG > 6,
      acquisitionNotes: editType !== "existing" ? editAcqNotes || null : null,
      notes: editNodeNotes || null,
      sire: existing?.sire ?? null, dam: existing?.dam ?? null,
    };
    if (absPath.length === 0) {
      setTree(prev => ({ ...prev, ...updated, sire: prev.sire, dam: prev.dam }));
    } else {
      setTree(prev => setAt(prev, absPath, updated) ?? prev);
    }
    setSelPath(null); setSavedMsg(false);
  }

  function removeNode() {
    if (selPath === null) return;
    const absPath: Path = [...windowPath, ...selPath];
    if (absPath.length === 0) return;
    setTree(prev => setAt(prev, absPath, null) ?? prev);
    setSelPath(null); setSavedMsg(false);
  }

  function diveInto(relPath: Path) { setWindowPath([...windowPath, ...relPath]); setSelPath(null); setZoom(1); }
  function navigateTo(path: Path)  { setWindowPath(path); setSelPath(null); setZoom(1); }

  /* ── save ── */
  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/herd-plans/${planId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status, goal, tree, notes: planNotes }),
      });
      setSavedMsg(true);
    } catch { alert("Save failed."); } finally { setSaving(false); }
  }

  /* ── derived ── */
  const coi           = calcCOI(tree);
  const coiCeiling    = goal.coiCeiling ?? 6.25;
  const acquisitions: Array<{ path: Path; node: PlanNode }> = [];
  collectAcquisitions(tree, [], acquisitions);
  const steps: BreedingStep[] = extractBreedingSteps(hasTree ? tree : null);

  const crumbs: { label: string; path: Path }[] = [{ label: tree.horseName ?? tree.targetBreed ?? "Goal", path: [] }];
  for (let i = 0; i < windowPath.length; i++) {
    const n = getAt(tree, windowPath.slice(0, i + 1));
    crumbs.push({ label: n?.horseName ?? n?.targetBreed ?? (windowPath[i] === "sire" ? "Sire" : "Dam"), path: windowPath.slice(0, i + 1) });
  }

  /* ── styles ── */
  const btn: React.CSSProperties = { padding: "5px 12px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--white)", color: "var(--teal-dark)", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-lato)" };
  const inp: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 4, padding: "6px 10px", fontSize: 13, fontFamily: "var(--font-lato)", background: "var(--white)", color: "var(--text)", width: "100%", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
  const cap: React.CSSProperties = { fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" };
  const card: React.CSSProperties = { background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px 24px", marginBottom: 16 };

  const colTemplate = `1.2fr repeat(${depthState}, 1fr)`;
  const rowTemplate  = `repeat(${totalRows}, 1fr)`;
  const scaledW = containerW * zoom, scaledH = naturalH * zoom;

  const horseOptions = horses.filter(h =>
    (!editBrHorse || h.breed?.toLowerCase().includes(editBrHorse.toLowerCase()) || h.name.toLowerCase().includes(editBrHorse.toLowerCase())) &&
    (editTgtGender === "" || !editTgtGender || h.gender?.toLowerCase().includes(editTgtGender.toLowerCase()))
  );

  /* ── render ── */
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Nav */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>← Admin</Link>
        <Link href="/admin/breeding/planner" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>Herd Planner</Link>
      </div>

      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); setSavedMsg(false); }}
          style={{ fontFamily: "var(--font-playfair)", fontSize: 26, color: "var(--teal-dark)", border: "none", background: "transparent", outline: "none", flex: 1, minWidth: 200 }}
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setSavedMsg(false); }} style={{ ...inp, width: "auto", fontWeight: 700 }}>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
        {hasTree && <COIBadge coi={coi} ceiling={Number(coiCeiling)} />}
        <button onClick={save} disabled={saving} style={{ ...btn, background: "var(--teal-dark)", color: "white", fontWeight: 700, padding: "7px 20px", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save"}
        </button>
        {savedMsg && <span style={{ fontSize: 12, color: "var(--teal-dark)", fontFamily: "var(--font-lato)" }}>✓ Saved</span>}
      </div>

      {/* Goal card */}
      <div style={{ ...card, borderColor: "var(--teal)", borderWidth: 2 }}>
        {!editGoal ? (
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: 15, color: "var(--teal-dark)" }}>Goal</span>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontFamily: "var(--font-lato)", fontSize: 13, flex: 1 }}>
              {goal.breed      && <span><b>Breed:</b> {goal.breed}</span>}
              {goal.targetGen  && <span><b>Target:</b> Gen {goal.targetGen}</span>}
              {goal.coiCeiling && <span><b>COI ceiling:</b> &lt;{goal.coiCeiling}%</span>}
              {goal.discipline && <span><b>Discipline:</b> {goal.discipline}</span>}
              {goal.notes      && <span style={{ color: "var(--text-muted)" }}>{goal.notes}</span>}
            </div>
            <button onClick={() => setEditGoal(true)} style={btn}>Edit Goal</button>
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 15, color: "var(--teal-dark)", marginBottom: 14 }}>Edit Goal</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              {[
                { label: "Target Breed", key: "breed",      type: "text",   ph: "e.g. KWPN" },
                { label: "Target Gen",   key: "targetGen",  type: "number", ph: "e.g. 8" },
                { label: "COI Ceiling %",key: "coiCeiling", type: "number", ph: "e.g. 6.25" },
                { label: "Discipline",   key: "discipline", type: "text",   ph: "e.g. Show Jumping" },
              ].map(({ label, key, type, ph }) => (
                <label key={key} style={lbl}>
                  <span style={cap}>{label}</span>
                  <input type={type} value={(goal as Record<string, unknown>)[key] as string ?? ""} placeholder={ph}
                    onChange={e => setGoal(g => ({ ...g, [key]: type === "number" ? parseFloat(e.target.value) || null : e.target.value }))}
                    style={inp} />
                </label>
              ))}
              <label style={{ ...lbl, gridColumn: "1 / -1" }}>
                <span style={cap}>Goal notes</span>
                <input value={goal.notes ?? ""} onChange={e => setGoal(g => ({ ...g, notes: e.target.value }))} style={inp} placeholder="Any extra context for this plan…" />
              </label>
            </div>
            <button onClick={() => setEditGoal(false)} style={{ ...btn, background: "var(--teal)", color: "white", fontWeight: 700 }}>Done</button>
          </div>
        )}
      </div>

      {/* ── GENERATE PLAN ── */}
      <div style={{ ...card, background: hasTree ? "var(--white)" : "var(--cream)", borderColor: hasTree ? "var(--border)" : "var(--teal)", borderWidth: hasTree ? 1 : 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 15, color: "var(--teal-dark)", marginBottom: 4 }}>
              {hasTree ? "Regenerate Plan" : "Generate Breeding Plan"}
            </div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "var(--text-muted)" }}>
              {hasTree
                ? "Rebuild the plan from scratch using current goal settings and your herd. This will replace all existing nodes."
                : "Automatically build a multi-generation breeding roadmap using your horses. Outside studs and acquisitions will be flagged where your herd can't fill a position."}
            </div>
          </div>
          <button
            onClick={generatePlan}
            disabled={generating}
            style={{ ...btn, background: "var(--teal-dark)", color: "white", fontWeight: 700, padding: "10px 24px", fontSize: 13, flexShrink: 0, opacity: generating ? 0.6 : 1 }}
          >
            {generating ? "Generating…" : hasTree ? "↺ Regenerate" : "Generate Plan"}
          </button>
        </div>
        {generating && (
          <div style={{ marginTop: 12, fontFamily: "var(--font-lato)", fontSize: 12, color: "var(--text-muted)" }}>
            Analysing your herd and building the breeding tree…
          </div>
        )}
      </div>

      {/* ── VIEW TOGGLE + TREE/STEPS ── */}
      {hasTree && (
        <>
          {/* View tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {(["tree", "steps"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ ...btn, background: view === v ? "var(--teal-dark)" : "var(--white)", color: view === v ? "white" : "var(--text-muted)", fontWeight: view === v ? 700 : 400, textTransform: "capitalize", padding: "6px 18px" }}>
                {v === "tree" ? "Tree View" : `Steps (${steps.length})`}
              </button>
            ))}
          </div>

          {/* ── TREE VIEW ── */}
          {view === "tree" && (
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-playfair)", fontSize: 16, color: "var(--teal-dark)" }}>Breeding Tree</span>
                <span style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: "var(--text-muted)" }}>— root = goal horse, branches = required ancestors</span>
                <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {[
                    { label: "Existing", bg: "var(--sire-bg)", border: "var(--sire-border)", text: "var(--sire-text)" },
                    { label: "Planned",  bg: "var(--cream)",   border: "var(--border)",      text: "var(--text-muted)" },
                    { label: "Stud",     bg: "var(--sand-bg)", border: "var(--sand-border)", text: "var(--sand-text)" },
                    { label: "Acquire",  bg: "var(--sage-bg)", border: "var(--sage-border)", text: "var(--sage-text)" },
                  ].map(l => (
                    <span key={l.label} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: l.bg, border: `1px solid ${l.border}`, color: l.text, fontFamily: "var(--font-lato)", fontWeight: 700 }}>{l.label}</span>
                  ))}
                </span>
              </div>

              {/* Breadcrumb */}
              {crumbs.length > 1 && (
                <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                  {crumbs.map((c, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {i > 0 && <span style={{ color: "var(--text-muted)", fontSize: 13 }}>›</span>}
                      <button onClick={() => navigateTo(c.path)} style={{ ...btn, padding: "3px 10px", background: i === crumbs.length - 1 ? "var(--teal)" : "var(--white)", color: i === crumbs.length - 1 ? "white" : "var(--teal-dark)", fontWeight: i === crumbs.length - 1 ? 700 : 400 }}>{c.label}</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Toolbar */}
              <div ref={wrapRef} style={isFs ? { background: "var(--cream)", height: "100vh", display: "flex", flexDirection: "column", padding: 16 } : {}}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>Gen:</span>
                  {[2, 3, 4, 5, 6, 7, 8].map(d => (
                    <button key={d} onClick={() => setDepthState(d)} style={{ ...btn, padding: "4px 10px", background: depthState === d ? "var(--teal)" : "var(--white)", color: depthState === d ? "white" : "var(--text-muted)", fontWeight: depthState === d ? 700 : 400 }}>{d}</button>
                  ))}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    <button onClick={() => setZoom(z => clampZoom(z - 0.15))} style={{ ...btn, fontWeight: 700 }}>−</button>
                    <button onClick={() => setZoom(calcFit(depthState, canvasH))} style={{ ...btn, minWidth: 52, textAlign: "center" }}>{Math.round(zoom * 100)}%</button>
                    <button onClick={() => setZoom(z => clampZoom(z + 0.15))} style={{ ...btn, fontWeight: 700 }}>+</button>
                    <button onClick={toggleFs} style={btn}>{isFs ? "✕" : "⛶"}</button>
                  </div>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
                  Click a block to assign or edit · → to dive into a branch · drag to pan · ⌘+scroll to zoom
                </p>

                {/* Grid */}
                <div ref={scrollRef} onWheel={onWheel} onMouseDown={onPanStart}
                  onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => { touchRef.current = null; pinchRef.current = null; }}
                  style={{ overflow: "auto", cursor: "grab", border: "1px solid var(--border)", borderRadius: 8, background: "var(--cream-dark)", touchAction: "none", ...(isFs ? { flex: 1, minHeight: 0 } : { height: CANVAS_H }) }}>
                  <div style={{ width: Math.max(scaledW, containerW), height: Math.max(scaledH, canvasH), position: "relative" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, width: containerW, height: naturalH, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
                      <div style={{ display: "grid", gridTemplateColumns: colTemplate, gridTemplateRows: rowTemplate, gap: 2, width: "100%", height: "100%", padding: 4, boxSizing: "border-box" }}>
                        {cells.map((cell, i) => {
                          const isSelected = selPath !== null && selPath.join(",") === cell.relPath.join(",");
                          const isLeaf     = cell.col >= depthState + 1;
                          return <PlanCard key={i} cell={cell} rowUnitH={rowUnitH} isSelected={isSelected} isLeaf={isLeaf} onSelect={() => openNode(cell.relPath, cell.node)} onDiveIn={!isLeaf ? () => diveInto(cell.relPath) : undefined} />;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit panel */}
              {selPath !== null && (() => {
                const absPath: Path = [...windowPath, ...selPath];
                const node = getAt(tree, absPath);
                const isRoot = absPath.length === 0;
                const posLabel = absPath.length === 0 ? "Goal horse" : absPath.map(s => s === "sire" ? "Sire" : "Dam").join(" → ");
                return (
                  <div style={{ marginTop: 12, background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <span style={{ fontFamily: "var(--font-playfair)", fontSize: 14, color: "var(--teal-dark)" }}>{posLabel}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>Generation {absPath.length}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                      {(["existing", "planned", "stud", "acquire"] as NodeType[]).map(t => {
                        const labels: Record<NodeType, string> = { existing: "Existing horse", planned: "Planned offspring", stud: "Stud cover", acquire: "Acquire horse" };
                        return (
                          <button key={t} onClick={() => setEditType(t)} style={{ ...btn, background: editType === t ? "var(--teal-dark)" : "var(--white)", color: editType === t ? "white" : "var(--text)", fontWeight: editType === t ? 700 : 400, fontSize: 12 }}>
                            {labels[t]}
                          </button>
                        );
                      })}
                    </div>
                    {editType === "existing" ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <label style={lbl}>
                          <span style={cap}>Search by name or breed</span>
                          <input value={editBrHorse} onChange={e => setEditBrHorse(e.target.value)} style={inp} placeholder="Filter horses…" />
                        </label>
                        <label style={lbl}>
                          <span style={cap}>Gender filter</span>
                          <select value={editTgtGender} onChange={e => setEditTgtGender(e.target.value)} style={inp}>
                            <option value="">Any</option>
                            <option value="Stallion">Stallion / Gelding</option>
                            <option value="Mare">Mare</option>
                          </select>
                        </label>
                        <div style={{ gridColumn: "1 / -1", maxHeight: 220, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 6, background: "var(--white)" }}>
                          {horseOptions.length === 0 && <div style={{ padding: 12, fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>No horses match.</div>}
                          {horseOptions.map(h => (
                            <div key={h.id} onClick={() => setEditHorseId(h.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", background: editHorseId === h.id ? "var(--teal-muted)" : "transparent", borderBottom: "1px solid var(--border)" }}>
                              <span style={{ fontFamily: "var(--font-playfair)", fontSize: 13, color: "var(--teal-dark)", fontWeight: 700, flex: 1 }}>{h.name}</span>
                              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{h.breed ?? "—"} · {h.gender ?? "—"} · Gen {h.generations}</span>
                              {h.availableForBreeding && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: "var(--sage-bg)", color: "var(--sage-text)", border: "1px solid var(--sage-border)" }}>Available</span>}
                            </div>
                          ))}
                        </div>
                        <label style={lbl}><span style={cap}>Status</span>
                          <select value={editStatus} onChange={e => setEditStatus(e.target.value as NodeStatus)} style={inp}>
                            {(["planned","secured","in_progress","born","acquired"] as NodeStatus[]).map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                          </select>
                        </label>
                        <label style={lbl}><span style={cap}>Node notes</span>
                          <input value={editNodeNotes} onChange={e => setEditNodeNotes(e.target.value)} style={inp} placeholder="Any notes for this slot…" />
                        </label>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                        <label style={lbl}><span style={cap}>{editType === "stud" ? "Stud breed needed" : editType === "acquire" ? "Acquire breed" : "Expected breed"}</span>
                          <input value={editTgtBreed} onChange={e => setEditTgtBreed(e.target.value)} style={inp} placeholder={goal.breed ?? "e.g. KWPN"} />
                        </label>
                        <label style={lbl}><span style={cap}>Gender</span>
                          <select value={editTgtGender} onChange={e => setEditTgtGender(e.target.value)} style={inp}>
                            <option value="">—</option>
                            <option value="Stallion">Stallion</option>
                            <option value="Mare">Mare</option>
                            <option value="Gelding">Gelding</option>
                          </select>
                        </label>
                        <label style={lbl}><span style={cap}>Min generations</span>
                          <input type="number" value={editMinGens} onChange={e => setEditMinGens(e.target.value)} style={{ ...inp, borderColor: editMinGens && parseInt(editMinGens) > 6 ? "var(--inbreed-border)" : "var(--border)" }} min={0} max={12} placeholder="e.g. 5" />
                        </label>
                        {editMinGens && parseInt(editMinGens) > 6 && (
                          <div style={{ gridColumn: "1 / -1", fontSize: 12, padding: "6px 10px", borderRadius: 6, background: "var(--inbreed-bg)", color: "var(--inbreed-text)", border: "1px solid var(--inbreed-border)", fontFamily: "var(--font-lato)" }}>
                            ⚠ {parseInt(editMinGens)}+ gen horses are rarely available from other players.
                          </div>
                        )}
                        <label style={lbl}><span style={cap}>Target coat</span>
                          <input value={editTgtCoat} onChange={e => setEditTgtCoat(e.target.value)} style={inp} placeholder="e.g. Bay" />
                        </label>
                        <label style={lbl}><span style={cap}>Target genotype</span>
                          <input value={editTgtGeno} onChange={e => setEditTgtGeno(e.target.value)} style={inp} placeholder="e.g. Ee Aa" />
                        </label>
                        <label style={lbl}><span style={cap}>Status</span>
                          <select value={editStatus} onChange={e => setEditStatus(e.target.value as NodeStatus)} style={inp}>
                            {(["planned","secured","in_progress","acquired"] as NodeStatus[]).map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                          </select>
                        </label>
                        {(editType === "stud" || editType === "acquire") && (
                          <label style={{ ...lbl, gridColumn: "1 / -1" }}><span style={cap}>Acquisition notes</span>
                            <input value={editAcqNotes} onChange={e => setEditAcqNotes(e.target.value)} style={inp} placeholder="e.g. Waiting on player to offer stud, arranged via Discord…" />
                          </label>
                        )}
                        <label style={{ ...lbl, gridColumn: "1 / -1" }}><span style={cap}>Node notes</span>
                          <input value={editNodeNotes} onChange={e => setEditNodeNotes(e.target.value)} style={inp} placeholder="Any extra notes…" />
                        </label>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button onClick={applyNode} style={{ ...btn, background: "var(--teal)", color: "white", fontWeight: 700 }}>Apply</button>
                      {!isRoot && <button onClick={removeNode} style={{ ...btn, color: "var(--inbreed-text)", borderColor: "var(--inbreed-border)" }}>Remove</button>}
                      <button onClick={() => setSelPath(null)} style={btn}>Cancel</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── STEPS VIEW ── */}
          {view === "steps" && (
            <div style={card}>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: 16, color: "var(--teal-dark)", marginBottom: 4 }}>Breeding Schedule</div>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "var(--text-muted)", margin: "0 0 20px" }}>
                Ordered earliest → latest. Complete earlier steps first — each produces a horse needed later in the plan.
              </p>
              {steps.length === 0 ? (
                <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)" }}>No breeding steps found. Generate a plan or add planned nodes to the tree.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {steps.map(step => {
                    const sire = step.sire;
                    const dam  = step.dam;
                    const stepCoi = calcCOI(step.node);
                    const sireName = sire?.horseName ?? sire?.targetBreed ?? (sire?.type === "stud" ? "Stud cover" : "Planned sire");
                    const damName  = dam?.horseName  ?? dam?.targetBreed  ?? (dam?.type  === "acquire" ? "Acquire mare" : "Planned dam");
                    const sireAvail = sire?.type === "existing" && sire.status === "secured";
                    const damAvail  = dam?.type  === "existing" && dam.status  === "secured";
                    const canBreed  = (sire?.type === "existing" || !sire) && (dam?.type === "existing" || !dam);
                    const coatCross = crossGenotypes(sire?.horseGenotype ?? null, dam?.horseGenotype ?? null);

                    return (
                      <div key={step.path.join("/")} style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 20px", position: "relative" }}>
                        {/* Step header */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: canBreed ? "var(--teal)" : "var(--sand-bg)", border: `2px solid ${canBreed ? "var(--teal)" : "var(--sand-border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 14, color: canBreed ? "white" : "var(--sand-text)", flexShrink: 0 }}>
                            {step.stepNum}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 14, color: "var(--teal-dark)", marginBottom: 2 }}>
                              {sireName} × {damName}
                            </div>
                            <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "var(--text-muted)" }}>
                              Produces: <b>{step.role}</b>
                              {step.node.targetBreed && ` · ${step.node.targetBreed}`}
                              {step.node.minGenerations != null && ` · Target Gen ${step.node.minGenerations}`}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
                            {stepCoi > 0 && <COIBadge coi={stepCoi} ceiling={Number(coiCeiling)} small />}
                            <span style={{ fontSize: 11, fontFamily: "var(--font-lato)", padding: "2px 8px", borderRadius: 8, background: canBreed ? "var(--sage-bg)" : "var(--cream-dark)", color: canBreed ? "var(--sage-text)" : "var(--text-muted)", border: `1px solid ${canBreed ? "var(--sage-border)" : "var(--border)"}` }}>
                              {canBreed ? "Ready to breed" : "Waiting on earlier steps"}
                            </span>
                          </div>
                        </div>

                        {/* Parents detail */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: coatCross ? 12 : 0 }}>
                          {[
                            { side: "Sire", node: sire, avail: sireAvail, clr: SIRE_CLR },
                            { side: "Dam",  node: dam,  avail: damAvail,  clr: DAM_CLR  },
                          ].map(({ side, node: n, avail, clr }) => {
                            const name  = n?.horseName ?? n?.targetBreed ?? (n?.type === "stud" ? "Outside stud" : n?.type === "acquire" ? "Outside mare" : "To be bred");
                            const meta  = [n?.horseBreed ?? n?.targetBreed, n?.horseGender ?? n?.targetGender, n?.horseGenerations != null ? `Gen ${n.horseGenerations}` : n?.minGenerations != null ? `≥Gen ${n.minGenerations}` : null].filter(Boolean).join(" · ");
                            const typeClr = n?.type === "stud" ? STUD_CLR : n?.type === "acquire" ? ACQUIRE_CLR : n?.type === "existing" ? clr : PLANNED_CLR;
                            return (
                              <div key={side} style={{ background: typeClr.bg, border: `1px solid ${typeClr.border}`, borderRadius: 6, padding: "10px 14px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontSize: 10, fontFamily: "var(--font-lato)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: typeClr.text }}>{side}</span>
                                  {avail && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: "var(--sage-bg)", color: "var(--sage-text)", border: "1px solid var(--sage-border)", fontFamily: "var(--font-lato)" }}>Available</span>}
                                  {n?.unrealistic && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: "var(--inbreed-bg)", color: "var(--inbreed-text)", border: "1px solid var(--inbreed-border)", fontFamily: "var(--font-lato)" }}>⚠ Hard to find</span>}
                                </div>
                                <div style={{ fontFamily: "var(--font-playfair)", fontSize: 13, fontWeight: 700, color: typeClr.text, marginBottom: 2 }}>{name}</div>
                                {meta && <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: typeClr.text, opacity: 0.8 }}>{meta}</div>}
                                {n?.horseCoat && <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: typeClr.text, opacity: 0.7, marginTop: 2 }}>{n.horseCoat}{n.horseGenotype ? ` · ${n.horseGenotype}` : ""}</div>}
                                {n?.acquisitionNotes && <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: typeClr.text, opacity: 0.7, fontStyle: "italic", marginTop: 4 }}>{n.acquisitionNotes}</div>}
                              </div>
                            );
                          })}
                        </div>

                        {/* Coat probability */}
                        {coatCross && (
                          <div style={{ marginTop: 10, background: "var(--white)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 14px" }}>
                            <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Foal genotype probabilities</div>
                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                              {coatCross.map(locus => (
                                <div key={locus.gene} style={{ fontFamily: "var(--font-lato)", fontSize: 12 }}>
                                  <b style={{ color: "var(--teal-dark)" }}>{locus.gene}</b>:{" "}
                                  {locus.combos.map((c, i) => (
                                    <span key={c.geno} style={{ color: "var(--text)" }}>
                                      {i > 0 ? ", " : ""}{c.geno} ({c.pct}%)
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {step.node.notes && (
                          <div style={{ marginTop: 10, fontFamily: "var(--font-lato)", fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>{step.node.notes}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ACQUISITION REQUIREMENTS ── */}
          {acquisitions.length > 0 && (
            <div style={card}>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: 16, color: "var(--teal-dark)", marginBottom: 14 }}>
                Acquisition Requirements
                <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 400, color: "var(--text-muted)", marginLeft: 10 }}>{acquisitions.length} outside horse{acquisitions.length !== 1 ? "s" : ""} needed</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {acquisitions.map(({ path, node }, i) => {
                  const isStud = node.type === "stud";
                  const clrs   = isStud ? STUD_CLR : ACQUIRE_CLR;
                  const pos    = path.map(s => s === "sire" ? "Sire" : "Dam").join(" → ") || "Root";
                  const role   = formatRole(path as string[]);
                  return (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 16px", borderRadius: 6, background: clrs.bg, border: `1px solid ${clrs.border}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 12, color: clrs.text, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                            {isStud ? "Stud Cover" : "Acquire"}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>→ {role}</span>
                          {node.unrealistic && (
                            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: "var(--inbreed-bg)", color: "var(--inbreed-text)", border: "1px solid var(--inbreed-border)", fontFamily: "var(--font-lato)", fontWeight: 700 }}>
                              ⚠ Hard to find ({node.minGenerations}+ gen)
                            </span>
                          )}
                        </div>
                        <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text)", display: "flex", gap: 14, flexWrap: "wrap" }}>
                          {node.targetBreed   && <span><b>Breed:</b> {node.targetBreed}</span>}
                          {node.targetGender  && <span><b>Gender:</b> {node.targetGender}</span>}
                          {node.minGenerations != null && <span><b>Min gens:</b> {node.minGenerations}</span>}
                          {node.targetCoat    && <span><b>Coat:</b> {node.targetCoat}</span>}
                        </div>
                        {node.acquisitionNotes && (
                          <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontStyle: "italic" }}>{node.acquisitionNotes}</div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-lato)", padding: "2px 8px", borderRadius: 8, background: "var(--white)", border: "1px solid var(--border)", color: STATUS_DOT[node.status] }}>
                          ● {node.status.replace("_", " ")}
                        </span>
                        <button onClick={() => { navigateTo(path.slice(0, -1) as Path); openNode(path.slice(-1) as Path, node); setView("tree"); }} style={{ ...btn, fontSize: 11, padding: "3px 8px" }}>Edit</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PLAN SUMMARY ── */}
          <div style={card}>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 16, color: "var(--teal-dark)", marginBottom: 14 }}>Plan Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {[
                { label: "Existing horses", value: countNodes(tree, "existing"), color: "var(--sire-text)", bg: "var(--sire-bg)", border: "var(--sire-border)" },
                { label: "To breed",        value: countNodes(tree, "planned"),  color: "var(--text-muted)", bg: "var(--cream)", border: "var(--border)" },
                { label: "Stud covers",     value: countNodes(tree, "stud"),     color: "var(--sand-text)", bg: "var(--sand-bg)", border: "var(--sand-border)" },
                { label: "To acquire",      value: countNodes(tree, "acquire"),  color: "var(--sage-text)", bg: "var(--sage-bg)", border: "var(--sage-border)" },
                { label: "Overall COI",     value: `${+(coi * 100).toFixed(2)}%`, color: coi * 100 < coiCeiling ? "var(--sage-text)" : "var(--inbreed-text)", bg: coi * 100 < coiCeiling ? "var(--sage-bg)" : "var(--inbreed-bg)", border: coi * 100 < coiCeiling ? "var(--sage-border)" : "var(--inbreed-border)" },
                { label: "Breeding steps",  value: steps.length, color: "var(--teal-dark)", bg: "var(--teal-muted)", border: "var(--teal)" },
              ].map(stat => (
                <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: stat.color, opacity: 0.8, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── PLAN NOTES ── */}
      <div style={card}>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 16, color: "var(--teal-dark)", marginBottom: 12 }}>Plan Notes</div>
        <textarea
          value={planNotes}
          onChange={e => { setPlanNotes(e.target.value); setSavedMsg(false); }}
          rows={5}
          placeholder="General notes about this plan — sourcing contacts, strategy, timeline thoughts…"
          style={{ ...inp, resize: "vertical" }}
        />
      </div>

      {/* Bottom save */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", paddingBottom: 40 }}>
        <button onClick={save} disabled={saving} style={{ ...btn, background: "var(--teal-dark)", color: "white", fontWeight: 700, padding: "9px 24px", fontSize: 14, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save Plan"}
        </button>
        {savedMsg && <span style={{ fontSize: 12, color: "var(--teal-dark)", fontFamily: "var(--font-lato)" }}>✓ Saved</span>}
      </div>
    </div>
  );
}

/* ─────────── node counter ─────────── */

function countNodes(node: PlanNode | null, type: NodeType): number {
  if (!node) return 0;
  return (node.type === type ? 1 : 0) + countNodes(node.sire ?? null, type) + countNodes(node.dam ?? null, type);
}

/* ─────────────────────────── PlanCard ─────────────────────────── */

interface PlanCardProps {
  cell: PedCell; rowUnitH: number; isSelected: boolean; isLeaf: boolean;
  onSelect: () => void; onDiveIn?: () => void;
}

function PlanCard({ cell, rowUnitH, isSelected, isLeaf, onSelect, onDiveIn }: PlanCardProps) {
  const { col, rowStart, rowSpan, node, slot } = cell;
  const type    = node?.type ?? "planned";
  const s       = nodeClr(type, slot);
  const nameSz  = NAME_SZ[col - 1] ?? 8;
  const metaSz  = META_SZ[col - 1] ?? 7;
  const cellH   = rowUnitH * rowSpan;
  const isEmpty = !node;
  const vPad    = col === 1 ? 10 : cellH < 18 ? 1 : cellH < 28 ? 2 : 4;
  const displayName = node?.horseName ?? node?.targetBreed ?? (type === "stud" ? "Stud cover" : type === "acquire" ? "Acquire" : null);

  return (
    <div
      style={{ gridColumn: col, gridRow: `${rowStart} / span ${rowSpan}`, background: isEmpty ? "transparent" : s.bg, border: isSelected ? "2px solid var(--teal)" : isEmpty ? "1px dashed var(--border)" : `1px solid ${s.border}`, borderRadius: 4, overflow: "hidden", cursor: "pointer", minWidth: 0, minHeight: 0, position: "relative", boxSizing: "border-box", ...(col === 1 && !isEmpty ? { borderLeft: "4px solid var(--teal)" } : {}) }}
      onClick={onSelect}
      title={isEmpty ? "Click to assign" : "Click to edit"}
    >
      {isEmpty ? (
        cellH >= 12 && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--border)", fontSize: Math.min(nameSz, 11) }}>+</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: col === 1 ? `${vPad}px 14px` : `${vPad}px 8px`, height: "100%", gap: 1, overflow: "hidden" }}>
          {cellH >= 18 && <div style={{ position: "absolute", top: 3, right: type !== "existing" && !isLeaf && onDiveIn ? 18 : 3, width: 5, height: 5, borderRadius: "50%", background: STATUS_DOT[node?.status ?? "planned"] }} />}
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: nameSz, fontWeight: 700, color: s.text, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName ?? "—"}
          </div>
          {cellH >= 30 && (
            <div style={{ fontFamily: "var(--font-lato)", fontSize: metaSz, color: s.text, opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.25 }}>
              {node.horseBreed ?? node.targetBreed ?? ""}
              {node.horseGenerations != null ? ` · Gen ${node.horseGenerations}` : node.minGenerations != null ? ` · ≥${node.minGenerations} gen` : ""}
            </div>
          )}
          {node?.unrealistic && cellH >= 46 && <div style={{ fontFamily: "var(--font-lato)", fontSize: 8, color: "var(--inbreed-text)", fontWeight: 700 }}>⚠ Hard to find</div>}
        </div>
      )}
      {!isLeaf && !isEmpty && onDiveIn && cellH >= 20 && (
        <button onClick={e => { e.stopPropagation(); onDiveIn(); }} title="Dive into this branch" style={{ position: "absolute", bottom: 2, right: 2, padding: "1px 5px", fontSize: 9, lineHeight: 1.5, background: "rgba(255,255,255,0.85)", border: `1px solid ${s.border}`, borderRadius: 3, cursor: "pointer", color: s.text, fontFamily: "var(--font-lato)" }}>→</button>
      )}
    </div>
  );
}
