import React from "react";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { parseHorseCoat } from "@/lib/horseCoat";
import { getCoatSwatch } from "@/lib/coatSwatch";
import HorseHero from "@/components/HorseHero";
import PedigreeTree from "@/components/PedigreeTree";
import PhotoGallery from "@/components/PhotoGallery";
import Icon from "@/components/Icon";
import BreedingHistory from "@/app/registry/[id]/BreedingHistory";
import HorseTimeline from "@/app/registry/[id]/HorseTimeline";
import { buildPedigreeTree, findDuplicates, pedigreeDepth, inbreedingCoefficient } from "@/lib/pedigree";
import type { HorseMap } from "@/lib/pedigree";
import { isAdminLoggedIn } from "@/lib/auth";
import BreedingSubnav from "../../BreedingSubnav";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = await prisma.horse.findUnique({ where: { id }, select: { name: true } });
  return { title: `${h?.name ?? "Stallion"} at Stud — Redfield Equestrian Centre` };
}

export default async function StudProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const horse = await prisma.horse.findUnique({
    where: { id, gender: "Stallion", availableForBreeding: true },
    include: {
      photos: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      documents: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { date: "asc" } },
    },
  });
  if (!horse) notFound();

  const admin = await isAdminLoggedIn();
  const coat = parseHorseCoat(horse.coat).cleanName || null;
  const swatch = coat ? getCoatSwatch(coat) : null;

  const results = await prisma.result.findMany({ where: { horseId: id }, orderBy: { date: "desc" } });
  const breedingHistory = await prisma.pregnancy.findMany({
    where: { OR: [{ damId: horse.id }, { sireName: horse.name }] },
    orderBy: { coverDate: "desc" },
  });

  const allHorses = await prisma.horse.findMany({
    select: { id: true, name: true, breed: true, gender: true, coat: true, genotype: true, sireName: true, damName: true, ownership: true, isImportedPlaceholder: true, regNumber: true, stablePrefix: true, breedingFee: true, breedingPolicies: true, price: true, saleDescription: true, saleContact: true },
  });
  const horseMap: HorseMap = new Map(allHorses.map(h => [h.name.toLowerCase(), h]));
  const tree = buildPedigreeTree(horse.name, horseMap, 10);
  const dupes = findDuplicates(tree);
  const generations = pedigreeDepth(horse.name, horseMap);
  const coi = inbreedingCoefficient(tree);
  const allHorsesJson = JSON.stringify(allHorses.map(h => ({ id: h.id, name: h.name })));

  const nameLower = horse.name.toLowerCase();
  const offspring = allHorses.filter(h => h.sireName?.toLowerCase() === nameLower).sort((a, b) => a.name.localeCompare(b.name));

  const sire = horse.sireName ? horseMap.get(horse.sireName.toLowerCase()) : undefined;
  const dam = horse.damName ? horseMap.get(horse.damName.toLowerCase()) : undefined;

  const damIds = breedingHistory.map(p => p.damId).filter(Boolean) as string[];
  const damRecords = damIds.length ? await prisma.horse.findMany({ where: { id: { in: damIds } }, select: { id: true, name: true } }) : [];
  const damById = new Map(damRecords.map(d => [d.id, d]));

  const foalIds = breedingHistory.map(p => p.foalId).filter(Boolean) as string[];
  const foalRecords = foalIds.length ? await prisma.horse.findMany({ where: { id: { in: foalIds } }, select: { id: true, name: true } }) : [];
  const foalById = new Map(foalRecords.map(f => [f.id, f]));

  type TimelineType = "birth" | "show" | "breeding" | "foal" | "sale" | "training" | "health" | "competition" | "milestone" | "note";
  const timelineEvents: { date: string; label: string; sublabel?: string; href?: string; imageUrl?: string | null; type: TimelineType }[] = [];
  if (horse.dob) timelineEvents.push({ date: horse.dob.toISOString(), label: "Born", type: "birth" });
  for (const r of results) {
    if (r.date) timelineEvents.push({ date: r.date.toISOString(), label: r.event, sublabel: [r.placement, r.notes].filter(Boolean).join("  ·  ") || undefined, type: "show" });
  }
  for (const p of breedingHistory) {
    if (p.coverDate) timelineEvents.push({ date: p.coverDate.toISOString(), label: p.sireName ? `Covered — out of ${damById.get(p.damId)?.name ?? "mare"}` : `Covered by ${p.sireName}`, type: "breeding" });
    if (p.status === "born" && p.foalId) {
      const foal = foalById.get(p.foalId);
      const birthIso = p.dueDate ? p.dueDate.toISOString() : p.coverDate ? new Date(new Date(p.coverDate).getTime() + 72 * 3600 * 1000).toISOString() : null;
      if (foal && birthIso) timelineEvents.push({ date: birthIso, label: `Foal born: ${foal.name}`, href: `/registry/${foal.id}`, type: "foal" });
    }
  }
  for (const ev of horse.events) {
    timelineEvents.push({ date: ev.date.toISOString(), label: ev.title, sublabel: ev.description ?? undefined, imageUrl: ev.imageUrl, type: ev.type as TimelineType });
  }
  timelineEvents.sort((a, b) => a.date.localeCompare(b.date));

  const details: [string, React.ReactNode][] = [
    ["Breed", horse.breed],
    ["Coat", coat ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{swatch && <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: swatch, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} />}{coat}</span> : null],
    ["Genotype", horse.genotype],
    ["Height", horse.height],
    ["Discipline", horse.discipline],
    ["Foal Date", horse.dob ? new Date(horse.dob).toLocaleDateString() : null],
    ["Reg #", horse.regNumber],
    ["Generations", generations > 0 ? String(generations) : null],
  ];

  const hero = horse.photos[0];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <BreedingSubnav active="/breeding/studs" />

      <div className="mb-6 flex items-center justify-between gap-3" style={{ marginTop: 20 }}>
        <Link href="/breeding/studs" style={{ display: "inline-block", fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>
          ‹ All Studs
        </Link>
        {admin && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={`/registry/${horse.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--teal-dark)", background: "var(--white)", border: "1px solid var(--teal)", padding: "7px 16px", borderRadius: 6, textDecoration: "none", fontFamily: "var(--font-lato)", fontWeight: 700 }}>
              Registry page
            </Link>
            <Link href={`/admin/horses/${horse.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--teal-dark)", background: "var(--white)", border: "1px solid var(--teal)", padding: "7px 16px", borderRadius: 6, textDecoration: "none", fontFamily: "var(--font-lato)", fontWeight: 700 }}>
              Edit
            </Link>
          </div>
        )}
      </div>

      {hero ? (
        <HorseHero name={horse.name} isAdmin={admin} photos={horse.photos.map(p => ({ id: p.id, url: p.url, caption: p.caption, fill: p.fill }))} />
      ) : (
        <div style={{ maxWidth: 920, margin: "0 auto 8px", aspectRatio: "16/8", background: "linear-gradient(135deg, var(--teal-muted), var(--cream-dark))", borderRadius: 8, border: "4px solid var(--gold-light)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Icon name="photo" size={46} color="var(--teal-light)" strokeWidth={1.3} />
          <span style={{ fontSize: 11, color: "var(--teal)", fontFamily: "var(--font-lato)", marginTop: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>No photos yet</span>
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 44, color: "var(--teal-dark)", lineHeight: 1.1 }}>{horse.name}</h1>
        <div style={{ fontSize: 14, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 6 }}>
          {[horse.breed, "Stallion", coat].filter(Boolean).join("  ·  ") || "—"}
        </div>
        <div style={{ marginTop: 12 }}>
          <span style={{ background: "var(--sire-bg)", border: "1px solid var(--sire-border)", borderRadius: 12, padding: "4px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "var(--sire-text)", fontFamily: "var(--font-lato)" }}>AT STUD</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6" style={{ marginBottom: 28 }}>
        <div style={{ background: "#EDF3F1", border: "1px solid var(--border)", borderRadius: 10, padding: 24 }}>
          <RowGrid rows={details} />
        </div>

        <div>
          <div style={{ padding: "0 4px" }}>
            <RowGrid rows={[
              ["Sire's Name", sire ? <Link href={`/registry/${sire.id}`} style={{ color: "var(--sire-text)", fontWeight: 700, textDecoration: "none" }}>{horse.sireName}</Link> : horse.sireName],
              ["Sire's Breed", sire?.breed],
              ["Dam's Name", dam ? <Link href={`/registry/${dam.id}`} style={{ color: "var(--dam-text)", fontWeight: 700, textDecoration: "none" }}>{horse.damName}</Link> : horse.damName],
              ["Dam's Breed", dam?.breed],
            ]} gap={18} />

            {horse.breedingFee && (
              <div style={{ marginTop: 18, display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)" }}>Stud Fee</span>
                <span style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--gold)", fontWeight: 700 }}>{horse.breedingFee}</span>
              </div>
            )}
            {horse.breedingPolicies && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-lato)", marginBottom: 4 }}>Policies</div>
                <div style={{ fontSize: 13, fontFamily: "var(--font-lato)", color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{horse.breedingPolicies}</div>
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <Link href={`/registry/${horse.id}`} style={{ fontSize: 12, color: "var(--teal)", fontFamily: "var(--font-lato)", textDecoration: "none" }}>Full registry profile →</Link>
            </div>
          </div>
        </div>
      </div>

      {horse.description && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 16 }}>About</h2>
          <p style={{ fontSize: 14.5, color: "var(--text)", fontFamily: "var(--font-lato)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{horse.description}</p>
        </div>
      )}

      {horse.photos.length > 1 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 16 }}>Photos</h2>
          <PhotoGallery photos={horse.photos.map(p => ({ id: p.id, url: p.url, caption: p.caption }))} />
        </div>
      )}

      {results.length > 0 && (
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 16 }}>Show Results</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map(r => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", background: "var(--cream)", fontFamily: "var(--font-lato)", fontSize: 13 }}>
                {r.placement && <span style={{ background: "var(--gold-light)", color: "#6B5A2A", borderRadius: 12, padding: "3px 11px", fontSize: 11, fontWeight: 700 }}>{r.placement}</span>}
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, color: "var(--teal-dark)" }}>{r.event}</span>
                  {r.notes && <span style={{ color: "var(--text-muted)" }}>  —  {r.notes}</span>}
                </div>
                {r.date && <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{new Date(r.date).toLocaleDateString()}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(sire || dam) && (
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", margin: 0 }}>
              Pedigree{generations ? ` · ${generations} generation${generations !== 1 ? "s" : ""}` : ""}
            </h2>
            {coi > 0 && (
              <span style={{ fontSize: 12, fontFamily: "var(--font-lato)", fontWeight: 700, color: coi >= 0.125 ? "var(--inbreed-text)" : "var(--text-muted)", background: coi >= 0.125 ? "var(--inbreed-bg)" : "var(--cream)", border: `1px solid ${coi >= 0.125 ? "var(--inbreed-border)" : "var(--border)"}`, borderRadius: 10, padding: "2px 10px" }}>
                COI {(coi * 100).toFixed(1)}%
              </span>
            )}
          </div>
          <PedigreeTree node={tree} dupes={dupes} allHorses={allHorsesJson} isAdmin={admin} title={horse.name} availableDepth={generations} />
        </div>
      )}

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: 28 }}>
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 16 }}>Offspring ({offspring.length})</h2>
        {offspring.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>No recorded offspring.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {offspring.map(o => (
              <Link key={o.id} href={`/registry/${o.id}`} style={{ textDecoration: "none" }}>
                <div className="hover-row" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", background: "var(--cream)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--teal-dark)", fontFamily: "var(--font-lato)" }}>{o.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{[o.breed, o.gender].filter(Boolean).join(" · ") || "—"}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {breedingHistory.length > 0 && (
        <BreedingHistory
          horseName={horse.name}
          entries={breedingHistory.map(p => ({
            id: p.id, sireName: p.sireName, damId: p.damId,
            damName: damById.get(p.damId)?.name ?? null,
            foalId: p.foalId ? foalById.get(p.foalId)?.id ?? null : null,
            foalName: p.foalId ? foalById.get(p.foalId)?.name ?? null : null,
            coverDate: p.coverDate ? p.coverDate.toISOString() : null,
            status: p.status, notes: p.notes,
          }))}
        />
      )}

      <HorseTimeline systemEvents={timelineEvents as import("@/app/registry/[id]/HorseTimeline").SystemEvent[]} manualEvents={[]} isAdmin={false} horseId={horse.id} />
    </div>
  );
}

function RowGrid({ rows, labelColor = "var(--teal-dark)", gap = 10 }: { rows: [string, React.ReactNode][]; labelColor?: string; gap?: number }) {
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
