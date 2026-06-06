"use client";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";

/* ============================================================================
   Course Planner — drag-and-drop arena designer for Show Jumping & Cross
   Country. Pure React + SVG so the same scene is rendered, edited, exported,
   and printed without dragging in heavyweight canvas libs.

   Coordinate system: SVG userSpace 0..VIEW_W, 0..VIEW_H. Every prop's x/y is
   stored in that space, so panning the SVG (responsive) doesn't shift props.

   Scale: 12 px = 1 metre on the rendered arena. Stride = 3.6 m (one canter
   stride). These are tunable at the top of the file.
============================================================================ */

const VIEW_W = 1200;
const VIEW_H = 800;
const PX_PER_M = 12;
const STRIDE_M = 3.6;
const COMBINATION_M = 12; // <12 m between fences = combination (A/B/C…)

/* ===================== Prop catalogue ===================== */

type Category = "show" | "xc" | "utility";
type PropType =
  | "vertical" | "oxer" | "triple" | "water"
  | "log" | "wall" | "splash" | "drop"
  | "start" | "finish" | "shrub" | "marker";

interface PropDef {
  type: PropType;
  label: string;
  category: Category;
  /** width / height in METRES of the prop's footprint, for the drawing size */
  w: number;
  h: number;
  /** Whether this counts as a jumping obstacle for numbering / track */
  jumpable: boolean;
}

const CATALOGUE: PropDef[] = [
  // Show jumping
  { type: "vertical", label: "Vertical",    category: "show", w: 4, h: 0.7, jumpable: true },
  { type: "oxer",     label: "Oxer",        category: "show", w: 4, h: 1.8, jumpable: true },
  { type: "triple",   label: "Triple Bar",  category: "show", w: 4, h: 2.6, jumpable: true },
  { type: "water",    label: "Liverpool",   category: "show", w: 4, h: 2.2, jumpable: true },
  // Cross country
  { type: "log",      label: "Solid Log",   category: "xc", w: 4.5, h: 1.2, jumpable: true },
  { type: "wall",     label: "Stone Wall",  category: "xc", w: 4.5, h: 1.1, jumpable: true },
  { type: "splash",   label: "Water Entry", category: "xc", w: 6,   h: 5,   jumpable: true },
  { type: "drop",     label: "Drop / Bank", category: "xc", w: 4.5, h: 2.5, jumpable: true },
  // Utility
  { type: "start",    label: "Start Gate",  category: "utility", w: 5, h: 1.2, jumpable: false },
  { type: "finish",   label: "Finish Flags",category: "utility", w: 5, h: 1.2, jumpable: false },
  { type: "shrub",    label: "Potted Shrub",category: "utility", w: 1.5, h: 1.5, jumpable: false },
  { type: "marker",   label: "Boundary",    category: "utility", w: 0.6, h: 2,   jumpable: false },
];

const CAT_LABEL: Record<Category, string> = {
  show: "Show Jumping",
  xc: "Cross Country",
  utility: "Utility",
};

/* ===================== Data shape ===================== */

interface PlacedProp {
  id: string;
  type: PropType;
  /** Centre of the prop in SVG user units */
  x: number;
  y: number;
  rotation: number; // degrees
  /** Per-axis scale multipliers applied on top of the catalogue size. */
  scaleX: number;
  scaleY: number;
}

type Difficulty = "Novice" | "Intermediate" | "Advanced";

interface CourseMeta {
  name: string;
  designer: string;
  difficulty: Difficulty;
}

/* ===================== Helpers ===================== */

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function getDef(type: PropType): PropDef {
  return CATALOGUE.find((d) => d.type === type)!;
}

function distancePx(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function distanceM(a: { x: number; y: number }, b: { x: number; y: number }) {
  return distancePx(a, b) / PX_PER_M;
}

/**
 * Walk the track and produce a sequence number for each step:
 *   1, 2, 3, 4, 5, 6   normally
 *   3A, 3B, 3C         when consecutive jumps are inside COMBINATION_M.
 * The number bumps only when the previous and current jumps are far enough
 * apart to be a separate effort.
 */
function labelTrack(track: PlacedProp[]): string[] {
  const labels: string[] = [];
  let n = 0;
  let combIdx = 0; // 0=no comb, 1=A, 2=B…
  for (let i = 0; i < track.length; i++) {
    if (i === 0) {
      n = 1; combIdx = 0;
      labels.push(`${n}`);
      continue;
    }
    const prev = track[i - 1];
    const cur = track[i];
    const m = distanceM(prev, cur);
    if (m < COMBINATION_M) {
      // Part of the same combination as the previous effort.
      if (combIdx === 0) {
        // Retroactively letter the previous label.
        labels[i - 1] = `${n}A`;
        combIdx = 1;
      }
      combIdx += 1;
      labels.push(`${n}${String.fromCharCode(64 + combIdx)}`); // 65 = 'A'
    } else {
      n += 1;
      combIdx = 0;
      labels.push(`${n}`);
    }
  }
  return labels;
}

/* ===================== Prop glyph ===================== */

/**
 * Returns the inner SVG markup for a prop, drawn around (0,0) before
 * translation/rotation. Dimensions in SVG user units (metres × PX_PER_M).
 *
 * The glyph's own stroke and size are CONSTANT regardless of selection —
 * all "is this selected" visual feedback lives in a sibling overlay group
 * so that toggling selection can never resize / shift the prop itself.
 */
function PropGlyph({ type }: { type: PropType }) {
  const d = getDef(type);
  const w = d.w * PX_PER_M;
  const h = d.h * PX_PER_M;
  const stroke = "var(--teal-dark)";
  const sw = 1.5;

  switch (type) {
    case "vertical":
      // Single bar + two standards
      return (
        <g stroke={stroke} strokeWidth={sw}>
          <rect x={-w / 2} y={-3} width={w} height={6} fill="#FFFFFF" />
          <rect x={-w / 2 - 2} y={-h / 2 - 6} width={4} height={h + 12} fill="var(--teal-dark)" />
          <rect x={w / 2 - 2} y={-h / 2 - 6} width={4} height={h + 12} fill="var(--teal-dark)" />
        </g>
      );
    case "oxer":
      return (
        <g stroke={stroke} strokeWidth={sw}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#FFFFFF" opacity={0.4} />
          <rect x={-w / 2} y={-h / 2 - 1} width={w} height={4} fill="#FFFFFF" />
          <rect x={-w / 2} y={h / 2 - 3} width={w} height={4} fill="#FFFFFF" />
          {[-w / 2, w / 2].map((x) => (
            <rect key={`${x}-front`} x={x - 2} y={-h / 2 - 6} width={4} height={12} fill="var(--teal-dark)" />
          ))}
          {[-w / 2, w / 2].map((x) => (
            <rect key={`${x}-back`} x={x - 2} y={h / 2 - 6} width={4} height={12} fill="var(--teal-dark)" />
          ))}
        </g>
      );
    case "triple":
      return (
        <g stroke={stroke} strokeWidth={sw}>
          <rect x={-w / 2} y={-h / 2 - 1} width={w} height={3} fill="#FFFFFF" />
          <rect x={-w / 2} y={-2} width={w} height={3} fill="#FFFFFF" />
          <rect x={-w / 2} y={h / 2 - 3} width={w} height={3} fill="#FFFFFF" />
        </g>
      );
    case "water":
      return (
        <g stroke={stroke} strokeWidth={sw}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#C6E4ED" />
          <line x1={-w / 2} y1={-h / 2} x2={w / 2} y2={h / 2} stroke="#6B9EAB" strokeWidth={1} opacity={0.5} />
          <line x1={-w / 2} y1={h / 2} x2={w / 2} y2={-h / 2} stroke="#6B9EAB" strokeWidth={1} opacity={0.5} />
        </g>
      );
    case "log":
      return (
        <g stroke={stroke} strokeWidth={sw}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} ry={h / 2} fill="#8B6A45" />
          <line x1={-w / 2 + 3} y1={0} x2={w / 2 - 3} y2={0} stroke="#5A4A2E" strokeWidth={1} opacity={0.6} />
        </g>
      );
    case "wall":
      return (
        <g stroke={stroke} strokeWidth={sw}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#A39580" />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={-w / 2} y1={-h / 2 + (i + 1) * (h / 4)} x2={w / 2} y2={-h / 2 + (i + 1) * (h / 4)} stroke="#5C4F3B" strokeWidth={0.8} opacity={0.6} />
          ))}
        </g>
      );
    case "splash":
      return (
        <g stroke={stroke} strokeWidth={sw}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill="#9FD0DC" />
          <circle cx={-w / 4} cy={-h / 6} r={4} fill="#FFFFFF" opacity={0.6} />
          <circle cx={w / 5}  cy={h / 5}  r={5} fill="#FFFFFF" opacity={0.5} />
        </g>
      );
    case "drop":
      return (
        <g stroke={stroke} strokeWidth={sw}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#C7A87A" />
          <line x1={-w / 2} y1={h / 2 - 4} x2={w / 2} y2={h / 2 - 4} stroke="#7A5C2E" strokeWidth={1.5} />
          <polygon points={`0,${-h / 2 + 5} -4,${-h / 2 - 2} 4,${-h / 2 - 2}`} fill="var(--teal-dark)" />
        </g>
      );
    case "start":
      return (
        <g stroke={stroke} strokeWidth={sw}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#E7F3E5" />
          <text x={0} y={3} textAnchor="middle" fontSize={11} fontWeight={700} fill="#3F6A3F" fontFamily="var(--font-lato), sans-serif">START</text>
        </g>
      );
    case "finish":
      return (
        <g stroke={stroke} strokeWidth={sw}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#FBE9E9" />
          <text x={0} y={3} textAnchor="middle" fontSize={11} fontWeight={700} fill="#A14242" fontFamily="var(--font-lato), sans-serif">FINISH</text>
        </g>
      );
    case "shrub":
      return (
        <g stroke={stroke} strokeWidth={sw}>
          <circle cx={0} cy={0} r={w / 2} fill="#82A37A" />
          <circle cx={-3} cy={-3} r={3} fill="#9DBE94" opacity={0.7} />
        </g>
      );
    case "marker":
      return (
        <g stroke={stroke} strokeWidth={sw}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#C4A96E" />
        </g>
      );
  }
}

/* ===================== Main component ===================== */

export default function CoursePlannerClient() {
  const [props, setProps] = useState<PlacedProp[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trackIds, setTrackIds] = useState<string[]>([]);
  const [connectMode, setConnectMode] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [meta, setMeta] = useState<CourseMeta>({
    name: "",
    designer: "",
    difficulty: "Novice",
  });

  // Refs for mouse-coordinate math + export PNG
  const svgRef = useRef<SVGSVGElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  /* ---- Coordinate helpers ---- */
  const eventToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const inv = ctm.inverse();
    const local = pt.matrixTransform(inv);
    return {
      x: clamp(local.x, 20, VIEW_W - 20),
      y: clamp(local.y, 20, VIEW_H - 20),
    };
  }, []);

  /* ---- Sidebar drag: native HTML5 drag → SVG drop ---- */
  function onPaletteDragStart(e: React.DragEvent, type: PropType) {
    e.dataTransfer.setData("application/x-prop-type", type);
    e.dataTransfer.effectAllowed = "copy";
  }
  function onSvgDragOver(e: React.DragEvent) {
    if (e.dataTransfer.types.includes("application/x-prop-type")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }
  function onSvgDrop(e: React.DragEvent) {
    const type = e.dataTransfer.getData("application/x-prop-type") as PropType;
    if (!type) return;
    e.preventDefault();
    const { x, y } = eventToSvg(e.clientX, e.clientY);
    const id = uid();
    setProps((p) => [...p, { id, type, x, y, rotation: 0, scaleX: 1, scaleY: 1 }]);
    setSelectedId(id);
  }

  /* ---- Existing-prop drag inside the canvas ----
     Drag only kicks in AFTER the cursor has moved past a small threshold from
     the mousedown point. Before that, the gesture is a pure click → it only
     mutates the selection variable and explicitly leaves x/y untouched, so
     sub-pixel pointer jitter while clicking can never shift the prop. */
  const DRAG_THRESHOLD_PX = 4;
  const dragState = useRef<{
    id: string;
    /** Offset between cursor and prop centre at mousedown, in SVG units. */
    dx: number; dy: number;
    /** Mousedown position in client pixels — used for the threshold check. */
    startClientX: number; startClientY: number;
    /** Has the cursor moved far enough to commit to dragging? */
    dragging: boolean;
  } | null>(null);

  function onPropMouseDown(e: React.MouseEvent, p: PlacedProp) {
    e.stopPropagation();
    if (connectMode) {
      // Connect-mode click adds the prop to the track sequence
      addToTrack(p.id);
      return;
    }
    setSelectedId(p.id);
    const { x, y } = eventToSvg(e.clientX, e.clientY);
    dragState.current = {
      id: p.id,
      dx: p.x - x, dy: p.y - y,
      startClientX: e.clientX, startClientY: e.clientY,
      dragging: false,
    };
    window.addEventListener("mousemove", onWindowMove);
    window.addEventListener("mouseup", onWindowUp);
  }
  function onWindowMove(e: MouseEvent) {
    const ds = dragState.current;
    if (!ds) return;
    // Don't commit any position change until the cursor has moved past the
    // threshold. This stops a click-without-drag from nudging the prop.
    if (!ds.dragging) {
      const moved = Math.hypot(e.clientX - ds.startClientX, e.clientY - ds.startClientY);
      if (moved < DRAG_THRESHOLD_PX) return;
      ds.dragging = true;
    }
    const { x, y } = eventToSvg(e.clientX, e.clientY);
    setProps((arr) =>
      arr.map((p) => (p.id === ds.id ? { ...p, x: x + ds.dx, y: y + ds.dy } : p))
    );
  }
  function onWindowUp() {
    dragState.current = null;
    window.removeEventListener("mousemove", onWindowMove);
    window.removeEventListener("mouseup", onWindowUp);
  }

  /* ---- Resize handles ---- */
  // We do the math in the prop's own (rotated) frame so corner pulls always
  // map to width / height intuitively, regardless of how the prop is angled.
  const resizeState = useRef<{
    id: string; corner: "tl" | "tr" | "bl" | "br";
    startScaleX: number; startScaleY: number;
    startLocal: { lx: number; ly: number };
    cx: number; cy: number;
    rot: number;
    defW: number; defH: number;
  } | null>(null);

  // Map SVG-space mouse coords into the prop's rotated frame (so X = along
  // the prop's width axis, Y = along its height axis).
  function toLocal(svgX: number, svgY: number, cx: number, cy: number, rotDeg: number) {
    const rx = svgX - cx, ry = svgY - cy;
    const r = (-rotDeg * Math.PI) / 180; // inverse rotation
    const cos = Math.cos(r), sin = Math.sin(r);
    return { lx: rx * cos - ry * sin, ly: rx * sin + ry * cos };
  }

  function onHandleDown(e: React.MouseEvent, prop: PlacedProp, corner: "tl" | "tr" | "bl" | "br") {
    e.stopPropagation();
    e.preventDefault();
    const def = getDef(prop.type);
    const { x, y } = eventToSvg(e.clientX, e.clientY);
    resizeState.current = {
      id: prop.id, corner,
      startScaleX: prop.scaleX, startScaleY: prop.scaleY,
      startLocal: toLocal(x, y, prop.x, prop.y, prop.rotation),
      cx: prop.x, cy: prop.y, rot: prop.rotation,
      defW: def.w * PX_PER_M, defH: def.h * PX_PER_M,
    };
    window.addEventListener("mousemove", onResizeMove);
    window.addEventListener("mouseup", onResizeUp);
  }
  function onResizeMove(e: MouseEvent) {
    const rs = resizeState.current;
    if (!rs) return;
    const { x, y } = eventToSvg(e.clientX, e.clientY);
    const cur = toLocal(x, y, rs.cx, rs.cy, rs.rot);

    // Direction the corner pulls in the prop's own frame. tl/bl pull -X,
    // tr/br pull +X; tl/tr pull -Y; bl/br pull +Y.
    const signX = rs.corner === "tl" || rs.corner === "bl" ? -1 : 1;
    const signY = rs.corner === "tl" || rs.corner === "tr" ? -1 : 1;

    // Translate the local distance back into a scale ratio against the
    // original (start-of-drag) corner position.
    const startSpanX = Math.abs(rs.startLocal.lx) || 1;
    const startSpanY = Math.abs(rs.startLocal.ly) || 1;
    const newSpanX = Math.max(8, cur.lx * signX);
    const newSpanY = Math.max(4, cur.ly * signY);

    const ratioX = newSpanX / startSpanX;
    const ratioY = newSpanY / startSpanY;
    const nextX = clamp(rs.startScaleX * ratioX, 0.25, 6);
    const nextY = clamp(rs.startScaleY * ratioY, 0.25, 6);

    setProps((arr) => arr.map((p) => p.id === rs.id ? { ...p, scaleX: nextX, scaleY: nextY } : p));
  }
  function onResizeUp() {
    resizeState.current = null;
    window.removeEventListener("mousemove", onResizeMove);
    window.removeEventListener("mouseup", onResizeUp);
  }

  // Reset selected prop's scale back to 1×1
  function resetScale() {
    if (!selectedId) return;
    setProps((arr) => arr.map((p) => p.id === selectedId ? { ...p, scaleX: 1, scaleY: 1 } : p));
  }

  // Ensure all window listeners are torn down on unmount
  useEffect(() => () => {
    window.removeEventListener("mousemove", onWindowMove);
    window.removeEventListener("mouseup", onWindowUp);
    window.removeEventListener("mousemove", onResizeMove);
    window.removeEventListener("mouseup", onResizeUp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Rotation ---- */
  function rotateSelected(delta: number) {
    if (!selectedId) return;
    setProps((arr) =>
      arr.map((p) =>
        p.id === selectedId ? { ...p, rotation: (p.rotation + delta + 360) % 360 } : p
      )
    );
  }

  /* ---- Delete ---- */
  function deleteSelected() {
    if (!selectedId) return;
    setProps((arr) => arr.filter((p) => p.id !== selectedId));
    setTrackIds((t) => t.filter((id) => id !== selectedId));
    setSelectedId(null);
  }

  // Keyboard: Delete removes selection, R/Shift+R rotates
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showExport) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      } else if (e.key === "r") {
        rotateSelected(e.shiftKey ? -15 : 15);
      } else if (e.key === "R") {
        rotateSelected(45);
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setConnectMode(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, showExport]);

  /* ---- Track ---- */
  function addToTrack(id: string) {
    setTrackIds((t) => {
      // Don't queue the same prop twice in a row
      if (t[t.length - 1] === id) return t;
      return [...t, id];
    });
  }
  function clearTrack() {
    setTrackIds([]);
  }
  function clearCanvas() {
    if (!props.length && !trackIds.length) return;
    if (!confirm("Clear the whole arena? This can't be undone.")) return;
    setProps([]);
    setTrackIds([]);
    setSelectedId(null);
  }

  /* ---- Derived: ordered track of placed props ---- */
  const track = useMemo<PlacedProp[]>(() => {
    const byId = new Map(props.map((p) => [p.id, p]));
    return trackIds.map((id) => byId.get(id)!).filter(Boolean);
  }, [props, trackIds]);

  const trackLabels = useMemo(() => labelTrack(track), [track]);

  const trackStats = useMemo(() => {
    // Distance is the actual arc length along the curved spline path the
    // horse would travel, NOT the straight Euclidean chord between fences.
    // Per spline segment we sample the cubic Bezier and sum chord lengths.
    const segs = buildCubicSegments(track);
    const legs: number[] = [];
    let totalPx = 0;
    for (const s of segs) {
      const lenPx = cubicArcLength(s);
      totalPx += lenPx;
      legs.push(lenPx / PX_PER_M);
    }
    const totalM = totalPx / PX_PER_M;
    return {
      totalM,
      strides: totalM / STRIDE_M,
      legs,
      jumpCount: trackLabels.filter((l) => /^\d+$/.test(l) || /^\d+A$/.test(l)).length,
      effortCount: track.length,
    };
  }, [track, trackLabels]);

  const selected = props.find((p) => p.id === selectedId) ?? null;

  /* ---- Export PNG ---- */
  const [exporting, setExporting] = useState(false);
  async function downloadPng() {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
        backgroundColor: "#FBF8F4",
      });
      const a = document.createElement("a");
      a.download = `${(meta.name || "course").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-plan.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Could not export PNG. Try again or use the print button.");
    } finally {
      setExporting(false);
    }
  }

  /* =================== Render =================== */
  return (
    <main className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <Link href="/" className="text-xs uppercase tracking-[0.12em] text-[var(--teal)] no-underline" style={{ fontFamily: "var(--font-lato)" }}>
          ← Back home
        </Link>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 30, color: "var(--teal-dark)" }}>
          Course Planner
        </h1>
        <div className="text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-lato)" }}>
          {props.length} prop{props.length !== 1 ? "s" : ""} · {track.length} on track
        </div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "260px 1fr" }}>
        {/* ===== Sidebar ===== */}
        <aside style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, alignSelf: "start", position: "sticky", top: 16 }}>
          <SectionLabel>Course Info</SectionLabel>
          <MetaForm meta={meta} setMeta={setMeta} />

          <hr className="my-4" style={{ borderColor: "var(--border)" }} />

          <SectionLabel>Drag a prop onto the arena</SectionLabel>
          {(["show", "xc", "utility"] as Category[]).map((cat) => (
            <div key={cat} className="mb-3">
              <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] font-semibold mb-1.5" style={{ fontFamily: "var(--font-lato)" }}>
                {CAT_LABEL[cat]}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CATALOGUE.filter((c) => c.category === cat).map((c) => (
                  <PaletteTile key={c.type} def={c} onDragStart={(e) => onPaletteDragStart(e, c.type)} />
                ))}
              </div>
            </div>
          ))}

          <hr className="my-4" style={{ borderColor: "var(--border)" }} />

          <SectionLabel>Track</SectionLabel>
          <button
            type="button"
            onClick={() => setConnectMode((c) => !c)}
            className="w-full text-xs py-2 rounded-md border transition-colors mb-2"
            style={{
              background: connectMode ? "var(--teal)" : "var(--white)",
              color: connectMode ? "#fff" : "var(--teal-dark)",
              borderColor: connectMode ? "var(--teal)" : "var(--border)",
              fontFamily: "var(--font-lato)",
              fontWeight: 700,
            }}
          >
            {connectMode ? "✓ Connecting — click fences" : "Draw / Connect Track Line"}
          </button>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => setTrackIds((t) => t.slice(0, -1))} disabled={!track.length}
              className="flex-1 text-[11px] py-1.5 rounded-md border bg-white text-[var(--teal-dark)] disabled:opacity-40"
              style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)" }}>
              Undo last
            </button>
            <button type="button" onClick={clearTrack} disabled={!track.length}
              className="flex-1 text-[11px] py-1.5 rounded-md border bg-white text-[var(--inbreed-text)] disabled:opacity-40"
              style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)" }}>
              Clear track
            </button>
          </div>

          <hr className="my-4" style={{ borderColor: "var(--border)" }} />

          <SectionLabel>Course Actions</SectionLabel>
          <button type="button" onClick={() => setShowExport(true)}
            className="w-full text-xs py-2 rounded-md mb-2"
            style={{ background: "var(--gold)", color: "var(--teal-dark)", border: "none", fontFamily: "var(--font-lato)", fontWeight: 700 }}>
            Generate Master Plan
          </button>
          <button type="button" onClick={clearCanvas}
            className="w-full text-xs py-2 rounded-md border"
            style={{ background: "var(--white)", color: "var(--inbreed-text)", borderColor: "var(--inbreed-border)", fontFamily: "var(--font-lato)", fontWeight: 700 }}>
            Clear Canvas
          </button>

          <p className="mt-3 text-[10.5px] text-[var(--text-muted)] leading-snug" style={{ fontFamily: "var(--font-lato)" }}>
            Shortcuts: <strong>R</strong> rotate 15°, <strong>Shift+R</strong> reverse, <strong>R</strong> (caps) 45°,
            <strong> Del</strong> remove, <strong>Esc</strong> deselect.
          </p>
        </aside>

        {/* ===== Canvas ===== */}
        <section>
          {/* Permanently reserved slot for the selection toolbar. The slot
              always renders and keeps the same min-height regardless of
              selection state, so the arena below never shifts vertically
              when a prop is selected or deselected. */}
          <div className="min-h-[52px] mb-2" aria-hidden={!selected}>
            {selected && (
              <SelectionToolbar
                prop={selected}
                onRotate={rotateSelected}
                onDelete={deleteSelected}
                onAddToTrack={() => addToTrack(selected.id)}
                onResetSize={resetScale}
              />
            )}
          </div>

          <div
            style={{ background: "var(--cream-dark)", border: "1px solid var(--border)", borderRadius: 12, padding: 10 }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              preserveAspectRatio="xMidYMid meet"
              onDragOver={onSvgDragOver}
              onDrop={onSvgDrop}
              onMouseDown={() => setSelectedId(null)}
              style={{ width: "100%", height: "auto", display: "block", background: "var(--cream)", borderRadius: 8, cursor: connectMode ? "crosshair" : "default", touchAction: "none" }}
            >
              <ArenaDecor />
              <TrackPath track={track} labels={trackLabels} />
              {props.map((p) => (
                <PropOnCanvas
                  key={p.id}
                  prop={p}
                  selected={p.id === selectedId}
                  trackIndex={trackIds.indexOf(p.id)}
                  trackLabel={trackLabels[trackIds.indexOf(p.id)] ?? null}
                  onMouseDown={(e) => onPropMouseDown(e, p)}
                  onHandleDown={(e, corner) => onHandleDown(e, p, corner)}
                />
              ))}
              {props.length === 0 && (
                <text x={VIEW_W / 2} y={VIEW_H / 2} textAnchor="middle" fill="var(--text-muted)" fontSize={20} fontFamily="var(--font-playfair), serif" opacity={0.6}>
                  Drag a fence from the sidebar to begin
                </text>
              )}
            </svg>
          </div>

          <TrackStats stats={trackStats} />
        </section>
      </div>

      {/* ===== Export modal ===== */}
      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          meta={meta}
          props={props}
          track={track}
          trackLabels={trackLabels}
          stats={trackStats}
          exportRef={exportRef}
          downloadPng={downloadPng}
          exporting={exporting}
        />
      )}
    </main>
  );
}

/* ===================== Subcomponents ===================== */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] font-semibold mb-2" style={{ fontFamily: "var(--font-lato)" }}>
      {children}
    </div>
  );
}

function MetaForm({ meta, setMeta }: { meta: CourseMeta; setMeta: (m: CourseMeta) => void }) {
  const inputCls = "w-full text-xs rounded-md border bg-white px-2.5 py-1.5";
  return (
    <div className="flex flex-col gap-2">
      <input className={inputCls} placeholder="Course name" value={meta.name}
        onChange={(e) => setMeta({ ...meta, name: e.target.value })}
        style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)", color: "var(--text)" }} />
      <input className={inputCls} placeholder="Designer handle" value={meta.designer}
        onChange={(e) => setMeta({ ...meta, designer: e.target.value })}
        style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)", color: "var(--text)" }} />
      <select className={inputCls} value={meta.difficulty}
        onChange={(e) => setMeta({ ...meta, difficulty: e.target.value as Difficulty })}
        style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)", color: "var(--text)" }}>
        <option>Novice</option>
        <option>Intermediate</option>
        <option>Advanced</option>
      </select>
    </div>
  );
}

function PaletteTile({ def, onDragStart }: { def: PropDef; onDragStart: (e: React.DragEvent) => void }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      title={`Drag ${def.label} onto the arena`}
      className="cursor-grab active:cursor-grabbing"
      style={{
        background: "var(--cream)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "8px 10px",
        fontSize: 11,
        color: "var(--teal-dark)",
        fontFamily: "var(--font-lato)",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <svg width={28} height={20} viewBox="-30 -20 60 40">
        <PropGlyph type={def.type} />
      </svg>
      {def.label}
    </div>
  );
}

function ArenaDecor() {
  // Subtle outer ring + grid for spatial reference
  const cells = 12;
  const w = (VIEW_W - 40) / cells;
  return (
    <g>
      <rect x={10} y={10} width={VIEW_W - 20} height={VIEW_H - 20} rx={14} fill="none" stroke="var(--gold-light)" strokeWidth={3} />
      <g opacity={0.18} stroke="var(--teal-light)" strokeWidth={0.6}>
        {Array.from({ length: cells - 1 }, (_, i) => (
          <line key={`v${i}`} x1={20 + (i + 1) * w} y1={20} x2={20 + (i + 1) * w} y2={VIEW_H - 20} />
        ))}
        {Array.from({ length: Math.floor((VIEW_H - 40) / w) - 1 }, (_, i) => (
          <line key={`h${i}`} x1={20} y1={20 + (i + 1) * w} x2={VIEW_W - 20} y2={20 + (i + 1) * w} />
        ))}
      </g>
    </g>
  );
}

function PropOnCanvas({
  prop, selected, trackLabel, onMouseDown, onHandleDown,
}: {
  prop: PlacedProp; selected: boolean; trackIndex: number; trackLabel: string | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onHandleDown: (e: React.MouseEvent, corner: "tl" | "tr" | "bl" | "br") => void;
}) {
  const def = getDef(prop.type);
  // Render-space half-dimensions (after scale, before rotation).
  const halfW = (def.w * PX_PER_M * prop.scaleX) / 2;
  const halfH = (def.h * PX_PER_M * prop.scaleY) / 2;
  const labelOffset = halfH + 14;

  return (
    <g transform={`translate(${prop.x}, ${prop.y}) rotate(${prop.rotation})`}>
      {/* Glyph: scale here so the underlying shape stays unit-agnostic. */}
      <g
        transform={`scale(${prop.scaleX}, ${prop.scaleY})`}
        onMouseDown={onMouseDown}
        style={{ cursor: "move" }}
      >
        <PropGlyph type={prop.type} />
      </g>

      {/* Selection bounding box + resize handles — rendered as an absolute
          visual overlay on top of the glyph. The frame itself is non-interactive
          (pointerEvents="none"), so it never intercepts clicks meant for the
          glyph or the canvas. Only the four corner handles consume events. */}
      {selected && (
        <g>
          <rect
            x={-halfW - 4} y={-halfH - 4}
            width={halfW * 2 + 8} height={halfH * 2 + 8}
            fill="none" stroke="var(--gold)" strokeWidth={1.5} strokeDasharray="4 3"
            pointerEvents="none"
          />
          {/* Four corner handles. Cursor hints match the rotated frame. */}
          {([
            ["tl", -halfW - 4, -halfH - 4, "nwse-resize"],
            ["tr",  halfW + 4, -halfH - 4, "nesw-resize"],
            ["bl", -halfW - 4,  halfH + 4, "nesw-resize"],
            ["br",  halfW + 4,  halfH + 4, "nwse-resize"],
          ] as const).map(([corner, hx, hy, cursor]) => (
            <rect
              key={corner}
              x={hx - 5} y={hy - 5}
              width={10} height={10}
              fill="var(--white)" stroke="var(--gold)" strokeWidth={1.5}
              style={{ cursor }}
              onMouseDown={(e) => onHandleDown(e, corner)}
            />
          ))}
        </g>
      )}

      {/* Track-number badge — rotate back so it stays upright */}
      {trackLabel && (
        <g transform={`rotate(${-prop.rotation})`}>
          <circle cx={0} cy={-labelOffset} r={11} fill="var(--gold)" stroke="var(--teal-dark)" strokeWidth={1.5} />
          <text x={0} y={-labelOffset + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--teal-dark)" fontFamily="var(--font-lato), sans-serif">
            {trackLabel}
          </text>
        </g>
      )}
    </g>
  );
}

/* ===================== Catmull-Rom → Cubic-Bezier spline =====================
   Real horses don't pivot 90° between fences — they take a sweeping turn. We
   smooth the track by converting consecutive props into a Catmull-Rom spline
   then emitting it as one continuous cubic-Bezier path (each segment uses
   the "C x1 y1, x2 y2, x y" form). This keeps a single SVG <path> element
   while still letting the renderer interpolate every position and tangent
   along the curve.

   For points P[i-1], P[i], P[i+1], P[i+2] (the segment is P[i] → P[i+1]):
     C1 = P[i]   +  (P[i+1] - P[i-1]) * tension / 3
     C2 = P[i+1] -  (P[i+2] - P[i])   * tension / 3
   Endpoints reflect the missing neighbour so the curve starts/ends tangent
   to the line into/out of the first / last prop.

   Tension 0.5 gives nicely rounded equestrian arcs without overshooting
   the way tension 1.0 (uniform Catmull-Rom) sometimes does in tight zigzags. */
const SPLINE_TENSION = 0.5;

interface CubicSeg {
  /** Start point (P0). */ x0: number; y0: number;
  /** First control point.  */ x1: number; y1: number;
  /** Second control point. */ x2: number; y2: number;
  /** End point (P3).    */   x3: number; y3: number;
}

function buildCubicSegments(points: { x: number; y: number }[]): CubicSeg[] {
  const segs: CubicSeg[] = [];
  if (points.length < 2) return segs;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];       // reflect first
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? points[i + 1];   // reflect last
    const c1x = p1.x + (p2.x - p0.x) * (SPLINE_TENSION / 3);
    const c1y = p1.y + (p2.y - p0.y) * (SPLINE_TENSION / 3);
    const c2x = p2.x - (p3.x - p1.x) * (SPLINE_TENSION / 3);
    const c2y = p2.y - (p3.y - p1.y) * (SPLINE_TENSION / 3);
    segs.push({ x0: p1.x, y0: p1.y, x1: c1x, y1: c1y, x2: c2x, y2: c2y, x3: p2.x, y3: p2.y });
  }
  return segs;
}

/** Evaluate a cubic Bezier at parameter t ∈ [0,1]. */
function cubicAt(s: CubicSeg, t: number): { x: number; y: number } {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return {
    x: a * s.x0 + b * s.x1 + c * s.x2 + d * s.x3,
    y: a * s.y0 + b * s.y1 + c * s.y2 + d * s.y3,
  };
}

/** Derivative of a cubic Bezier at parameter t (the tangent vector). */
function cubicTangent(s: CubicSeg, t: number): { dx: number; dy: number } {
  const u = 1 - t;
  // B'(t) = 3u²(P1-P0) + 6ut(P2-P1) + 3t²(P3-P2)
  const c1 = 3 * u * u;
  const c2 = 6 * u * t;
  const c3 = 3 * t * t;
  return {
    dx: c1 * (s.x1 - s.x0) + c2 * (s.x2 - s.x1) + c3 * (s.x3 - s.x2),
    dy: c1 * (s.y1 - s.y0) + c2 * (s.y2 - s.y1) + c3 * (s.y3 - s.y2),
  };
}

/** Approximate the arc length of a cubic Bezier by sampling chord lengths. */
function cubicArcLength(s: CubicSeg, samples = 24): number {
  let len = 0;
  let prev = cubicAt(s, 0);
  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const cur = cubicAt(s, t);
    len += Math.hypot(cur.x - prev.x, cur.y - prev.y);
    prev = cur;
  }
  return len;
}

function TrackPath({ track, labels }: { track: PlacedProp[]; labels: string[] }) {
  void labels;
  if (track.length < 2) return null;

  const segs = buildCubicSegments(track);
  // Emit one continuous SVG path string: M to the very first point, then a
  // chain of cubic Bezier segments.
  const d =
    `M ${segs[0].x0} ${segs[0].y0} ` +
    segs.map((s) => `C ${s.x1} ${s.y1}, ${s.x2} ${s.y2}, ${s.x3} ${s.y3}`).join(" ");

  return (
    <g>
      <defs>
        {/* auto-start-reverse lets the SVG renderer auto-rotate the
            arrowhead along the path's own tangent at the path end. */}
        <marker id="cp-arrow" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={8} markerHeight={8} orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--teal-dark)" />
        </marker>
      </defs>

      <path
        d={d}
        fill="none"
        stroke="var(--teal-dark)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="10 6"
        opacity={0.85}
      />

      {/* Per-segment mid-curve arrow. Position = curve point at t=0.55,
          orientation = derivative tangent angle atan2(dy, dx)·180/π. */}
      {segs.map((s, i) => {
        const t = 0.55;
        const pos = cubicAt(s, t);
        const { dx, dy } = cubicTangent(s, t);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <g key={`arrow-${i}`} transform={`translate(${pos.x}, ${pos.y}) rotate(${angle})`}>
            <polygon points="-7,-6 8,0 -7,6" fill="var(--teal-dark)" />
          </g>
        );
      })}
    </g>
  );
}

function TrackStats({ stats }: { stats: { totalM: number; strides: number; legs: number[]; jumpCount: number; effortCount: number } }) {
  if (!stats.effortCount) return null;
  return (
    <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
      <Stat label="Efforts" value={`${stats.effortCount}`} />
      <Stat label="Numbered fences" value={`${stats.jumpCount}`} />
      <Stat label="Total distance" value={`${stats.totalM.toFixed(0)} m`} />
      <Stat label="Strides (≈)" value={`${stats.strides.toFixed(0)}`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
      <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-lato)" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)" }}>{value}</div>
    </div>
  );
}

function SelectionToolbar({
  prop, onRotate, onDelete, onAddToTrack, onResetSize,
}: { prop: PlacedProp; onRotate: (d: number) => void; onDelete: () => void; onAddToTrack: () => void; onResetSize: () => void }) {
  const def = getDef(prop.type);
  const btn: React.CSSProperties = {
    background: "var(--white)", border: "1px solid var(--border)", borderRadius: 6,
    padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
    fontFamily: "var(--font-lato)", color: "var(--teal-dark)",
  };
  const scaled = Math.abs(prop.scaleX - 1) > 0.01 || Math.abs(prop.scaleY - 1) > 0.01;
  return (
    <div className="flex flex-wrap items-center gap-2" style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px" }}>
      <span className="text-xs" style={{ fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>
        Selected: <strong style={{ color: "var(--teal-dark)" }}>{def.label}</strong>
        {" · "}{Math.round(prop.rotation)}°
        {scaled && (
          <> {" · "}<span style={{ color: "var(--teal-dark)" }}>{prop.scaleX.toFixed(2)}× / {prop.scaleY.toFixed(2)}×</span></>
        )}
      </span>
      <div className="ml-auto flex gap-1.5 flex-wrap">
        <button style={btn} onClick={() => onRotate(-45)}>⟲ 45°</button>
        <button style={btn} onClick={() => onRotate(-15)}>⟲ 15°</button>
        <button style={btn} onClick={() => onRotate(15)}>15° ⟳</button>
        <button style={btn} onClick={() => onRotate(45)}>45° ⟳</button>
        {scaled && <button style={btn} onClick={onResetSize}>Reset size</button>}
        {def.jumpable && <button style={{ ...btn, background: "var(--teal-muted)" }} onClick={onAddToTrack}>+ Add to track</button>}
        <button style={{ ...btn, color: "var(--inbreed-text)", borderColor: "var(--inbreed-border)" }} onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

/* ===================== Export modal ===================== */

function ExportModal({
  onClose, meta, props, track, trackLabels, stats, exportRef, downloadPng, exporting,
}: {
  onClose: () => void;
  meta: CourseMeta;
  props: PlacedProp[];
  track: PlacedProp[];
  trackLabels: string[];
  stats: { totalM: number; strides: number; legs: number[]; jumpCount: number; effortCount: number };
  exportRef: React.RefObject<HTMLDivElement | null>;
  downloadPng: () => void;
  exporting: boolean;
}) {
  // Summarise the jumps used by type
  const counts = useMemo(() => {
    const m = new Map<PropType, number>();
    for (const p of props) m.set(p.type, (m.get(p.type) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [props]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--cream)", borderRadius: 12, maxWidth: 1100, width: "100%", maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", padding: 0 }}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-3 sticky top-0 z-10" style={{ background: "var(--white)", borderBottom: "1px solid var(--border)" }}>
          <strong style={{ fontFamily: "var(--font-playfair)", color: "var(--teal-dark)" }}>Master Plan Preview</strong>
          <div className="flex gap-2">
            <button onClick={downloadPng} disabled={exporting}
              style={{ background: "var(--teal)", color: "white", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: exporting ? "wait" : "pointer", fontFamily: "var(--font-lato)" }}>
              {exporting ? "Generating…" : "↓ Download PNG"}
            </button>
            <button onClick={() => window.print()}
              style={{ background: "var(--white)", color: "var(--teal-dark)", border: "1px solid var(--teal)", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-lato)" }}>
              🖨 Print
            </button>
            <button onClick={onClose}
              style={{ background: "var(--white)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 6, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-lato)" }}>
              Close
            </button>
          </div>
        </div>

        {/* The printable canvas */}
        <div ref={exportRef} style={{ background: "var(--cream)", padding: "28px 32px" }}>
          <header className="flex items-end justify-between flex-wrap gap-3 mb-4 pb-3" style={{ borderBottom: "2px solid var(--gold)" }}>
            <div>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: 30, color: "var(--teal-dark)", lineHeight: 1.1 }}>
                {meta.name || "Untitled Course"}
              </div>
              <div className="mt-1 text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-lato)" }}>
                Designed by {meta.designer || "—"} · {meta.difficulty} · Redfield Equestrian Centre
              </div>
            </div>
            <div className="text-right text-xs" style={{ fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>
              {stats.jumpCount} numbered · {stats.totalM.toFixed(0)} m · ≈{stats.strides.toFixed(0)} strides
            </div>
          </header>

          {/* Static canvas snapshot */}
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 8, marginBottom: 18 }}>
            <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "auto", display: "block", background: "var(--cream)", borderRadius: 8 }}>
              <ArenaDecor />
              <TrackPath track={track} labels={trackLabels} />
              {props.map((p) => {
                const halfH = (getDef(p.type).h * PX_PER_M * p.scaleY) / 2;
                return (
                  <g key={p.id} transform={`translate(${p.x},${p.y}) rotate(${p.rotation})`}>
                    <g transform={`scale(${p.scaleX}, ${p.scaleY})`}>
                      <PropGlyph type={p.type} />
                    </g>
                    {(() => {
                      const idx = track.indexOf(p);
                      const label = idx === -1 ? null : trackLabels[idx];
                      if (!label) return null;
                      return (
                        <g transform={`rotate(${-p.rotation})`}>
                          <circle cx={0} cy={-halfH - 14} r={11} fill="var(--gold)" stroke="var(--teal-dark)" strokeWidth={1.5} />
                          <text x={0} y={-halfH - 10} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--teal-dark)" fontFamily="var(--font-lato), sans-serif">{label}</text>
                        </g>
                      );
                    })()}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Summary tables */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <SummaryCard title="Jumps used">
              {counts.length === 0 ? (
                <div className="text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-lato)" }}>None placed.</div>
              ) : (
                <table className="w-full text-xs" style={{ fontFamily: "var(--font-lato)" }}>
                  <thead>
                    <tr style={{ color: "var(--text-muted)", textAlign: "left" }}>
                      <th className="py-1">Prop</th>
                      <th className="py-1 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counts.map(([t, n]) => (
                      <tr key={t} style={{ borderTop: "1px solid var(--border)" }}>
                        <td className="py-1.5">{getDef(t).label}</td>
                        <td className="py-1.5 text-right">{n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SummaryCard>

            <SummaryCard title="Track sequence">
              {track.length === 0 ? (
                <div className="text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-lato)" }}>No track drawn.</div>
              ) : (
                <table className="w-full text-xs" style={{ fontFamily: "var(--font-lato)" }}>
                  <thead>
                    <tr style={{ color: "var(--text-muted)", textAlign: "left" }}>
                      <th className="py-1">#</th>
                      <th className="py-1">Fence</th>
                      <th className="py-1 text-right">Leg</th>
                      <th className="py-1 text-right">Strides</th>
                    </tr>
                  </thead>
                  <tbody>
                    {track.map((p, i) => {
                      const legM = i === 0 ? 0 : stats.legs[i - 1];
                      const strides = legM / STRIDE_M;
                      return (
                        <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                          <td className="py-1.5 font-bold" style={{ color: "var(--teal-dark)" }}>{trackLabels[i]}</td>
                          <td className="py-1.5">{getDef(p.type).label}</td>
                          <td className="py-1.5 text-right">{i === 0 ? "—" : `${legM.toFixed(1)} m`}</td>
                          <td className="py-1.5 text-right">{i === 0 ? "—" : strides.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </SummaryCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
      <div className="text-xs uppercase tracking-[0.08em] mb-2" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontWeight: 600 }}>{title}</div>
      {children}
    </div>
  );
}
