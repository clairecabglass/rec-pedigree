import { isAdminLoggedIn } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PapersPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");
  const { id } = await params;

  const horse = await prisma.horse.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!horse) notFound();

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

      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 28, color: "var(--teal-dark)", marginBottom: 6 }}>
        Papers
      </h1>
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
      </div>
    </div>
  );
}
