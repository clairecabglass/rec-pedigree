import { prisma } from "@/lib/db";
import RegistryClient from "./RegistryClient";
import { pedigreeDepth } from "@/lib/pedigree";
import type { HorseMap } from "@/lib/pedigree";
import { isAdminLoggedIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Registry — Redfield Equestrian Centre" };

export default async function RegistryPage() {
  const admin = await isAdminLoggedIn();

  // All horses (incl. Outside/Void) for the pedigree map — ancestors may be any of them.
  const allForMap = await prisma.horse.findMany({
    select: {
      id: true,
      name: true,
      breed: true,
      gender: true,
      coat: true,
      genotype: true,
      sireName: true,
      damName: true,
      ownership: true,
      isImportedPlaceholder: true,
      // Add other fields that might be part of FullHorseData if necessary
    },
  });
  const map: HorseMap = new Map(allForMap.map((h) => [h.name.toLowerCase(), h]));

  // Public registry shows owned, [REC]-tagged horses. Outside/Void/Expected are
  // record-keeping only. Admins receive ALL owned horses + a toggle to show non-[REC].
  const owned = { OR: [{ ownership: { notIn: ["Outside", "Void", "Expected"] } }, { ownership: null }] };
  const horses = await prisma.horse.findMany({
    where: admin ? owned : { AND: [owned, { name: { startsWith: "[REC]" } }] },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, breed: true, gender: true, coat: true,
      ownership: true, sireName: true, damName: true, dob: true, withFoal: true,
      photos: { where: { isPrimary: true }, select: { url: true }, take: 1 },
    },
  });

  // Share one memo across all depth calculations so shared ancestors are only
  // traversed once — prevents O(n * tree_size) recursion on large registries.
  const depthMemo = new Map<string, number>();
  const flat = horses.map((h) => ({
    id: h.id, name: h.name, breed: h.breed, gender: h.gender, coat: h.coat,
    ownership: h.ownership, sireName: h.sireName, damName: h.damName,
    dob: h.dob ? h.dob.toISOString() : null, withFoal: h.withFoal,
    photo: h.photos[0]?.url ?? null,
    generations: pedigreeDepth(h.name, map, new Set(), depthMemo),
  }));

  const breeds = [...new Set(horses.map((h) => h.breed).filter(Boolean))].sort() as string[];

  return <RegistryClient horses={flat} breeds={breeds} isAdmin={admin} />;
}
