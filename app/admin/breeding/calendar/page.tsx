import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import NurseryClient from "./NurseryClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nursery — Redfield Admin" };

export default async function NurseryPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  const now = new Date();

  // Auto-advance: flip any "expecting" pregnancies whose due date has passed to "born"
  {
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
  const recentCutoff = new Date(now.getTime() - 20 * 24 * 3600 * 1000);

  // 1. Currently growing foals (lifeStage != null)
  const growing = await prisma.horse.findMany({
    where: { lifeStage: { not: null } },
    select: { id: true, name: true, breed: true, lifeStage: true, lastBredDateTime: true },
    orderBy: { lastBredDateTime: "asc" },
  });

  // 2. Recently became adults
  const adultThreshold = new Date(now.getTime() - 6 * 24 * 3600 * 1000);
  const recentAdults = await prisma.horse.findMany({
    where: { lifeStage: null, lastBredDateTime: { gte: recentCutoff, lte: adultThreshold } },
    select: { id: true, name: true, breed: true, lastBredDateTime: true },
    orderBy: { lastBredDateTime: "desc" },
  });

  // 3. Pregnancies for calendar & upcoming list
  const pregnancies = await prisma.pregnancy.findMany({
    where: { status: "expecting" },
    orderBy: { dueDate: "asc" },
  });

  const damIds = [...new Set(pregnancies.map((p) => p.damId))];
  const dams = await prisma.horse.findMany({
    where: { id: { in: damIds } },
    select: { id: true, name: true },
  });
  const damById = new Map(dams.map((d) => [d.id, d.name]));

  const foalIds = pregnancies.map((p) => p.foalId).filter(Boolean) as string[];
  const foals = foalIds.length
    ? await prisma.horse.findMany({ where: { id: { in: foalIds } }, select: { id: true, name: true, gender: true, coat: true } })
    : [];
  const foalById = new Map(foals.map((f) => [f.id, f]));

  const calendarEntries = pregnancies
    .filter((p) => p.dueDate)
    .map((p) => {
      const foal = p.foalId ? foalById.get(p.foalId) : null;
      return {
        id: p.id,
        damId: p.damId,
        damName: damById.get(p.damId) ?? "Unknown mare",
        sireName: p.sireName,
        dueDate: p.dueDate!.toISOString(),
        coverDate: p.coverDate ? p.coverDate.toISOString() : null,
        foalId: p.foalId ?? null,
        foalName: foal?.name ?? null,
        foalGender: foal?.gender ?? null,
        markedForDeletion: p.markedForDeletion,
      };
    });

  // 4. Birth history — pregnancies marked born in the last 30 days
  const birthCutoff = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const recentBirths = await prisma.pregnancy.findMany({
    where: { status: "born", updatedAt: { gte: birthCutoff } },
    orderBy: { updatedAt: "desc" },
  });
  const birthDamIds = [...new Set(recentBirths.map((p) => p.damId))];
  const birthDams = birthDamIds.length
    ? await prisma.horse.findMany({ where: { id: { in: birthDamIds } }, select: { id: true, name: true } })
    : [];
  const birthDamById = new Map(birthDams.map((d) => [d.id, d.name]));
  const birthFoalIds = recentBirths.map((p) => p.foalId).filter(Boolean) as string[];
  const birthFoals = birthFoalIds.length
    ? await prisma.horse.findMany({ where: { id: { in: birthFoalIds } }, select: { id: true, name: true, coat: true, gender: true } })
    : [];
  const birthFoalById = new Map(birthFoals.map((f) => [f.id, f]));

  const birthHistory = recentBirths.map((p) => {
    const foal = p.foalId ? birthFoalById.get(p.foalId) : null;
    return {
      id: p.id,
      damName: birthDamById.get(p.damId) ?? "Unknown mare",
      sireName: p.sireName,
      foalId: p.foalId ?? null,
      foalName: foal?.name ?? null,
      foalCoat: foal?.coat ?? null,
      foalGender: foal?.gender ?? null,
      bornAt: p.updatedAt.toISOString(),
    };
  });

  // Stats
  const stats = {
    expecting: pregnancies.length,
    growing: growing.length,
    bornThisMonth: recentBirths.length,
  };

  return (
    <NurseryClient
      growing={growing.map((h) => ({
        id: h.id, name: h.name, breed: h.breed,
        lifeStage: h.lifeStage,
        lastBredDateTime: h.lastBredDateTime ? h.lastBredDateTime.toISOString() : null,
      }))}
      recentAdults={recentAdults.map((h) => ({
        id: h.id, name: h.name, breed: h.breed,
        lastBredDateTime: h.lastBredDateTime ? h.lastBredDateTime.toISOString() : null,
      }))}
      calendarEntries={calendarEntries}
      birthHistory={birthHistory}
      stats={stats}
    />
  );
}
