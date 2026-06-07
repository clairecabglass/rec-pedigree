import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import BreedingClient from "./BreedingClient";
import { computeFoalStage } from "@/lib/foalGrowth";

export const dynamic = "force-dynamic";

export default async function BreedingPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  // === Auto-advance any foals that have grown into adults ===
  // The 4-phase growth tracker is "real-time": every page load sweeps the
  // expecting pregnancies and promotes the ones at ≥144 h post-breeding.
  // Cheap, idempotent, and keeps the breeding menu free of stale rows.
  {
    const expecting = await prisma.pregnancy.findMany({ where: { status: "expecting" } });
    for (const p of expecting) {
      const stage = computeFoalStage(p.coverDate);
      if (!stage?.isAdult) continue;
      if (p.foalId) {
        await prisma.horse.update({
          where: { id: p.foalId },
          data: {
            ownership: "Home",
            assignedCharacter: "Athena Redfield",
            dob: p.dueDate ?? p.coverDate ?? new Date(),
          },
        });
      }
      await prisma.pregnancy.update({ where: { id: p.id }, data: { status: "born" } });
    }
  }

  const horses = await prisma.horse.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, breed: true, gender: true, coat: true,
      genotype: true, sireName: true, damName: true,
    },
  });

  const pregnancies = await prisma.pregnancy.findMany({
    where: { status: "expecting" },
    orderBy: { dueDate: "asc" },
  });
  const byId = new Map(horses.map((h) => [h.id, h]));
  const pregList = pregnancies.map((p) => ({
    id: p.id,
    sireName: p.sireName,
    coverDate: p.coverDate ? p.coverDate.toISOString() : null,
    dueDate: p.dueDate ? p.dueDate.toISOString() : null,
    damId: p.damId,
    damName: byId.get(p.damId)?.name ?? "Unknown mare",
    foalId: p.foalId,
    foalName: p.foalId ? byId.get(p.foalId)?.name ?? null : null,
  }));

  const plans = await prisma.breedingPlan.findMany({ orderBy: { createdAt: "desc" } });
  const planList = plans.map((p) => ({
    id: p.id, damId: p.damId, damName: p.damName,
    sireId: p.sireId, sireName: p.sireName, notes: p.notes,
  }));

  return <BreedingClient horses={horses as never} pregnancies={pregList} plans={planList} />;
}
