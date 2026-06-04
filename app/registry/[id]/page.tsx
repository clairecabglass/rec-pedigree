import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import PedigreeTree from "@/components/PedigreeTree";
import { buildPedigreeTree, findDuplicates } from "@/lib/pedigree";
import type { HorseMap } from "@/lib/pedigree";

export const dynamic = "force-dynamic";

export default async function HorsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const horse = await prisma.horse.findUnique({ where: { id } });
  if (!horse) notFound();

  const allHorses = await prisma.horse.findMany({
    select: { id: true, name: true, breed: true, gender: true, coat: true, sireName: true, damName: true },
  });

  const horseMap: HorseMap = new Map(
    allHorses.map((h) => [h.name.toLowerCase(), h])
  );

  const tree = buildPedigreeTree(horse.name, horseMap, 5);
  const dupes = findDuplicates(tree);

  const OWNERSHIP_COLORS: Record<string, string> = {
    "Home": "#D4E3E1", "For Sale": "#FFF3D0", "Sold": "#F0F0F0",
    "Outside": "#E8F4E8", "Void": "#FFE8E8",
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/registry" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>
          ← Back to Registry
        </Link>
      </div>

      {/* Horse header */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 28, marginBottom: 24 }} className="flex flex-wrap gap-6 justify-between">
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", marginBottom: 4 }}>
            {horse.name}
          </h1>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {horse.breed && <span style={{ fontSize: 14, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{horse.breed}</span>}
            {horse.gender && (
              <span style={{ background: horse.gender === "Stallion" ? "var(--teal-muted)" : "#FCE8F0", borderRadius: 12, padding: "3px 10px", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: horse.gender === "Stallion" ? "var(--teal-dark)" : "#8B4C6B" }}>
                {horse.gender}
              </span>
            )}
            {horse.ownership && (
              <span style={{ background: OWNERSHIP_COLORS[horse.ownership] ?? "#EEE", borderRadius: 12, padding: "3px 10px", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>
                {horse.ownership}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", fontSize: 13, fontFamily: "var(--font-lato)" }}>
          {horse.microchip && (
            <>
              <span style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>Microchip</span>
              <span style={{ color: "var(--text)" }}>{horse.microchip}</span>
            </>
          )}
          {horse.coat && (
            <>
              <span style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>Coat</span>
              <span style={{ color: "var(--text)" }}>{horse.coat}</span>
            </>
          )}
          {horse.dob && (
            <>
              <span style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>Date of Birth</span>
              <span style={{ color: "var(--text)" }}>{new Date(horse.dob).toLocaleDateString()}</span>
            </>
          )}
          {horse.withFoal && (
            <>
              <span style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>With Foal</span>
              <span style={{ color: "var(--gold)", fontWeight: 600 }}>Yes</span>
            </>
          )}
        </div>
      </div>

      {horse.notes && (
        <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 20px", marginBottom: 24, fontSize: 13, fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--text)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>Notes:</strong> {horse.notes}
        </div>
      )}

      {/* Pedigree */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 24 }}>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)" }}>
            Pedigree
          </h2>
          {dupes.size > 0 && (
            <span style={{ fontSize: 12, color: "#C05050", background: "#FFF0F0", border: "1px solid #FFCCCC", borderRadius: 4, padding: "4px 10px", fontFamily: "var(--font-lato)" }}>
              ⚠ Inbreeding detected ({dupes.size} duplicate ancestor{dupes.size !== 1 ? "s" : ""})
            </span>
          )}
        </div>

        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16, fontFamily: "var(--font-lato)", display: "flex", gap: 16 }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderLeft: "3px solid var(--teal-light)", background: "var(--white)", marginRight: 4, borderRadius: 2 }}></span>Sire line</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderLeft: "3px solid var(--gold)", background: "var(--white)", marginRight: 4, borderRadius: 2 }}></span>Dam line</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#FFF5F5", border: "1px solid #E07070", marginRight: 4, borderRadius: 2 }}></span>Inbreeding</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#FFFBF0", border: "1px solid var(--gold-light)", marginRight: 4, borderRadius: 2 }}></span>Unknown</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <PedigreeTree node={tree} dupes={dupes} allHorses={JSON.stringify(allHorses.map(h => ({ id: h.id, name: h.name })))} />
        </div>
      </div>
    </div>
  );
}
