/* ─────────────────────────── Shared types ─────────────────────────── */

export type NodeType   = "existing" | "planned" | "stud" | "acquire";
export type NodeStatus = "planned" | "secured" | "in_progress" | "born" | "acquired";

export interface PlanNode {
  nodeId:    string;
  type:      NodeType;
  horseId?:  string | null;
  horseName?: string | null;
  horseBreed?: string | null;
  horseCoat?:  string | null;
  horseGenotype?: string | null;
  horseGender?:   string | null;
  horseGenerations?: number | null;
  targetBreed?:   string | null;
  targetCoat?:    string | null;
  targetGenotype?: string | null;
  targetGender?:  string | null;
  minGenerations?: number | null;
  status:         NodeStatus;
  acquisitionNotes?: string | null;
  unrealistic?:   boolean;
  notes?: string | null;
  generation: number;
  sire?: PlanNode | null;
  dam?:  PlanNode | null;
}

export interface HorsePlanner {
  id: string;
  name: string;
  breed: string | null;
  gender: string | null;
  coat: string | null;
  genotype: string | null;
  availableForBreeding: boolean;
  lastBredDateTime: string | null;
  generations: number;
}

export interface PlanGoal {
  breed?:      string | null;
  targetGen?:  number | null;
  coiCeiling?: number | null;
  discipline?: string | null;
  notes?:      string | null;
}

/* ─────────────────────────── Generation algorithm ─────────────────────────── */

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function findBest(
  candidates: HorsePlanner[],
  neededGen: number,
  excludeIds: Set<string>,
): HorsePlanner | null {
  // 1. Best fit: gen exactly meets requirement, prefer available
  const eligible = candidates.filter(h => !excludeIds.has(h.id) && h.generations >= neededGen);

  if (eligible.length > 0) {
    // Sort: available first, then lowest gen that still meets requirement (save high-gen for closer positions)
    eligible.sort((a, b) => {
      if (a.availableForBreeding !== b.availableForBreeding) return a.availableForBreeding ? -1 : 1;
      return a.generations - b.generations;
    });
    return eligible[0];
  }

  // 2. Fallback for very low gen requirements: take any available horse
  if (neededGen <= 1) {
    const any = candidates.find(h => !excludeIds.has(h.id));
    return any ?? null;
  }

  return null;
}

function fillBranch(
  node: PlanNode,
  depth: number,
  targetGen: number,
  stallions: HorsePlanner[],
  mares: HorsePlanner[],
  usedMareIds: Set<string>,
): void {
  if (depth >= targetGen) return; // at max plan depth

  const neededParentGen = Math.max(0, targetGen - depth - 1);

  // ── SIRE ──
  // Stallions can cover multiple mares so we don't lock them
  const sire = findBest(stallions, neededParentGen, new Set<string>());
  if (sire) {
    node.sire = {
      nodeId: uid(),
      type: "existing",
      status: sire.availableForBreeding ? "secured" : "planned",
      generation: depth + 1,
      horseId: sire.id,
      horseName: sire.name,
      horseBreed: sire.breed,
      horseGender: sire.gender,
      horseCoat: sire.coat,
      horseGenotype: sire.genotype,
      horseGenerations: sire.generations,
    };
  } else {
    const isHard = neededParentGen > 6;
    node.sire = {
      nodeId: uid(),
      type: isHard ? "stud" : "planned",
      status: "planned",
      generation: depth + 1,
      targetBreed: node.targetBreed ?? null,
      targetGender: "Stallion",
      minGenerations: neededParentGen > 0 ? neededParentGen : null,
      unrealistic: isHard,
      notes: isHard ? `Need ${neededParentGen}+ gen stallion — arrange outside stud cover` : null,
    };
    if (!isHard && neededParentGen > 0) {
      fillBranch(node.sire, depth + 1, targetGen, stallions, mares, usedMareIds);
    }
  }

  // ── DAM ──
  const dam = findBest(mares, neededParentGen, usedMareIds);
  if (dam) {
    node.dam = {
      nodeId: uid(),
      type: "existing",
      status: dam.availableForBreeding ? "secured" : "planned",
      generation: depth + 1,
      horseId: dam.id,
      horseName: dam.name,
      horseBreed: dam.breed,
      horseGender: dam.gender,
      horseCoat: dam.coat,
      horseGenotype: dam.genotype,
      horseGenerations: dam.generations,
    };
    usedMareIds.add(dam.id);
  } else {
    const isHard = neededParentGen > 6;
    node.dam = {
      nodeId: uid(),
      type: isHard ? "acquire" : "planned",
      status: "planned",
      generation: depth + 1,
      targetBreed: node.targetBreed ?? null,
      targetGender: "Mare",
      minGenerations: neededParentGen > 0 ? neededParentGen : null,
      unrealistic: isHard,
      notes: isHard ? `Need ${neededParentGen}+ gen mare — rare from other players` : null,
    };
    if (!isHard && neededParentGen > 0) {
      fillBranch(node.dam, depth + 1, targetGen, stallions, mares, usedMareIds);
    }
  }
}

export function generatePlanTree(goal: PlanGoal, horses: HorsePlanner[]): PlanNode {
  const targetGen  = Math.max(1, goal.targetGen ?? 8);
  const breedFilter = goal.breed?.toLowerCase().trim() ?? null;

  let pool = breedFilter
    ? horses.filter(h => h.breed?.toLowerCase().includes(breedFilter))
    : horses;

  // Fall back to all horses if the breed filter leaves too few
  if (pool.length < 3) pool = horses;

  const stallions = [...pool]
    .filter(h => h.gender === "Stallion" || h.gender === "Gelding")
    .sort((a, b) => b.generations - a.generations);

  const mares = [...pool]
    .filter(h => h.gender === "Mare")
    .sort((a, b) => b.generations - a.generations);

  const root: PlanNode = {
    nodeId: uid(),
    type: "planned",
    status: "planned",
    generation: 0,
    targetBreed: goal.breed ?? null,
  };

  fillBranch(root, 0, targetGen, stallions, mares, new Set<string>());

  return root;
}

/* ─────────────────────────── Step extraction ─────────────────────────── */

export interface BreedingStep {
  stepNum: number;    // set after sorting
  path:    string[];
  node:    PlanNode;
  role:    string;
  sire:    PlanNode | null;
  dam:     PlanNode | null;
}

export function formatRole(path: string[]): string {
  if (path.length === 0) return "Goal horse";
  return "Goal's " + path.map(s => s === "sire" ? "Sire" : "Dam").join("'s ").toLowerCase();
}

function collectSteps(node: PlanNode | null, path: string[], out: BreedingStep[]): void {
  if (!node) return;
  // Post-order: children first → deepest (earliest) steps appear first
  collectSteps(node.sire ?? null, [...path, "sire"], out);
  collectSteps(node.dam  ?? null, [...path, "dam"],  out);

  if (node.type === "planned" && (node.sire || node.dam)) {
    out.push({
      stepNum: 0,
      path,
      node,
      role: formatRole(path),
      sire: node.sire ?? null,
      dam:  node.dam  ?? null,
    });
  }
}

export function extractBreedingSteps(root: PlanNode | null): BreedingStep[] {
  const steps: BreedingStep[] = [];
  collectSteps(root, [], steps);
  return steps.map((s, i) => ({ ...s, stepNum: i + 1 }));
}

/* ─────────────────────────── Genotype probability ─────────────────────────── */

function parseLoci(geno: string): Map<string, [string, string]> {
  const result = new Map<string, [string, string]>();
  const parts = geno.trim().split(/\s+/);
  for (const part of parts) {
    if (part.length === 2 && /^[A-Za-z]{2}$/.test(part)) {
      const gene = part[0].toUpperCase();
      result.set(gene, [part[0], part[1]]);
    }
  }
  return result;
}

function sortAlleles(a: string, b: string): string {
  const aU = a === a.toUpperCase();
  const bU = b === b.toUpperCase();
  if (a.toUpperCase() < b.toUpperCase()) return a + b;
  if (a.toUpperCase() > b.toUpperCase()) return b + a;
  return aU ? a + b : b + a;
}

export interface LocusCross {
  gene:   string;
  combos: { geno: string; pct: number }[];
}

export function crossGenotypes(g1: string | null, g2: string | null): LocusCross[] | null {
  if (!g1 || !g2) return null;
  const loci1 = parseLoci(g1);
  const loci2 = parseLoci(g2);
  if (loci1.size === 0 || loci2.size === 0) return null;

  const results: LocusCross[] = [];
  for (const [gene, a1] of loci1) {
    const a2 = loci2.get(gene);
    if (!a2) continue;
    const counts = new Map<string, number>();
    for (const x of a1) for (const y of a2) {
      const k = sortAlleles(x, y);
      counts.set(k, (counts.get(k) ?? 0) + 25);
    }
    results.push({
      gene,
      combos: Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([geno, pct]) => ({ geno, pct })),
    });
  }
  return results.length > 0 ? results : null;
}
