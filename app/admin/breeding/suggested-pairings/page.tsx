import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SuggestedPairingsClient from "./SuggestedPairingsClient";
import type { FullHorseData } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SuggestedPairingsPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  // Suggested pairings are ONLY for horses we actively own ("Home"). This
  // happens at the DB level so the cross-product never blows up to 50k+ pairs.
  const horses = await prisma.horse.findMany({
    orderBy: { name: "asc" },
    where: {
      ownership: "Home",
      gender: { in: ["Mare", "Stallion"] },
    },
    select: {
      id: true, name: true, breed: true, gender: true, coat: true,
      genotype: true, sireName: true, damName: true,
      ownership: true,
      isImportedPlaceholder: true,
    },
  });

  return <SuggestedPairingsClient horses={horses as FullHorseData[]} />;
}
