import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SuggestedPairingsClient from "./SuggestedPairingsClient";
import type { FullHorseData } from "@/lib/types"; // Updated import

export const dynamic = "force-dynamic";

export default async function SuggestedPairingsPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  const horses = await prisma.horse.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, breed: true, gender: true, coat: true,
      genotype: true, sireName: true, damName: true,
      ownership: true,
      isImportedPlaceholder: true,
    },
  });

  return <SuggestedPairingsClient horses={horses as FullHorseData[]} />; // Updated usage
}
