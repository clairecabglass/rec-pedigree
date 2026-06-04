"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import PedigreeTree from "@/components/PedigreeTree";
import Icon from "@/components/Icon";
import { buildPedigreeTree, findDuplicates } from "@/lib/pedigree";
import type { HorseMap, HorseNode } from "@/lib/pedigree";
import { predictFoal, extractGeneCode, PATTERNS as PATTERN_LABEL } from "@/lib/genetics";

interface Horse {
  id: string; name: string; breed: string | null; gender: string | null;
  coat: string | null; genotype: string | null; sireName: string | null; damName: string | null;
}

function nodeDepth(n: HorseNode | null | undefined): number {
  if (!n) return 0;
  const s = n.sire ? 1 + nodeDepth(n.sire) : 0;
  const d = n.dam ? 1 + nodeDepth(n.dam) : 0;
  return Math.max(s, d);
}

export default function StableTrackerClient({ horses }: { horses: Horse[] }) {
  const [dam, setDam] = useState<Horse | null>(null);
  const [sire, setSire] = useState<Horse | null>(null);

  const map: HorseMap = useMemo(
    () => new Map(horses.map((h) => [h.name.toLowerCase(), {
      id: h.id, name: h.name, breed: h.breed, gender: h.gender,
      coat: h.coat, sireName: h.sireName, damName: h.damName,
    }])),
    [horses]
  );
  const allHorsesJson = useMemo(
    () => JSON.stringify(horses.map((h) => ({ id: h.id, name: h.name }))),
    [horses]
  );

  // Build the predicted foal's pedigree from the two parents.
  const foal = useMemo<HorseNode | null>(() => {
    if (!dam || !sire) return null;
    return {
      id: "foal",
      name: "Potential Foal",
      breed: dam.breed === sire.breed ? dam.breed : `${sire.breed ?? "?"} × ${dam.breed ?? "?"}`,
      gender: null,
      coat: null,
      sire: buildPedigreeTree(sire.name, map, 6),
      dam: buildPedigreeTree(dam.name, map, 6),
    };
  }, [dam, sire, map]);

  const dupes = useMemo(() => findDuplicates(foal), [foal]);
  const generations = foal ? nodeDepth(foal) : 0;
  const clean = dupes.size === 0;

  const genes = useMemo(() => {
    if (!dam || !sire) return null;
    return predictFoal(
      extractGeneCode(sire.coat, sire.genotype),
      extractGeneCode(dam.coat, dam.genotype),
    );
  }, [dam, sire]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>← Admin</Link>
      </div>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", marginBottom: 4 }}>Stable Tracker</h1>
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14, marginBottom: 28 }}>
        Pair a mare and stallion to preview the foal&apos;s pedigree, check for inbreeding, and see how deep the bloodline runs.
      </p>

      {/* Pairing pickers */}
      <div className="grid md:grid-cols-2 gap-5" style={{ marginBottom: 28 }}>
        <Picker label="Dam (Mare)" accent="var(--dam-text)" accentBg="var(--dam-bg)" accentBorder="var(--dam-border)"
          horses={horses.filter((h) => h.gender === "Mare")} selected={dam} onSelect={setDam} />
        <Picker label="Sire (Stallion)" accent="var(--sire-text)" accentBg="var(--sire-bg)" accentBorder="var(--sire-border)"
          horses={horses.filter((h) => h.gender === "Stallion")} selected={sire} onSelect={setSire} />
      </div>

      {!foal ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "var(--text-muted)", fontFamily: "var(--font-lato)", border: "1px dashed var(--border)", borderRadius: 10 }}>
          Select a mare and a stallion above to preview their foal.
        </div>
      ) : (
        <>
          {/* Verdict cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4" style={{ marginBottom: 24 }}>
            <Stat label="Pedigree Depth" value={`${generations} gen`} note={generations >= 5 ? "Deep bloodline" : "Shallow"} good={generations >= 5} />
            <Stat label="Inbreeding" value={clean ? "None" : `${dupes.size} shared`} note={clean ? "No duplicate ancestors" : "Shared ancestor(s)"} good={clean} />
            <Stat label="Pairing" value={clean && generations >= 5 ? "Excellent" : clean ? "Good" : "Caution"} note={clean ? "Outcross" : "Linebreeding"} good={clean} />
          </div>

          {/* Predicted genetics */}
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)", marginBottom: 12 }}>Predicted Foal Genetics</h2>
            <div className="grid grid-cols-2 gap-4" style={{ fontFamily: "var(--font-lato)", fontSize: 13, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--dam-text)", textTransform: "uppercase" }}>Dam coat</div>
                <div>{dam!.coat ?? "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--sire-text)", textTransform: "uppercase" }}>Sire coat</div>
                <div>{sire!.coat ?? "—"}</div>
              </div>
            </div>

            {!genes?.ok ? (
              <div style={{ padding: "10px 14px", background: "var(--cream)", borderRadius: 8, fontSize: 12.5, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
                {genes?.reason ?? "Add gene codes to both parents' coats (e.g. “Bay Overo (B_O)”) to predict the foal."}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <ChipRow label="Possible base colours" items={genes.bases.map((b) => ({ R: "Red / Chestnut", B: "Bay", BL: "Black" }[b]))} color="var(--teal-dark)" bg="var(--teal-muted)" />
                {genes.modifiers.length > 0 && (
                  <ChipRow label="May inherit" items={genes.modifiers.map((m) => m.label)} color="#6B5A2A" bg="var(--gold-light)" />
                )}
                <ChipRow label="Possible patterns" items={genes.patterns.length ? ["None", ...genes.patterns.map((p) => PATTERN_LABEL[p] ?? p)] : ["None"]} color="var(--dam-text)" bg="var(--dam-bg)" />

                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-lato)", marginBottom: 8 }}>Possible foal coats</div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {genes.coats.map((grp) => (
                      <div key={grp.base} style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 14, color: "var(--teal-dark)", marginBottom: 6 }}>{grp.base}</div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--text)", fontFamily: "var(--font-lato)", lineHeight: 1.7 }}>
                          {grp.names.map((n) => <li key={n}>{n}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
                    These are the colours/patterns this pairing <em>could</em> produce — actual foals get one combination at random.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Foal pedigree */}
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)" }}>Predicted Foal Pedigree</h2>
              {!clean && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--inbreed-text)", background: "var(--inbreed-bg)", border: "1px solid var(--inbreed-border)", borderRadius: 16, padding: "4px 12px", fontFamily: "var(--font-lato)" }}>
                  <Icon name="warning" size={14} color="var(--inbreed-text)" />
                  {dupes.size} shared ancestor{dupes.size !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <PedigreeTree node={foal} dupes={dupes} allHorses={allHorsesJson} isAdmin title={`foal-${sire!.name}-x-${dam!.name}`} />
          </div>
        </>
      )}
    </div>
  );
}

function ChipRow({ label, items, color, bg }: { label: string; items: (string | undefined)[]; color: string; bg: string }) {
  const list = items.filter(Boolean) as string[];
  if (!list.length) return null;
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-lato)", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {list.map((it) => (
          <span key={it} style={{ background: bg, color, border: "1px solid rgba(0,0,0,0.06)", borderRadius: 14, padding: "3px 12px", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-lato)" }}>{it}</span>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, note, good }: { label: string; value: string; note: string; good: boolean }) {
  return (
    <div style={{ background: "var(--white)", border: `1px solid ${good ? "var(--border)" : "var(--inbreed-border)"}`, borderRadius: 10, padding: 16, textAlign: "center" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-lato)" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-playfair)", fontSize: 26, color: good ? "var(--teal)" : "var(--inbreed-text)", margin: "4px 0" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{note}</div>
    </div>
  );
}

function Picker({ label, horses, selected, onSelect, accent, accentBg, accentBorder }: {
  label: string; horses: Horse[]; selected: Horse | null; onSelect: (h: Horse | null) => void;
  accent: string; accentBg: string; accentBorder: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => {
    if (!query || query.length < 1) return horses.slice(0, 12);
    const q = query.toLowerCase();
    return horses.filter((h) => h.name.toLowerCase().includes(q)).slice(0, 12);
  }, [horses, query]);

  return (
    <div style={{ background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.1em", color: accent, textTransform: "uppercase", fontFamily: "var(--font-lato)", fontWeight: 700, marginBottom: 8 }}>{label}</div>
      {selected ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 17, color: "var(--teal-dark)" }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{[selected.breed, selected.coat].filter(Boolean).join(" · ") || "—"}</div>
          </div>
          <button onClick={() => { onSelect(null); setQuery(""); }} style={{ background: "var(--white)", border: `1px solid ${accentBorder}`, borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>Change</button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <input value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={`Search ${label.toLowerCase()}…`}
            style={{ width: "100%", border: `1px solid ${accentBorder}`, borderRadius: 6, padding: "9px 12px", fontSize: 14, background: "var(--white)", color: "var(--text)", fontFamily: "var(--font-lato)", outline: "none" }} />
          {open && suggestions.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--white)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 50, marginTop: 2, maxHeight: 280, overflowY: "auto" }}>
              {suggestions.map((h) => (
                <div key={h.id} onMouseDown={() => { onSelect(h); setOpen(false); }}
                  style={{ padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-lato)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cream)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--white)")}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--teal-dark)" }}>{h.name}</div>
                  {h.breed && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{h.breed}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
