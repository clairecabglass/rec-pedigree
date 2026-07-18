"use client";
import { useState, createContext, useContext, useRef } from "react";
import { useRouter } from "next/navigation";
import PedigreeTree from "@/components/PedigreeTree";
import RichTextEditor from "@/components/RichTextEditor";
import { buildPedigreeTree, findDuplicates, HorseNode } from "@/lib/pedigree";
import type { HorseMap } from "@/lib/pedigree";

interface HorseData {
  id?: string;
  microchip?: string;
  name: string;
  breed?: string;
  gender?: string;
  sireName?: string;
  damName?: string;
  coat?: string;
  withFoal?: boolean;
  ownership?: string;
  notes?: string;
  dob?: string;
  height?: string;
  discipline?: string;
  regNumber?: string;
  achievements?: string;
  videoUrl?: string;
  personality?: string;
  genotype?: string;
  eyeColor?: string;
  baseStats?: string;
  description?: string;
  ownerName?: string;
  ownerCharacter?: string;
  stablePrefix?: string;
  breedingFee?: string;
  breedingPolicies?: string;
  availableForBreeding?: boolean;
  isCustomHorse?: boolean;
  hasCustomCoat?: boolean;
  price?: string;
  saleDescription?: string;
  saleContact?: string;
}

type RiftTrailsHorse = {
  name: string;
  sex: string;
  breed: string;
  base: string;
  genes: string;
  personality: string;
  status: string;
  discipline: string;
  height: string;
  notes: string;
  eye: string;
  sire: string;
  dam: string;
  photo?: string;
  gallery?: string;
};

function statusToOwnership(status: string): string {
  if (status === "For Sale") return "For Sale";
  if (status === "Active") return "Home";
  return "Outside";
}

function riftToHorseData(h: RiftTrailsHorse, ownership?: string): HorseData {
  return {
    name: h.name,
    gender: h.sex === "Mare" || h.sex === "Stallion" || h.sex === "Gelding" ? h.sex : undefined,
    breed: h.breed || undefined,
    coat: h.base || undefined,
    genotype: h.genes || undefined,
    personality: h.personality || undefined,
    discipline: h.discipline || undefined,
    height: h.height || undefined,
    regNumber: h.notes || undefined,
    eyeColor: h.eye || undefined,
    sireName: h.sire || undefined,
    damName: h.dam || undefined,
    ownership: ownership ?? statusToOwnership(h.status),
  };
}

const BREEDS = ["American Paint Horse", "American Quarter Horse", "Andalusian", "Anglo-Arabian", "Arabian", "Belgian", "Clydesdale", "Colorado Ranger", "Connemara", "Criollo", "Friesian", "Hanoverian", "Holsteiner", "Irish Cob", "KWPN", "Kladruber", "Klabruber", "Lipizzaner", "Lusitano", "Menorquin", "Mustang", "Norfolk Roadster", "Nokota", "Oldenburg", "Paso Fino", "Percheron", "Selle Francais", "Shire", "Sugarbush Harlequin", "Suffolk Punch", "Thoroughbred", "Trotteur Francais", "Turkoman", "Warlander"];
const OWNERSHIPS: ReadonlyArray<readonly [string, string]> = [
  ["Home", "My Horse (HOME) — active, included in breeding tools"],
  ["For Sale", "For Sale — listed on the For Sale page"],
  ["Sold", "Sold — no longer owned, kept for history"],
  ["Outside", "Outside / Reference — pedigree ancestor only, not in breeding tools"],
  ["Void", "Void — hide from the registry entirely"],
];

const fieldStyle: React.CSSProperties = {
  border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px",
  fontSize: 13, background: "var(--white)", color: "var(--text)",
  fontFamily: "var(--font-lato)", outline: "none", width: "100%",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)",
  textTransform: "uppercase", fontFamily: "var(--font-lato)", fontWeight: 600,
  display: "block", marginBottom: 4,
};

export default function HorseForm({ initial, mode }: { initial?: HorseData; mode: "create" | "edit" }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<HorseData>(initial ?? { name: "", ownership: "Home" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Rift Trails single-horse import state
  const [pendingAncestors, setPendingAncestors] = useState<RiftTrailsHorse[]>([]);
  const [pendingPhoto, setPendingPhoto] = useState("");
  const [savedHorseId, setSavedHorseId] = useState("");
  const [importStep, setImportStep] = useState<"form" | "post-save">("form");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: string[] } | null>(null);

  // Pedigree image OCR state
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [pendingOcrAncestors, setPendingOcrAncestors] = useState<HorseData[]>([]);

  // Pedigree preview (from JSON or OCR)
  const [previewTree, setPreviewTree] = useState<HorseNode | null>(null);
  const [previewDupes, setPreviewDupes] = useState<Set<string>>(new Set());
  const [previewAllHorses, setPreviewAllHorses] = useState("[]");
  const [showPreview, setShowPreview] = useState(false);

  function buildAndSetPreview(root: HorseData, ancestors: HorseData[]) {
    const all = [root, ...ancestors].filter((h) => h.name?.trim());
    const map = new Map(
      all.map((h) => [
        (h.name ?? "").toLowerCase(),
        { id: h.name ?? "", name: h.name ?? "", breed: h.breed ?? null, gender: h.gender ?? null, coat: h.coat ?? null, genotype: h.genotype ?? null, sireName: h.sireName ?? null, damName: h.damName ?? null },
      ])
    ) as unknown as HorseMap;
    const tree = buildPedigreeTree(root.name ?? "", map, 5);
    setPreviewTree(tree);
    setPreviewDupes(findDuplicates(tree));
    setPreviewAllHorses(JSON.stringify(all.map((h) => ({ id: h.name ?? "", name: h.name ?? "" }))));
    setShowPreview(true);
  }

  const set = (key: keyof HorseData, value: string | boolean) =>
    setData((d) => ({ ...d, [key]: value }));

  function handleJsonUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (!json.horses?.length) { alert("No horse data found in this file."); return; }
        const root: RiftTrailsHorse = json.horses[0];
        const ancestors: RiftTrailsHorse[] = json.horses.slice(1).filter((h: RiftTrailsHorse) => h.name?.trim());
        const rootData = riftToHorseData(root);
        setData((prev) => ({ ...rootData, ownership: prev.ownership ?? statusToOwnership(root.status) }));
        setPendingAncestors(ancestors);
        const photo = root.photo?.startsWith("data:image") ? root.photo
          : root.gallery?.startsWith("data:image") ? root.gallery : "";
        setPendingPhoto(photo);
        buildAndSetPreview(rootData, ancestors.map((a) => riftToHorseData(a)));
      } catch {
        alert("Could not parse this file. Make sure it's a valid Rift Trails export.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setOcrLoading(true);
    setOcrError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/pedigree-import", { method: "POST", body: fd });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error ?? "OCR failed."); }
      const { rootHorse, ancestors }: { rootHorse: HorseData; ancestors: HorseData[] } = await res.json();
      // Merge rootHorse fields non-destructively (only fill blank fields)
      setData((prev) => {
        const merged = { ...prev };
        for (const [k, v] of Object.entries(rootHorse)) {
          if (v && !prev[k as keyof HorseData]) (merged as Record<string, unknown>)[k] = v;
        }
        return merged;
      });
      const filtered = ancestors.filter((a) => a.name?.trim());
      setPendingOcrAncestors(filtered);
      buildAndSetPreview(rootHorse, filtered);
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : "OCR failed. Please try again.");
    } finally {
      setOcrLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.name.trim()) { setError("Name is required."); return; }
    setLoading(true);
    setError("");
    const url = mode === "edit" ? `/api/horses/${initial!.id}` : "/api/horses";
    const method = mode === "edit" ? "PUT" : "POST";
    const payload = { ...data, dob: data.dob ? new Date(data.dob).toISOString() : null };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Something went wrong.");
      return;
    }
    const horse = await res.json();

    // Upload photo from JSON import if present
    if (pendingPhoto && horse.id) {
      try {
        const blob = await (await fetch(pendingPhoto)).blob();
        const fd = new FormData();
        fd.append("files", blob, "photo.jpg");
        await fetch(`/api/horses/${horse.id}/photos`, { method: "POST", body: fd });
      } catch { /* non-fatal */ }
    }

    if (mode === "create" && (pendingAncestors.length > 0 || pendingOcrAncestors.length > 0)) {
      setSavedHorseId(horse.id);
      setImportStep("post-save");
    } else {
      router.push(`/registry/${horse.id}`);
      router.refresh();
    }
  }

  async function importAncestors() {
    setImportLoading(true);
    let imported = 0;
    const skipped: string[] = [];
    const allAncestors: HorseData[] = [
      ...pendingAncestors.map((a) => riftToHorseData(a, "Outside")),
      ...pendingOcrAncestors.map((a) => ({ ...a, ownership: "Outside" })),
    ];
    for (const payload of allAncestors) {
      const res = await fetch("/api/horses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, isImportedPlaceholder: true }),
      });
      if (res.ok) imported++;
      else skipped.push(payload.name ?? "unknown");
    }
    setImportLoading(false);
    setImportResult({ imported, skipped });
  }

  async function deleteHorse() {
    if (!confirm(`Delete ${data.name}? This cannot be undone.`)) return;
    setLoading(true);
    await fetch(`/api/horses/${initial!.id}`, { method: "DELETE" });
    router.push("/registry");
    router.refresh();
  }

  // Post-save screen: offer ancestor import
  if (importStep === "post-save") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 20, color: "var(--teal)" }}>✓</span>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)" }}>
            {data.name} added!
          </span>
        </div>

        {importResult ? (
          <div>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, marginBottom: 16, color: "var(--text)" }}>
              Imported <strong>{importResult.imported}</strong> ancestor{importResult.imported !== 1 ? "s" : ""}.
              {importResult.skipped.length > 0 && (
                <> {importResult.skipped.length} skipped (already exist): <em>{importResult.skipped.join(", ")}</em></>
              )}
            </p>
            <button
              onClick={() => { router.push(`/registry/${savedHorseId}`); router.refresh(); }}
              style={{ background: "var(--teal)", color: "var(--white)", border: "none", borderRadius: 6, padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-lato)" }}
            >
              View Horse Profile →
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, marginBottom: 4, color: "var(--text)" }}>
              {(() => { const total = pendingAncestors.length + pendingOcrAncestors.length; return <>Found <strong>{total} pedigree ancestor{total !== 1 ? "s" : ""}</strong></>; })()}.
              Import them as <em>Outside / Reference</em> records so the pedigree tree resolves fully?
            </p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
              Horses that already exist in your registry will be skipped automatically.
            </p>
            <ul style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "var(--text-muted)", marginBottom: 20, paddingLeft: 18, maxHeight: 180, overflowY: "auto", lineHeight: 1.8 }}>
              {pendingAncestors.map((a) => (
                <li key={a.name}>
                  <strong>{a.name}</strong>
                  {a.sex ? ` · ${a.sex}` : ""}
                  {a.breed ? ` · ${a.breed}` : ""}
                  {a.base ? ` · ${a.base}` : ""}
                </li>
              ))}
              {pendingOcrAncestors.map((a) => (
                <li key={a.name}>
                  <strong>{a.name}</strong>
                  {a.gender ? ` · ${a.gender}` : ""}
                  {a.breed ? ` · ${a.breed}` : ""}
                  <span style={{ color: "var(--teal)", fontSize: 10, marginLeft: 4 }}>[OCR]</span>
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={importAncestors}
                disabled={importLoading}
                style={{ background: "var(--teal)", color: "var(--white)", border: "none", borderRadius: 6, padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: importLoading ? "not-allowed" : "pointer", fontFamily: "var(--font-lato)", opacity: importLoading ? 0.7 : 1 }}
              >
                {importLoading ? "Importing…" : `Import ${pendingAncestors.length + pendingOcrAncestors.length} Ancestors`}
              </button>
              <button
                onClick={() => { router.push(`/registry/${savedHorseId}`); router.refresh(); }}
                style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 6, padding: "11px 20px", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-lato)" }}
              >
                Skip, view profile
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <FormCtx.Provider value={{ data, set }}>
    <form onSubmit={submit}>
      {/* Rift Trails JSON import — create mode only */}
      {mode === "create" && (
        <div style={{ background: "color-mix(in srgb, var(--teal) 6%, transparent)", border: "1px dashed var(--teal)", borderRadius: 8, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, fontWeight: 700, color: "var(--teal-dark)", margin: 0 }}>
              Import from Rift Trails
            </p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0", lineHeight: 1.6 }}>
              Upload a <code style={{ fontSize: 11 }}>.rifttrails.json</code> or a pedigree screenshot to auto-fill sire/dam and queue ancestors.
              {(pendingAncestors.length > 0 || pendingPhoto || pendingOcrAncestors.length > 0) && (
                <><br /><span style={{ color: "var(--teal)", fontWeight: 600 }}>
                  {pendingAncestors.length > 0 && `✓ ${pendingAncestors.length} JSON ancestors queued. `}
                  {pendingPhoto && "✓ Photo ready. "}
                  {pendingOcrAncestors.length > 0 && `✓ ${pendingOcrAncestors.length} OCR ancestors queued. `}
                </span></>
              )}
              {ocrError && <><br /><span style={{ color: "#C05050" }}>{ocrError}</span></>}
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleJsonUpload} />
          <input ref={imgInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ background: "var(--teal)", color: "var(--white)", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-lato)", whiteSpace: "nowrap" }}
            >
              {pendingAncestors.length > 0 || pendingPhoto ? "Replace JSON" : "JSON File"}
            </button>
            <button
              type="button"
              onClick={() => imgInputRef.current?.click()}
              disabled={ocrLoading}
              style={{ background: "var(--white)", color: "var(--teal-dark)", border: "1px solid var(--teal)", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: ocrLoading ? "not-allowed" : "pointer", fontFamily: "var(--font-lato)", whiteSpace: "nowrap", opacity: ocrLoading ? 0.6 : 1 }}
            >
              {ocrLoading ? "Analysing…" : pendingOcrAncestors.length > 0 ? "Replace Image" : "Pedigree Image"}
            </button>
          </div>
        </div>
      )}

      {/* Pedigree preview after JSON / OCR import */}
      {mode === "create" && previewTree && (
        <div style={{ marginBottom: 24, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "var(--cream)", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: "var(--teal-dark)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Pedigree Preview
            </span>
            <button type="button" onClick={() => setShowPreview((v) => !v)} style={{ background: "none", border: "none", fontSize: 12, color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-lato)" }}>
              {showPreview ? "Hide ▲" : "Show ▼"}
            </button>
          </div>
          {showPreview && (
            <div style={{ overflowX: "auto", padding: 12 }}>
              <PedigreeTree node={previewTree} dupes={previewDupes} allHorses={previewAllHorses} bare fixedDepth={4} />
            </div>
          )}
        </div>
      )}

      {/* Identity */}
      <Section title="Identity" first>
        <Text k="name" label="Horse Name *" ph="[REC] HORSE NAME" full />
        <MicrochipField />
        <div>
          <label style={labelStyle}>Breed</label>
          <input
            list="breed-options"
            value={data.breed ?? ""}
            onChange={(e) => set("breed", e.target.value)}
            placeholder="Type or pick a breed…"
            style={fieldStyle}
            autoComplete="off"
          />
          <datalist id="breed-options">
            {BREEDS.map((b) => <option key={b} value={b} />)}
            <option value="Unknown" />
          </datalist>
        </div>
        <div>
          <label style={labelStyle}>Gender</label>
          <select value={data.gender ?? ""} onChange={(e) => set("gender", e.target.value)} style={fieldStyle}>
            <option value="">— Select —</option>
            <option value="Stallion">Stallion</option>
            <option value="Mare">Mare</option>
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Ownership</label>
          <select value={data.ownership ?? ""} onChange={(e) => set("ownership", e.target.value)} style={fieldStyle}>
            <option value="">— Select —</option>
            {OWNERSHIPS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <p style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)", lineHeight: 1.5 }}>
            Pick <strong>Home</strong> for horses you actually own. Pick <strong>Outside / Reference</strong> for
            sires/dams added purely so the pedigree resolves — they won't appear in Suggested Pairings.
          </p>
        </div>
        <Text k="sireName" label="Sire Name" ph="[TAG] SIRE NAME" />
        <Text k="damName" label="Dam Name" ph="[TAG] DAM NAME" />
        <div>
          <label style={labelStyle}>Foal Date</label>
          <input type="date" value={data.dob ? data.dob.slice(0, 10) : ""} onChange={(e) => set("dob", e.target.value)} style={fieldStyle} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" id="withFoal" checked={data.withFoal ?? false} onChange={(e) => set("withFoal", e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor="withFoal" style={{ ...labelStyle, marginBottom: 0, textTransform: "none", letterSpacing: 0, fontSize: 13 }}>In Foal</label>
        </div>
      </Section>

      {/* Appearance & traits */}
      <Section title="Appearance & Traits">
        <Text k="coat" label="Coat Name" ph="e.g. Sooty Dapple Bay" />
        <Text k="genotype" label="Genotype" ph="e.g. B" />
        <Text k="eyeColor" label="Eye Color" ph="e.g. Brown Eyes" />
        <Text k="personality" label="Personality" ph="e.g. Extrovert" />
        <Text k="height" label="Height" ph="e.g. 17.3" />
        <Text k="baseStats" label="Base Stats" ph="e.g. 77-7767" />
        <Text k="discipline" label="Discipline" ph="e.g. Show Jumping" />
        <Text k="videoUrl" label="Video Link" ph="YouTube / clip URL" />
        <Area k="achievements" label="Competition Placements / Achievements" rows={2} ph="Top-4 in-game placements, titles…" />
      </Section>

      {/* Owner / RP */}
      <Section title="Owner & Stable">
        <Text k="ownerName" label="Owner (Discord)" ph="e.g. Vlasic3849" />
        <Text k="ownerCharacter" label="Character Name" ph="e.g. Dill Pickles" />
        <Text k="stablePrefix" label="Stable / Prefix" ph="e.g. Redfield Equestrian / REC" full />
      </Section>

      {/* Breeding */}
      <Section title="Breeding">
        <Text k="breedingFee" label="Price per Cover" ph="e.g. $2000" />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" id="availableForBreeding" checked={data.availableForBreeding ?? false} onChange={(e) => set("availableForBreeding", e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor="availableForBreeding" style={{ ...labelStyle, marginBottom: 0, textTransform: "none", letterSpacing: 0, fontSize: 13 }}>
            Available for breeding — list on public Studs / Broodmares page
          </label>
        </div>
        <Area k="breedingPolicies" label="Breeding Policies" rows={2} ph="e.g. One free rebreed if first foal returned…" />
      </Section>

      {/* Custom */}
      <Section title="Custom">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" id="isCustomHorse" checked={data.isCustomHorse ?? false} onChange={(e) => set("isCustomHorse", e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor="isCustomHorse" style={{ ...labelStyle, marginBottom: 0, textTransform: "none", letterSpacing: 0, fontSize: 13 }}>
            Custom Horse — base horse created in the stable with custom traits
          </label>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <input type="checkbox" id="hasCustomCoat" checked={data.hasCustomCoat ?? false} onChange={(e) => set("hasCustomCoat", e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor="hasCustomCoat" style={{ ...labelStyle, marginBottom: 0, textTransform: "none", letterSpacing: 0, fontSize: 13 }}>
            Custom Coat — carries a custom coat (10% chance to pass to foal)
          </label>
        </div>
      </Section>

      {/* Description */}
      <Section title="Description">
        <div style={{ gridColumn: "1 / -1", marginBottom: 4 }}>
          <label style={labelStyle}>Description / Backstory</label>
          <RichTextEditor
            value={data.description ?? ""}
            onChange={(html) => set("description", html)}
            placeholder="Tell this horse's story…"
          />
        </div>
        <Area k="notes" label="Internal Notes" rows={2} ph="Private notes (not emphasised publicly)" />
      </Section>

      {/* For Sale */}
      <Section title="For Sale Details" subtitle="Shown on the For Sale page when ownership is &quot;For Sale&quot;.">
        <Text k="price" label="Price" ph="e.g. $500 or Negotiable" />
        <Text k="saleContact" label="Sale Contact" ph="Discord / in-game name" />
        <Area k="saleDescription" label="Sale Description" ph="Sales pitch for buyers…" />
      </Section>

      {error && <div style={{ color: "#C05050", fontSize: 13, fontFamily: "var(--font-lato)", marginTop: 12 }}>{error}</div>}

      <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "space-between", position: "sticky", bottom: 0, background: "var(--white)", paddingTop: 12 }}>
        <button type="submit" disabled={loading} style={{ background: "var(--teal)", color: "var(--white)", border: "none", borderRadius: 6, padding: "11px 28px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "var(--font-lato)", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Saving…" : mode === "create" ? "Add Horse" : "Save Changes"}
        </button>
        {mode === "edit" && (
          <button type="button" onClick={deleteHorse} style={{ background: "none", border: "1px solid #E07070", color: "#C05050", borderRadius: 6, padding: "11px 20px", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-lato)" }}>
            Delete
          </button>
        )}
      </div>
    </form>
    </FormCtx.Provider>
  );
}

const FormCtx = createContext<{
  data: HorseData;
  set: (key: keyof HorseData, value: string | boolean) => void;
}>({ data: { name: "" }, set: () => {} });

function Text({ k, label, ph, full }: { k: keyof HorseData; label: string; ph?: string; full?: boolean }) {
  const { data, set } = useContext(FormCtx);
  return (
    <div style={full ? { gridColumn: "1 / -1" } : undefined}>
      <label style={labelStyle}>{label}</label>
      <input value={(data[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} style={fieldStyle} placeholder={ph} />
    </div>
  );
}

function Area({ k, label, ph, rows = 3 }: { k: keyof HorseData; label: string; ph?: string; rows?: number }) {
  const { data, set } = useContext(FormCtx);
  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <label style={labelStyle}>{label}</label>
      <textarea value={(data[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} rows={rows} style={{ ...fieldStyle, resize: "vertical" }} placeholder={ph} />
    </div>
  );
}

function MicrochipField() {
  const { data, set } = useContext(FormCtx);
  const [checking, setChecking] = useState(false);

  async function generate() {
    setChecking(true);
    try {
      for (let attempts = 0; attempts < 20; attempts++) {
        const digits = Array.from(crypto.getRandomValues(new Uint32Array(2)))
          .map((n) => n.toString().padStart(5, "0")).join("").slice(0, 10);
        const chip = `REC-${digits}`;
        const res = await fetch(`/api/horses?microchip=${encodeURIComponent(chip)}`);
        const { exists } = await res.json();
        if (!exists) { set("microchip", chip); return; }
      }
      alert("Could not generate a unique chip number — please try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <label style={labelStyle}>Microchip / Reg #</label>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={(data.microchip as string) ?? ""} onChange={(e) => set("microchip", e.target.value)} style={{ ...fieldStyle, flex: 1 }} placeholder="REC-0000000000" />
        <button type="button" onClick={generate} disabled={checking} title="Generate unique chip number" style={{ background: "var(--teal)", color: "var(--white)", border: "none", borderRadius: 6, padding: "0 12px", fontSize: 12, fontWeight: 700, cursor: checking ? "not-allowed" : "pointer", fontFamily: "var(--font-lato)", whiteSpace: "nowrap", flexShrink: 0, opacity: checking ? 0.6 : 1 }}>
          {checking ? "…" : "Generate"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, subtitle, first, children }: { title: string; subtitle?: string; first?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: first ? 0 : 26, paddingTop: first ? 0 : 20, borderTop: first ? "none" : "1px solid var(--border)" }}>
      <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 17, color: "var(--teal-dark)", marginBottom: subtitle ? 2 : 14 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginBottom: 14 }}>{subtitle}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {children}
      </div>
    </div>
  );
}
