import { prisma } from "@/lib/db";
import { isAdminLoggedIn } from "@/lib/auth";
import BreedingSubnav from "./BreedingSubnav";
import PoliciesEditor from "./PoliciesEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Breeding Policies — Redfield Equestrian Centre",
  description: "Breeding policies, available studs, and broodmares at Redfield Equestrian Centre.",
};

export default async function BreedingPoliciesPage() {
  const [row, admin] = await Promise.all([
    prisma.diaryNote.findUnique({ where: { key: "breeding_policies" } }),
    isAdminLoggedIn(),
  ]);
  const policies = row?.body ?? "";

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", marginBottom: 4 }}>Breeding</h1>
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14, marginBottom: 24 }}>
        Our breeding program, policies, and available horses.
      </p>

      <BreedingSubnav active="/breeding" />

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: 28 }}>
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 14 }}>Breeding Policies</h2>
        {policies.trim() ? (
          <div style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-lato)", fontSize: 15, lineHeight: 1.7, color: "var(--text)" }}>
            {policies}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14, fontStyle: "italic" }}>
            {admin ? "No policies written yet — click Edit policies to add them." : "Breeding policies will be posted here soon."}
          </p>
        )}
        {admin && <PoliciesEditor initial={policies} />}
      </div>
    </main>
  );
}
