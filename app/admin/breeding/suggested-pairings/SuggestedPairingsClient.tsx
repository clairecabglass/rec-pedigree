"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { buildPedigreeTree, inbreedingCoefficient, commonAncestors } from "@/lib/pedigree";
import type { HorseMap, HorseNode } from "@/lib/pedigree";
import { predictFoal, extractGeneCode, PATTERNS as PATTERN_LABEL } from "@/lib/genetics";

import { FullHorseData } from "@/lib/types";

interface Pairing {
  mare: FullHorseData;
  stallion: FullHorseData;
  foal: HorseNode;
  pedigreeDepth: number;
  inbreedingCoefficient: number;
  sharedAncestors: number;
  isPurebredCross: boolean; // true if both parents same breed, false if different
  foalGenetics: ReturnType<typeof predictFoal> | null;
  reasons: string[];
}

export default function SuggestedPairingsClient({ horses }: { horses: FullHorseData[] }) {
  const router = useRouter();

  // Filter states
  const [minGenerations, setMinGenerations] = useState(3);
  const [requirePurebred, setRequirePurebred] = useState<boolean | null>(null); // null = any, true = purebred, false = cross
  const [maxInbreeding, setMaxInbreeding] = useState(0.125); // 0.125 = 12.5%
  const [selectedBreed, setSelectedBreed] = useState<string | null>(null);
  const [ownedHorsesOnly, setOwnedHorsesOnly] = useState(false);
  const [knownParentsOnly, setKnownParentsOnly] = useState(false);

  // Memoized data
  const mares = useMemo(() => horses.filter(h => h.gender === "Mare"), [horses]);
  const stallions = useMemo(() => horses.filter(h => h.gender === "Stallion"), [horses]);
  const horseMap: HorseMap = useMemo(
    () => new Map(horses.map((h) => [h.name.toLowerCase(), {
      id: h.id, name: h.name, breed: h.breed, gender: h.gender,
      coat: h.coat, genotype: h.genotype, sireName: h.sireName, damName: h.damName,
      ownership: h.ownership, isImportedPlaceholder: h.isImportedPlaceholder,
    }])),
    [horses]
  );
  const breeds = useMemo(() => Array.from(new Set(horses.map(h => h.breed).filter(Boolean))) as string[], [horses]);


  const suggestedPairings = useMemo(() => {
    const pairings: Pairing[] = [];

    // Optimize: Filter mares and stallions once based on ownedHorsesOnly and knownParentsOnly
    const filteredMares = ownedHorsesOnly ? mares.filter(m => m.ownership === "Home") : mares;
    const filteredStallions = ownedHorsesOnly ? stallions.filter(s => s.ownership === "Home") : stallions;

    // Further filter by breed if selected
    const breedFilteredMares = selectedBreed ? filteredMares.filter(m => m.breed === selectedBreed) : filteredMares;
    const breedFilteredStallions = selectedBreed ? filteredStallions.filter(s => s.breed === selectedBreed) : filteredStallions;

    // Only iterate if there are enough potential parents
    if (breedFilteredMares.length === 0 || breedFilteredStallions.length === 0) {
      return pairings;
    }

    // Iterate through all possible mare-stallion pairs
    for (const mare of breedFilteredMares) {
      for (const stallion of breedFilteredStallions) {
        if (mare.id === stallion.id) continue; // Cannot pair a horse with itself

        const reasons: string[] = [];

        // Check for known parents only if filter is active
        if (knownParentsOnly && (!mare.sireName || !mare.damName || !stallion.sireName || !stallion.damName)) {
          continue; // Skip pairing if either mare or stallion has unknown parents
        }

        // Build potential foal pedigree (up to max generations for inbreeding calc)
        const foal: HorseNode = {
          id: "foal", name: "Potential Foal", breed: null, gender: null, coat: null,
          sire: buildPedigreeTree(stallion.name, horseMap, 6), // Max 6 generations for pedigree calculations
          dam: buildPedigreeTree(mare.name, horseMap, 6),
        };

        const pedigreeDepth = foal ? nodeDepth(foal) : 0;
        const coi = foal ? inbreedingCoefficient(foal) : 0;
        const sharedAncestors = commonAncestors(foal).size;
        const isPurebredCross = mare.breed === stallion.breed;
        const foalGenetics = predictFoal(
            extractGeneCode(stallion.coat, stallion.genotype),
            extractGeneCode(mare.coat, mare.genotype),
        );

        // Apply filters
        if (pedigreeDepth < minGenerations) continue;
        reasons.push(`Pedigree depth: ${pedigreeDepth} generations (meets minimum of ${minGenerations})`);

        if (requirePurebred !== null) {
          if (requirePurebred && !isPurebredCross) continue;
          if (!requirePurebred && isPurebredCross) continue;
          reasons.push(requirePurebred ? "Purebred pairing" : "Cross-breed pairing");
        }

        if (coi > maxInbreeding) continue;
        reasons.push(`Inbreeding CoI: ${(coi * 100).toFixed(1)}% (below maximum of ${(maxInbreeding * 100).toFixed(1)}%)`);
        if (coi === 0) reasons.push("Outcross - no shared ancestors");
        else if (sharedAncestors > 0) reasons.push(`${sharedAncestors} shared ancestors`);


        // If all filters pass, add the pairing
        pairings.push({
          mare, stallion, foal, pedigreeDepth, inbreedingCoefficient: coi, sharedAncestors, isPurebredCross, foalGenetics, reasons,
        });
      }
    }
    return pairings.sort((a, b) => a.inbreedingCoefficient - b.inbreedingCoefficient || b.pedigreeDepth - a.pedigreeDepth); // Sort by COI then depth
  }, [horses, minGenerations, requirePurebred, maxInbreeding, selectedBreed, ownedHorsesOnly, knownParentsOnly, mares, stallions, horseMap]);


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
              <input type="number" min="1" max="6" value={minGenerations} onChange={(e) => setMinGenerations(parseInt(e.target.value))} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Inbreeding Coefficient (Max %)</label>
              <input type="range" min="0" max="25" step="0.5" value={maxInbreeding * 100} onChange={(e) => setMaxInbreeding(parseFloat(e.target.value) / 100)} style={{ width: "100%" }} />
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{(maxInbreeding * 100).toFixed(1)}%</span>
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

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="ownedOnly" checked={ownedHorsesOnly} onChange={(e) => setOwnedHorsesOnly(e.target.checked)} />
              <label htmlFor="ownedOnly" style={{ ...labelStyle, marginBottom: 0 }}>Owned Horses Only ("Home" Ownership)</label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="knownParentsOnly" checked={knownParentsOnly} onChange={(e) => setKnownParentsOnly(e.target.checked)} />
              <label htmlFor="knownParentsOnly" style={{ ...labelStyle, marginBottom: 0 }}>Known Parents Only (Sire/Dam Names Present)</label>
            </div>

          </div>
        </div>

        <div className="md:col-span-3">
          <div style={cardStyle}>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 16 }}>
              Suggested Pairings ({suggestedPairings.length})
            </h2>
            {suggestedPairings.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>
                No pairings match your criteria. Try adjusting your filters.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {suggestedPairings.map((p, index) => (
                  <div key={`${p.mare.id}-${p.stallion.id}`} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16, background: "var(--cream-dark)", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)" }}>
                        <Link href={`/registry/${p.mare.id}`} style={{ color: "var(--dam-text)", textDecoration: "none" }}>{p.mare.name}</Link>
                        <span style={{ color: "var(--text-muted)" }}> × </span>
                        <Link href={`/registry/${p.stallion.id}`} style={{ color: "var(--sire-text)", textDecoration: "none" }}>{p.stallion.name}</Link>
                      </h3>
                      {p.inbreedingCoefficient === 0 && (
                        <span style={{ background: "var(--teal-muted)", color: "var(--teal-dark)", borderRadius: 12, padding: "2px 8px", fontSize: 11, fontFamily: "var(--font-lato)", fontWeight: 600 }}>Outcross</span>
                      )}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--text)", fontFamily: "var(--font-lato)", listStyleType: "disc" }}>
                      {p.reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                      {p.foalGenetics?.ok && p.foalGenetics.coats.length > 0 && (
                        <li>Interesting coat potential: {p.foalGenetics.coats.map(c => c.base).join(", ")}</li>
                      )}
                    </ul>
                    <div style={{ marginTop: 15, display: "flex", justifyContent: "flex-end" }}>
                      <Link href={`/admin/breeding?mareId=${p.mare.id}&stallionId=${p.stallion.id}`} style={secondaryButtonStyle}>
                         View Foal Pedigree
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-using the nodeDepth function from BreedingClient for consistency
function nodeDepth(n: HorseNode | null | undefined): number {
  if (!n) return 0;
  const s = n.sire ? 1 + nodeDepth(n.sire) : 0;
  const d = n.dam ? 1 + nodeDepth(n.dam) : 0;
  return Math.max(s, d);
}
