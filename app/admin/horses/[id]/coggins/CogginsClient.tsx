"use client";

import { useRef, useState, forwardRef } from "react";
import { toPng } from "html-to-image";
import Link from "next/link";

const CERT_W = 1240;
const CERT_H = 1754;
const PREVIEW_SCALE = 0.5;

const TEAL_DARK  = "rgba(135,155,149,0.45)";  // pastel header bg
const TEAL       = "rgba(135,155,149,0.32)";  // title bar bg
const TEAL_LIGHT = "rgba(135,155,149,0.14)";  // alternating row / banner tint
const BORDER     = "rgba(135,155,149,0.50)";  // borders
const HEADER_TEXT = "#3d5450";                // dark text on light headers
const MUTED      = "#6a8078";
const TEXT       = "#1e2c2a";

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Seeded pseudo-random that stays consistent per horse
function seeded(id: string, offset = 0) {
  const n = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) + offset;
  return (n * 1103515245 + 12345) & 0x7fffffff;
}
function rand(id: string, offset: number, min: number, max: number, decimals = 1) {
  const r = seeded(id, offset) / 0x7fffffff;
  return (min + r * (max - min)).toFixed(decimals);
}

function drawDate() {
  // Blood drawn 4 days before today (generation date)
  const d = new Date();
  d.setDate(d.getDate() - 4);
  return d.toISOString().split("T")[0];
}

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function accession(id: string) {
  return `BL-EIA-${2024}-${String(seeded(id, 2) % 90000 + 10000)}`;
}

function tubeNum(id: string) {
  return `T-${String(seeded(id, 9) % 9000 + 1000)}`;
}

interface Props {
  id: string;
  name: string;
  breed: string;
  gender: string;
  dob: string;
  regNumber: string;
  coat: string;
}

export default function CogginsClient({ id, name, breed, gender, dob, regNumber, coat }: Props) {
  const certRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (!certRef.current) return;
    setLoading(true);
    try {
      await toPng(certRef.current, { pixelRatio: 2, cacheBust: true });
      const dataUrl = await toPng(certRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${slug(name)}-coggins.png`;
      a.click();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "32px 24px", fontFamily: "var(--font-lato)" }}>
      <div style={{ maxWidth: CERT_W * PREVIEW_SCALE + 48, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <Link href={`/admin/horses/${id}/papers`} style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none" }}>
            ← Back to Papers
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, color: "var(--teal-dark)", margin: 0 }}>
            Coggins Test (EIA)
          </h1>
          <button onClick={handleDownload} disabled={loading} style={{
            background: "var(--teal)", color: "white", border: "none", borderRadius: 8,
            padding: "10px 22px", fontFamily: "var(--font-lato)", fontWeight: 700,
            fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
          }}>
            {loading ? "Generating…" : "↓ Download PNG"}
          </button>
        </div>
        <div style={{ width: CERT_W * PREVIEW_SCALE, height: CERT_H * PREVIEW_SCALE, overflow: "hidden", border: "1px solid var(--border)", borderRadius: 8 }}>
          <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left", width: CERT_W, height: CERT_H }}>
            <CertBody ref={certRef} id={id} name={name} breed={breed} gender={gender} dob={dob} regNumber={regNumber} coat={coat} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const CertBody = forwardRef<HTMLDivElement, Props>(function CertBody(
  { id, name, breed, gender, dob, regNumber, coat }, ref
) {
  const acc  = accession(id);
  const tube = tubeNum(id);
  const drawn      = drawDate();
  const received   = addDays(drawn, 2);
  const reported   = new Date().toISOString().split("T")[0];
  const validUntil = addDays(drawn, 365);

  // CBC values — seeded per horse, all within normal equine ranges
  const rbc  = rand(id,  3, 5.8, 9.2, 1);
  const wbc  = rand(id,  4, 5.2, 9.8, 1);
  const hct  = rand(id,  5, 32, 48, 0);
  const hgb  = rand(id,  6, 11.2, 16.8, 1);
  const mcv  = rand(id,  7, 41, 58, 0);
  const mch  = rand(id,  8, 14.5, 19.5, 1);
  const mchc = rand(id, 10, 32.5, 37.5, 1);
  const plt  = rand(id, 11, 110, 320, 0);
  const neut = rand(id, 12, 2.8, 6.5, 1);
  const lymp = rand(id, 13, 1.6, 4.8, 1);
  const mono = rand(id, 14, 0.1, 0.5, 2);
  const eosi = rand(id, 15, 0.0, 0.7, 2);

  // Serum chemistry
  const tp   = rand(id, 16, 6.0, 8.5, 1);
  const alb  = rand(id, 17, 2.7, 3.6, 1);
  const glob = (parseFloat(tp) - parseFloat(alb)).toFixed(1);
  const bun  = rand(id, 18, 11, 24, 0);
  const creat = rand(id, 19, 0.9, 1.7, 1);
  const gluc = rand(id, 20, 72, 112, 0);
  const ast  = rand(id, 21, 215, 385, 0);
  const ggt  = rand(id, 22, 7, 24, 0);
  const ck   = rand(id, 23, 120, 390, 0);
  const tbil = rand(id, 24, 0.8, 3.4, 1);

  const lato    = "Arial, sans-serif";
  const playfair = "'Georgia', 'Times New Roman', serif";

  const sectionTitle = (text: string) => (
    <div style={{ background: TEAL_DARK, color: "white", fontFamily: playfair, fontSize: 16, fontWeight: 700, letterSpacing: "0.06em", padding: "8px 16px", marginBottom: 0, textTransform: "uppercase" as const }}>
      {text}
    </div>
  );

  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 } as React.CSSProperties;
  const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 } as React.CSSProperties;
  const grid4 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 0 } as React.CSSProperties;

  const fieldBox = (label: string, val: string, bold = false): React.CSSProperties => ({});
  void fieldBox;

  function Field({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
      <div style={{ padding: "10px 14px", borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontFamily: lato, fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
        <div style={{ fontFamily: lato, fontSize: 14, color: TEXT, fontWeight: bold ? 700 : 400 }}>{value || "—"}</div>
      </div>
    );
  }

  function ResultRow({ analyte, result, ref: refRange, unit, flag }: { analyte: string; result: string; ref: string; unit: string; flag?: string }) {
    const isFlag = !!flag;
    return (
      <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
        <td style={{ fontFamily: lato, fontSize: 13, color: TEXT, padding: "7px 14px", borderRight: `1px solid ${BORDER}` }}>{analyte}</td>
        <td style={{ fontFamily: lato, fontSize: 13, fontWeight: isFlag ? 700 : 400, color: isFlag ? "#b84040" : TEXT, padding: "7px 14px", borderRight: `1px solid ${BORDER}`, textAlign: "right" as const }}>{result}</td>
        <td style={{ fontFamily: lato, fontSize: 13, color: MUTED, padding: "7px 14px", borderRight: `1px solid ${BORDER}`, textAlign: "center" as const }}>{unit}</td>
        <td style={{ fontFamily: lato, fontSize: 13, color: MUTED, padding: "7px 14px", borderRight: `1px solid ${BORDER}`, textAlign: "center" as const }}>{refRange}</td>
        <td style={{ fontFamily: lato, fontSize: 12, color: isFlag ? "#b84040" : "#2a7a3a", fontWeight: 700, padding: "7px 10px", textAlign: "center" as const }}>{flag || "✓"}</td>
      </tr>
    );
  }

  return (
    <div ref={ref} style={{ width: CERT_W, height: CERT_H, background: "#fff", boxSizing: "border-box", fontFamily: lato, color: TEXT, overflow: "hidden" }}>

      {/* Header */}
      <div style={{ background: TEAL_DARK, padding: "24px 36px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: playfair, fontSize: 32, color: HEADER_TEXT, fontWeight: 700, letterSpacing: "0.04em" }}>Belmont Laboratory</div>
          <div style={{ fontFamily: lato, fontSize: 12, color: MUTED, marginTop: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>Equine Diagnostic Services</div>
          <div style={{ fontFamily: lato, fontSize: 11, color: MUTED, marginTop: 2, opacity: 0.75 }}>14 Westridge Road · Southern Territories · The Rift</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: lato, fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Accession Number</div>
          <div style={{ fontFamily: lato, fontSize: 17, color: HEADER_TEXT, fontWeight: 700 }}>{acc}</div>
          <div style={{ fontFamily: lato, fontSize: 10, color: MUTED, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Report Date</div>
          <div style={{ fontFamily: lato, fontSize: 13, color: HEADER_TEXT }}>{formatDate(reported)}</div>
        </div>
      </div>

      {/* Report title bar */}
      <div style={{ background: TEAL, padding: "8px 36px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: playfair, fontSize: 15, color: HEADER_TEXT, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Equine Infectious Anemia (EIA) — Laboratory Report
        </div>
        <div style={{ fontFamily: lato, fontSize: 11, color: MUTED }}>
          USDA Accredited · Test Method: AGID
        </div>
      </div>

      <div style={{ padding: "0 36px 24px" }}>

        {/* Result banner */}
        <div style={{ margin: "18px 0 16px", background: TEAL_LIGHT, border: `2px solid ${TEAL}`, borderRadius: 6, padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: lato, fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>EIA Official Result</div>
            <div style={{ fontFamily: playfair, fontSize: 28, fontWeight: 700, color: "#1d5c2e", letterSpacing: "0.04em" }}>NEGATIVE</div>
            <div style={{ fontFamily: lato, fontSize: 12, color: MUTED, marginTop: 3 }}>No precipitin bands detected · p26 antigen absent</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: lato, fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Valid Until</div>
            <div style={{ fontFamily: lato, fontSize: 16, fontWeight: 700, color: TEAL_DARK }}>{formatDate(validUntil)}</div>
            <div style={{ fontFamily: lato, fontSize: 11, color: MUTED, marginTop: 2 }}>Tube No. {tube}</div>
          </div>
        </div>

        {/* Horse Identification */}
        {sectionTitle("Equine Identification")}
        <div style={{ border: `1px solid ${BORDER}`, borderTop: "none" }}>
          <div style={grid4}>
            <Field label="Registered Name" value={name} bold />
            <Field label="Breed / Species" value={breed} />
            <Field label="Gender" value={gender} />
            <Field label="Date of Birth" value={formatDate(dob)} />
          </div>
          <div style={grid3}>
            <Field label="Coat / Hair Colour" value={coat} />
            <Field label="Registration / Microchip No." value={regNumber} />
            <Field label="Attending Veterinarian" value="Dr. J. Nicks-Reyelle, DVM" />
          </div>
          <div style={grid3}>
            <Field label="Premises / Stable" value="Redfield Equestrian Centre" />
            <Field label="Date Blood Drawn" value={formatDate(drawn)} />
            <Field label="Date Received" value={formatDate(received)} />
          </div>
        </div>

        {/* CBC */}
        <div style={{ marginTop: 14 }}>
          {sectionTitle("Complete Blood Count")}
          <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${BORDER}`, borderTop: "none" }}>
            <thead>
              <tr style={{ background: TEAL_LIGHT }}>
                {["Analyte", "Result", "Units", "Reference Range", "Flag"].map((h, i) => (
                  <th key={h} style={{ fontFamily: lato, fontSize: 11, fontWeight: 700, color: TEAL_DARK, padding: "7px 14px", borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, textAlign: i > 0 ? "center" : "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <ResultRow analyte="Erythrocytes (RBC)"   result={rbc}  unit="×10⁶/μL" ref="5.5 – 9.5"   />
              <ResultRow analyte="Haematocrit (PCV)"    result={hct}  unit="%"        ref="30 – 50"      />
              <ResultRow analyte="Haemoglobin"          result={hgb}  unit="g/dL"     ref="11.0 – 17.0"  />
              <ResultRow analyte="MCV"                  result={mcv}  unit="fL"       ref="40 – 60"      />
              <ResultRow analyte="MCH"                  result={mch}  unit="pg"       ref="14.0 – 20.0"  />
              <ResultRow analyte="MCHC"                 result={mchc} unit="g/dL"     ref="32.0 – 38.0"  />
              <ResultRow analyte="Leucocytes (WBC)"     result={wbc}  unit="×10³/μL"  ref="5.0 – 10.0"  />
              <ResultRow analyte="Neutrophils"          result={neut} unit="×10³/μL"  ref="2.7 – 6.7"   />
              <ResultRow analyte="Lymphocytes"          result={lymp} unit="×10³/μL"  ref="1.5 – 5.5"   />
              <ResultRow analyte="Monocytes"            result={mono} unit="×10³/μL"  ref="0.0 – 0.6"   />
              <ResultRow analyte="Eosinophils"          result={eosi} unit="×10³/μL"  ref="0.0 – 0.8"   />
              <ResultRow analyte="Platelets"            result={plt}  unit="×10³/μL"  ref="100 – 350"    />
            </tbody>
          </table>
        </div>

        {/* Serum chemistry */}
        <div style={{ marginTop: 14 }}>
          {sectionTitle("Serum Biochemistry")}
          <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${BORDER}`, borderTop: "none" }}>
            <thead>
              <tr style={{ background: TEAL_LIGHT }}>
                {["Analyte", "Result", "Units", "Reference Range", "Flag"].map((h, i) => (
                  <th key={h} style={{ fontFamily: lato, fontSize: 11, fontWeight: 700, color: TEAL_DARK, padding: "7px 14px", borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, textAlign: i > 0 ? "center" : "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <ResultRow analyte="Total Protein"       result={tp}    unit="g/dL"   ref="5.8 – 8.7"   />
              <ResultRow analyte="Albumin"             result={alb}   unit="g/dL"   ref="2.6 – 3.7"   />
              <ResultRow analyte="Globulin"            result={glob}  unit="g/dL"   ref="2.4 – 5.0"   />
              <ResultRow analyte="BUN (Urea Nitrogen)" result={bun}   unit="mg/dL"  ref="10 – 25"      />
              <ResultRow analyte="Creatinine"          result={creat} unit="mg/dL"  ref="0.8 – 1.8"   />
              <ResultRow analyte="Glucose"             result={gluc}  unit="mg/dL"  ref="70 – 115"     />
              <ResultRow analyte="AST"                 result={ast}   unit="IU/L"   ref="200 – 400"    />
              <ResultRow analyte="GGT"                 result={ggt}   unit="IU/L"   ref="5 – 25"       />
              <ResultRow analyte="CK (Creatine Kinase)" result={ck}   unit="IU/L"   ref="100 – 400"    />
              <ResultRow analyte="Total Bilirubin"     result={tbil}  unit="mg/dL"  ref="0.5 – 3.5"   />
            </tbody>
          </table>
        </div>

        {/* Certification & Signature */}
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 4, padding: "14px 16px" }}>
            <div style={{ fontFamily: lato, fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Laboratory Director</div>
            <div style={{ fontFamily: "'Times New Roman', serif", fontSize: 22, fontStyle: "italic", color: TEXT, marginBottom: 6 }}>Dr. M. Belmont, PhD</div>
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 6 }}>
              <div style={{ fontFamily: lato, fontSize: 11, color: MUTED }}>Director of Equine Diagnostics · Belmont Laboratory</div>
              <div style={{ fontFamily: lato, fontSize: 11, color: MUTED }}>Accreditation No. BL-USDA-2024-0041</div>
            </div>
          </div>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 4, padding: "14px 16px", background: TEAL_LIGHT }}>
            <div style={{ fontFamily: lato, fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Certification Statement</div>
            <div style={{ fontFamily: lato, fontSize: 12, color: TEXT, lineHeight: 1.6 }}>
              This report certifies that the above-named equine was tested for Equine Infectious Anemia using the AGID method as approved by the USDA. Results are valid for 12 months from the date of blood draw.
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: TEAL_DARK, padding: "10px 36px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: lato, fontSize: 10, color: MUTED }}>
          Belmont Laboratory · 14 Westridge Road · Southern Territories · The Rift
        </div>
        <div style={{ fontFamily: lato, fontSize: 10, color: MUTED }}>
          Accession: {acc} · Official EIA Test · USDA Veterinary Services
        </div>
      </div>
    </div>
  );
});
