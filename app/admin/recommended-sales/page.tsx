import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildPedigreeTree, commonAncestors, inbreedingCoefficient, pedigreeDepth } from "@/lib/pedigree";
import type { HorseMap } from "@/lib/pedigree";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recommended Sales — Redfield Admin" };

const COI_THRESHOLD = 0.125;

function nodeDepth(n: ReturnType<typeof buildPedigreeTree>): number {
  if (!n) return 0;
  return Math.max(n.sire ? 1 + nodeDepth(n.sire) : 0, n.dam ? 1 + nodeDepth(n.dam) : 0);
}

// Normalize "Warlander X Andalusian" → "warlander"
function baseBreed(b: string | null) {
  if (!b) return null;
  return b.toLowerCase().replace(/\s+[x×].*$/, "").trim();
}

export default async function RecommendedSalesPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  const allHorses = await prisma.horse.findMany({
    select: { id: true, name: true, breed: true, gender: true, coat: true, genotype: true, sireName: true, damName: true, ownership: true, isImportedPlaceholder: true },
  });

  const horseMap: HorseMap = new Map(allHorses.map((h) => [h.name.toLowerCase(), h as Parameters<typeof buildPedigreeTree>[1] extends Map<string, infer V> ? V : never]));

  const home = allHorses.filter((h) => h.ownership === "Home");
  const homeMares     = home.filter((h) => h.gender === "Mare");
  const homeStallions = home.filter((h) => h.gender === "Stallion");

  // Pre-build trees + compute depths
  const treeCache = new Map<string, ReturnType<typeof buildPedigreeTree>>();
  const depthCache = new Map<string, number>();
  for (const h of home) {
    const tree = buildPedigreeTree(h.name, horseMap as HorseMap, 12);
    treeCache.set(h.id, tree);
    depthCache.set(h.id, nodeDepth(tree));
  }

  // ── Breed depth comparison ──────────────────────────────────────────
  // Group Home horses by base breed, compute avg depth per breed
  const breedDepths = new Map<string, number[]>();
  for (const h of home) {
    if (h.gender !== "Mare" && h.gender !== "Stallion") continue;
    const b = baseBreed(h.breed);
    if (!b) continue;
    const arr = breedDepths.get(b) ?? [];
    arr.push(depthCache.get(h.id) ?? 0);
    breedDepths.set(b, arr);
  }
  const breedAvg = new Map<string, number>();
  for (const [b, depths] of breedDepths) {
    breedAvg.set(b, depths.reduce((a, c) => a + c, 0) / depths.length);
  }

  // ── COI analysis ────────────────────────────────────────────────────
  type Result = {
    id: string; name: string; gender: string | null; breed: string | null; coat: string | null;
    cleanPartners: number; totalPartners: number; coiSamples: number[];
    depth: number; breedAvgDepth: number | null; depthDelta: number | null;
  };
  const results: Result[] = [];

  for (const horse of home) {
    if (horse.gender !== "Mare" && horse.gender !== "Stallion") continue;
    const partners = horse.gender === "Mare" ? homeStallions : homeMares;
    let clean = 0;
    const coiSamples: number[] = [];

    for (const partner of partners) {
      if (partner.id === horse.id) continue;
      const foal = {
        id: "foal", name: "foal", breed: null, gender: null, coat: null,
        sire: horse.gender === "Mare" ? treeCache.get(partner.id) ?? null : treeCache.get(horse.id) ?? null,
        dam:  horse.gender === "Mare" ? treeCache.get(horse.id) ?? null   : treeCache.get(partner.id) ?? null,
      };
      const shared = commonAncestors(foal).size;
      const coi = shared > 0 ? inbreedingCoefficient(foal) : 0;
      coiSamples.push(coi);
      if (coi < COI_THRESHOLD) clean++;
    }

    const depth = depthCache.get(horse.id) ?? 0;
    const b = baseBreed(horse.breed);
    const avg = b ? (breedAvg.get(b) ?? null) : null;
    const delta = avg !== null ? depth - avg : null;

    results.push({ id: horse.id, name: horse.name, gender: horse.gender, breed: horse.breed, coat: horse.coat, cleanPartners: clean, totalPartners: partners.length, coiSamples, depth, breedAvgDepth: avg, depthDelta: delta });
  }

  results.sort((a, b) => a.cleanPartners - b.cleanPartners || a.name.localeCompare(b.name));

  const noClean = results.filter((r) => r.cleanPartners === 0);
  const veryFew = results.filter((r) => r.cleanPartners > 0 && r.cleanPartners <= 2);
  const fewMore = results.filter((r) => r.cleanPartners > 2 && r.cleanPartners <= 5);

  // Shallow pedigree: at least 2 horses of same breed, and this horse is 2+ gens below breed avg
  const shallowPedigree = results
    .filter((r) => {
      if (r.depthDelta === null) return false;
      const b = baseBreed(r.breed);
      if (!b) return false;
      const count = breedDepths.get(b)?.length ?? 0;
      return count >= 2 && r.depthDelta <= -2;
    })
    .sort((a, b) => (a.depthDelta ?? 0) - (b.depthDelta ?? 0));

  function avgCoi(r: Result) {
    if (!r.coiSamples.length) return 0;
    return r.coiSamples.reduce((a, b) => a + b, 0) / r.coiSamples.length;
  }

  function HorseRow({ r, showDepth, urgent }: { r: Result; showDepth?: boolean; urgent?: boolean }) {
    const avg = avgCoi(r);
    const pct = r.totalPartners > 0 ? Math.round((r.cleanPartners / r.totalPartners) * 100) : 0;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderBottom: "1px solid var(--border)", background: urgent ? "var(--inbreed-bg)" : "var(--white)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/registry/${r.id}`} style={{ fontSize: 14, fontWeight: 700, color: "var(--teal-dark)", fontFamily: "var(--font-lato)", textDecoration: "none" }}>{r.name}</Link>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 1 }}>
            {[r.gender, r.breed, r.coat].filter(Boolean).join(" · ")}
          </div>
        </div>
        {showDepth ? (
          <>
            <div style={{ textAlign: "center", minWidth: 80 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--inbreed-text)", fontFamily: "var(--font-playfair)" }}>{r.depth} gen</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>this horse</div>
            </div>
            <div style={{ textAlign: "center", minWidth: 80 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{r.breedAvgDepth?.toFixed(1)} gen</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>breed avg</div>
            </div>
            <div style={{ textAlign: "center", minWidth: 60 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--inbreed-text)", fontFamily: "var(--font-lato)" }}>{r.depthDelta?.toFixed(1)}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>below avg</div>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", minWidth: 80 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: r.cleanPartners === 0 ? "var(--inbreed-text)" : r.cleanPartners <= 2 ? "#B07020" : "var(--teal-dark)", fontFamily: "var(--font-playfair)" }}>
                {r.cleanPartners}<span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>/{r.totalPartners}</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>clean partners</div>
            </div>
            <div style={{ textAlign: "center", minWidth: 70 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{pct}%</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>compatible</div>
            </div>
            <div style={{ textAlign: "center", minWidth: 70 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: avg >= 0.125 ? "var(--inbreed-text)" : "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{(avg * 100).toFixed(1)}%</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>avg COI</div>
            </div>
          </>
        )}
        <Link href={`/admin/horses/${r.id}`} style={{ fontSize: 12, color: "var(--teal)", fontFamily: "var(--font-lato)", textDecoration: "none", flexShrink: 0 }}>Edit →</Link>
      </div>
    );
  }

  function Tier({ title, subtitle, horses, showDepth, urgent }: { title: string; subtitle: string; horses: Result[]; showDepth?: boolean; urgent?: boolean }) {
    if (!horses.length) return null;
    return (
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 12 }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: urgent ? "var(--inbreed-text)" : "var(--teal-dark)", margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)", margin: "3px 0 0" }}>{subtitle}</p>
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          {horses.map((r) => <HorseRow key={r.id} r={r} showDepth={showDepth} urgent={urgent} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>‹ Admin</Link>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", margin: 0 }}>Recommended Sales</h1>
      </div>

      <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 20px", marginBottom: 28, fontSize: 13, fontFamily: "var(--font-lato)", color: "var(--text-muted)", lineHeight: 1.6 }}>
        Two reasons a horse may appear here: <strong style={{ color: "var(--teal-dark)" }}>too few clean breeding partners</strong> (COI &lt; 12.5%), or a <strong style={{ color: "var(--teal-dark)" }}>shallow pedigree</strong> compared to others of the same breed — meaning they contribute less genetic depth to foals.
      </div>

      {noClean.length === 0 && veryFew.length === 0 && fewMore.length === 0 && shallowPedigree.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>
          All your horses are in good shape — no sales recommended right now.
        </div>
      )}

      <Tier title="No Clean Partners" subtitle="Cannot produce a clean foal (<12.5% COI) with any of your current Home horses." horses={noClean} urgent />
      <Tier title="1–2 Clean Partners" subtitle="Very limited options — consider selling soon." horses={veryFew} />
      <Tier title="3–5 Clean Partners" subtitle="Starting to run out of options — worth keeping an eye on." horses={fewMore} />
      <Tier title="Shallow Pedigree" subtitle="These horses have 2+ fewer recorded generations than the average for their breed. They add less depth to foals and may limit pedigree quality." horses={shallowPedigree} showDepth />
    </div>
  );
}
