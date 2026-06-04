import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const loggedIn = await isAdminLoggedIn();
  if (!loggedIn) redirect("/admin/login");

  const [total, forSale, withFoal] = await Promise.all([
    prisma.horse.count({ where: { ownership: "Home" } }),
    prisma.horse.count({ where: { ownership: "For Sale" } }),
    prisma.horse.count({ where: { withFoal: true } }),
  ]);

  const recent = await prisma.horse.findMany({
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: { id: true, name: true, breed: true, gender: true, ownership: true, updatedAt: true },
  });

  return <AdminDashboard stats={{ total, forSale, withFoal }} recent={recent as any} />;
}
