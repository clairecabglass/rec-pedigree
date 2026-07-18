import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import BreedingClient from "./BreedingClient";

export const dynamic = "force-dynamic";

export default async function BreedingPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  // Auto-advance: flip any "expecting" pregnancies whose due date has passed to "born"
  {
    const now = new Date();
    const overdue = await prisma.pregnancy.findMany({
      where: { status: "expecting", dueDate: { lte: now } },
    });
    for (const p of overdue) {
      if (p.foalId) {
        await prisma.horse.update({
          where: { id: p.foalId },
          data: { ownership: "Home", assignedCharacter: "Athena Redfield", dob: p.dueDate ?? now },
        });
      }
      await prisma.pregnancy.update({ where: { id: p.id }, data: { status: "born" } });
    }
  }

  const horses = await prisma.horse.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, breed: true, gender: true, coat: true,
      genotype: true, sireName: true, damName: true, ownership: true, isImportedPlaceholder: true,
    },
  });

  // Flagged-for-deletion pregnancies stay visible even after the foal is born
  // (auto-advance above would otherwise flip them to "born" and hide them),
  // so the admin doesn't lose track of a foal they still mean to delete.
  const pregnancies = await prisma.pregnancy.findMany({
    where: { OR: [{ status: "expecting" }, { markedForDeletion: true }] },
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
    markedForDeletion: p.markedForDeletion,
    status: p.status,
  }));

  const plans = await prisma.breedingPlan.findMany({ orderBy: { createdAt: "desc" } });
  const planList = plans.map((p) => ({
    id: p.id, damId: p.damId, damName: p.damName,
    sireId: p.sireId, sireName: p.sireName, notes: p.notes,
  }));

  return <BreedingClient horses={horses as never} pregnancies={pregList} plans={planList} />;
}
