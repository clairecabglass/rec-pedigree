import { FullHorseData } from "@/lib/types";

export interface HorseNode {
  id: string;
  name: string;
  breed?: string | null;
  gender?: string | null;
  coat?: string | null;
  genotype?: string | null;
  sire?: HorseNode | null;
  dam?: HorseNode | null;
  inbreeding?: boolean;
}

export type HorseMap = Map<string, FullHorseData>;

// Placeholder ancestor names that are NOT specific horses, so repeats of them
// across a pedigree do not count as inbreeding.
export function isPlaceholderAncestor(name: string): boolean {
  const n = name.trim().toLowerCase();
  return n.startsWith("foundation") || n.startsWith("unknown");
}

/**
 * Returns a copy of the tree with every Foundation/Unknown leaf (and any node
 * whose name matches isPlaceholderAncestor) replaced by null, so those boxes
 * are omitted from the rendered pedigree entirely.
 */
export function pruneFoundationNodes(node: HorseNode | null | undefined): HorseNode | null {
  if (!node) return null;
  if (isPlaceholderAncestor(node.name)) return null;
  return {
    ...node,
    sire: pruneFoundationNodes(node.sire),
    dam: pruneFoundationNodes(node.dam),
  };
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
    genotype: horse.genotype,
  };

  if (depth >= maxDepth) return node;

  const key = horse.name.toLowerCase();

  if (seen.has(key) && !isPlaceholderAncestor(horse.name)) {
    // This ancestor is inbred (appears more than once in the pedigree).
    // We still populate its parents so the tree renders the full lineage for
    // every occurrence. We pass `seen` (not nextSeen) to the children:
    // since this horse is already in `seen`, any true cycle back to it on
    // this path is caught immediately in the child call.
    node.inbreeding = true;
    if (depth < maxDepth) {
      if (horse.sireName && !isPlaceholderAncestor(horse.sireName)) {
        node.sire = buildPedigreeTree(horse.sireName, allHorses, maxDepth, depth + 1, seen);
      }
      if (horse.damName && !isPlaceholderAncestor(horse.damName)) {
        node.dam = buildPedigreeTree(horse.damName, allHorses, maxDepth, depth + 1, seen);
      }
    }
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
// Pass a shared `memo` map when computing depth for many horses (e.g. the
// registry page) so ancestor sub-trees are only traversed once.
export function pedigreeDepth(
  name: string,
  allHorses: HorseMap,
  seen = new Set<string>(),
  memo = new Map<string, number>()
): number {
  const horse = allHorses.get(name.toLowerCase());
  if (!horse) return 0;
  const key = horse.name.toLowerCase();
  if (seen.has(key)) return 0;
  if (memo.has(key)) return memo.get(key)!;
  const next = new Set(seen);
  next.add(key);
  let depth = 0;
  if (horse.sireName && !isPlaceholderAncestor(horse.sireName)) depth = Math.max(depth, 1 + pedigreeDepth(horse.sireName, allHorses, next, memo));
  if (horse.damName && !isPlaceholderAncestor(horse.damName)) depth = Math.max(depth, 1 + pedigreeDepth(horse.damName, allHorses, next, memo));
  memo.set(key, depth);
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
