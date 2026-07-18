import { isAdminLoggedIn } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildPedigreeTree, findDuplicates } from "@/lib/pedigree";
import type { HorseMap } from "@/lib/pedigree";
import CertificateClient from "./CertificateClient";

export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");
  const { id } = await params;
  const horse = await prisma.horse.findUnique({ where: { id } });
  if (!horse) notFound();

  const all = await prisma.horse.findMany({
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
      regNumber: true,
      stablePrefix: true,
      breedingFee: true,
      breedingPolicies: true,
      price: true,
      saleDescription: true,
      saleContact: true,
      // Include any other fields that might be part of FullHorseData if necessary
    },
  });
  const map: HorseMap = new Map(all.map((h) => [h.name.toLowerCase(), h]));
  const tree = buildPedigreeTree(horse.name, map, 6);
  const dupes = findDuplicates(tree);
  const allHorsesJson = JSON.stringify(all.map((h) => ({ id: h.id, name: h.name })));

  return (
    <CertificateClient
      horseId={horse.id}
      name={horse.name}
      regNumber={horse.microchip || horse.regNumber || ""}
      tree={tree}
      dupes={[...dupes]}
      allHorses={allHorsesJson}
    />
  );
}
