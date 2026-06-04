import { isAdminLoggedIn } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import HorseForm from "@/components/HorseForm";

export const dynamic = "force-dynamic";

export default async function EditHorsePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");
  const { id } = await params;
  const horse = await prisma.horse.findUnique({ where: { id } });
  if (!horse) notFound();

  const initial = {
    ...horse,
    dob: horse.dob?.toISOString() ?? undefined,
    microchip: horse.microchip ?? undefined,
    breed: horse.breed ?? undefined,
    gender: horse.gender ?? undefined,
    sireName: horse.sireName ?? undefined,
    damName: horse.damName ?? undefined,
    coat: horse.coat ?? undefined,
    ownership: horse.ownership ?? undefined,
    notes: horse.notes ?? undefined,
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>
          ← Admin
        </Link>
        <Link href={`/registry/${horse.id}`} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>
          View public profile →
        </Link>
      </div>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 28, color: "var(--teal-dark)", marginBottom: 24 }}>
        Edit: {horse.name}
      </h1>
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 28 }}>
        <HorseForm mode="edit" initial={initial} />
      </div>
    </div>
  );
}
