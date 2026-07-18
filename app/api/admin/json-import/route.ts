import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

// Maps Rift Trails JSON horse → our Horse schema fields
function mapHorse(h: Record<string, unknown>) {
  const gender =
    typeof h.sex === "string"
      ? h.sex === "Male" || h.sex === "Stallion" ? "Stallion"
      : h.sex === "Female" || h.sex === "Mare" ? "Mare"
      : null
      : null;

  return {
    name: (h.name as string).trim().toUpperCase(),
    breed: (h.breed as string | null) || null,
    gender,
    coat: (h.base as string | null) || null,
    genotype: (h.genes as string | null) || null,
    personality: (h.personality as string | null) || null,
    notes: (h.notes as string | null) || null,
    discipline: (h.discipline as string | null) || null,
    height: (h.height as string | null) || null,
    sireName: h.sire ? (h.sire as string).trim().toUpperCase() : null,
    damName: h.dam ? (h.dam as string).trim().toUpperCase() : null,
    // Status mapping: Active → Home, anything else → Outside
    ownership:
      (h.status as string) === "Active" ? "Home" : "Outside",
  };
}

export async function POST(req: NextRequest) {
  if (!(await isAdminLoggedIn()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Accept both a full Rift Trails backup and a plain array of horses
  const rawHorses: unknown[] = Array.isArray(body)
    ? body
    : Array.isArray(body.horses)
    ? (body.horses as unknown[])
    : [];

  if (!rawHorses.length)
    return NextResponse.json({ error: "No horses found in file" }, { status: 400 });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const raw of rawHorses) {
    const h = raw as Record<string, unknown>;
    if (!h.name || typeof h.name !== "string" || !h.name.trim()) { skipped++; continue; }

    try {
      const data = mapHorse(h);
      const existing = await prisma.horse.findUnique({ where: { name: data.name } });
      if (existing) {
        // Only overwrite fields that are blank in our DB — don't clobber manually set data
        const patch: Record<string, unknown> = {};
        if (!existing.breed       && data.breed)       patch.breed       = data.breed;
        if (!existing.gender      && data.gender)      patch.gender      = data.gender;
        if (!existing.coat        && data.coat)        patch.coat        = data.coat;
        if (!existing.genotype    && data.genotype)    patch.genotype    = data.genotype;
        if (!existing.personality && data.personality) patch.personality = data.personality;
        if (!existing.notes       && data.notes)       patch.notes       = data.notes;
        if (!existing.discipline  && data.discipline)  patch.discipline  = data.discipline;
        if (!existing.height      && data.height)      patch.height      = data.height;
        if (!existing.sireName    && data.sireName)    patch.sireName    = data.sireName;
        if (!existing.damName     && data.damName)     patch.damName     = data.damName;

        if (Object.keys(patch).length) {
          await prisma.horse.update({ where: { name: data.name }, data: patch });
          updated++;
        } else {
          skipped++;
        }
      } else {
        await prisma.horse.create({ data });
        created++;
      }
    } catch (e: unknown) {
      errors.push(`${h.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    total: rawHorses.length,
    created,
    updated,
    skipped,
    errors: errors.length,
    errorDetails: errors.slice(0, 20),
  });
}
