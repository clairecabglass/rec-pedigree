import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import Link from "next/link";
import BulkTrainingClient from "./BulkTrainingClient";

export const dynamic = "force-dynamic";

export default async function BulkTrainingPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  const horses = await prisma.horse.findMany({
    where: { ownership: "Home" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      breed: true,
      lifeStage: true,
      assignedCharacter: true,
      trainingExp: true,
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)", display: "block", marginBottom: 20 }}>
        ← Back to Admin
      </Link>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", marginBottom: 8 }}>
        Bulk Training
      </h1>
      <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
        Select the horses you trained, set how much EXP to add, then save. You can override EXP per horse if amounts differ.
      </p>
      <BulkTrainingClient horses={horses} />
    </div>
  );
}
