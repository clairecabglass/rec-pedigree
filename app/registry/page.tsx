import { prisma } from "@/lib/db";
import RegistryClient from "./RegistryClient";

export const dynamic = "force-dynamic";

export default async function RegistryPage() {
  const horses = await prisma.horse.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, breed: true, gender: true,
      coat: true, ownership: true, sireName: true, damName: true, dob: true,
    },
  });

  const breeds = [...new Set(horses.map((h) => h.breed).filter(Boolean))].sort() as string[];
  const ownerships = [...new Set(horses.map((h) => h.ownership).filter(Boolean))].sort() as string[];

  return <RegistryClient horses={horses as any} breeds={breeds} ownerships={ownerships} />;
}
