"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { buildPedigreeTree, inbreedingCoefficient, commonAncestors } from "@/lib/pedigree";
import type { HorseMap, HorseNode } from "@/lib/pedigree";
import { predictFoal, extractGeneCode, DILUTIONS, PATTERNS } from "@/lib/genetics";

// Codes the user can target. Bases + dilutions + patterns.
const TARGET_BASES = [
  { code: "R", label: "Red / Chestnut" },
  { code: "B", label: "Bay" },
  { code: "BL", label: "Black" },
];
const TARGET_DILUTIONS = (DILUTIONS as readonly string[]).map((code) => ({
  code,
  label: ({ CH: "Champagne", CR: "Cream (1 copy)", CR2: "Cream (2 copies)", Z: "Silver", M: "Mushroom",
    P: "Pangare", G: "Grey", DW: "Dominant White", FLX: "Flaxen" } as Record<string, string>)[code] ?? code,
}));
const TARGET_PATTERNS = Object.entries(PATTERNS).map(([code, label]) => ({ code, label }));

// Does the predicted foal's reachable outcomes include EVERY targeted code?
function foalCanProduce(pred: ReturnType<typeof predictFoal>, targets: string[]): boolean {
  if (!targets.length) return true;
  if (!pred.ok) return false;
  const baseSet = new Set<string>(pred.bases);
  const modSet = new Set<string>(pred.modifiers.map((m) => m.code));
  // Cream is reported as creamCopies + a CR modifier; surface both CR & CR2 explicitly.
  if (pred.creamCopies.includes(1) || pred.creamCopies.includes(2)) modSet.add("CR");
  if (pred.creamCopies.includes(2)) modSet.add("CR2");
  const patSet = new Set<string>(pred.patterns);

  for (const t of targets) {
    if (baseSet.has(t)) continue;
    if (modSet.has(t)) continue;
    if (patSet.has(t)) continue;
    return false; // this target cannot be produced — pair fails
  }
  return true;
}

import { FullHorseData } from "@/lib/types";

interface Pairing {
  mare: FullHorseData;
  stallion: FullHorseData;
  foal: HorseNode;
  /** Minimum of sire/dam depth + 1 — the balanced, honest generation count. */
  pedigreeDepth: number;
  /** Raw depth of the stallion's recorded pedigree (not +1 for the foal). */
  stallionDepth: number;
  /** Raw depth of the mare's recorded pedigree (not +1 for the foal). */
  mareDepth: number;
  /** Count of non-placeholder ancestors across the combined foal pedigree. */
  namedAncestors: number;
  inbreedingCoefficient: number;
  sharedAncestors: number;
  isPurebredCross: boolean;
  foalGenetics: ReturnType<typeof predictFoal> | null;
  reasons: string[];
}

export default function SuggestedPairingsClient({
  horses,
}: {
  horses: FullHorseData[],
}) {
  // Filter states
  const [minGenerations, setMinGenerations] = useState(3);
  const [requirePurebred, setRequirePurebred] = useState<boolean | null>(null); // null = any, true = purebred, false = cross
  const [maxInbreeding, setMaxInbreeding] = useState(0.125);
  const [limitCoi, setLimitCoi] = useState(false); // off by default = no limit
  const [selectedBreed, setSelectedBreed] = useState<string | null>(null);
  const [knownParentsOnly, setKnownParentsOnly] = useState(false);
  const [noVisibleInbreeding, setNoVisibleInbreeding] = useState(false);
  const [fullPedigreeOnly, setFullPedigreeOnly] = useState(false);
  const [sortMode, setSortMode] = useState<"named" | "generations">("named");
  // Multi-select set of gene codes the foal must be able to produce.
  const [targetGenotypes, setTargetGenotypes] = useState<string[]>([]);

  // Pagination states (client-side for pairings)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Effect to reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [minGenerations, requirePurebred, maxInbreeding, limitCoi, selectedBreed, knownParentsOnly, targetGenotypes, noVisibleInbreeding, fullPedigreeOnly, sortMode]);

  const toggleTarget = (code: string) =>
    setTargetGenotypes((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);

  // Save a pair to the breeding wishlist so it can be mass-bred later.
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [savingKey, setSavingKey] = useState<string | null>(null);
  async function savePair(p: { mare: { id: string; name: string }; stallion: { id: string; name: string } }) {
    const key = `${p.mare.id}-${p.stallion.id}`;
    if (savedKeys.has(key)) return;
    setSavingKey(key);
    try {
      const res = await fetch("/api/breeding-plans", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ damId: p.mare.id, damName: p.mare.name, sireId: p.stallion.id, sireName: p.stallion.name }),
      });
      if (res.ok) setSavedKeys((s) => new Set(s).add(key));
      else alert("Could not save this pair to the wishlist.");
    } finally {
      setSavingKey(null);
    }
  }


  // Memoized data
  const mares = useMemo(() => horses.filter(h => h.gender === "Mare" && h.ownership === "Home"), [horses]);
  const stallions = useMemo(() => horses.filter(h => h.gender === "Stallion" && h.ownership === "Home"), [horses]);
  const horseMap: HorseMap = useMemo(
    () => new Map(horses.map((h) => [h.name.toLowerCase(), {
      id: h.id, name: h.name, breed: h.breed, gender: h.gender,
      coat: h.coat, genotype: h.genotype, sireName: h.sireName, damName: h.damName,
      ownership: h.ownership, isImportedPlaceholder: h.isImportedPlaceholder,
    }])),
    [horses]
  );
  const breeds = useMemo(() => Array.from(new Set(horses.map(h => h.breed).filter(Boolean))) as string[], [horses]);

  // Pre-compute each horse's pedigree tree ONCE at full depth.
  // Rebuilds only when the horse list changes, not on every filter change.
  const horseTreeCache = useMemo(() => {
    const cache = new Map<string, HorseNode | null>();
    for (const h of horses) cache.set(h.id, buildPedigreeTree(h.name, horseMap, 12));
    return cache;
  }, [horses, horseMap]);

  // Pre-compute recorded pedigree depth per horse.
  const horseDepthCache = useMemo(() => {
    const cache = new Map<string, number>();
    for (const [id, tree] of horseTreeCache) cache.set(id, nodeDepth(tree));
    return cache;
  }, [horseTreeCache]);


  const suggestedPairings = useMemo(() => {
    const pairings: Pairing[] = [];

    const breedFilteredMares = selectedBreed ? mares.filter(m => m.breed === selectedBreed) : mares;
    const breedFilteredStallions = selectedBreed ? stallions.filter(s => s.breed === selectedBreed) : stallions;

    if (breedFilteredMares.length === 0 || breedFilteredStallions.length === 0) return pairings;

    for (const mare of breedFilteredMares) {
      // --- cheap pre-checks on the mare alone ---
      if (knownParentsOnly && (!mare.sireName || !mare.damName)) continue;
      const mareDepth = horseDepthCache.get(mare.id) ?? 0;

      for (const stallion of breedFilteredStallions) {
        if (mare.id === stallion.id) continue;

        // --- cheap pre-checks on the stallion alone ---
        if (knownParentsOnly && (!stallion.sireName || !stallion.damName)) continue;
        const stallionDepth = horseDepthCache.get(stallion.id) ?? 0;

        // Balanced depth check — done before any expensive tree work
        const pedigreeDepth = 1 + Math.min(stallionDepth, mareDepth) + Math.min(1, Math.abs(stallionDepth - mareDepth));
        if (pedigreeDepth < minGenerations) continue;

        // Full pedigree check: every slot in minGenerations-1 generations of each parent must be filled
        if (fullPedigreeOnly) {
          const genDepth = minGenerations - 1; // parent needs this many full gens for foal to have minGenerations
          const stallionTree = horseTreeCache.get(stallion.id);
          const mareTree = horseTreeCache.get(mare.id);
          if (!isFullPedigree(stallionTree, genDepth) || !isFullPedigree(mareTree, genDepth)) continue;
        }

        // Purebred / cross check — also cheap
        const isPurebredCross = mare.breed === stallion.breed;
        if (requirePurebred !== null) {
          if (requirePurebred && !isPurebredCross) continue;
          if (!requirePurebred && isPurebredCross) continue;
        }

        // Use pre-computed trees — no redundant buildPedigreeTree calls
        const foal: HorseNode = {
          id: "foal", name: "Potential Foal", breed: null, gender: null, coat: null,
          sire: horseTreeCache.get(stallion.id) ?? null,
          dam:  horseTreeCache.get(mare.id)  ?? null,
        };

        const shared = commonAncestors(foal).size;
        const coi = inbreedingCoefficient(foal);

        // No visible inbreeding filter — any repeated ancestor within 6 gen fails
        if (noVisibleInbreeding && shared > 0) continue;

        // COI filter — when limit is 0% use sharedAncestors (immune to float errors)
        if (limitCoi) {
          if (maxInbreeding === 0 && shared > 0) continue;
          else if (maxInbreeding > 0 && coi > maxInbreeding) continue;
        }

        const foalGenetics = predictFoal(
          extractGeneCode(stallion.coat, stallion.genotype),
          extractGeneCode(mare.coat, mare.genotype),
        );

        if (targetGenotypes.length && !foalCanProduce(foalGenetics, targetGenotypes)) continue;

        const namedAncestors = countNamedAncestors(foal);

        const reasons: string[] = [];
        reasons.push(`Named ancestors: ${namedAncestors}`);
        const balanced = stallionDepth === mareDepth
          ? `${pedigreeDepth} gen`
          : `${pedigreeDepth} gen (♂ ${stallionDepth} · ♀ ${mareDepth})`;
        reasons.push(`Pedigree depth: ${balanced}`);
        if (requirePurebred !== null) reasons.push(requirePurebred ? "Purebred pairing" : "Cross-breed pairing");
        if (shared === 0) reasons.push("Outcross — no shared ancestors");
        else reasons.push(`${shared} shared ancestor${shared !== 1 ? "s" : ""}`);
        if (targetGenotypes.length) reasons.push(`Can produce target genotype: ${targetGenotypes.join(", ")}`);

        pairings.push({
          mare, stallion, foal, pedigreeDepth, stallionDepth, mareDepth, namedAncestors,
          inbreedingCoefficient: coi, sharedAncestors: shared, isPurebredCross, foalGenetics, reasons,
        });
      }
    }
    if (sortMode === "named") {
      return pairings.sort((a, b) => b.namedAncestors - a.namedAncestors || a.inbreedingCoefficient - b.inbreedingCoefficient);
    }
    return pairings.sort((a, b) => a.inbreedingCoefficient - b.inbreedingCoefficient || b.pedigreeDepth - a.pedigreeDepth);
  }, [mares, stallions, horseTreeCache, horseDepthCache, minGenerations, requirePurebred, maxInbreeding, limitCoi, selectedBreed, knownParentsOnly, targetGenotypes, noVisibleInbreeding, fullPedigreeOnly, sortMode]);

  const totalPages = Math.ceil(suggestedPairings.length / itemsPerPage);
  const paginatedPairings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return suggestedPairings.slice(startIndex, endIndex);
  }, [suggestedPairings, currentPage, itemsPerPage]);


  const cardStyle = { background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 24 };
  const buttonStyle = {
    background: "var(--teal)", color: "var(--white)", border: "none", borderRadius: 6,
    padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
    fontFamily: "var(--font-lato)", opacity: 1,
  };
  const secondaryButtonStyle = {
    background: "var(--white)", border: "1px solid var(--border)", borderRadius: 6,
    padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
    fontFamily: "var(--font-lato)", opacity: 1, color: "var(--teal-dark)",
  };
  const inputStyle: React.CSSProperties = {
    border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px",
    fontSize: 13, background: "var(--white)", color: "var(--text)",
    fontFamily: "var(--font-lato)", outline: "none", width: "100%",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)",
    textTransform: "uppercase", fontFamily: "var(--font-lato)", fontWeight: 600,
    display: "block", marginBottom: 4,
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };


  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <Link href="/admin/breeding" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>← Breeding</Link>
      </div>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", marginBottom: 4 }}>Suggested Pairings</h1>
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14, marginBottom: 28 }}>
        Find optimal mare and stallion matches based on your breeding goals.
      </p>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div style={cardStyle}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)", marginBottom: 16 }}>Filters</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div>
              <label style={labelStyle}>Minimum Pedigree Depth (Generations)</label>
              <input
                type="number" min={1} max={10}
                value={minGenerations}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  // Clamp to [1,10]. NaN happens if the field is cleared mid-edit.
                  setMinGenerations(Number.isFinite(v) ? Math.min(10, Math.max(1, v)) : 1);
                }}
                style={inputStyle}
              />
              <p style={{ marginTop: 4, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
                1–10 generations. If no horse has that depth recorded, the list will be empty.
              </p>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8 }}>
                <input type="checkbox" id="fullPedigreeOnly" checked={fullPedigreeOnly} onChange={(e) => setFullPedigreeOnly(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
                <label htmlFor="fullPedigreeOnly" style={{ ...labelStyle, marginBottom: 0, fontSize: 12 }}>
                  Full pedigree only — no unknown or foundation horses for the minimum depth
                </label>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <input type="checkbox" id="limitCoi" checked={limitCoi} onChange={(e) => setLimitCoi(e.target.checked)} />
                <label htmlFor="limitCoi" style={{ ...labelStyle, marginBottom: 0 }}>Limit max COI</label>
              </div>
              {limitCoi && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>0% (outcross only)</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--teal-dark)", fontFamily: "var(--font-lato)" }}>≤ {(maxInbreeding * 100).toFixed(1)}%</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>50%</span>
                  </div>
                  <input type="range" min="0" max="50" step="0.5" value={maxInbreeding * 100} onChange={(e) => setMaxInbreeding(parseFloat(e.target.value) / 100)} style={{ width: "100%" }} />
                </>
              )}
            </div>

            <div>
              <label style={labelStyle}>Purebred / Cross</label>
              <select value={requirePurebred === null ? "any" : requirePurebred ? "purebred" : "cross"} onChange={(e) => setRequirePurebred(e.target.value === "any" ? null : e.target.value === "purebred")} style={inputStyle}>
                <option value="any">Any (Purebred or Cross)</option>
                <option value="purebred">Purebred (Same Breed)</option>
                <option value="cross">Cross (Different Breeds)</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Specific Breed (Parents)</label>
              <select value={selectedBreed ?? ""} onChange={(e) => setSelectedBreed(e.target.value || null)} style={inputStyle}>
                <option value="">Any Breed</option>
                {breeds.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)", margin: 0, lineHeight: 1.5 }}>
              Only pairs horses you own (<strong>Home</strong> ownership).
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="knownParentsOnly" checked={knownParentsOnly} onChange={(e) => setKnownParentsOnly(e.target.checked)} />
              <label htmlFor="knownParentsOnly" style={{ ...labelStyle, marginBottom: 0 }}>Known Parents Only (Sire/Dam Names Present)</label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="noVisibleInbreeding" checked={noVisibleInbreeding} onChange={(e) => setNoVisibleInbreeding(e.target.checked)} />
              <label htmlFor="noVisibleInbreeding" style={{ ...labelStyle, marginBottom: 0 }}>No Visible Inbreeding (6 Generations)</label>
            </div>

            {/* ===== Target Foal Genotypes ===== */}
            <div>
              <label style={labelStyle}>Target Foal Genotypes</label>
              <p style={{ marginTop: 0, marginBottom: 8, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
                Only show pairs that could pass <em>every</em> selected code to the foal.
              </p>
              <TargetGroup title="Base" options={TARGET_BASES} selected={targetGenotypes} onToggle={toggleTarget} />
              <TargetGroup title="Modifiers" options={TARGET_DILUTIONS} selected={targetGenotypes} onToggle={toggleTarget} />
              <TargetGroup title="Patterns" options={TARGET_PATTERNS} selected={targetGenotypes} onToggle={toggleTarget} />
              {targetGenotypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTargetGenotypes([])}
                  style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "var(--font-lato)" }}
                >
                  Clear targets
                </button>
              )}
            </div>

          </div>
        </div>

        <div className="md:col-span-3">
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", margin: 0 }}>
                Suggested Pairings ({suggestedPairings.length})
              </h2>
              <div style={{ display: "flex", gap: 0, border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                {(["named", "generations"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSortMode(mode)}
                    style={{
                      padding: "6px 14px", fontSize: 12, fontFamily: "var(--font-lato)", fontWeight: 700,
                      border: "none", cursor: "pointer",
                      background: sortMode === mode ? "var(--teal-dark)" : "var(--white)",
                      color: sortMode === mode ? "white" : "var(--text-muted)",
                    }}
                  >
                    {mode === "named" ? "Named Ancestors" : "Generations"}
                  </button>
                ))}
              </div>
            </div>

            {suggestedPairings.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5" style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)" }}>
                <span>
                  Showing {(currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(currentPage * itemsPerPage, suggestedPairings.length)} of {suggestedPairings.length}
                </span>
                <div className="flex items-center gap-2">
                  <label htmlFor="itemsPerPage">Results per page:</label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                    style={{ ...inputStyle, width: "auto", padding: "6px 10px", fontSize: 12 }}
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>
            )}

            {suggestedPairings.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>
                No pairings match your criteria. Try adjusting your filters.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {paginatedPairings.map((p, index) => (
                  <div key={`${p.mare.id}-${p.stallion.id}`} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16, background: "var(--sand-bg)", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
                      <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)", margin: 0 }}>
                        <Link href={`/registry/${p.mare.id}`} style={{ color: "var(--dam-text)", textDecoration: "none" }}>{p.mare.name}</Link>
                        <span style={{ color: "var(--text-muted)" }}> × </span>
                        <Link href={`/registry/${p.stallion.id}`} style={{ color: "var(--sire-text)", textDecoration: "none" }}>{p.stallion.name}</Link>
                      </h3>
                      <span style={{
                        flexShrink: 0,
                        background: p.inbreedingCoefficient === 0 ? "var(--teal-muted)" : p.inbreedingCoefficient >= 0.125 ? "var(--inbreed-bg)" : "var(--cream)",
                        color: p.inbreedingCoefficient === 0 ? "var(--teal-dark)" : p.inbreedingCoefficient >= 0.125 ? "var(--inbreed-text)" : "var(--text-muted)",
                        border: `1px solid ${p.inbreedingCoefficient >= 0.125 ? "var(--inbreed-border)" : "var(--border)"}`,
                        borderRadius: 12, padding: "3px 10px", fontSize: 11, fontFamily: "var(--font-lato)", fontWeight: 700,
                      }}>
                        {p.inbreedingCoefficient === 0 ? "Outcross" : `COI ${(p.inbreedingCoefficient * 100).toFixed(1)}%`}
                      </span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--text)", fontFamily: "var(--font-lato)", listStyleType: "disc" }}>
                      {p.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                      {p.foalGenetics?.ok && p.foalGenetics.coats.length > 0 && (
                        <li>Interesting coat potential: {p.foalGenetics.coats.map(c => c.base).join(", ")}</li>
                      )}
                    </ul>
                    <div style={{ marginTop: 15, display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                      {(() => {
                        const key = `${p.mare.id}-${p.stallion.id}`;
                        const saved = savedKeys.has(key);
                        return (
                          <button
                            type="button"
                            onClick={() => savePair(p)}
                            disabled={saved || savingKey === key}
                            style={{
                              ...secondaryButtonStyle,
                              cursor: saved ? "default" : "pointer",
                              background: saved ? "var(--teal-muted)" : "var(--white)",
                              color: saved ? "var(--teal-dark)" : "var(--teal-dark)",
                              borderColor: saved ? "var(--teal-light)" : "var(--border)",
                            }}
                          >
                            {saved ? "✓ Saved to wishlist" : savingKey === key ? "Saving…" : "☆ Save pair"}
                          </button>
                        );
                      })()}
                      <Link href={`/admin/breeding?mareId=${p.mare.id}&stallionId=${p.stallion.id}`} style={secondaryButtonStyle}>
                         View Foal Pedigree
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
                <PageBtn disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                  ← Previous
                </PageBtn>
                {buildPageWindow(currentPage, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`gap-${i}`} className="px-2 text-sm" style={{ color: "var(--text-muted)" }}>…</span>
                  ) : (
                    <PageBtn key={p} active={p === currentPage} onClick={() => handlePageChange(p)}>
                      {p}
                    </PageBtn>
                  )
                )}
                <PageBtn disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                  Next →
                </PageBtn>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact pagination button (Tailwind).
function PageBtn({
  children, onClick, active, disabled,
}: { children: React.ReactNode; onClick?: () => void; active?: boolean; disabled?: boolean }) {
  const base =
    "min-w-[36px] h-9 px-3 text-sm rounded-md border transition-colors font-[var(--font-lato)] " +
    "inline-flex items-center justify-center";
  const state = disabled
    ? "opacity-40 cursor-not-allowed border-[var(--border)] bg-white text-[var(--text-muted)]"
    : active
    ? "border-[var(--teal)] bg-[var(--teal)] text-white cursor-default"
    : "border-[var(--border)] bg-white text-[var(--teal-dark)] hover:border-[var(--teal-light)] hover:bg-[var(--teal-muted)] cursor-pointer";
  return (
    <button type="button" onClick={disabled || active ? undefined : onClick} disabled={disabled} className={`${base} ${state}`}>
      {children}
    </button>
  );
}

/**
 * Build a capped page window: always shows first, last, current, and one
 * neighbour either side; collapses long runs with "…". Examples:
 *   3 of 50  →  [1, 2, 3, 4, …, 50]
 *  25 of 50  →  [1, …, 24, 25, 26, …, 50]
 *  48 of 50  →  [1, …, 47, 48, 49, 50]
 */
function buildPageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

/** Count ancestors (excluding the root foal itself) that are real named horses — not foundation/unknown placeholders. */
function countNamedAncestors(n: HorseNode | null | undefined, isRoot = true): number {
  if (!n) return 0;
  const selfCount = isRoot ? 0 : (isPlaceholder(n.name) ? 0 : 1);
  return selfCount + countNamedAncestors(n.sire, false) + countNamedAncestors(n.dam, false);
}

// Re-using the nodeDepth function from BreedingClient for consistency
function nodeDepth(n: HorseNode | null | undefined): number {
  if (!n) return 0;
  const s = n.sire ? 1 + nodeDepth(n.sire) : 0;
  const d = n.dam ? 1 + nodeDepth(n.dam) : 0;
  return Math.max(s, d);
}

/**
 * Returns true if every ancestor slot for `depth` generations is filled with a
 * real (non-placeholder, non-imported-stub) horse. depth=1 means just sire+dam,
 * depth=2 means grandparents, etc.
 */
function isPlaceholder(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n.startsWith("foundation") || n.startsWith("unknown");
}

/**
 * Returns true if every ancestor slot for `depth` generations is filled with a
 * real (non-placeholder) horse. depth=1 means just sire+dam present and real,
 * depth=2 means grandparents too, etc.
 */
function isFullPedigree(n: HorseNode | null | undefined, depth: number): boolean {
  if (depth <= 0) return true;
  if (!n || isPlaceholder(n.name)) return false;
  if (!n.sire || !n.dam) return false;
  if (isPlaceholder(n.sire.name) || isPlaceholder(n.dam.name)) return false;
  if (depth === 1) return true;
  return isFullPedigree(n.sire, depth - 1) && isFullPedigree(n.dam, depth - 1);
}

// Sidebar pill group for the Target Genotype filter.
function TargetGroup({
  title, options, selected, onToggle,
}: { title: string; options: { code: string; label: string }[]; selected: string[]; onToggle: (c: string) => void }) {
  return (
    <div className="mb-2">
      <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] font-semibold mb-1.5" style={{ fontFamily: "var(--font-lato)" }}>
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.code);
          return (
            <button
              key={o.code}
              type="button"
              onClick={() => onToggle(o.code)}
              title={o.label}
              className={
                "text-[11px] px-2.5 py-1 rounded-full border transition-colors " +
                (on
                  ? "bg-[var(--teal)] text-white border-[var(--teal)]"
                  : "bg-white text-[var(--teal-dark)] border-[var(--border)] hover:border-[var(--teal-light)]")
              }
              style={{ fontFamily: "var(--font-lato)" }}
            >
              {o.code}
            </button>
          );
        })}
      </div>
    </div>
  );
}