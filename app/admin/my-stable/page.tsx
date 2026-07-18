import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import MyStableClient from "./MyStableClient";

export const dynamic = "force-dynamic";

export default async function MyStablePage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  // Every horse marked as actively owned ("Home"), regardless of [REC] prefix.
  const horses = await prisma.horse.findMany({
    where: { ownership: "Home" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      breed: true,
      gender: true,
      coat: true,
      assignedCharacter: true,
      lifeStage: true,
      updatedAt: true,
    },
  });

  // Active pregnancies — drive Nursery View + the live gestation countdown.
  const pregnancies = await prisma.pregnancy.findMany({
    where: { status: "expecting" },
    select: { id: true, damId: true, coverDate: true, dueDate: true, foalId: true },
  });

  return (
    <MyStableClient
      horses={horses.map((h) => ({ ...h, updatedAt: h.updatedAt.toISOString() }))}
      pregnancies={pregnancies.map((p) => ({
        id: p.id,
        damId: p.damId,
        foalId: p.foalId,
        coverDate: p.coverDate ? p.coverDate.toISOString() : null,
        dueDate: p.dueDate ? p.dueDate.toISOString() : null,
      }))}
    />
  );
}
