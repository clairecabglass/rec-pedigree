import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const loggedIn = await isAdminLoggedIn();
  if (!loggedIn) redirect("/admin/login");

  const [total, forSale, withFoal, pregnant] = await Promise.all([
    prisma.horse.count({ where: { ownership: "Home" } }),
    prisma.horse.count({ where: { ownership: "For Sale" } }),
    prisma.horse.count({ where: { withFoal: true } }),
    prisma.pregnancy.count({ where: { status: "expecting" } }),
  ]);

  const recent = await prisma.horse.findMany({
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: { id: true, name: true, breed: true, gender: true, ownership: true, updatedAt: true },
  });

  // To-do list lives as a JSON array in a single DiaryNote row.
  const todoRow = await prisma.diaryNote.findUnique({ where: { key: "admin_todos" } });
  let todos: { id: string; text: string; done: boolean }[] = [];
  try { const p = todoRow?.body ? JSON.parse(todoRow.body) : []; if (Array.isArray(p)) todos = p; } catch { todos = []; }

  return <AdminDashboard stats={{ total, forSale, withFoal, pregnant }} recent={recent as any} initialTodos={todos} />;
}
