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

export type HorseMap = Map<string, {
  id: string;
  name: string;
  breed: string | null;
  gender: string | null;
  coat: string | null;
  sireName: string | null;
  damName: string | null;
}>;

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

  if (horse.sireName) {
    node.sire = buildPedigreeTree(horse.sireName, allHorses, maxDepth, depth + 1, nextSeen);
  }
  if (horse.damName) {
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
  if (horse.sireName) depth = Math.max(depth, 1 + pedigreeDepth(horse.sireName, allHorses, next));
  if (horse.damName) depth = Math.max(depth, 1 + pedigreeDepth(horse.damName, allHorses, next));
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
