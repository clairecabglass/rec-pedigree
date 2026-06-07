import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import DiaryClient from "./DiaryClient";

export const dynamic = "force-dynamic";

export default async function DiaryPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  const [note, services] = await Promise.all([
    prisma.diaryNote.findUnique({ where: { key: "general" } }),
    prisma.preferredService.findMany({ orderBy: { updatedAt: "desc" } }),
  ]);

  return (
    <DiaryClient
      initialNote={note?.body ?? ""}
      noteUpdatedAt={note?.updatedAt?.toISOString() ?? null}
      services={services.map((s) => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() }))}
    />
  );
}
