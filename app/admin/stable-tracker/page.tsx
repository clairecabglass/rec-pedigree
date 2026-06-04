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

  const pregnancies = await prisma.pregnancy.findMany({
    where: { status: "expecting" },
    orderBy: { dueDate: "asc" },
  });
  const byId = new Map(horses.map((h) => [h.id, h]));
  const pregList = pregnancies.map((p) => ({
    id: p.id,
    sireName: p.sireName,
    dueDate: p.dueDate ? p.dueDate.toISOString() : null,
    damId: p.damId,
    damName: byId.get(p.damId)?.name ?? "Unknown mare",
    foalId: p.foalId,
    foalName: p.foalId ? byId.get(p.foalId)?.name ?? null : null,
  }));

  return <StableTrackerClient horses={horses as never} pregnancies={pregList} />;
}
