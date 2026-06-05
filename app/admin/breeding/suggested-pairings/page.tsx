import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SuggestedPairingsClient from "./SuggestedPairingsClient";
import type { FullHorseData } from "@/lib/types"; // Updated import

export const dynamic = "force-dynamic";

export default async function SuggestedPairingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  const ownedHorsesOnly = searchParams.ownedHorsesOnly === "true";

  const whereClause = {
    gender: {
      in: ["Mare", "Stallion"],
    },
    ...(ownedHorsesOnly && { ownership: "Home" }),
  };

  const horses = await prisma.horse.findMany({
    orderBy: { name: "asc" },
    where: whereClause,
    select: {
      id: true, name: true, breed: true, gender: true, coat: true,
      genotype: true, sireName: true, damName: true,
      ownership: true,
      isImportedPlaceholder: true,
    },
  });

  return (
    <SuggestedPairingsClient
      horses={horses as FullHorseData[]}
      ownedHorsesOnly={ownedHorsesOnly}
    />
  );
}
