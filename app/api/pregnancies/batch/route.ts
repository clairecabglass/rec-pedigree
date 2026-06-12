import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

const GESTATION_MS = 72 * 60 * 60 * 1000; // 72-hour gestation

/**
 * Mass-breed a set of saved wishlist pairs.
 * Body: { planIds: string[] }
 * For each plan: create the placeholder foal + a 72h pregnancy (bred now),
 * then delete the wishlist entry. Skips plans whose mare can't be resolved.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const planIds: string[] = Array.isArray(body.planIds) ? body.planIds : [];
  if (planIds.length === 0) return NextResponse.json({ error: "No pairs selected" }, { status: 400 });

  let bred = 0;
  const skipped: string[] = [];

  for (const planId of planIds) {
    const plan = await prisma.breedingPlan.findUnique({ where: { id: planId } });
    if (!plan) { skipped.push(planId); continue; }

    // Resolve the mare — prefer the stored id, fall back to name.
    const dam = plan.damId
      ? await prisma.horse.findUnique({ where: { id: plan.damId } })
      : await prisma.horse.findFirst({ where: { name: plan.damName } });
    if (!dam) { skipped.push(plan.damName); continue; }

    // Unique placeholder foal name.
    const base = `Foal of ${dam.name}`;
    let name = base;
    let n = 2;
    while (await prisma.horse.findUnique({ where: { name } })) name = `${base} (${n++})`;

    const foal = await prisma.horse.create({
      data: {
        name,
        sireName: plan.sireName || null,
        damName: dam.name,
        breed: dam.breed,
        ownership: "Expected",
        notes: "Auto-created foal placeholder from a mass-breed batch.",
      },
    });

    const now = Date.now();
    await prisma.pregnancy.create({
      data: {
        damId: dam.id,
        sireName: plan.sireName || null,
        coverDate: new Date(now),
        dueDate: new Date(now + GESTATION_MS),
        foalId: foal.id,
        status: "expecting",
      },
    });

    await prisma.breedingPlan.delete({ where: { id: plan.id } }).catch(() => {});
    bred += 1;
  }

  return NextResponse.json({ ok: true, bred, skipped });
}
