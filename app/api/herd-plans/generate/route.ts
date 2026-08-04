import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { pedigreeDepth } from "@/lib/pedigree";
import type { HorseMap } from "@/lib/pedigree";
import { generatePlanTree } from "@/lib/breedingPlanner";
import type { PlanGoal } from "@/lib/breedingPlanner";
import type { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, goal } = (await req.json()) as { planId: string; goal: PlanGoal };

  const plan = await prisma.herdPlan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allHorses = await prisma.horse.findMany({
    where: { isImportedPlaceholder: false },
    select: {
      id: true, name: true, breed: true, gender: true, coat: true, genotype: true,
      sireName: true, damName: true, ownership: true, isImportedPlaceholder: true,
      availableForBreeding: true, lastBredDateTime: true,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const horseMap: HorseMap = new Map(allHorses.map(h => [h.name.toLowerCase(), h as any]));
  const depthMemo = new Map<string, number>();

  const horses = allHorses.map(h => ({
    id: h.id,
    name: h.name,
    breed: h.breed,
    gender: h.gender,
    coat: h.coat,
    genotype: h.genotype,
    availableForBreeding: h.availableForBreeding,
    lastBredDateTime: h.lastBredDateTime?.toISOString() ?? null,
    generations: pedigreeDepth(h.name, horseMap, new Set(), depthMemo),
  }));

  const tree = generatePlanTree(goal, horses);

  await prisma.herdPlan.update({
    where: { id: planId },
    data: {
      tree: tree as unknown as Prisma.InputJsonValue,
      goal: goal as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ tree });
}
