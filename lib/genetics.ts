/**
 * The Rift coat genetics — predicts a foal's possible coats from two parents.
 * Rules from the user's gene logic; coat names from the Coat Catalogue (Azelas).
 *
 * Genotype codes look like "B_CR_Z_TO": base _ dilutions _ pattern.
 *   base:      R (red/chestnut), B (bay), BL (black)
 *   dilutions: CH CR CR2 Z M P G DW FLX
 *   pattern:   one of BK BR D FSP LP O RB RN SB SF SW TO TOV ZB
 */

export const DILUTIONS = ["CH", "CR", "CR2", "Z", "M", "P", "G", "DW", "FLX"] as const;
export const PATTERNS: Record<string, string> = {
  BK: "Blanket", BR: "Brindle", D: "Dun", FSP: "Few Spotted", LP: "Leopard",
  O: "Overo", RB: "Rabicano", RN: "Roan", SB: "Sabino", SF: "Snowflake",
  SW: "Splashed", TO: "Tobiano", TOV: "Tovero", ZB: "Zebra",
};
const PATTERN_SET = new Set(Object.keys(PATTERNS));
const DILUTION_SET = new Set(DILUTIONS as readonly string[]);

// normalized "base|sorted-dilutions" -> { coat name, canonical gene code }
const BASE_COATS: Record<string, { name: string; code: string }> = {
  "R": { name: "Chestnut", code: "R" }, "B": { name: "Bay", code: "B" }, "BL": { name: "Black", code: "BL" },
  // Bay dilutions
  "B|CH": { name: "Amber Champagne", code: "B_CH" }, "B|CR": { name: "Buckskin", code: "B_CR" },
  "B|CH,CR": { name: "Amber Cream Champagne", code: "B_CR_CH" }, "B|CR,Z": { name: "Silver Buckskin", code: "B_CR_Z" },
  "B|CR2": { name: "Perlino", code: "B_CR2" }, "B|M": { name: "Bay Mushroom", code: "B_M" },
  "B|P": { name: "Bay Pangare", code: "B_P" }, "B|Z": { name: "Silver Bay", code: "B_Z" },
  // Black dilutions
  "BL|CH": { name: "Classic Champagne", code: "BL_CH" }, "BL|CR": { name: "Smoky Black", code: "BL_CR" },
  "BL|CH,CR": { name: "Classic Cream Champagne", code: "BL_CR_CH" }, "BL|CR,Z": { name: "Silver Smoky Black", code: "BL_CR_Z" },
  "BL|CR2": { name: "Smoky Cream", code: "BL_CR2" }, "BL|DW": { name: "Dominant White", code: "BL_DW" },
  "BL|G": { name: "Grey", code: "BL_G" }, "BL|Z": { name: "Silver Black", code: "BL_Z" },
  // Red dilutions
  "R|CH": { name: "Gold Champagne", code: "R_CH" }, "R|CH,CR": { name: "Gold Cream Champagne", code: "R_CR_CH" },
  "R|CR": { name: "Palomino", code: "R_CR" }, "R|CR2": { name: "Cremello", code: "R_CR2" },
  "R|FLX": { name: "Flaxen Chestnut", code: "R_FLX" }, "R|G": { name: "Rose Grey", code: "R_G" },
  "R|M": { name: "Red Mushroom", code: "R_M" }, "R|P": { name: "Chestnut Pangare", code: "R_P" },
};

export interface Genotype {
  base: "R" | "B" | "BL" | null;
  dilutions: string[];
  pattern: string | null;
  raw: string;
}

/** Extract a gene code from a coat string ("Bay Overo (B_O)" -> "B_O") or raw code. */
export function extractGeneCode(coat?: string | null, genotype?: string | null): string | null {
  if (genotype && /[A-Z]/.test(genotype) && /_|^(R|B|BL)$/.test(genotype)) return genotype.trim();
  if (!coat) return null;
  const m = coat.match(/\(([^)]+)\)/);
  return m ? m[1].trim() : null;
}

export function parseGenotype(code: string | null): Genotype | null {
  if (!code) return null;
  const tokens = code.toUpperCase().split(/[_\s]+/).filter(Boolean);
  if (!tokens.length) return null;
  const base = (["R", "B", "BL"].includes(tokens[0]) ? tokens[0] : null) as Genotype["base"];
  const dilutions: string[] = [];
  let pattern: string | null = null;
  for (const t of tokens.slice(base ? 1 : 0)) {
    if (DILUTION_SET.has(t)) dilutions.push(t);
    else if (PATTERN_SET.has(t)) pattern = pattern ?? t;
  }
  return { base, dilutions, pattern, raw: code };
}

// Base-colour inheritance (set of possible foal bases), symmetric.
function possibleBases(a: "R" | "B" | "BL", b: "R" | "B" | "BL"): Array<"R" | "B" | "BL"> {
  const pair = [a, b].sort().join("");
  // RR -> R; BLBL -> R,BL; everything else with bay or mixed -> R,BL,B
  if (pair === "RR") return ["R"];
  if (pair === "BLBL") return ["R", "BL"];
  return ["R", "B", "BL"];
}

export interface FoalPrediction {
  ok: boolean;
  reason?: string;
  bases: Array<"R" | "B" | "BL">;
  creamCopies: number[];        // possible cream copies 0/1/2
  modifiers: { code: string; label: string }[];   // dilutions/modifiers the foal MAY inherit
  patterns: string[];           // possible patterns (codes); always includes "" (none) implicitly
  coats: { base: string; items: { name: string; code: string }[] }[]; // possible coats grouped by base colour
}

const BASE_LABEL: Record<string, string> = { R: "Red / Chestnut", B: "Bay", BL: "Black" };

export function predictFoal(sireCode: string | null, damCode: string | null): FoalPrediction {
  const sire = parseGenotype(sireCode);
  const dam = parseGenotype(damCode);
  const empty: FoalPrediction = { ok: false, bases: [], creamCopies: [], modifiers: [], patterns: [], coats: [] };

  if (!sire?.base || !dam?.base) {
    return { ...empty, reason: "Both parents need a base colour in their coat code (e.g. B, BL, R) to predict a foal." };
  }

  const bases = possibleBases(sire.base, dam.base);

  // --- Cream: CR2 always passes a copy, CR may pass, none passes nothing ---
  const creamPass = (g: Genotype): number[] =>
    g.dilutions.includes("CR2") ? [1] : g.dilutions.includes("CR") ? [0, 1] : [0];
  const creamCopies = new Set<number>();
  for (const s of creamPass(sire)) for (const d of creamPass(dam)) creamCopies.add(s + d);

  // --- Other modifiers: "may inherit" if a parent carries it (with base restrictions) ---
  const has = (code: string, restrict?: (g: Genotype) => boolean) =>
    (sire.dilutions.includes(code) && (!restrict || restrict(sire))) ||
    (dam.dilutions.includes(code) && (!restrict || restrict(dam)));

  const isBlackBased = (g: Genotype) => g.base === "B" || g.base === "BL";
  const isRed = (g: Genotype) => g.base === "R";

  const canZ = has("Z", isBlackBased);   // silver only passed by black/bay
  const canFLX = has("FLX", isRed);       // flaxen only passed by red
  const canCH = has("CH");
  const canP = has("P");
  const canM = has("M");
  const canG = has("G");
  const canDW = has("DW");

  const modifiers: { code: string; label: string }[] = [];
  if (creamCopies.has(1) || creamCopies.has(2)) modifiers.push({ code: "CR", label: creamCopies.has(2) ? "Cream (single or double)" : "Cream (single)" });
  if (canZ) modifiers.push({ code: "Z", label: "Silver (on black/bay)" });
  if (canCH) modifiers.push({ code: "CH", label: "Champagne" });
  if (canG) modifiers.push({ code: "G", label: "Grey" });
  if (canDW) modifiers.push({ code: "DW", label: "Dominant White" });
  if (canP) modifiers.push({ code: "P", label: "Pangare" });
  if (canM) modifiers.push({ code: "M", label: "Mushroom" });
  if (canFLX) modifiers.push({ code: "FLX", label: "Flaxen (on red)" });

  const canInherit: Record<string, boolean> = {
    Z: canZ, CH: canCH, P: canP, M: canM, G: canG, DW: canDW, FLX: canFLX,
  };

  // --- Patterns: foal may inherit sire's, dam's, or none (one max) ---
  const patternSet = new Set<string>();
  if (sire.pattern) patternSet.add(sire.pattern);
  if (dam.pattern) patternSet.add(dam.pattern);
  const patternOptions: (string | null)[] = [null, ...patternSet];

  // --- Enumerate every catalogued base coat that is reachable ---
  const coatsByBase: Record<string, Map<string, string>> = {}; // code -> name
  for (const [key, { name, code }] of Object.entries(BASE_COATS)) {
    const [b, dilStr] = key.split("|");
    if (!bases.includes(b as "R" | "B" | "BL")) continue;
    const dils = dilStr ? dilStr.split(",") : [];

    let feasible = true;
    let needCream = 0;
    for (const d of dils) {
      if (d === "CR2") needCream = 2;
      else if (d === "CR") needCream = Math.max(needCream, 1);
      else if (!canInherit[d]) { feasible = false; break; }
    }
    if (!feasible) continue;
    if (!creamCopies.has(needCream)) continue;   // 0 means undiluted must be possible

    (coatsByBase[b] ??= new Map());
    for (const p of patternOptions) {
      const fullName = p ? `${name} ${PATTERNS[p]}` : name;
      const fullCode = p ? `${code}_${p}` : code;
      coatsByBase[b].set(fullCode, fullName);
    }
  }

  const coats = bases
    .filter((b) => coatsByBase[b]?.size)
    .map((b) => ({
      base: BASE_LABEL[b],
      items: [...coatsByBase[b].entries()]
        .map(([code, name]) => ({ name, code }))
        .sort((a, z) => a.name.localeCompare(z.name)),
    }));

  return {
    ok: true,
    bases,
    creamCopies: [...creamCopies].sort(),
    modifiers,
    patterns: [...patternSet],
    coats,
  };
}
