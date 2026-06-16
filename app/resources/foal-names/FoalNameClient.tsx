"use client";
import { useState, useMemo } from "react";

// Strip roleplay stable prefixes like [REC], [TES], [F.E] etc.
function stripPrefix(name: string): string {
  return name.replace(/^\[[^\]]*\]\s*/, "").trim();
}

// Split a name into meaningful chunks (words, then sub-word syllables for blending).
function chunks(name: string): string[] {
  const clean = stripPrefix(name);
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words;
  // Single-word name — split into two halves for blending
  const w = words[0] ?? "";
  if (w.length <= 3) return [w];
  const mid = Math.ceil(w.length / 2);
  return [w.slice(0, mid), w.slice(mid)];
}

// Capitalise first letter
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// Blend two chunks arrays into name candidates
function blend(sireChunks: string[], damChunks: string[]): string[] {
  const s = sireChunks.map((c) => c.toLowerCase());
  const d = damChunks.map((c) => c.toLowerCase());
  const results: string[] = [];

  // Word-level combinations
  for (const sw of s) {
    for (const dw of d) {
      if (sw !== dw) results.push(`${cap(sw)} ${cap(dw)}`);
    }
  }
  for (const dw of d) {
    for (const sw of s) {
      if (dw !== sw) results.push(`${cap(dw)} ${cap(sw)}`);
    }
  }

  // Sub-word blending: front of sire word + back of dam word, and vice versa
  for (const sw of s) {
    for (const dw of d) {
      if (sw.length >= 3 && dw.length >= 3) {
        const front = sw.slice(0, Math.ceil(sw.length * 0.5));
        const back = dw.slice(Math.floor(dw.length * 0.5));
        const blended = cap(front + back);
        if (blended.length >= 4) results.push(blended);
      }
    }
  }
  for (const dw of d) {
    for (const sw of s) {
      if (dw.length >= 3 && sw.length >= 3) {
        const front = dw.slice(0, Math.ceil(dw.length * 0.5));
        const back = sw.slice(Math.floor(sw.length * 0.5));
        const blended = cap(front + back);
        if (blended.length >= 4) results.push(blended);
      }
    }
  }

  // Deduplicate, filter noise
  const seen = new Set<string>();
  return results.filter((n) => {
    const key = n.toLowerCase();
    if (seen.has(key)) return false;
    if (n.length < 3) return false;
    seen.add(key);
    return true;
  });
}

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "11px 14px",
  fontSize: 15, fontFamily: "var(--font-lato)", background: "var(--white)", color: "var(--text)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-lato)", fontSize: 11, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6, display: "block",
};

export default function FoalNameClient() {
  const [sire, setSire] = useState("");
  const [dam, setDam] = useState("");
  const [prefix, setPrefix] = useState("");

  const names = useMemo(() => {
    const sc = chunks(sire);
    const dc = chunks(dam);
    if (!sire.trim() && !dam.trim()) return [];
    if (!sire.trim()) return dc.map(cap);
    if (!dam.trim()) return sc.map(cap);
    return blend(sc, dc);
  }, [sire, dam]);

  const withPrefix = prefix.trim()
    ? names.map((n) => `[${prefix.trim().replace(/^\[|\]$/g, "")}] ${n}`)
    : names;

  return (
    <div>
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: 28, marginBottom: 28 }}>
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label style={{ ...labelStyle, color: "var(--sire-text)" }}>Sire name</label>
            <input
              value={sire}
              onChange={(e) => setSire(e.target.value)}
              placeholder="e.g. [REC] Shadowfire"
              style={{ ...inputStyle, borderColor: sire ? "var(--sire-border)" : undefined }}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, color: "var(--dam-text)" }}>Dam name</label>
            <input
              value={dam}
              onChange={(e) => setDam(e.target.value)}
              placeholder="e.g. [REC] Moonwhisper"
              style={{ ...inputStyle, borderColor: dam ? "var(--dam-border)" : undefined }}
            />
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <label style={labelStyle}>Stable prefix (optional)</label>
          <input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="REC"
            style={{ ...inputStyle, maxWidth: 160 }}
          />
          <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 6 }}>
            Added as [PREFIX] before each name. Leave blank to see names without prefix.
          </p>
        </div>
      </div>

      {withPrefix.length > 0 && (
        <div>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)", marginBottom: 14 }}>
            {withPrefix.length} suggestion{withPrefix.length !== 1 ? "s" : ""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {withPrefix.map((name) => (
              <div
                key={name}
                style={{
                  background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8,
                  padding: "12px 16px", fontFamily: "var(--font-lato)", fontSize: 14,
                  color: "var(--teal-dark)", fontWeight: 600, cursor: "default",
                }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      )}

      {!withPrefix.length && (sire.trim() || dam.trim()) && (
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>
          Enter both names to see blended suggestions.
        </p>
      )}
    </div>
  );
}
