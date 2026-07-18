import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";

// Collect a horse + all its ancestors recursively (up to 10 generations)
async function collectAncestors(
  name: string,
  allHorses: Map<string, { name: string; breed: string | null; gender: string | null; coat: string | null; genotype: string | null; personality: string | null; dob: Date | null; notes: string | null; discipline: string | null; height: string | null; sireName: string | null; damName: string | null; ownership: string | null; photos: { url: string }[] }>,
  visited = new Set<string>(),
  depth = 0
): Promise<string[]> {
  if (!name || depth > 10) return [];
  const key = name.toLowerCase();
  if (visited.has(key)) return [];
  visited.add(key);
  const h = allHorses.get(key);
  if (!h) return [name]; // placeholder — still include name for reference
  return [
    name,
    ...(await collectAncestors(h.sireName ?? "", allHorses, visited, depth + 1)),
    ...(await collectAncestors(h.damName ?? "", allHorses, visited, depth + 1)),
  ];
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await isAdminLoggedIn();
  const { searchParams } = new URL(req.url);
  const isPublic = searchParams.get("public") === "1";

  // Public export is only allowed if the horse is listed for breeding
  const horse = await prisma.horse.findUnique({
    where: { id },
    include: { photos: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1 } },
  });
  if (!horse) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!admin && !horse.availableForBreeding) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load all horses for ancestor traversal
  const all = await prisma.horse.findMany({
    select: {
      name: true, breed: true, gender: true, coat: true, genotype: true,
      personality: true, dob: true, notes: true, discipline: true, height: true,
      sireName: true, damName: true, ownership: true,
      photos: { select: { url: true }, orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1 },
    },
  });
  const byName = new Map(all.map((h) => [h.name.toLowerCase(), h]));

  // Collect subject + all ancestors
  const ancestorNames = await collectAncestors(horse.name, byName);
  const uniqueNames = [...new Set(ancestorNames)];

  function deriveAge(dob: Date | null): number {
    if (!dob) return 0;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  }

  // Main horse: Active if admin private download, Retired if public
  const mainStatus = admin && !isPublic ? "Active" : "Retired";

  const horses = uniqueNames.map((name, i) => {
    const h = byName.get(name.toLowerCase());
    const isMain = i === 0;
    return {
      name: h?.name ?? name,
      sex: h?.gender ?? "",
      breed: h?.breed ?? "",
      base: h?.coat ?? "",
      custom: "",
      genes: h?.genotype ?? "",
      personality: h?.personality ?? "",
      age: deriveAge(h?.dob ?? null),
      status: isMain ? mainStatus : "Retired",
      tags: "",
      favorite: isMain ? 1 : 0,
      notes: h?.notes ?? "",
      discipline: h?.discipline ?? "",
      height: h?.height ?? "",
      folder: "",
      shows: [],
      training: [],
      sire: h?.sireName ?? "",
      dam: h?.damName ?? "",
      photo: h?.photos[0]?.url ?? null,
      gallery: [],
      trophies: [],
    };
  });

  const payload = {
    app: "Rift Trails Pedigree Creator",
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    horses,
    nonOwnedFoals: [],
  };

  const filename = `${horse.name.replace(/[^a-zA-Z0-9_\- ]/g, "").trim()}-pedigree.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
