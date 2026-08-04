import { isAdminLoggedIn } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildPedigreeTree, pedigreeDepth, mergeJsonTree } from "@/lib/pedigree";
import type { HorseMap } from "@/lib/pedigree";
import PlannerClient from "./PlannerClient";

export const dynamic = "force-dynamic";

export default async function PlannerEditorPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");
  const { id } = await params;

  const plan = await prisma.herdPlan.findUnique({ where: { id } });
  if (!plan) notFound();

  // All horses for the picker + COI calculation
  const allHorses = await prisma.horse.findMany({
    where: { isImportedPlaceholder: false },
    select: {
      id: true, name: true, breed: true, gender: true, coat: true, genotype: true,
      sireName: true, damName: true, ownership: true, isImportedPlaceholder: true,
      availableForBreeding: true, lastBredDateTime: true,
    },
    orderBy: { name: "asc" },
  });

  const horseMap: HorseMap = new Map(allHorses.map((h) => [h.name.toLowerCase(), h]));
  const depthMemo = new Map<string, number>();

  const horses = allHorses.map((h) => {
    const dbTree  = buildPedigreeTree(h.name, horseMap, 12);
    const fullTree = mergeJsonTree(dbTree, null);
    return {
      id: h.id,
      name: h.name,
      breed: h.breed,
      gender: h.gender,
      coat: h.coat,
      genotype: h.genotype,
      sireName: h.sireName,
      damName: h.damName,
      ownership: h.ownership,
      availableForBreeding: h.availableForBreeding,
      lastBredDateTime: h.lastBredDateTime?.toISOString() ?? null,
      generations: pedigreeDepth(h.name, horseMap, new Set(), depthMemo),
      // Serialise the pedigree tree for COI calculations in the client
      tree: JSON.stringify(fullTree),
    };
  });

  return (
    <PlannerClient
      planId={plan.id}
      initialTitle={plan.title}
      initialStatus={plan.status}
      initialGoal={plan.goal as Record<string, unknown>}
      initialTree={(plan.tree ?? null) as Record<string, unknown> | null}
      initialNotes={plan.notes ?? ""}
      horses={horses}
    />
  );
}
