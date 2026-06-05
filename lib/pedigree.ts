import { FullHorseData } from "@/lib/types";

export interface HorseNode {
  id: string;
  name: string;
  breed?: string | null;
  gender?: string | null;
  coat?: string | null;
  sire?: HorseNode | null;
  dam?: HorseNode | null;
  inbreeding?: boolean;
}

export type HorseMap = Map<string, FullHorseData>;

// Placeholder ancestor names that are NOT specific horses, so repeats of them
// across a pedigree do not count as inbreeding.
const PLACEHOLDER_NAMES = new Set(["unknown", "foundation"]);

export function isPlaceholderAncestor(name: string): boolean {
  return PLACEHOLDER_NAMES.has(name.trim().toLowerCase());
}

export function buildPedigreeTree(
  name: string,
  allHorses: HorseMap,
  maxDepth = 6,
  depth = 0,
  seen = new Set<string>()
): HorseNode | null {
  const horse = allHorses.get(name.toLowerCase());
  if (!horse) {
    return { id: name, name, breed: null, gender: null, coat: null };
  }

  const node: HorseNode = {
    id: horse.id,
    name: horse.name,
    breed: horse.breed,
    gender: horse.gender,
    coat: horse.coat,
  };

  if (depth >= maxDepth) return node;

  const key = horse.name.toLowerCase();
  if (seen.has(key) && !isPlaceholderAncestor(horse.name)) {
    node.inbreeding = true;
    return node;
  }

  const nextSeen = new Set(seen);
  nextSeen.add(key);

  // Unknown / Foundation ancestors are placeholders — leave that branch empty.
  if (horse.sireName && !isPlaceholderAncestor(horse.sireName)) {
    node.sire = buildPedigreeTree(horse.sireName, allHorses, maxDepth, depth + 1, nextSeen);
  }
  if (horse.damName && !isPlaceholderAncestor(horse.damName)) {
    node.dam = buildPedigreeTree(horse.damName, allHorses, maxDepth, depth + 1, nextSeen);
  }

  return node;
}

// How many generations of known ancestors exist above this horse.
export function pedigreeDepth(
  name: string,
  allHorses: HorseMap,
  seen = new Set<string>()
): number {
  const horse = allHorses.get(name.toLowerCase());
  if (!horse) return 0;
  const key = horse.name.toLowerCase();
  if (seen.has(key)) return 0;
  const next = new Set(seen);
  next.add(key);
  let depth = 0;
  if (horse.sireName && !isPlaceholderAncestor(horse.sireName)) depth = Math.max(depth, 1 + pedigreeDepth(horse.sireName, allHorses, next));
  if (horse.damName && !isPlaceholderAncestor(horse.damName)) depth = Math.max(depth, 1 + pedigreeDepth(horse.damName, allHorses, next));
  return depth;
}

export function getAllNames(node: HorseNode | null | undefined): string[] {
  if (!node) return [];
  return [node.name, ...getAllNames(node.sire), ...getAllNames(node.dam)];
}

export function findDuplicates(node: HorseNode | null | undefined): Set<string> {
  const names = getAllNames(node);
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const n of names) {
    const key = n.toLowerCase();
    if (isPlaceholderAncestor(n)) continue; // Unknown/Foundation aren't real ancestors
    if (seen.has(key)) dupes.add(key);
    seen.add(key);
  }
  return dupes;
}

/**
 * Ancestors that appear in BOTH the sire's and the dam's lineages — i.e. the
 * ancestors that actually make the foal inbred (vs. a parent's own inbreeding).
 */
export function commonAncestors(foal: HorseNode | null | undefined): Set<string> {
  if (!foal?.sire || !foal?.dam) return new Set();
  const names = (n: HorseNode | null | undefined) =>
    new Set(getAllNames(n).map((x) => x.toLowerCase()).filter((x) => !isPlaceholderAncestor(x)));
  const s = names(foal.sire);
  const d = names(foal.dam);
  const common = new Set<string>();
  for (const x of s) if (d.has(x)) common.add(x);
  return common;
}

/**
 * Wright's coefficient of inbreeding for a (potential) foal, from its sire & dam
 * subtrees. F = Σ over common ancestors, over all sire-path × dam-path pairs,
 * of (1/2)^(n1+n2+1). Ignores ancestors' own inbreeding (good estimate).
 * Returns 0–1 (multiply by 100 for a %).
 */
export function inbreedingCoefficient(foal: HorseNode | null | undefined): number {
  if (!foal?.sire || !foal?.dam) return 0;
  const collect = (node: HorseNode | null | undefined, depth: number, map: Map<string, number[]>) => {
    if (!node) return;
    if (!isPlaceholderAncestor(node.name)) {
      const key = node.name.toLowerCase();
      const arr = map.get(key);
      if (arr) arr.push(depth); else map.set(key, [depth]);
    }
    if (!node.inbreeding) {
      collect(node.sire, depth + 1, map);
      collect(node.dam, depth + 1, map);
    }
  };
  const sireA = new Map<string, number[]>();
  const damA = new Map<string, number[]>();
  collect(foal.sire, 0, sireA);
  collect(foal.dam, 0, damA);

  let F = 0;
  for (const [name, n1s] of sireA) {
    const n2s = damA.get(name);
    if (!n2s) continue;
    for (const n1 of n1s) for (const n2 of n2s) F += Math.pow(0.5, n1 + n2 + 1);
  }
  return Math.min(F, 1);
}
