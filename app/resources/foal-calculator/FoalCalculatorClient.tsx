"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { DILUTIONS, PATTERNS, predictFoal } from "@/lib/genetics";

type Base = "R" | "B" | "BL" | "";

const BASE_OPTIONS: { code: Base; label: string }[] = [
  { code: "", label: "— Select base —" },
  { code: "R", label: "Red / Chestnut (R)" },
  { code: "B", label: "Bay (B)" },
  { code: "BL", label: "Black (BL)" },
];

// "Modifier" pills exclude CR2 — we surface it via the "+ double cream" toggle
// pattern below so the UI mirrors how the genome string is normally written.
const MODIFIER_PILLS = (DILUTIONS as readonly string[]);

interface ParentState {
  base: Base;
  modifiers: Set<string>; // dilution codes
  pattern: string;        // "" or pattern code
}

const emptyParent = (): ParentState => ({ base: "", modifiers: new Set(), pattern: "" });

// Build the stored "B_CR_Z_TO" genome string from the picker state.
function buildGenome(p: ParentState): string {
  if (!p.base) return "";
  // Sort dilutions for a stable display (CR before Z, etc.)
  const dils = [...p.modifiers].sort();
  return [p.base, ...dils, p.pattern].filter(Boolean).join("_");
}

// Which modifier codes can the current base carry?
function modifierDisabled(code: string, base: Base): boolean {
  if (code === "FLX") return base !== "R";       // Flaxen only on red
  if (code === "Z") return !(base === "B" || base === "BL"); // Silver on black/bay
  return false;
}

export default function FoalCalculatorClient() {
  const [sire, setSire] = useState<ParentState>(emptyParent());
  const [dam, setDam] = useState<ParentState>(emptyParent());

  const sireGenome = buildGenome(sire);
  const damGenome = buildGenome(dam);

  // Re-compute on every state change — engine is cheap.
  const prediction = useMemo(
    () => predictFoal(sireGenome || null, damGenome || null),
    [sireGenome, damGenome]
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/" className="text-xs uppercase tracking-[0.12em] text-[var(--teal)] no-underline" style={{ fontFamily: "var(--font-lato)" }}>
          ← Back home
        </Link>
      </div>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 36, color: "var(--teal-dark)", marginBottom: 6 }}>
        Foal Coat Calculator
      </h1>
      <p className="text-[var(--text-muted)] mb-8" style={{ fontFamily: "var(--font-lato)", fontSize: 14 }}>
        Build a hypothetical sire and dam and see every coat their foal could produce.
        Genetics rules and coat names are the Azelas Coat Catalogue used by The Rift.
      </p>

      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <ParentBuilder title="Sire" accent="var(--sire-text)" bg="var(--sire-bg)" border="var(--sire-border)" state={sire} setState={setSire} genome={sireGenome} />
        <ParentBuilder title="Dam"  accent="var(--dam-text)"  bg="var(--dam-bg)"  border="var(--dam-border)"  state={dam}  setState={setDam}  genome={damGenome} />
      </div>

      {/* ===== Results ===== */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24 }}>
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 16 }}>
          Predicted Foal
        </h2>

        {!prediction.ok ? (
          <p className="text-[var(--text-muted)] text-sm" style={{ fontFamily: "var(--font-lato)" }}>
            {prediction.reason ?? "Pick a base colour for both parents to see predictions."}
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            <ChipRow label="Possible Base Colours" items={prediction.bases.map(baseLabel)} kind="base" />
            <ChipRow
              label="May Inherit"
              items={prediction.modifiers.length ? prediction.modifiers.map((m) => `${m.code} · ${m.label}`) : ["None"]}
              kind="mod"
            />
            <ChipRow
              label="Possible Patterns"
              items={prediction.patterns.length ? prediction.patterns.map((p) => `${p} · ${PATTERNS[p] ?? p}`) : ["None — solid"]}
              kind="pattern"
            />

            <div>
              <SectionLabel>Possible Foal Coats</SectionLabel>
              <CoatColumns prediction={prediction} />
              <p className="text-[11px] text-[var(--text-muted)] mt-3" style={{ fontFamily: "var(--font-lato)" }}>
                These are coats this pairing <em>could</em> produce. An actual foal gets one combination at random.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ===========================================================================
// Parent builder — base dropdown, modifier pills, pattern grid, live genome.
// ===========================================================================
function ParentBuilder({
  title, accent, bg, border, state, setState, genome,
}: {
  title: string;
  accent: string; bg: string; border: string;
  state: ParentState;
  setState: React.Dispatch<React.SetStateAction<ParentState>>;
  genome: string;
}) {
  const setBase = (b: Base) =>
    setState((s) => {
      // Clear base-restricted modifiers if the new base can't carry them.
      const next = new Set(s.modifiers);
      if (b !== "R") next.delete("FLX");
      if (!(b === "B" || b === "BL")) next.delete("Z");
      return { ...s, base: b, modifiers: next };
    });

  const toggleMod = (code: string) =>
    setState((s) => {
      const next = new Set(s.modifiers);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      // CR2 implies CR is also passable, but we represent CR2 alone to match
      // the canonical genome string convention used by the engine. If both
      // are picked, the engine still handles it; we don't auto-strip.
      return { ...s, modifiers: next };
    });

  const togglePattern = (code: string) =>
    setState((s) => ({ ...s, pattern: s.pattern === code ? "" : code }));

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: 18 }}>
      <div className="mb-3" style={{ fontSize: 11, letterSpacing: "0.12em", color: accent, textTransform: "uppercase", fontFamily: "var(--font-lato)", fontWeight: 700 }}>
        {title}
      </div>

      {/* Base */}
      <SectionLabel>Base colour</SectionLabel>
      <select
        value={state.base}
        onChange={(e) => setBase(e.target.value as Base)}
        className="w-full text-sm rounded-md p-2.5 border bg-white mb-4"
        style={{ borderColor: border, fontFamily: "var(--font-lato)", color: "var(--text)" }}
      >
        {BASE_OPTIONS.map((o) => (
          <option key={o.code} value={o.code}>{o.label}</option>
        ))}
      </select>

      {/* Modifiers */}
      <SectionLabel>Modifiers (optional)</SectionLabel>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {MODIFIER_PILLS.map((code) => {
          const on = state.modifiers.has(code);
          const disabled = modifierDisabled(code, state.base);
          return (
            <button
              key={code}
              type="button"
              onClick={() => !disabled && toggleMod(code)}
              disabled={disabled}
              title={disabled ? `${code} requires a compatible base colour` : code}
              className={
                "text-xs px-3 py-1.5 rounded-full border transition-colors " +
                (disabled
                  ? "opacity-40 cursor-not-allowed bg-white text-[var(--text-muted)] border-[var(--border)]"
                  : on
                  ? "bg-[var(--teal)] text-white border-[var(--teal)]"
                  : "bg-white text-[var(--teal-dark)] border-[var(--border)] hover:border-[var(--teal-light)]")
              }
              style={{ fontFamily: "var(--font-lato)" }}
            >
              {code}
            </button>
          );
        })}
      </div>

      {/* Pattern */}
      <SectionLabel>Pattern (select one)</SectionLabel>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 mb-4">
        {Object.entries(PATTERNS).map(([code, label]) => {
          const on = state.pattern === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => togglePattern(code)}
              title={label}
              className={
                "text-[11px] py-1.5 rounded-md border transition-colors " +
                (on
                  ? "bg-[var(--teal)] text-white border-[var(--teal)]"
                  : "bg-white text-[var(--teal-dark)] border-[var(--border)] hover:border-[var(--teal-light)]")
              }
              style={{ fontFamily: "var(--font-lato)" }}
            >
              {code}
            </button>
          );
        })}
      </div>

      {/* Live genome string */}
      <div className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)] mb-1" style={{ fontFamily: "var(--font-lato)" }}>
        Genome
      </div>
      <code
        className="block text-sm bg-white border rounded-md px-3 py-2"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          color: genome ? "var(--teal-dark)" : "var(--text-muted)",
          borderColor: border,
        }}
      >
        {genome || "— select a base —"}
      </code>
    </div>
  );
}

// ===========================================================================
// Result helpers
// ===========================================================================
function ChipRow({ label, items, kind }: { label: string; items: string[]; kind: "base" | "mod" | "pattern" }) {
  const colours = {
    base:    { bg: "var(--teal-muted)",   fg: "var(--teal-dark)" },
    mod:     { bg: "var(--gold-light)",   fg: "#6B5A2A" },
    pattern: { bg: "var(--dam-bg)",       fg: "var(--dam-text)" },
  }[kind];
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <span
            key={it}
            className="text-xs font-semibold px-3 py-1 rounded-full border"
            style={{ background: colours.bg, color: colours.fg, borderColor: "rgba(0,0,0,0.06)", fontFamily: "var(--font-lato)" }}
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function CoatColumns({ prediction }: { prediction: ReturnType<typeof predictFoal> }) {
  // The engine returns groups labeled "Red / Chestnut", "Bay", "Black". We
  // render them as three clean columns in a fixed order so the layout is
  // identical whether or not a particular base is reachable.
  const ORDER = ["Red / Chestnut", "Bay", "Black"] as const;
  const colorFor: Record<string, { bg: string; border: string; head: string }> = {
    "Red / Chestnut": { bg: "#FBF3E8", border: "#E6D1AE", head: "#9B6A2B" },
    "Bay":            { bg: "var(--sire-bg)", border: "var(--sire-border)", head: "var(--sire-text)" },
    "Black":          { bg: "#EBEAEE", border: "#C9C7D0", head: "#403F50" },
  };
  const groups = new Map(prediction.coats.map((g) => [g.base, g.items]));

  return (
    <div className="grid sm:grid-cols-3 gap-3 mt-2">
      {ORDER.map((base) => {
        const items = groups.get(base);
        const c = colorFor[base];
        return (
          <div key={base} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 15, color: c.head, marginBottom: 8 }}>
              {base}
            </div>
            {!items?.length ? (
              <div className="text-xs text-[var(--text-muted)]" style={{ fontFamily: "var(--font-lato)" }}>
                Not reachable.
              </div>
            ) : (
              <ul className="m-0 pl-0 list-none flex flex-col gap-1.5">
                {items.map((it) => (
                  <li key={it.code} className="text-xs leading-snug text-[var(--text)] flex items-center justify-between gap-2" style={{ fontFamily: "var(--font-lato)" }}>
                    <span>{it.name}</span>
                    <code
                      className="text-[10.5px] px-1.5 py-0.5 rounded border"
                      style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", background: "var(--white)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                    >
                      {it.code}
                    </code>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] font-semibold mb-2"
      style={{ fontFamily: "var(--font-lato)" }}
    >
      {children}
    </div>
  );
}

function baseLabel(b: "R" | "B" | "BL"): string {
  return { R: "Red / Chestnut", B: "Bay", BL: "Black" }[b];
}
