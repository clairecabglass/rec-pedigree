import { prisma } from "@/lib/db";
import BreedingSubnav from "../BreedingSubnav";
import RosterGrid, { RosterHorse } from "../RosterGrid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Studs — Redfield Equestrian Centre",
  description: "Stallions standing at stud at Redfield Equestrian Centre.",
};

export default async function StudsPage() {
  const horses = await prisma.horse.findMany({
    where: { ownership: "Home", gender: "Stallion", availableForBreeding: true },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, breed: true, coat: true, breedingFee: true, breedingPolicies: true,
      photos: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1, select: { url: true } },
    },
  });

  const roster: RosterHorse[] = horses.map((h) => ({
    id: h.id, name: h.name, breed: h.breed, coat: h.coat,
    breedingFee: h.breedingFee, breedingPolicies: h.breedingPolicies,
    photoUrl: h.photos[0]?.url ?? null,
  }));

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", marginBottom: 4 }}>Studs</h1>
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14, marginBottom: 24 }}>
        Stallions standing at stud — {roster.length} available.
      </p>
      <BreedingSubnav active="/breeding/studs" />
      <RosterGrid horses={roster} emptyLabel="No stallions are currently listed at stud." />
    </main>
  );
}
