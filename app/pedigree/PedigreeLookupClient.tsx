"use client";
import { useState, useMemo } from "react";
import PedigreeTree from "@/components/PedigreeTree";
import { buildPedigreeTree, findDuplicates } from "@/lib/pedigree";
import type { HorseMap } from "@/lib/pedigree";

interface Horse {
  id: string;
  name: string;
  breed: string | null;
  gender: string | null;
  coat: string | null;
  sireName: string | null;
  damName: string | null;
}

export default function PedigreeLookupClient({ horses }: { horses: Horse[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Horse | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const horseMap: HorseMap = useMemo(() => new Map(
    horses.map((h) => [h.name.toLowerCase(), h])
  ), [horses]);

  const suggestions = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return horses.filter((h) => h.name.toLowerCase().includes(q)).slice(0, 10);
  }, [horses, query]);

  const tree = useMemo(() => {
    if (!selected) return null;
    return buildPedigreeTree(selected.name, horseMap, 5);
  }, [selected, horseMap]);

  const dupes = useMemo(() => findDuplicates(tree), [tree]);

  const allHorsesJson = JSON.stringify(horses.map(h => ({ id: h.id, name: h.name })));

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 36, color: "var(--teal-dark)", marginBottom: 6 }}>
          Pedigree Lookup
        </h1>
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>
          Search for any registered horse to view its full family tree.
        </p>
      </div>

      <div style={{ maxWidth: 480, position: "relative", marginBottom: 32 }}>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); if (!e.target.value) setSelected(null); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search horse name…"
          style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 16px", fontSize: 15, background: "var(--white)", color: "var(--text)", fontFamily: "var(--font-lato)", outline: "none" }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--white)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 50, marginTop: 2 }}>
            {suggestions.map((h) => (
              <div
                key={h.id}
                onMouseDown={() => { setSelected(h); setQuery(h.name); setShowSuggestions(false); }}
                style={{ padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-lato)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cream)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--white)")}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--teal-dark)" }}>{h.name}</div>
                {h.breed && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{h.breed} · {h.gender}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && tree && (
        <div>
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)" }}>{selected.name}</span>
              {selected.breed && <span style={{ marginLeft: 12, fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{selected.breed} · {selected.gender}</span>}
            </div>
            <a href={`/registry/${selected.id}`} style={{ fontSize: 13, color: "var(--teal)", fontFamily: "var(--font-lato)", textDecoration: "none" }}>
              View profile →
            </a>
          </div>

          {dupes.size > 0 && (
            <div style={{ marginBottom: 16, background: "#FFF0F0", border: "1px solid #FFCCCC", borderRadius: 6, padding: "10px 16px", fontSize: 13, color: "#C05050", fontFamily: "var(--font-lato)" }}>
              ⚠ Inbreeding detected — {dupes.size} duplicate ancestor{dupes.size !== 1 ? "s" : ""} found in this pedigree.
            </div>
          )}

          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 24, overflowX: "auto" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16, fontFamily: "var(--font-lato)", display: "flex", gap: 16 }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderLeft: "3px solid var(--teal-light)", background: "var(--white)", marginRight: 4, borderRadius: 2 }}></span>Sire line</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderLeft: "3px solid var(--gold)", background: "var(--white)", marginRight: 4, borderRadius: 2 }}></span>Dam line</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#FFF5F5", border: "1px solid #E07070", marginRight: 4, borderRadius: 2 }}></span>Inbreeding</span>
            </div>
            <PedigreeTree node={tree} dupes={dupes} allHorses={allHorsesJson} />
          </div>
        </div>
      )}

      {!selected && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 15 }}>
          Search for a horse above to view its pedigree tree.
        </div>
      )}
    </div>
  );
}
