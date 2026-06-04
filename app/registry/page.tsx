import { prisma } from "@/lib/db";
import RegistryClient from "./RegistryClient";
import { pedigreeDepth } from "@/lib/pedigree";
import type { HorseMap } from "@/lib/pedigree";

export const dynamic = "force-dynamic";

export default async function RegistryPage() {
  // All horses (incl. Outside/Void) for the pedigree map — ancestors may be any of them.
  const allForMap = await prisma.horse.findMany({
    select: { id: true, name: true, breed: true, gender: true, coat: true, sireName: true, damName: true },
  });
  const map: HorseMap = new Map(allForMap.map((h) => [h.name.toLowerCase(), h]));

  // Outside (not owned) and Void (deleted) are kept only for pedigree
  // record-keeping — they're reachable from a pedigree link but not listed here.
  const horses = await prisma.horse.findMany({
    where: { OR: [{ ownership: { notIn: ["Outside", "Void"] } }, { ownership: null }] },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, breed: true, gender: true, coat: true,
      ownership: true, sireName: true, damName: true, dob: true, withFoal: true,
      photos: { where: { isPrimary: true }, select: { url: true }, take: 1 },
    },
  });

  const flat = horses.map((h) => ({
    id: h.id, name: h.name, breed: h.breed, gender: h.gender, coat: h.coat,
    ownership: h.ownership, sireName: h.sireName, damName: h.damName,
    dob: h.dob ? h.dob.toISOString() : null, withFoal: h.withFoal,
    photo: h.photos[0]?.url ?? null,
    generations: pedigreeDepth(h.name, map),
  }));

  const breeds = [...new Set(horses.map((h) => h.breed).filter(Boolean))].sort() as string[];

  return <RegistryClient horses={flat} breeds={breeds} />;
}
