"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PedigreeTree from "@/components/PedigreeTree";
import Icon from "@/components/Icon";
import { buildPedigreeTree, commonAncestors, inbreedingCoefficient } from "@/lib/pedigree";
import type { HorseMap, HorseNode } from "@/lib/pedigree";
import { predictFoal, extractGeneCode, PATTERNS as PATTERN_LABEL } from "@/lib/genetics";
import { FullHorseData } from "@/lib/types";
import { computeFoalStage, fmtCountdown } from "@/lib/foalGrowth";

const GESTATION_MS = 72 * 60 * 60 * 1000; // pregnancy = exactly 72 hours

// The local Horse interface is replaced by FullHorseData from "@/lib/types"
// interface Horse {
//   id: string; name: string; breed: string | null; gender: string | null;
//   coat: string | null; genotype: string | null; sireName: string | null; damName: string | null;
// }

interface Pregnancy {
  id: string;
  sireName: string | null;
  /** Original breeding/cover date — the source of truth for the growth tracker. */
  coverDate: string | null;
  dueDate: string | null;
  damId: string;
  damName: string;
  foalId: string | null;
  foalName: string | null;
}

interface Plan {
  id: string; damId: string | null; damName: string;
  sireId: string | null; sireName: string | null; notes: string | null;
}

function countdown(date: string | null): string {
  if (!date) return "no due date";
  const ms = new Date(date).getTime() - Date.now();
  if (ms <= 0) return "due now";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  return `${h}h ${m}m left`;
}

function nodeDepth(n: HorseNode | null | undefined): number {
  if (!n) return 0;
  const s = n.sire ? 1 + nodeDepth(n.sire) : 0;
  const d = n.dam ? 1 + nodeDepth(n.dam) : 0;
  return Math.max(s, d);
}

export default function BreedingClient({ horses, pregnancies, plans }: { horses: FullHorseData[]; pregnancies: Pregnancy[]; plans: Plan[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dam, setDam] = useState<FullHorseData | null>(null);
  const [sire, setSire] = useState<FullHorseData | null>(null);
  const [busy, setBusy] = useState(false);
  const [pregOpen, setPregOpen] = useState(true);
  const [wishlistOpen, setWishlistOpen] = useState(true);
  const [matches, setMatches] = useState<{ stallion: FullHorseData; depth: number; coi: number; shared: number }[] | null>(null);

  // Prefill the planner from URL params. Suggested Pairings sends
  // ?mareId=...&stallionId=...; we also accept ?dam=...&sire=... for flexibility.
  useEffect(() => {
    const damId = searchParams.get("mareId") ?? searchParams.get("damId") ?? searchParams.get("dam");
    const sireId = searchParams.get("stallionId") ?? searchParams.get("sireId") ?? searchParams.get("sire");
    if (damId) {
      const h = horses.find((x) => x.id === damId);
      if (h) setDam(h);
    }
    if (sireId) {
      const h = horses.find((x) => x.id === sireId);
      if (h) setSire(h);
    }
    // Only run on mount / when the URL params change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Drop a wishlist row straight into the planner — no manual re-selection.
  function loadPair(plan: Plan) {
    const d = plan.damId ? horses.find((h) => h.id === plan.damId) : null;
    const s = plan.sireId ? horses.find((h) => h.id === plan.sireId) : null;
    if (d) setDam(d);
    if (s) setSire(s);
    // Scroll to the planner so the user sees the prefilled values.
    setTimeout(() => {
      document.getElementById("plan-a-pairing")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  // Pregnancy auto-dates: bred now, due in exactly 72 hours.
  async function registerPregnancy() {
    if (!dam) return;
    setBusy(true);
    const now = Date.now();
    const res = await fetch("/api/pregnancies", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        damId: dam.id, sireName: sire?.name ?? null,
        coverDate: new Date(now).toISOString(),
        dueDate: new Date(now + GESTATION_MS).toISOString(),
      }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("Could not register pregnancy.");
  }

  async function savePlan() {
    if (!dam) return;
    setBusy(true);
    const res = await fetch("/api/breeding-plans", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ damId: dam.id, damName: dam.name, sireId: sire?.id ?? null, sireName: sire?.name ?? null }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  async function deletePlan(id: string) {
    await fetch(`/api/breeding-plans/${id}`, { method: "DELETE" });
    router.refresh();
  }

  // Mass-breed every saved wishlist pair: a foal placeholder + 72h pregnancy each.
  const [massBusy, setMassBusy] = useState(false);
  async function massBreed() {
    const breedable = plans.filter((p) => p.damId || p.damName);
    if (breedable.length === 0) return;
    if (!confirm(`Breed all ${breedable.length} saved pair${breedable.length !== 1 ? "s" : ""}? This creates ${breedable.length} foal placeholder${breedable.length !== 1 ? "s" : ""}, each with a 72-hour pregnancy, and clears them from the wishlist.`)) return;
    setMassBusy(true);
    const res = await fetch("/api/pregnancies/batch", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planIds: breedable.map((p) => p.id) }),
    });
    setMassBusy(false);
    if (!res.ok) { alert("Mass breed failed."); return; }
    const data = await res.json();
    if (data.skipped?.length) alert(`Bred ${data.bred}. Skipped ${data.skipped.length} (mare not found).`);
    router.refresh();
  }

  async function markBorn(id: string) {
    if (!confirm("Mark this foal as born? It will be added to the registry — you can then fill in its details.")) return;
    await fetch(`/api/pregnancies/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markBorn: true }) });
    router.refresh();
  }

  async function deletePregnancy(id: string) {
    if (!confirm("Remove this pregnancy? The unborn foal placeholder will also be deleted.")) return;
    await fetch(`/api/pregnancies/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const map: HorseMap = useMemo(
    () => new Map(horses.map((h) => [h.name.toLowerCase(), {
      id: h.id, name: h.name, breed: h.breed, gender: h.gender,
      coat: h.coat, genotype: h.genotype, sireName: h.sireName, damName: h.damName,
      ownership: h.ownership, isImportedPlaceholder: h.isImportedPlaceholder,
    }])),
    [horses]
  );
  const allHorsesJson = useMemo(
    () => JSON.stringify(horses.map((h) => ({ id: h.id, name: h.name }))),
    [horses]
  );

  // Build the predicted foal's pedigree from the two parents.
  const foal = useMemo<HorseNode | null>(() => {
    if (!dam || !sire) return null;
    return {
      id: "foal",
      name: "Potential Foal",
      breed: dam.breed === sire.breed ? dam.breed : `${sire.breed ?? "?"} × ${dam.breed ?? "?"}`,
      gender: null,
      coat: null,
      sire: buildPedigreeTree(sire.name, map, 6),
      dam: buildPedigreeTree(dam.name, map, 6),
    };
  }, [dam, sire, map]);

  const dupes = useMemo(() => commonAncestors(foal), [foal]);
  const generations = foal ? nodeDepth(foal) : 0;
  const clean = dupes.size === 0;
  const coi = useMemo(() => (foal ? inbreedingCoefficient(foal) : 0), [foal]);

  const stallions = useMemo(() => horses.filter((h) => h.gender === "Stallion"), [horses]);

  // Find the best stallions to pair with the selected mare.
  function findBestStallions() {
    if (!dam) return;
    const ranked = stallions
      .filter((st) => st.name.toLowerCase() !== dam.name.toLowerCase())
      .map((st) => {
        const f: HorseNode = {
          id: "foal", name: "foal", breed: null, gender: null, coat: null,
          sire: buildPedigreeTree(st.name, map, 6),
          dam: buildPedigreeTree(dam.name, map, 6),
        };
        return { stallion: st, depth: nodeDepth(f), coi: inbreedingCoefficient(f), shared: commonAncestors(f).size };
      })
      // best = no inbreeding first, then deepest pedigree
      .sort((a, b) => a.coi - b.coi || b.depth - a.depth)
      .slice(0, 12);
    setMatches(ranked);
  }

  const genes = useMemo(() => {
    if (!dam || !sire) return null;
    return predictFoal(
      extractGeneCode(sire.coat, sire.genotype),
      extractGeneCode(dam.coat, dam.genotype),
    );
  }, [dam, sire]);

  const secondaryButtonStyle = {
    background: "var(--white)", border: "1px solid var(--border)", borderRadius: 6,
    padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
    fontFamily: "var(--font-lato)", opacity: 1, color: "var(--teal-dark)",
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>← Admin</Link>
      </div>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", marginBottom: 4 }}>Breeding</h1>
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14, marginBottom: 28 }}>
        Manage pregnancies, plan future pairings, and explore genetic possibilities for your horses.
      </p>

      {/* Suggested Pairings Link */}
      <div style={{ marginBottom: 28 }}>
        <Link href="/admin/breeding/suggested-pairings" style={{ ...secondaryButtonStyle, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Icon name="search" size={15} color="var(--teal-dark)" /> Find Suggested Pairings
        </Link>
      </div>

      {/* ===== Current pregnancies ===== */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: 28 }}>
        <h2 onClick={() => setPregOpen((o) => !o)} style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: pregOpen ? 16 : 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, userSelect: "none" }}>
          <span style={{ fontSize: 15, color: "var(--text-muted)", transform: pregOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s", display: "inline-block" }}>▸</span>
          Current Pregnancies{pregnancies.length ? ` (${pregnancies.length})` : ""}
        </h2>
        {!pregOpen ? null : pregnancies.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>
            No active pregnancies. Pair a mare &amp; stallion below and click “Register pregnancy”.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pregnancies.map((p) => {
              const stage = computeFoalStage(p.coverDate);
              const stageColor = stage?.code === "gestation" ? "var(--dam-text)"
                : stage?.code === "weanling" ? "var(--teal)"
                : stage?.code === "yearling" ? "var(--teal-dark)"
                : stage?.code === "youngster" ? "var(--gold)"
                : "var(--teal-dark)";
              return (
                <div key={p.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 12, border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", background: "var(--cream)", fontFamily: "var(--font-lato)" }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <Link href={`/registry/${p.damId}`} style={{ fontWeight: 700, color: "var(--dam-text)", textDecoration: "none", fontSize: 14 }}>{p.damName}</Link>
                      {p.sireName ? <span style={{ color: "var(--text-muted)", fontSize: 13 }}>×  <span style={{ color: "var(--sire-text)", fontWeight: 600 }}>{p.sireName}</span></span> : null}
                      {stage && (
                        <span style={{ background: stageColor, color: "white", fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, borderRadius: 999, padding: "2px 10px" }}>
                          {stage.label}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      {p.dueDate ? <>Due {new Date(p.dueDate).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}  ·  <strong style={{ color: "var(--dam-text)" }}>{countdown(p.dueDate)}</strong></> : "No due date set"}
                      {stage && Number.isFinite(stage.hoursToNextPhase) && stage.hoursToNextPhase > 0 && (
                        <>  ·  next phase in <strong>{fmtCountdown(stage.hoursToNextPhase)}</strong></>
                      )}
                    </div>
                    {stage && stage.code !== "gestation" && (
                      <p style={{ fontSize: 11.5, color: "var(--text)", lineHeight: 1.5, marginTop: 6, opacity: 0.85 }}>
                        {stage.description}
                      </p>
                    )}
                  </div>
                  {p.foalId && (
                    <Link href={`/registry/${p.foalId}`} style={{ fontSize: 12, color: "var(--teal)", textDecoration: "none", fontWeight: 600 }}>Foal page →</Link>
                  )}
                  <button onClick={() => markBorn(p.id)} disabled={busy} style={{ background: "var(--teal)", color: "white", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", fontFamily: "var(--font-lato)", opacity: busy ? 0.7 : 1 }}>
                      {busy ? "Saving…" : "Mark born"}
                    </button>
                    <button onClick={() => deletePregnancy(p.id)} style={{ background: "none", border: "1px solid var(--border)", color: "#C05050", borderRadius: 6, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-lato)" }}>✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* ===== Breeding wishlist ===== */}
      {plans.length > 0 && (
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: wishlistOpen ? 16 : 0, flexWrap: "wrap" }}>
            <h2
              onClick={() => setWishlistOpen((o) => !o)}
              style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, userSelect: "none", margin: 0 }}
            >
              <span style={{ fontSize: 15, color: "var(--text-muted)", transform: wishlistOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s", display: "inline-block" }}>▸</span>
              Breeding Wishlist ({plans.length})
            </h2>
            <button
              onClick={massBreed}
              disabled={massBusy || plans.length === 0}
              title="Breed every saved pair at once — creates a foal + 72h pregnancy for each"
              style={{
                background: "var(--gold)", color: "var(--teal-dark)", border: "none", borderRadius: 8,
                padding: "9px 18px", fontSize: 13, fontWeight: 800, fontFamily: "var(--font-lato)",
                cursor: massBusy ? "wait" : "pointer", opacity: massBusy ? 0.7 : 1, whiteSpace: "nowrap",
              }}
            >
              {massBusy ? "Breeding…" : `⚡ Mass Breed (${plans.length})`}
            </button>
          </div>
          {wishlistOpen && (
            <div className="grid sm:grid-cols-2 gap-3">
              {plans.map((pl) => {
                const canLoad = !!(pl.damId && pl.sireId);
                return (
                  <div key={pl.id} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", background: "var(--cream)", fontFamily: "var(--font-lato)" }}>
                    <div style={{ flex: 1, fontSize: 13 }}>
                      <Link href={`/registry/${pl.damId}`} style={{ color: "var(--dam-text)", fontWeight: 700, textDecoration: "none" }}>{pl.damName}</Link>
                      <span style={{ color: "var(--text-muted)" }}>  ×  </span>
                      {pl.sireId ? <Link href={`/registry/${pl.sireId}`} style={{ color: "var(--sire-text)", fontWeight: 700, textDecoration: "none" }}>{pl.sireName}</Link> : <span style={{ color: "var(--sire-text)", fontWeight: 700 }}>{pl.sireName ?? "any stallion"}</span>}
                    </div>
                    <button
                      onClick={() => loadPair(pl)}
                      disabled={!canLoad}
                      title={canLoad ? "Load this pair into the planner below" : "Both horses must still exist to load"}
                      style={{
                        background: canLoad ? "var(--teal)" : "var(--cream-dark)",
                        color: canLoad ? "white" : "var(--text-muted)",
                        border: "none",
                        borderRadius: 6,
                        padding: "5px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: canLoad ? "pointer" : "not-allowed",
                        fontFamily: "var(--font-lato)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      ↓ Use pair
                    </button>
                    <button onClick={() => deletePlan(pl.id)} style={{ background: "none", border: "1px solid var(--border)", color: "#C05050", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <h2 id="plan-a-pairing" style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 16, scrollMarginTop: 80 }}>Plan a Pairing</h2>

      {/* Pairing pickers */}
      <div className="grid md:grid-cols-2 gap-5" style={{ marginBottom: 28 }}>
        <Picker label="Dam (Mare)" accent="var(--dam-text)" accentBg="var(--dam-bg)" accentBorder="var(--dam-border)"
          horses={horses.filter((h) => h.gender === "Mare")} selected={dam} onSelect={setDam} />
        <Picker label="Sire (Stallion)" accent="var(--sire-text)" accentBg="var(--sire-bg)" accentBorder="var(--sire-border)"
          horses={horses.filter((h) => h.gender === "Stallion")} selected={sire} onSelect={setSire} />
      </div>

      {/* Best-stallion finder */}
      {dam && (
        <div style={{ marginBottom: 28 }}>
          <button onClick={findBestStallions} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--teal)", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-lato)" }}>
            <Icon name="search" size={15} color="white" /> Find the best stallions for {dam.name}
          </button>
          {matches && (
            <div style={{ marginTop: 14, background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
                Ranked by lowest inbreeding, then deepest pedigree. Click a stallion to load the pairing.
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-lato)" }}>
                <thead>
                  <tr style={{ background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
                    {["#", "Stallion", "Foal depth", "Inbreeding", "COI"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 14px", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m, i) => (
                    <tr key={m.stallion.id} onClick={() => { setSire(m.stallion); setMatches(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", background: i % 2 ? "var(--cream)" : "var(--white)" }}>
                      <td style={{ padding: "8px 14px", color: "var(--text-muted)" }}>{i + 1}</td>
                      <td style={{ padding: "8px 14px", fontWeight: 700, color: "var(--sire-text)" }}>{m.stallion.name}</td>
                      <td style={{ padding: "8px 14px" }}>{m.depth} gen</td>
                      <td style={{ padding: "8px 14px", color: m.shared ? "var(--inbreed-text)" : "var(--teal)" }}>{m.shared ? `${m.shared} shared` : "None"}</td>
                      <td style={{ padding: "8px 14px", color: m.coi > 0 ? "var(--inbreed-text)" : "var(--teal)" }}>{(m.coi * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!foal ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "var(--text-muted)", fontFamily: "var(--font-lato)", border: "1px dashed var(--border)", borderRadius: 10 }}>
          Select a mare and a stallion above to preview their foal.
        </div>
      ) : (
        <>
          {/* Verdict cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: 24 }}>
            <Stat label="Pedigree Depth" value={`${generations} gen`} note={generations >= 5 ? "Deep bloodline" : "Shallow"} good={generations >= 5} />
            <Stat label="Inbreeding" value={clean ? "None" : `${dupes.size} shared`} note={clean ? "No duplicate ancestors" : "Shared ancestor(s)"} good={clean} />
            <Stat label="Inbreeding Coeff." value={`${(coi * 100).toFixed(1)}%`} note={coi === 0 ? "Outcross" : coi < 0.0625 ? "Low" : coi < 0.125 ? "Moderate" : "High"} good={coi < 0.0625} />
            <Stat label="Pairing" value={clean && generations >= 5 ? "Excellent" : clean ? "Good" : "Caution"} note={clean ? "Outcross" : "Linebreeding"} good={clean} />
          </div>

          {/* Register / save this pairing */}
          <div style={{ background: "var(--dam-bg)", border: "1px solid var(--dam-border)", borderRadius: 10, padding: "14px 20px", marginBottom: 24, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <button onClick={registerPregnancy} disabled={busy} style={{ background: "var(--dam-text)", color: "white", border: "none", borderRadius: 6, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", fontFamily: "var(--font-lato)", opacity: busy ? 0.7 : 1 }}>
              {busy ? "Saving…" : "Register pregnancy"}
            </button>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>Bred now → due in <strong>72 hours</strong>; creates a foal page.</span>
            <button onClick={savePlan} disabled={busy} style={{ marginLeft: "auto", background: "var(--white)", color: "var(--teal-dark)", border: "1px solid var(--teal)", borderRadius: 6, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-lato)" }}>
              ☆ Save to wishlist
            </button>
          </div>

          {/* Predicted genetics */}
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)", marginBottom: 12 }}>Predicted Foal Genetics</h2>
            <div className="grid grid-cols-2 gap-4" style={{ fontFamily: "var(--font-lato)", fontSize: 13, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--dam-text)", textTransform: "uppercase" }}>Dam coat</div>
                <div>{dam!.coat ?? "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--sire-text)", textTransform: "uppercase" }}>Sire coat</div>
                <div>{sire!.coat ?? "—"}</div>
              </div>
            </div>

            {!genes?.ok ? (
              <div style={{ padding: "10px 14px", background: "var(--cream)", borderRadius: 8, fontSize: 12.5, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
                {genes?.reason ?? "Add gene codes to both parents' coats (e.g. “Bay Overo (B_O)”) to predict the foal."}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <ChipRow label="Possible base colours" items={genes.bases.map((b) => ({ R: "Red / Chestnut", B: "Bay", BL: "Black" }[b]))} color="var(--teal-dark)" bg="var(--teal-muted)" />
                {genes.modifiers.length > 0 && (
                  <ChipRow label="May inherit" items={genes.modifiers.map((m) => m.label)} color="#6B5A2A" bg="var(--gold-light)" />
                )}
                <ChipRow label="Possible patterns" items={genes.patterns.length ? ["None", ...genes.patterns.map((p) => PATTERN_LABEL[p] ?? p)] : ["None"]} color="var(--dam-text)" bg="var(--dam-bg)" />

                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-lato)", marginBottom: 8 }}>Possible foal coats</div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {genes.coats.map((grp) => (
                      <div key={grp.base} style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 14, color: "var(--teal-dark)", marginBottom: 6 }}>{grp.base}</div>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--text)", fontFamily: "var(--font-lato)", lineHeight: 1.8 }}>
                          {grp.items.map((it) => (
                            <li key={it.code}>
                              {it.name}{" "}
                              <code style={{ fontSize: 10.5, color: "var(--text-muted)", background: "var(--white)", border: "1px solid var(--border)", borderRadius: 4, padding: "0 5px" }}>{it.code}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
                    These are the colours/patterns this pairing <em>could</em> produce — actual foals get one combination at random.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Foal pedigree */}
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)" }}>Predicted Foal Pedigree</h2>
              {!clean && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--inbreed-text)", background: "var(--inbreed-bg)", border: "1px solid var(--inbreed-border)", borderRadius: 16, padding: "4px 12px", fontFamily: "var(--font-lato)" }}>
                  <Icon name="warning" size={14} color="var(--inbreed-text)" />
                  {dupes.size} shared ancestor{dupes.size !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <PedigreeTree node={foal} dupes={dupes} allHorses={allHorsesJson} isAdmin title={`foal-${sire!.name}-x-${dam!.name}`} />
          </div>
        </>
      )}
    </div>
  );
}

function ChipRow({ label, items, color, bg }: { label: string; items: (string | undefined)[]; color: string; bg: string }) {
  const list = items.filter(Boolean) as string[];
  if (!list.length) return null;
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-lato)", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {list.map((it) => (
          <span key={it} style={{ background: bg, color, border: "1px solid rgba(0,0,0,0.06)", borderRadius: 14, padding: "3px 12px", fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-lato)" }}>{it}</span>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, note, good }: { label: string; value: string; note: string; good: boolean }) {
  return (
    <div style={{ background: "var(--white)", border: `1px solid ${good ? "var(--border)" : "var(--inbreed-border)"}`, borderRadius: 10, padding: 16, textAlign: "center" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-lato)" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-playfair)", fontSize: 26, color: good ? "var(--teal)" : "var(--inbreed-text)", margin: "4px 0" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{note}</div>
    </div>
  );
}

function Picker({ label, horses, selected, onSelect, accent, accentBg, accentBorder }: {
  label: string; horses: FullHorseData[]; selected: FullHorseData | null; onSelect: (h: FullHorseData | null) => void;
  accent: string; accentBg: string; accentBorder: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => {
    if (!query || query.length < 1) return horses.slice(0, 12);
    const q = query.toLowerCase();
    return horses.filter((h) => h.name.toLowerCase().includes(q)).slice(0, 12);
  }, [horses, query]);

  return (
    <div style={{ background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.1em", color: accent, textTransform: "uppercase", fontFamily: "var(--font-lato)", fontWeight: 700, marginBottom: 8 }}>{label}</div>
      {selected ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 17, color: "var(--teal-dark)" }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{[selected.breed, selected.coat].filter(Boolean).join(" · ") || "—"}</div>
          </div>
          <button onClick={() => { onSelect(null); setQuery(""); }} style={{ background: "var(--white)", border: `1px solid ${accentBorder}`, borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>Change</button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <input value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={`Search ${label.toLowerCase()}…`}
            style={{ width: "100%", border: `1px solid ${accentBorder}`, borderRadius: 6, padding: "9px 12px", fontSize: 14, background: "var(--white)", color: "var(--text)", fontFamily: "var(--font-lato)", outline: "none" }} />
          {open && suggestions.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--white)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 50, marginTop: 2, maxHeight: 280, overflowY: "auto" }}>
              {suggestions.map((h) => (
                <div key={h.id} onMouseDown={() => { onSelect(h); setOpen(false); }}
                  style={{ padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-lato)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cream)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--white)")}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--teal-dark)" }}>{h.name}</div>
                  {h.breed && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{h.breed}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}