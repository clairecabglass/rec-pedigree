"use client";
import { useState } from "react";
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
  price?: string;
  saleDescription?: string;
  saleContact?: string;
}

const BREEDS = ["American Paint Horse", "American Quarter Horse", "Andalusian", "Anglo-Arabian", "Arabian", "Belgian", "Clydesdale", "Colorado Ranger", "Connemara", "Criollo", "Friesian", "Hanoverian", "Holsteiner", "Irish Cob", "KWPN", "Kladruber", "Klabruber", "Lipizzaner", "Lusitano", "Menorquin", "Mustang", "Norfolk Roadster", "Nokota", "Oldenburg", "Paso Fino", "Percheron", "Selle Francais", "Shire", "Sugarbush Harlequin", "Suffolk Punch", "Thoroughbred", "Trotteur Francais", "Turkoman", "Warlander"];
const OWNERSHIPS = ["Home", "For Sale", "Sold", "Outside", "Void"];

export default function HorseForm({ initial, mode }: { initial?: HorseData; mode: "create" | "edit" }) {
  const router = useRouter();
  const [data, setData] = useState<HorseData>(initial ?? { name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof HorseData, value: string | boolean) {
    setData((d) => ({ ...d, [key]: value }));
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

  const fieldStyle = {
    border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px",
    fontSize: 13, background: "var(--white)", color: "var(--text)",
    fontFamily: "var(--font-lato)", outline: "none", width: "100%",
  };
  const labelStyle = {
    fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)",
    textTransform: "uppercase" as const, fontFamily: "var(--font-lato)", fontWeight: 600,
    display: "block", marginBottom: 4,
  };

  return (
    <form onSubmit={submit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Horse Name *</label>
          <input value={data.name} onChange={(e) => set("name", e.target.value)} required style={fieldStyle} placeholder="[REC] HORSE NAME" />
        </div>

        <div>
          <label style={labelStyle}>Microchip</label>
          <input value={data.microchip ?? ""} onChange={(e) => set("microchip", e.target.value)} style={fieldStyle} placeholder="REC-0000000000" />
        </div>

        <div>
          <label style={labelStyle}>Breed</label>
          <select value={data.breed ?? ""} onChange={(e) => set("breed", e.target.value)} style={fieldStyle}>
            <option value="">— Select —</option>
            {BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
            <option value="Unknown">Unknown</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Gender</label>
          <select value={data.gender ?? ""} onChange={(e) => set("gender", e.target.value)} style={fieldStyle}>
            <option value="">— Select —</option>
            <option value="Stallion">Stallion</option>
            <option value="Mare">Mare</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Ownership</label>
          <select value={data.ownership ?? ""} onChange={(e) => set("ownership", e.target.value)} style={fieldStyle}>
            <option value="">— Select —</option>
            {OWNERSHIPS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Sire Name</label>
          <input value={data.sireName ?? ""} onChange={(e) => set("sireName", e.target.value)} style={fieldStyle} placeholder="[TAG] SIRE NAME" />
        </div>

        <div>
          <label style={labelStyle}>Dam Name</label>
          <input value={data.damName ?? ""} onChange={(e) => set("damName", e.target.value)} style={fieldStyle} placeholder="[TAG] DAM NAME" />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Coat</label>
          <input value={data.coat ?? ""} onChange={(e) => set("coat", e.target.value)} style={fieldStyle} placeholder="e.g. Rose Grey Tovero (R_G_TOV)" />
        </div>

        <div>
          <label style={labelStyle}>Date of Birth</label>
          <input type="date" value={data.dob ? data.dob.slice(0, 10) : ""} onChange={(e) => set("dob", e.target.value)} style={fieldStyle} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" id="withFoal" checked={data.withFoal ?? false} onChange={(e) => set("withFoal", e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor="withFoal" style={{ ...labelStyle, marginBottom: 0, textTransform: "none", letterSpacing: 0, fontSize: 13 }}>With Foal</label>
        </div>

        <div>
          <label style={labelStyle}>Height</label>
          <input value={data.height ?? ""} onChange={(e) => set("height", e.target.value)} style={fieldStyle} placeholder="e.g. 16.2hh" />
        </div>

        <div>
          <label style={labelStyle}>Discipline</label>
          <input value={data.discipline ?? ""} onChange={(e) => set("discipline", e.target.value)} style={fieldStyle} placeholder="e.g. Dressage, Western" />
        </div>

        <div>
          <label style={labelStyle}>Registration #</label>
          <input value={data.regNumber ?? ""} onChange={(e) => set("regNumber", e.target.value)} style={fieldStyle} />
        </div>

        <div>
          <label style={labelStyle}>Video Link</label>
          <input value={data.videoUrl ?? ""} onChange={(e) => set("videoUrl", e.target.value)} style={fieldStyle} placeholder="YouTube / clip URL" />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Achievements</label>
          <textarea value={data.achievements ?? ""} onChange={(e) => set("achievements", e.target.value)} rows={2} style={{ ...fieldStyle, resize: "vertical" }} placeholder="Show results, titles, awards…" />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={data.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={3} style={{ ...fieldStyle, resize: "vertical" }} />
        </div>
      </div>

      {/* For Sale section */}
      <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
        <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)", marginBottom: 4 }}>For Sale Details</h3>
        <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginBottom: 16 }}>
          Shown on the For Sale page when ownership is set to “For Sale”.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={labelStyle}>Price</label>
            <input value={data.price ?? ""} onChange={(e) => set("price", e.target.value)} style={fieldStyle} placeholder="e.g. $500 or Negotiable" />
          </div>
          <div>
            <label style={labelStyle}>Sale Contact</label>
            <input value={data.saleContact ?? ""} onChange={(e) => set("saleContact", e.target.value)} style={fieldStyle} placeholder="Discord / in-game name" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Sale Description</label>
            <textarea value={data.saleDescription ?? ""} onChange={(e) => set("saleDescription", e.target.value)} rows={3} style={{ ...fieldStyle, resize: "vertical" }} placeholder="Sales pitch / details for buyers…" />
          </div>
        </div>
      </div>

      {error && <div style={{ color: "#C05050", fontSize: 13, fontFamily: "var(--font-lato)", marginTop: 12 }}>{error}</div>}

      <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "space-between" }}>
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
  );
}
