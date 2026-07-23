import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import PedigreeTree from "@/components/PedigreeTree";
import AdminHorseDeleteButton from "@/components/AdminHorseDeleteButton";
import { parseHorseCoat } from "@/lib/horseCoat";
import Icon from "@/components/Icon";
import PhotoGallery from "@/components/PhotoGallery";
import HorseHero from "@/components/HorseHero";
import BreedingHistory from "@/app/registry/[id]/BreedingHistory";
import HorseTimeline from "@/app/registry/[id]/HorseTimeline";
import { buildPedigreeTree, findDuplicates, pedigreeDepth, inbreedingCoefficient } from "@/lib/pedigree";
import type { HorseMap } from "@/lib/pedigree";
import { isAdminLoggedIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ForSaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const horse = await prisma.horse.findUnique({
    where: { id, ownership: "For Sale" },
    include: {
      photos: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      videos: { orderBy: { order: "asc" } },
      documents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!horse) notFound();

  const results = await prisma.result.findMany({ where: { horseId: id }, orderBy: { date: "desc" } });

  const breedingHistory = await prisma.pregnancy.findMany({
    where: { OR: [{ damId: horse.id }, { sireName: { equals: horse.name, mode: "insensitive" } }] },
    orderBy: { coverDate: "desc" },
  });
  const foalIds = breedingHistory.map((p) => p.foalId).filter(Boolean) as string[];
  const foalRecords = foalIds.length
    ? await prisma.horse.findMany({ where: { id: { in: foalIds } }, select: { id: true, name: true } })
    : [];
  const foalById = new Map(foalRecords.map((f) => [f.id, f]));
  const damIds = breedingHistory.map((p) => p.damId).filter(Boolean) as string[];
  const damRecords = damIds.length
    ? await prisma.horse.findMany({ where: { id: { in: damIds } }, select: { id: true, name: true } })
    : [];
  const damById = new Map(damRecords.map((d) => [d.id, d]));

  const allHorses = await prisma.horse.findMany({
    select: {
      id: true, name: true, breed: true, gender: true, coat: true, genotype: true,
      sireName: true, damName: true, ownership: true, isImportedPlaceholder: true,
      regNumber: true, stablePrefix: true, breedingFee: true, breedingPolicies: true,
      price: true, saleDescription: true, saleContact: true,
    },
  });
  const horseMap: HorseMap = new Map(allHorses.map((h) => [h.name.toLowerCase(), h]));
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

  const allHorsesJson = JSON.stringify(allHorses.map((h) => ({ id: h.id, name: h.name })));
  const hero = horse.photos[0];
  const admin = await isAdminLoggedIn();

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

  // Timeline events
  type TLType = "birth" | "show" | "breeding" | "foal" | "sale";
  const timelineEvents: { date: string; label: string; sublabel?: string; href?: string; type: TLType }[] = [];
  if (horse.dob) timelineEvents.push({ date: horse.dob.toISOString(), label: "Born", type: "birth" });
  for (const r of results) {
    if (r.date) timelineEvents.push({
      date: r.date.toISOString(), label: r.event,
      sublabel: [r.placement, r.notes].filter(Boolean).join("  ·  ") || undefined, type: "show",
    });
  }
  for (const p of breedingHistory) {
    if (p.coverDate) {
      const partnerName = p.sireName ?? damById.get(p.damId)?.name ?? null;
      timelineEvents.push({
        date: p.coverDate.toISOString(),
        label: p.sireName && horse.name.toLowerCase() !== p.sireName.toLowerCase()
          ? `Covered by ${p.sireName}` : partnerName ? `Covered — out of ${partnerName}` : "Covered",
        type: "breeding",
      });
    }
    if (p.status === "born" && p.foalId) {
      const foal = foalById.get(p.foalId);
      if (foal) {
        const birthIso = p.dueDate ? p.dueDate.toISOString()
          : p.coverDate ? new Date(new Date(p.coverDate).getTime() + 72 * 3600 * 1000).toISOString() : null;
        if (birthIso) timelineEvents.push({ date: birthIso, label: `Foal born: ${foal.name}`, href: `/registry/${foal.id}`, type: "foal" });
      }
    }
  }

  const details: [string, string | null | undefined][] = [
    ["Breed", horse.breed],
    ["Sex", horse.gender],
    ["Personality", horse.personality],
    ["Coat", parseHorseCoat(horse.coat).cleanName || null],
    ["Genotype", horse.genotype],
    ["Eye Color", horse.eyeColor],
    ["Base Stats", horse.baseStats],
    ["Height", horse.height],
    ["Discipline", horse.discipline],
    ["Microchip / Reg #", horse.microchip ?? horse.regNumber],
    ["Foal Date", horse.dob ? new Date(horse.dob).toLocaleDateString("en-GB") : null],
    ["Generations", generations > 0 ? String(generations) : null],
  ];

  const sectionTitle = (text: string) => (
    <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 16 }}>{text}</h2>
  );

  return (
    <div>
      {/* ── FOR SALE banner ── */}
      <div style={{ background: "var(--cream-dark)", borderBottom: "2px solid var(--gold)" }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4" style={{ flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)" }}>
            <Link href="/for-sale" style={{ color: "var(--teal)", textDecoration: "none" }}>Horses for Sale</Link>
            <span>›</span>
            <span style={{ color: "var(--text)" }}>{horse.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {horse.price && (
              <span style={{ fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 700, color: "var(--teal-dark)" }}>{horse.price}</span>
            )}
            <span style={{ background: "var(--gold)", color: "var(--teal-dark)", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", fontFamily: "var(--font-lato)" }}>
              FOR SALE
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Admin bar */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/for-sale" style={{ display: "inline-block", fontSize: 13, color: "var(--white)", background: "var(--teal)", padding: "7px 16px", borderRadius: 6, textDecoration: "none", fontFamily: "var(--font-lato)", letterSpacing: "0.04em" }}>
            ‹ For Sale
          </Link>
          {admin && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href={`/registry/${horse.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--teal-dark)", background: "var(--white)", border: "1px solid var(--teal)", padding: "7px 16px", borderRadius: 6, textDecoration: "none", fontFamily: "var(--font-lato)", fontWeight: 700 }}>
                Registry page
              </Link>
              <Link href={`/admin/horses/${horse.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--teal-dark)", background: "var(--white)", border: "1px solid var(--teal)", padding: "7px 16px", borderRadius: 6, textDecoration: "none", fontFamily: "var(--font-lato)", fontWeight: 700 }}>
                Edit this horse
              </Link>
              <AdminHorseDeleteButton id={horse.id} name={horse.name} />
            </div>
          )}
        </div>

        {/* Hero */}
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

        {/* Name */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 44, color: "var(--teal-dark)", lineHeight: 1.1 }}>{horse.name}</h1>
          <div style={{ fontSize: 14, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 6 }}>
            {[horse.breed, horse.gender, parseHorseCoat(horse.coat).cleanName || null].filter(Boolean).join("  ·  ") || "—"}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
            <span style={{ background: "#FFF3D0", borderRadius: 12, padding: "4px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", fontFamily: "var(--font-lato)", color: "#7A5C00" }}>For Sale</span>
            {horse.withFoal && (
              <span style={{ background: "var(--sage-bg)", border: "1px solid var(--sage-border)", borderRadius: 12, padding: "4px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "var(--sage-text)", fontFamily: "var(--font-lato)" }}>In Foal</span>
            )}
          </div>
        </div>

        {/* Pregnancy banner */}
        {pregnancy && (
          <div style={{ background: "linear-gradient(135deg, #F8ECF1, #FCE8F0)", border: "1px solid var(--dam-border)", borderRadius: 10, padding: "16px 22px", marginBottom: 28, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontFamily: "var(--font-lato)" }}>
              <span style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--dam-text)" }}>🤰 Currently in foal</span>
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

        {/* Two info blocks */}
        <div className="grid md:grid-cols-2 gap-6" style={{ marginBottom: 28 }}>
          <div style={{ background: "#EDF3F1", border: "1px solid var(--border)", borderRadius: 10, padding: 24 }}>
            <RowGrid rows={details} />
            {horse.achievements && (
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "var(--font-playfair)", fontSize: 15, color: "var(--teal-dark)", marginBottom: 6, textAlign: "center" }}>Competition Placements</div>
                <div style={{ fontSize: 13, fontFamily: "var(--font-lato)", color: "var(--text)", whiteSpace: "pre-wrap", textAlign: "center" }}>{horse.achievements}</div>
              </div>
            )}
          </div>

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
                ["Sire's Name", sire ? <Link key="s" href={`/registry/${sire.id}`} style={{ color: "var(--sire-text)", fontWeight: 700, textDecoration: "none" }}>{horse.sireName}</Link> : horse.sireName],
                ["Sire's Breed", sire?.breed],
                ["Dam's Name", dam ? <Link key="d" href={`/registry/${dam.id}`} style={{ color: "var(--dam-text)", fontWeight: 700, textDecoration: "none" }}>{horse.damName}</Link> : horse.damName],
                ["Dam's Breed", dam?.breed],
              ]} gap={18} />
            </div>

            {/* Sale info box */}
            {(horse.price || horse.saleDescription || horse.saleContact) && (
              <div style={{ background: "linear-gradient(135deg, #FFF8E8, #FFF3D0)", border: "1px solid var(--gold-light)", borderRadius: 10, padding: "20px 24px", marginTop: 18 }}>
                <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginBottom: horse.saleDescription ? 12 : 0 }}>
                  <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "#7A5C00", margin: 0 }}>Available for Sale</h2>
                  {horse.price && <span style={{ fontFamily: "var(--font-playfair)", fontSize: 24, color: "var(--teal-dark)", fontWeight: 700 }}>{horse.price}</span>}
                </div>
                {horse.saleDescription && <p style={{ fontSize: 14, color: "var(--text)", fontFamily: "var(--font-lato)", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>{horse.saleDescription}</p>}
                {horse.saleContact && <div style={{ marginTop: 12, fontSize: 13, fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}><strong style={{ color: "var(--text)" }}>Contact:</strong> {horse.saleContact}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {horse.description && (
          <div style={{ marginBottom: 28 }}>
            {sectionTitle("Description / Backstory")}
            <p style={{ fontSize: 14.5, color: "var(--text)", fontFamily: "var(--font-lato)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{horse.description}</p>
          </div>
        )}

        {/* Photo gallery */}
        {(horse.photos.length > 1 || horse.videos.length > 0) && (
          <div style={{ marginBottom: 28 }}>
            {sectionTitle(horse.videos.length > 0 ? "Photos & Videos" : "Photos")}
            <PhotoGallery
              photos={horse.photos.map((p) => ({ id: p.id, url: p.url, caption: p.caption }))}
              videos={horse.videos.map((v) => ({ id: v.id, url: v.url, caption: v.caption, mimeType: v.mimeType }))}
            />
          </div>
        )}

        {/* Show results */}
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

        {/* Pedigree */}
        {(sire || dam) && (
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", margin: 0 }}>
                Pedigree{generations ? ` · ${generations} generation${generations !== 1 ? "s" : ""}` : ""}
              </h2>
              {coi > 0 && (
                <span style={{
                  fontSize: 12, fontFamily: "var(--font-lato)", fontWeight: 700,
                  color: coi >= 0.125 ? "var(--inbreed-text)" : "var(--text-muted)",
                  background: coi >= 0.125 ? "var(--inbreed-bg)" : "var(--cream)",
                  border: `1px solid ${coi >= 0.125 ? "var(--inbreed-border)" : "var(--border)"}`,
                  borderRadius: 10, padding: "2px 10px",
                }}>
                  COI {(coi * 100).toFixed(1)}%
                </span>
              )}
            </div>
            <PedigreeTree node={tree} dupes={dupes} allHorses={allHorsesJson} isAdmin={admin} title={horse.name} availableDepth={generations} />
          </div>
        )}

        {/* Offspring */}
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: 28 }}>
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

        {/* Documents */}
        {horse.documents.length > 0 && (
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: 28 }}>
            {sectionTitle("Documents")}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {horse.documents.map((d) => (
                <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" className="hover-row"
                  style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", background: "var(--cream)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>
                  <Icon name="registry" size={18} color="var(--teal)" />
                  <span style={{ flex: 1, color: "var(--teal-dark)", fontWeight: 600, fontSize: 13 }}>{d.label}</span>
                  {d.type && <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--white)", borderRadius: 10, padding: "2px 8px" }}>{d.type}</span>}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Breeding history */}
        {breedingHistory.length > 0 && (
          <BreedingHistory
            horseName={horse.name}
            entries={breedingHistory.map((p) => ({
              id: p.id, sireName: p.sireName, damId: p.damId,
              damName: damById.get(p.damId)?.name ?? null,
              foalId: p.foalId ? foalById.get(p.foalId)?.id ?? null : null,
              foalName: p.foalId ? foalById.get(p.foalId)?.name ?? null : null,
              coverDate: p.coverDate ? p.coverDate.toISOString() : null,
              status: p.status, notes: p.notes,
            }))}
          />
        )}

        {/* Timeline */}
        {timelineEvents.length > 0 && <HorseTimeline systemEvents={timelineEvents} manualEvents={[]} isAdmin={false} horseId={horse.id} />}
      </div>
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
