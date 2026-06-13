"use client";
import { useState, createContext, useContext } from "react";
import { useRouter } from "next/navigation";

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
  price?: string;
  saleDescription?: string;
  saleContact?: string;
}

const BREEDS = ["American Paint Horse", "American Quarter Horse", "Andalusian", "Anglo-Arabian", "Arabian", "Belgian", "Clydesdale", "Colorado Ranger", "Connemara", "Criollo", "Friesian", "Hanoverian", "Holsteiner", "Irish Cob", "KWPN", "Kladruber", "Klabruber", "Lipizzaner", "Lusitano", "Menorquin", "Mustang", "Norfolk Roadster", "Nokota", "Oldenburg", "Paso Fino", "Percheron", "Selle Francais", "Shire", "Sugarbush Harlequin", "Suffolk Punch", "Thoroughbred", "Trotteur Francais", "Turkoman", "Warlander"];
// Each entry is [stored value, label shown in the dropdown]. The label spells
// out what each status DOES so it's obvious which to pick when adding ancestors
// vs. real owned horses.
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
  // New horses default to "Home" so they're immediately usable in the breeding
  // tools. Switch to "Outside" when adding a pedigree-only reference horse.
  const [data, setData] = useState<HorseData>(initial ?? { name: "", ownership: "Home" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof HorseData, value: string | boolean) =>
    setData((d) => ({ ...d, [key]: value }));

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
    } else {
      const horse = await res.json();
      router.push(`/registry/${horse.id}`);
      router.refresh();
    }
  }

  async function deleteHorse() {
    if (!confirm(`Delete ${data.name}? This cannot be undone.`)) return;
    setLoading(true);
    await fetch(`/api/horses/${initial!.id}`, { method: "DELETE" });
    router.push("/registry");
    router.refresh();
  }

  return (
    <FormCtx.Provider value={{ data, set }}>
    <form onSubmit={submit}>
      {/* Identity */}
      <Section title="Identity" first>
        <Text k="name" label="Horse Name *" ph="[REC] HORSE NAME" full />
        <Text k="microchip" label="Microchip / Reg #" ph="REC-0000000000" />
        <div>
          <label style={labelStyle}>Breed</label>
          {/* Typeable: known breeds autocomplete, but any new breed is accepted. */}
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
          <label style={labelStyle}>Date of Birth</label>
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

      {/* Description */}
      <Section title="Description">
        <Area k="description" label="Description / Backstory" rows={4} ph="Tell this horse's story…" />
        <Area k="notes" label="Internal Notes" rows={2} ph="Private notes (not emphasised publicly)" />
      </Section>

      {/* For Sale */}
      <Section title="For Sale Details" subtitle="Shown on the For Sale page when ownership is “For Sale”.">
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

// Shared form state so the field helpers can live at module scope (defining them
// inside HorseForm remounted every input on each keystroke, dropping focus).
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
