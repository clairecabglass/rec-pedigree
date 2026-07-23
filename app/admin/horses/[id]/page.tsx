import { isAdminLoggedIn } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import HorseForm from "@/components/HorseForm";
import PhotoManager from "@/components/PhotoManager";
import VideoManager from "@/components/VideoManager";
import DocumentManager from "@/components/DocumentManager";
import ResultManager from "@/components/ResultManager";

export const dynamic = "force-dynamic";

const undef = <T,>(v: T | null): T | undefined => v ?? undefined;

export default async function EditHorsePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");
  const { id } = await params;
  const horse = await prisma.horse.findUnique({
    where: { id },
    include: { photos: { orderBy: { order: "asc" } }, videos: { orderBy: { order: "asc" } }, documents: { orderBy: { createdAt: "asc" } } },
  });
  if (!horse) notFound();
  const results = await prisma.result.findMany({ where: { horseId: id }, orderBy: { date: "desc" } });

  const initial = {
    id: horse.id,
    name: horse.name,
    dob: horse.dob?.toISOString() ?? undefined,
    microchip: undef(horse.microchip),
    breed: undef(horse.breed),
    gender: undef(horse.gender),
    sireName: undef(horse.sireName),
    damName: undef(horse.damName),
    coat: undef(horse.coat),
    ownership: undef(horse.ownership),
    notes: undef(horse.notes),
    withFoal: horse.withFoal,
    height: undef(horse.height),
    discipline: undef(horse.discipline),
    regNumber: undef(horse.regNumber),
    achievements: undef(horse.achievements),
    videoUrl: undef(horse.videoUrl),
    personality: undef(horse.personality),
    genotype: undef(horse.genotype),
    eyeColor: undef(horse.eyeColor),
    baseStats: undef(horse.baseStats),
    description: undef(horse.description),
    ownerName: undef(horse.ownerName),
    ownerCharacter: undef(horse.ownerCharacter),
    stablePrefix: undef(horse.stablePrefix),
    breedingFee: undef(horse.breedingFee),
    breedingPolicies: undef(horse.breedingPolicies),
    availableForBreeding: horse.availableForBreeding,
    isCustomHorse: horse.isCustomHorse,
    hasCustomCoat: horse.hasCustomCoat,
    price: undef(horse.price),
    saleDescription: undef(horse.saleDescription),
    saleContact: undef(horse.saleContact),
  };

  const card = { background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 28, marginBottom: 24 };
  const sectionHead = { fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)", marginBottom: 16 };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>
          ← Admin
        </Link>
        <Link href={`/registry/${horse.id}`} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>
          View public profile →
        </Link>
        <Link href={`/admin/horses/${horse.id}/papers`} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>
          Papers →
        </Link>
        <a
          href={`/api/horses/${horse.id}/zip`}
          download
          style={{
            marginLeft: "auto", fontSize: 13, fontFamily: "var(--font-lato)", fontWeight: 700,
            background: "var(--teal-dark)", color: "white", textDecoration: "none",
            padding: "6px 14px", borderRadius: 6,
          }}
        >
          ↓ Export ZIP
        </a>
      </div>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 28, color: "var(--teal-dark)", marginBottom: 24 }}>
        Edit: {horse.name}
      </h1>

      <div style={card}>
        <HorseForm mode="edit" initial={initial} />
      </div>

      <div style={card}>
        <h2 style={sectionHead}>Photos</h2>
        <PhotoManager horseId={horse.id} initial={horse.photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption, order: p.order, isPrimary: p.isPrimary }))} />
      </div>

      <div style={card}>
        <h2 style={sectionHead}>Videos</h2>
        <VideoManager horseId={horse.id} initial={horse.videos.map((v) => ({ id: v.id, url: v.url, caption: v.caption, mimeType: v.mimeType }))} />
      </div>

      <div style={card}>
        <h2 style={sectionHead}>Documents</h2>
        <DocumentManager horseId={horse.id} initial={horse.documents.map((d) => ({ id: d.id, url: d.url, label: d.label, type: d.type }))} />
      </div>

      <div style={card}>
        <h2 style={sectionHead}>Show Results / Achievements</h2>
        <ResultManager horseId={horse.id} initial={results.map((r) => ({ id: r.id, event: r.event, placement: r.placement, date: r.date ? r.date.toISOString() : null, notes: r.notes }))} />
      </div>
    </div>
  );
}
