/**
 * Split a packed coat string like "Black Tovero (BL_TOV)" into a clean
 * presentation name and a genotype code, so summary cards and tables can
 * render just the human-readable bit without losing access to the genetics
 * code when something else needs it.
 *
 * Examples:
 *   parseHorseCoat("Black Tovero (BL_TOV)") → { cleanName: "Black Tovero", genotype: "BL_TOV" }
 *   parseHorseCoat("Chestnut")              → { cleanName: "Chestnut",     genotype: null }
 *   parseHorseCoat(null)                    → { cleanName: "",             genotype: null }
 *   parseHorseCoat("  (B_O)")              → { cleanName: "",             genotype: "B_O" }
 */
export interface ParsedCoat {
  cleanName: string;
  genotype: string | null;
}

export function parseHorseCoat(coat?: string | null): ParsedCoat {
  if (!coat) return { cleanName: "", genotype: null };

  // Match "(...)" at the END of the string. We anchor on the last paren so
  // a name with parens elsewhere (uncommon but possible) doesn't trip us up.
  const trailing = coat.match(/\s*\(([^)]+)\)\s*$/);
  if (!trailing) return { cleanName: coat.trim(), genotype: null };

  const genotype = trailing[1].trim() || null;
  const cleanName = coat.slice(0, trailing.index).trim();
  return { cleanName, genotype };
}
