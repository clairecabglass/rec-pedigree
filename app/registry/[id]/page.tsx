import React from "react";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
// next/image was here, but its optimizer rejects un-whitelisted hosts and our
// photos live on a public Cloudflare R2 bucket. Plain <img> renders R2 URLs
// directly without needing remotePatterns config (matches PhotoGallery).
import PedigreeTree from "@/components/PedigreeTree";
import AdminHorseDeleteButton from "@/components/AdminHorseDeleteButton";
import { parseHorseCoat } from "@/lib/horseCoat";
import Icon from "@/components/Icon";
import PhotoGallery from "@/components/PhotoGallery";
import HorseHero from "@/components/HorseHero";
import BreedingHistory from "./BreedingHistory";
import HorseTimeline from "./HorseTimeline";
import { buildPedigreeTree, findDuplicates, pedigreeDepth, inbreedingCoefficient } from "@/lib/pedigree";
import type { HorseMap } from "@/lib/pedigree";
import { isAdminLoggedIn } from "@/lib/auth";
import { getCoatSwatch } from "@/lib/coatSwatch";
import DocumentGallery from "@/components/DocumentGallery";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const horse = await prisma.horse.findUnique({ where: { id }, select: { name: true, breed: true } });
  if (!horse) return { title: "Horse — Redfield Equestrian Centre" };
  return { title: `${horse.name}${horse.breed ? ` · ${horse.breed}` : ""} — Redfield Equestrian Centre` };
}

const OWNERSHIP_COLORS: Record<string, { bg: string; text: string }> = {
  "Home": { bg: "var(--teal-muted)", text: "var(--teal-dark)" },
  "For Sale": { bg: "var(--sand-bg)", text: "var(--sand-text)" },
  "Sold": { bg: "var(--lilac-bg)", text: "var(--lilac-text)" },
  "Outside": { bg: "var(--sage-bg)", text: "var(--sage-text)" },
  "Void": { bg: "var(--inbreed-bg)", text: "var(--inbreed-text)" },
};
const DEFAULT_OWNERSHIP_COLOR = { bg: "#EEE", text: "var(--text)" };

export default async function HorsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const horse = await prisma.horse.findUnique({
    where: { id },
    include: {
      photos: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      videos: { orderBy: { order: "asc" } },
      documents: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { date: "asc" } },
    },
  });
  if (!horse) notFound();

  const results = await prisma.result.findMany({ where: { horseId: id }, orderBy: { date: "desc" } });

  // Breeding history: pregnancies where this horse was the dam, or named as sire
  const breedingHistory = await prisma.pregnancy.findMany({
    where: {
      OR: [
        { damId: horse.id },
        { sireName: { equals: horse.name, mode: "insensitive" } },
      ],
    },
    orderBy: { coverDate: "desc" },
  });
  // Resolve foal names for history entries that have a foalId
  const foalIds = breedingHistory.map((p) => p.foalId).filter(Boolean) as string[];
  const foalRecords = foalIds.length
    ? await prisma.horse.findMany({ where: { id: { in: foalIds } }, select: { id: true, name: true } })
    : [];
  const foalById = new Map(foalRecords.map((f) => [f.id, f]));

  const allHorses = await prisma.horse.findMany({
    select: {
      id: true,
      name: true,
      breed: true,
      gender: true,
      coat: true,
      genotype: true,
      sireName: true,
      damName: true,
      ownership: true,
      isImportedPlaceholder: true,
      regNumber: true,
      stablePrefix: true,
      breedingFee: true,
      breedingPolicies: true,
      price: true,
      saleDescription: true,
      saleContact: true,
    },
  });
  const horseMap: HorseMap = new Map(allHorses.map((h) => [h.name.toLowerCase(), h]));
  // Pedigree data for Generations detail, but not for displaying the tree itself on this page
  const tree = buildPedigreeTree(horse.name, horseMap, 10);
  const dupes = findDuplicates(tree);
  const generations = pedigreeDepth(horse.name, horseMap);
  const coi = inbreedingCoefficient(tree);

  const nameLower = horse.name.toLowerCase();
  const offspring = allHorses
    .filter((h) => h.sireName?.toLowerCase() === nameLower || h.damName?.toLowerCase() === nameLower)
    .sort((a, b) => a.name.localeCompare(b.name));

  const sire = horse.sireName ? horseMap.get(horse.sireName.toLowerCase()) : undefined;
  const dam = horse.damName ? horseMap.get(horse.damName.toLowerCase()) : undefined;

  // For stallion history entries, resolve dam name from damId
  const damIds = breedingHistory.map((p) => p.damId).filter(Boolean) as string[];
  const damRecords = damIds.length
    ? await prisma.horse.findMany({ where: { id: { in: damIds } }, select: { id: true, name: true } })
    : [];
  const damById = new Map(damRecords.map((d) => [d.id, d]));

  // Build system timeline events (auto-generated, read-only)
  type SysType = "birth" | "show" | "breeding" | "foal" | "sale";
  const systemEvents: { date: string; label: string; sublabel?: string; href?: string; imageUrl?: string | null; type: SysType }[] = [];
  if (horse.dob) systemEvents.push({ date: horse.dob.toISOString(), label: "Born", type: "birth" });
  for (const r of results) {
    if (r.date) systemEvents.push({
      date: r.date.toISOString(),
      label: r.event,
      sublabel: [r.placement, r.notes].filter(Boolean).join("  ·  ") || undefined,
      type: "show",
    });
  }
  for (const p of breedingHistory) {
    if (p.coverDate) {
      const partnerName = p.sireName ?? damById.get(p.damId)?.name ?? null;
      systemEvents.push({
        date: p.coverDate.toISOString(),
        label: p.sireName && horse.name.toLowerCase() !== p.sireName.toLowerCase()
          ? `Covered by ${p.sireName}`
          : partnerName ? `Covered — out of ${partnerName}` : "Covered",
        type: "breeding",
      });
    }
    if (p.status === "born" && p.foalId) {
      const foal = foalById.get(p.foalId);
      if (foal) {
        const birthIso = p.dueDate ? p.dueDate.toISOString() : p.coverDate ? new Date(new Date(p.coverDate).getTime() + 72 * 3600 * 1000).toISOString() : null;
        if (birthIso) systemEvents.push({
          date: birthIso,
          label: `Foal born: ${foal.name}`,
          href: `/registry/${foal.id}`,
          type: "foal",
        });
      }
    }
  }

  // Manual events (editable, reorderable)
  const manualEvents = horse.events.map(ev => ({
    id: ev.id,
    horseId: ev.horseId,
    date: ev.date.toISOString(),
    title: ev.title,
    description: ev.description,
    type: ev.type,
    imageUrl: ev.imageUrl,
    order: ev.order ?? 0,
    createdAt: ev.createdAt.toISOString(),
  }));

  const allHorsesJson = JSON.stringify(allHorses.map((h) => ({ id: h.id, name: h.name })));
  const hero = horse.photos[0];
  const admin = await isAdminLoggedIn();

  // Is this mare currently expecting a foal?
  const pregnancy = await prisma.pregnancy.findFirst({
    where: { damId: horse.id, status: "expecting" },
    orderBy: { createdAt: "desc" },
  });
  const expectedFoal = pregnancy?.foalId
    ? await prisma.horse.findUnique({ where: { id: pregnancy.foalId }, select: { id: true, name: true } })
    : null;
  const daysToDue = pregnancy?.dueDate
    ? Math.ceil((new Date(pregnancy.dueDate).getTime() - Date.now()) / 86400000)
    : null;

  const sectionTitle = (text: string) => (
    <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 16 }}>{text}</h2>
  );

  // Left detail rows (only non-empty shown)
  const details: [string, React.ReactNode][] = [
    ["Breed", horse.breed],
    ["Sex", horse.gender],
    ["Personality", horse.personality],
    ["Coat", (() => { const c = parseHorseCoat(horse.coat).cleanName; const sw = c ? getCoatSwatch(c) : null; return c ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{sw && <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: sw, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} />}{c}</span> : null; })()],
    ["Genotype", horse.genotype],
    ["Eye Color", horse.eyeColor],
    ["Base Stats", horse.baseStats],
    ["Height", horse.height],
    ["Discipline", horse.discipline],
    ["Microchip / Reg #", horse.microchip ?? horse.regNumber],
    ["Foal Date", horse.dob ? new Date(horse.dob).toLocaleDateString("en-GB") : null],
    ["Generations", generations > 0 ? String(generations) : null],
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/registry" style={{ display: "inline-block", fontSize: 13, color: "var(--white)", background: "var(--teal)", padding: "7px 16px", borderRadius: 6, textDecoration: "none", fontFamily: "var(--font-lato)", letterSpacing: "0.04em" }}>
          ‹ Back
        </Link>
        {admin && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={`/admin/horses/${horse.id}/papers`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "white", background: "var(--teal)", padding: "7px 16px", borderRadius: 6, textDecoration: "none", fontFamily: "var(--font-lato)", fontWeight: 700 }}>
              Papers
            </Link>
            <a href={`/api/horses/${horse.id}/export`} download style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--teal-dark)", background: "var(--white)", border: "1px solid var(--teal)", padding: "7px 16px", borderRadius: 6, textDecoration: "none", fontFamily: "var(--font-lato)", fontWeight: 700 }}>
              ↓ Export JSON
            </a>
            <Link href={`/admin/horses/${horse.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--teal-dark)", background: "var(--white)", border: "1px solid var(--teal)", padding: "7px 16px", borderRadius: 6, textDecoration: "none", fontFamily: "var(--font-lato)", fontWeight: 700 }}>
              Edit this horse
            </Link>
            <AdminHorseDeleteButton id={horse.id} name={horse.name} />
          </div>
        )}
      </div>

      {/* ===== Hero image ===== */}
      {hero ? (
        <HorseHero
          name={horse.name}
          isAdmin={admin}
          photos={horse.photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption, fill: p.fill }))}
          videos={horse.videos.map((v) => ({ id: v.id, url: v.url, caption: v.caption, mimeType: v.mimeType }))}
        />
      ) : (
        <div style={{ maxWidth: 920, margin: "0 auto 8px", aspectRatio: "16/8", background: "linear-gradient(135deg, var(--teal-muted), var(--cream-dark))", borderRadius: 8, border: "4px solid var(--gold-light)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Icon name="photo" size={46} color="var(--teal-light)" strokeWidth={1.3} />
          <span style={{ fontSize: 11, color: "var(--teal)", fontFamily: "var(--font-lato)", marginTop: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>No photos yet</span>
        </div>
      )}

      {/* ===== Name ===== */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 44, color: "var(--teal-dark)", lineHeight: 1.1 }}>{horse.name}</h1>
        <div style={{ fontSize: 14, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 6 }}>
          {[horse.breed, horse.gender, parseHorseCoat(horse.coat).cleanName || null].filter(Boolean).join("  ·  ") || "—"}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
          {horse.ownership && (
            <span style={{ background: (OWNERSHIP_COLORS[horse.ownership] ?? DEFAULT_OWNERSHIP_COLOR).bg, color: (OWNERSHIP_COLORS[horse.ownership] ?? DEFAULT_OWNERSHIP_COLOR).text, borderRadius: 12, padding: "4px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", fontFamily: "var(--font-lato)" }}>{horse.ownership}</span>
          )}
          {horse.withFoal && (
            <span style={{ background: "var(--sage-bg)", border: "1px solid var(--sage-border)", borderRadius: 12, padding: "4px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "var(--sage-text)", fontFamily: "var(--font-lato)" }}>In Foal</span>
          )}
          {horse.isCustomHorse && (
            <span style={{ background: "#EEF0FF", border: "1px solid #C0C8F8", borderRadius: 12, padding: "4px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#3B4AAA", fontFamily: "var(--font-lato)" }}>Custom Horse</span>
          )}
          {horse.hasCustomCoat && (
            <span style={{ background: "#F5EEFF", border: "1px solid #D4B8F8", borderRadius: 12, padding: "4px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#7B3FB8", fontFamily: "var(--font-lato)" }}>Custom Coat</span>
          )}
        </div>
        {horse.availableForBreeding && (
          <div style={{ marginTop: 14 }}>
            <a href={`/api/horses/${horse.id}/export?public=1`} download style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--teal-dark)", background: "var(--white)", border: "1px solid var(--border)", padding: "6px 14px", borderRadius: 6, textDecoration: "none", fontFamily: "var(--font-lato)", fontWeight: 600 }}>
              ↓ Download pedigree (.json)
            </a>
          </div>
        )}
      </div>

      {/* ===== Pregnancy banner ===== */}
      {pregnancy && (
        <div style={{ background: "linear-gradient(135deg, #F8ECF1, #FCE8F0)", border: "1px solid var(--dam-border)", borderRadius: 10, padding: "16px 22px", marginBottom: 28, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontFamily: "var(--font-lato)" }}>
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--dam-text)" }}>Currently in foal</span>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
              {pregnancy.sireName ? <>by <strong style={{ color: "var(--sire-text)" }}>{pregnancy.sireName}</strong>  ·  </> : null}
              {pregnancy.dueDate
                ? <>due {new Date(pregnancy.dueDate).toLocaleDateString("en-GB")}{daysToDue !== null && daysToDue >= 0 ? `  (${daysToDue} day${daysToDue !== 1 ? "s" : ""} to go)` : daysToDue !== null ? "  (overdue)" : ""}</>
                : "due date not set"}
            </div>
          </div>
          {expectedFoal && (
            <Link href={`/registry/${expectedFoal.id}`} style={{ background: "var(--dam-text)", color: "white", borderRadius: 6, padding: "9px 18px", fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "var(--font-lato)", whiteSpace: "nowrap" }}>
              View foal page →
            </Link>
          )}
        </div>
      )}

      {/* ===== Two info blocks ===== */}
      <div className="grid md:grid-cols-2 gap-6" style={{ marginBottom: 28 }}>
        {/* LEFT: details */}
        <div style={{ background: "#EDF3F1", border: "1px solid var(--border)", borderRadius: 10, padding: 24 }}>
          <RowGrid rows={details} />
          {horse.achievements && (
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: 15, color: "var(--teal-dark)", marginBottom: 6, textAlign: "center" }}>Competition Placements</div>
              <div style={{ fontSize: 13, fontFamily: "var(--font-lato)", color: "var(--text)", whiteSpace: "pre-wrap", textAlign: "center" }}>{horse.achievements}</div>
            </div>
          )}
        </div>

        {/* RIGHT: owner + parents + breeding */}
        <div>
          {(horse.ownerName || horse.ownerCharacter || horse.stablePrefix) && (
            <div style={{ background: "var(--teal-muted)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: 18 }}>
              <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)", marginBottom: 12 }}>Owned By</h3>
              <RowGrid rows={[
                ["Discord Name", horse.ownerName],
                ["Character Name", horse.ownerCharacter],
                ["Stable / Prefix", horse.stablePrefix],
              ]} labelColor="var(--teal-dark)" />
              {horse.videoUrl && (
                <a href={horse.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 14, background: "var(--white)", color: "var(--teal-dark)", border: "1px solid var(--teal)", padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: "var(--font-lato)", textDecoration: "none", letterSpacing: "0.05em" }}>
                  ▶ WATCH VIDEO
                </a>
              )}
            </div>
          )}

          <div style={{ padding: "0 4px" }}>
            <RowGrid rows={[
              ["Sire's Name", sire ? <Link href={`/registry/${sire.id}`} style={{ color: "var(--sire-text)", fontWeight: 700, textDecoration: "none" }}>{horse.sireName}</Link> : horse.sireName],
              ["Sire's Breed", sire?.breed],
              ["Dam's Name", dam ? <Link href={`/registry/${dam.id}`} style={{ color: "var(--dam-text)", fontWeight: 700, textDecoration: "none" }}>{horse.damName}</Link> : horse.damName],
              ["Dam's Breed", dam?.breed],
            ]} gap={18} />

            {horse.breedingFee && (
              <div style={{ marginTop: 18, display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)" }}>Breeding Fee</span>
                <span style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--gold)", fontWeight: 700 }}>{horse.breedingFee}</span>
              </div>
            )}
            {horse.breedingPolicies && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-lato)", marginBottom: 4 }}>Breeding Policies</div>
                <div style={{ fontSize: 13, fontFamily: "var(--font-lato)", color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{horse.breedingPolicies}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== For Sale banner ===== */}
      {horse.ownership === "For Sale" && (horse.price || horse.saleDescription || horse.saleContact) && (
        <div style={{ background: "linear-gradient(135deg, #FFF8E8, #FFF3D0)", border: "1px solid var(--gold-light)", borderRadius: 10, padding: "20px 24px", marginBottom: 28 }}>
          <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginBottom: horse.saleDescription ? 12 : 0 }}>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "#7A5C00" }}>Available for Sale</h2>
            {horse.price && <span style={{ fontFamily: "var(--font-playfair)", fontSize: 24, color: "var(--teal-dark)", fontWeight: 700 }}>{horse.price}</span>}
          </div>
          {horse.saleDescription && <p style={{ fontSize: 14, color: "var(--text)", fontFamily: "var(--font-lato)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{horse.saleDescription}</p>}
          {horse.saleContact && <div style={{ marginTop: 12, fontSize: 13, fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}><strong style={{ color: "var(--text)" }}>Contact:</strong> {horse.saleContact}</div>}
        </div>
      )}

      {/* ===== Description ===== */}
      {horse.description && (
        <div style={{ marginBottom: 28 }}>
          {sectionTitle("Description / Backstory")}
          <div className="horse-description" dangerouslySetInnerHTML={{ __html: horse.description }} />
        </div>
      )}

      {/* ===== Photo & video gallery ===== */}
      {(horse.photos.length > 1 || horse.videos.length > 0) && (
        <div style={{ marginBottom: 28 }}>
          {sectionTitle(horse.videos.length > 0 ? "Photos & Videos" : "Photos")}
          <PhotoGallery
            photos={horse.photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption }))}
            videos={horse.videos.map((v) => ({ id: v.id, url: v.url, caption: v.caption, mimeType: v.mimeType }))}
          />
        </div>
      )}

      {/* ===== Show results ===== */}
      {results.length > 0 && (
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: 28 }}>
          {sectionTitle("Show Results")}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", background: "var(--cream)", fontFamily: "var(--font-lato)", fontSize: 13 }}>
                {r.placement && <span style={{ background: "var(--gold-light)", color: "#6B5A2A", borderRadius: 12, padding: "3px 11px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{r.placement}</span>}
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, color: "var(--teal-dark)" }}>{r.event}</span>
                  {r.notes && <span style={{ color: "var(--text-muted)" }}>  —  {r.notes}</span>}
                </div>
                {r.date && <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{new Date(r.date).toLocaleDateString("en-GB")}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Pedigree ===== */}
      {(sire || dam) && (
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 16 }}>
            Pedigree{generations ? ` · ${generations} generation${generations !== 1 ? "s" : ""}` : ""}
          </h2>
          <PedigreeTree node={tree} dupes={dupes} allHorses={allHorsesJson} isAdmin={admin} title={horse.name} availableDepth={generations} coi={coi} />
        </div>
      )}

      {/* ===== Offspring ===== */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: horse.documents.length ? 28 : 0 }}>
        {sectionTitle(`Offspring${offspring.length ? ` (${offspring.length})` : ""}`)}
        {offspring.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>No recorded offspring for {horse.name}.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {offspring.map((o) => (
              <Link key={o.id} href={`/registry/${o.id}`} style={{ textDecoration: "none" }}>
                <div className="hover-row" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", background: "var(--cream)", transition: "border-color 0.15s" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--teal-dark)", fontFamily: "var(--font-lato)" }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
                    {[o.breed, o.gender].filter(Boolean).join(" · ") || "—"}
                    {o.sireName?.toLowerCase() === nameLower ? "  ·  by this sire" : "  ·  out of this dam"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ===== Documents ===== */}
      {horse.documents.length > 0 && (
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: 28 }}>
          {sectionTitle("Documents")}
          <DocumentGallery docs={horse.documents.map((d) => ({ id: d.id, url: d.url, label: d.label, type: d.type }))} />
        </div>
      )}

      {/* ===== Breeding history ===== */}
      {breedingHistory.length > 0 && (
        <BreedingHistory
          horseName={horse.name}
          entries={breedingHistory.map((p) => ({
            id: p.id,
            sireName: p.sireName,
            damId: p.damId,
            damName: damById.get(p.damId)?.name ?? null,
            foalId: p.foalId ? foalById.get(p.foalId)?.id ?? null : null,
            foalName: p.foalId ? foalById.get(p.foalId)?.name ?? null : null,
            coverDate: p.coverDate ? p.coverDate.toISOString() : null,
            status: p.status,
            notes: p.notes,
          }))}
        />
      )}

      {/* ===== Timeline ===== */}
      <HorseTimeline
        systemEvents={systemEvents}
        manualEvents={manualEvents}
        isAdmin={admin}
        horseId={horse.id}
      />
    </div>
  );
}

function RowGrid({ rows, labelColor = "var(--teal-dark)", gap = 10 }: {
  rows: [string, React.ReactNode][];
  labelColor?: string;
  gap?: number;
}) {
  const visible = rows.filter(([, v]) => v !== null && v !== undefined && v !== "");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: `${gap}px 16px`, fontSize: 13.5, fontFamily: "var(--font-lato)", alignItems: "baseline" }}>
      {visible.map(([label, value], i) => (
        <div key={i} style={{ display: "contents" }}>
          <span style={{ color: labelColor, fontWeight: 700 }}>{label}</span>
          <span style={{ color: "var(--text)" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function LegendDot({ bg, border, label }: { bg: string; border: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ display: "inline-block", width: 11, height: 11, background: bg, border: `1px solid ${border}`, borderRadius: 3 }} />
      {label}
    </span>
  );
}
