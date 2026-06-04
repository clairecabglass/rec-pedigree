import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import StableTrackerClient from "./StableTrackerClient";

export const dynamic = "force-dynamic";

export default async function StableTrackerPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  const horses = await prisma.horse.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, breed: true, gender: true, coat: true,
      genotype: true, sireName: true, damName: true,
    },
  });

  return <StableTrackerClient horses={horses as never} />;
}
