import { prisma } from "@/lib/db";
import PedigreeLookupClient from "./PedigreeLookupClient";

export const dynamic = "force-dynamic";

export default async function PedigreeLookupPage() {
  const horses = await prisma.horse.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, breed: true, gender: true, coat: true, sireName: true, damName: true },
  });

  return <PedigreeLookupClient horses={horses as any} />;
}
