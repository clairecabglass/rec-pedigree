import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import { computeFoalStage } from "@/lib/foalGrowth";

/**
 * Sweep all "expecting" pregnancies and:
 *   - For any foal whose growth stage has progressed to "adult" (>=144 h
 *     since the breeding/cover date), promote the foal: flip ownership from
 *     "Expected" → "Home" (default new character: Athena Redfield), set dob,
 *     and mark the Pregnancy as "born" so it leaves the breeding menu.
 *
 * Idempotent. Cheap. Called lazily from the breeding page on load — that's
 * enough cadence for this scale, no external cron needed.
 */
export async function POST() {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pending = await prisma.pregnancy.findMany({ where: { status: "expecting" } });
  let promoted = 0;
  for (const p of pending) {
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
    promoted += 1;
  }
  return NextResponse.json({ ok: true, promoted });
}
