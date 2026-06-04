import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import PedigreeTree from "@/components/PedigreeTree";
import Icon from "@/components/Icon";
import { buildPedigreeTree, findDuplicates } from "@/lib/pedigree";
import type { HorseMap } from "@/lib/pedigree";

export const dynamic = "force-dynamic";

const OWNERSHIP_COLORS: Record<string, string> = {
  "Home": "#D4E3E1", "For Sale": "#FFF3D0", "Sold": "#E8E8E8",
  "Outside": "#E8F4E8", "Void": "#F3E0E0",
};

export default async function HorsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const horse = await prisma.horse.findUnique({ where: { id } });
  if (!horse) notFound();

  const allHorses = await prisma.horse.findMany({
    select: { id: true, name: true, breed: true, gender: true, coat: true, sireName: true, damName: true, ownership: true },
  });

  const horseMap: HorseMap = new Map(allHorses.map((h) => [h.name.toLowerCase(), h]));
  const tree = buildPedigreeTree(horse.name, horseMap, 5);
  const dupes = findDuplicates(tree);

  // Progeny — any horse whose sire or dam is this horse.
  const nameLower = horse.name.toLowerCase();
  const offspring = allHorses
    .filter((h) =>
      h.sireName?.toLowerCase() === nameLower || h.damName?.toLowerCase() === nameLower)
    .sort((a, b) => a.name.localeCompare(b.name));

  const sireId = horse.sireName ? horseMap.get(horse.sireName.toLowerCase())?.id : undefined;
  const damId = horse.damName ? horseMap.get(horse.damName.toLowerCase())?.id : undefined;

  const allHorsesJson = JSON.stringify(allHorses.map((h) => ({ id: h.id, name: h.name })));

  const sectionTitle = (text: string) => (
    <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 16 }}>{text}</h2>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/registry" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>
          ← Back to Registry
        </Link>
      </div>

      {/* ===== Hero ===== */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 24 }} className="flex flex-col md:flex-row">
        {/* Photo area (ready for future uploads) */}
        <div style={{
          width: "100%", maxWidth: 320, minHeight: 240, background: "linear-gradient(135deg, var(--teal-muted), var(--cream-dark))",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }} className="md:w-80">
          <Icon name="photo" size={44} color="var(--teal-light)" strokeWidth={1.3} />
          <span style={{ fontSize: 11, color: "var(--teal)", fontFamily: "var(--font-lato)", marginTop: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Photo coming soon
          </span>
        </div>

        {/* Details */}
        <div style={{ padding: 28, flex: 1 }}>
          <div className="flex flex-wrap items-start justify-between gap-3" style={{ marginBottom: 18 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 30, color: "var(--teal-dark)", lineHeight: 1.15 }}>
                {horse.name}
              </h1>
              <div style={{ fontSize: 14, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 4 }}>
                {[horse.breed, horse.coat].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {horse.gender && (
                <span style={{ background: horse.gender === "Stallion" ? "var(--sire-bg)" : "var(--dam-bg)", border: `1px solid ${horse.gender === "Stallion" ? "var(--sire-border)" : "var(--dam-border)"}`, borderRadius: 12, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: horse.gender === "Stallion" ? "var(--sire-text)" : "var(--dam-text)", fontFamily: "var(--font-lato)" }}>
                  {horse.gender}
                </span>
              )}
              {horse.ownership && (
                <span style={{ background: OWNERSHIP_COLORS[horse.ownership] ?? "#EEE", borderRadius: 12, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", fontFamily: "var(--font-lato)" }}>
                  {horse.ownership}
                </span>
              )}
              {horse.withFoal && (
                <span style={{ background: "var(--gold-light)", borderRadius: 12, padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#6B5A2A", fontFamily: "var(--font-lato)" }}>
                  In Foal
                </span>
              )}
            </div>
          </div>

          {/* Parents */}
          <div className="grid grid-cols-2 gap-4" style={{ marginBottom: 18 }}>
            <div style={{ background: "var(--sire-bg)", border: "1px solid var(--sire-border)", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--sire-text)", textTransform: "uppercase", fontFamily: "var(--font-lato)", marginBottom: 2 }}>Sire</div>
              {horse.sireName ? (
                sireId ? <Link href={`/registry/${sireId}`} style={{ color: "var(--sire-text)", fontWeight: 700, textDecoration: "none", fontFamily: "var(--font-lato)", fontSize: 14 }}>{horse.sireName}</Link>
                  : <span style={{ color: "var(--sire-text)", fontWeight: 700, fontFamily: "var(--font-lato)", fontSize: 14 }}>{horse.sireName}</span>
              ) : <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>Unknown</span>}
            </div>
            <div style={{ background: "var(--dam-bg)", border: "1px solid var(--dam-border)", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--dam-text)", textTransform: "uppercase", fontFamily: "var(--font-lato)", marginBottom: 2 }}>Dam</div>
              {horse.damName ? (
                damId ? <Link href={`/registry/${damId}`} style={{ color: "var(--dam-text)", fontWeight: 700, textDecoration: "none", fontFamily: "var(--font-lato)", fontSize: 14 }}>{horse.damName}</Link>
                  : <span style={{ color: "var(--dam-text)", fontWeight: 700, fontFamily: "var(--font-lato)", fontSize: 14 }}>{horse.damName}</span>
              ) : <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>Unknown</span>}
            </div>
          </div>

          {/* Fact grid */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto 1fr", gap: "8px 18px", fontSize: 13, fontFamily: "var(--font-lato)", alignItems: "baseline" }}>
            {([
              ["Microchip", horse.microchip],
              ["Date of Birth", horse.dob ? new Date(horse.dob).toLocaleDateString() : null],
              ["Coat", horse.coat],
              ["Breed", horse.breed],
            ] as const).map(([label, value]) => (
              <div key={label} style={{ display: "contents" }}>
                <span style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
                <span style={{ color: "var(--text)" }}>{value || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {horse.notes && (
        <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 20px", marginBottom: 24, fontSize: 13, fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--text)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>Notes</strong>
          <div style={{ marginTop: 4, lineHeight: 1.6 }}>{horse.notes}</div>
        </div>
      )}

      {/* ===== Pedigree ===== */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: 24 }}>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          {sectionTitle("Pedigree")}
          {dupes.size > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--inbreed-text)", background: "var(--inbreed-bg)", border: "1px solid var(--inbreed-border)", borderRadius: 16, padding: "4px 12px", fontFamily: "var(--font-lato)" }}>
              <Icon name="warning" size={14} color="var(--inbreed-text)" />
              Inbreeding — {dupes.size} duplicate ancestor{dupes.size !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16, fontFamily: "var(--font-lato)", display: "flex", gap: 18, flexWrap: "wrap" }}>
          <LegendDot bg="var(--sire-bg)" border="var(--sire-border)" label="Sire line" />
          <LegendDot bg="var(--dam-bg)" border="var(--dam-border)" label="Dam line" />
          <LegendDot bg="var(--inbreed-bg)" border="var(--inbreed-border)" label="Inbreeding" />
          <LegendDot bg="var(--unknown-bg)" border="var(--unknown-border)" label="Unknown" />
        </div>

        <PedigreeTree node={tree} dupes={dupes} allHorses={allHorsesJson} />
      </div>

      {/* ===== Offspring ===== */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          {sectionTitle(`Offspring${offspring.length ? ` (${offspring.length})` : ""}`)}
        </div>
        {offspring.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>
            No recorded offspring for {horse.name}.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {offspring.map((o) => (
              <Link key={o.id} href={`/registry/${o.id}`} style={{ textDecoration: "none" }}>
                <div className="hover-row" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", background: "var(--cream)", transition: "border-color 0.15s" }}
                >
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
