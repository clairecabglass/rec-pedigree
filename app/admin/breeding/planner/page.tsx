import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import PlannerListClient from "./PlannerListClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Herd Planner — Admin" };

export default async function PlannerListPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");
  const plans = await prisma.herdPlan.findMany({ orderBy: { updatedAt: "desc" } });

  const serialised = plans.map((p) => ({
    id:        p.id,
    title:     p.title,
    status:    p.status,
    goal:      p.goal as Record<string, unknown>,
    notes:     p.notes,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>← Admin</Link>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 28, color: "var(--teal-dark)", margin: 0 }}>Herd Planner</h1>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          Plan multi-generation breeding programmes with COI tracking, acquisition requirements, and timeline estimates.
        </p>
      </div>
      <PlannerListClient plans={serialised} />
    </div>
  );
}
