import { isAdminLoggedIn } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { readFile } from "fs/promises";
import path from "path";
import Link from "next/link";
import BulkDownloader from "./BulkDownloader";
import PdfDownloader from "./PdfDownloader";

export const dynamic = "force-dynamic";

async function toDataUri(filename: string) {
  try {
    const buf = await readFile(path.join(process.cwd(), "public/brand", filename));
    const ext = filename.split(".").pop() ?? "png";
    return `data:image/${ext};base64,${buf.toString("base64")}`;
  } catch { return ""; }
}

export default async function PapersPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");
  const { id } = await params;

  const horse = await prisma.horse.findUnique({
    where: { id },
    select: {
      id: true, name: true, breed: true, gender: true, dob: true,
      regNumber: true, coat: true, genotype: true,
      microchip: true, height: true, discipline: true, stablePrefix: true,
      ownerName: true, sireName: true, damName: true,
    },
  });
  if (!horse) notFound();

  const results = await prisma.result.findMany({ where: { horseId: id }, orderBy: { date: "desc" } });

  const [templateDataUri, sigLab] = await Promise.all([
    toDataUri("REC Training Cert No Name.png"),
    toDataUri("lab-analyst.png"),
  ]);

  const card: React.CSSProperties = {
    display: "flex", flexDirection: "column", gap: 8,
    background: "var(--white)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "24px 28px",
  };

  const btn: React.CSSProperties = {
    display: "inline-block", background: "var(--teal)", color: "white",
    textDecoration: "none", fontFamily: "var(--font-lato)", fontWeight: 700,
    fontSize: 15, padding: "12px 24px", borderRadius: 8, marginTop: 8, width: "fit-content",
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div style={{ marginBottom: 20 }}>
        <Link href={`/admin/horses/${id}`} style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>
          ← Back to {horse.name}
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 28, color: "var(--teal-dark)", margin: 0 }}>
          Papers
        </h1>
        <BulkDownloader
          id={horse.id}
          name={horse.name}
          breed={horse.breed ?? ""}
          gender={horse.gender ?? ""}
          dob={horse.dob ? horse.dob.toISOString().split("T")[0] : ""}
          regNumber={horse.regNumber ?? ""}
          coat={horse.coat ?? ""}
          genotype={horse.genotype ?? ""}
          templateDataUri={templateDataUri}
          sigLab={sigLab}
        />
      </div>
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 13, marginBottom: 28 }}>
        {horse.name}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={card}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)" }}>Pedigree Certificate</div>
          <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 13 }}>
            Official registration certificate with full pedigree tree — exports as PNG.
          </div>
          <Link href={`/admin/horses/${id}/certificate`} style={btn}>↓ Download Pedigree Cert</Link>
        </div>

        <div style={card}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)" }}>ECGC — Equine Colour Genetics Certificate</div>
          <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 13 }}>
            Full coat colour gene analysis report across all 25 loci — exports as PNG.
          </div>
          <Link href={`/admin/horses/${id}/genetics-cert`} style={btn}>↓ Download ECGC</Link>
        </div>

        <div style={card}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)" }}>Coggins Test (EIA)</div>
          <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 13 }}>
            Equine Infectious Anemia negative result certificate — exports as PNG.
          </div>
          <Link href={`/admin/horses/${id}/coggins`} style={btn}>↓ Download Coggins</Link>
        </div>

        <div style={card}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)" }}>Training Certificate</div>
          <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 13 }}>
            Official REC training completion certificate — exports as PNG.
          </div>
          <Link href={`/admin/horses/${id}/training-cert`} style={btn}>↓ Download Training Cert</Link>
        </div>

        {/* ── PDF Documents (Belmont Veterinarian Clinic) ── */}
        <div style={{ ...card, gap: 14 }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)" }}>Belmont Veterinarian Clinic — PDF Documents</div>
          <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 13 }}>
            Health &amp; Vet Book (6 pages: Cover · Vitals &amp; Vaccinations · Preventive Care · Clinical Exam · X-Rays ×2) · Microchip Registration · BSE / Fertility (stallions) · Insurance Certificate · Training Log PDF
          </div>
          <PdfDownloader
            horse={{
              id:          horse.id,
              name:        horse.name,
              breed:       horse.breed,
              gender:      horse.gender,
              coat:        horse.coat,
              genotype:    horse.genotype,
              dob:         horse.dob?.toISOString() ?? null,
              regNumber:   horse.regNumber,
              microchip:   horse.microchip,
              height:      horse.height,
              discipline:  horse.discipline,
              stablePrefix: horse.stablePrefix,
              ownerName:   horse.ownerName,
              sireName:    horse.sireName,
              damName:     horse.damName,
            }}
            results={results.map(r => ({
              id:        r.id,
              event:     r.event,
              placement: r.placement,
              date:      r.date?.toISOString() ?? null,
              notes:     r.notes,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
