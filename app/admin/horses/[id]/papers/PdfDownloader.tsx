"use client";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";

// ─── Constants ───────────────────────────────────────────────────────────────
const PW = 1240;
const PH = 1754;
const PAD = 60;

const TEAL      = "#879b95";
const TEAL_DARK = "#3d5450";
const TEAL_LIGHT = "#c5d0cd";
const BG        = "#eef0ef";
const WHITE     = "#ffffff";
const TEXT      = "#1e2c2a";
const MUTED     = "#6a8078";
const GREEN_OK  = "#3a7a50";

const CLINIC = "Belmont Veterinarian Clinic";
const VET    = "Dr. E. Harlow, DVM";
const LIC    = "US-VET-29541063";

// ─── Utilities ────────────────────────────────────────────────────────────────
function seed(id: string, i: number): number {
  let h = (i * 2654435761) >>> 0;
  for (let j = 0; j < id.length; j++) h = (Math.imul(h ^ id.charCodeAt(j), 1664525) + 1013904223) >>> 0;
  return h / 0xffffffff;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB");
}

function horseSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function chipNumber(microchip: string | null | undefined, id: string): string {
  if (microchip) return microchip;
  const digits = Array.from({ length: 15 }, (_, i) => Math.floor(seed(id, i + 200) * 10));
  digits[0] = 9;
  return digits.join("");
}

function vitals(id: string) {
  const temp  = (99.0 + seed(id, 0) * 2.5).toFixed(1);
  const hr    = Math.round(28 + seed(id, 1) * 16);
  const rr    = Math.round(8  + seed(id, 2) * 8);
  const wt    = Math.round(900 + seed(id, 3) * 600);
  const deworm = new Date(Date.now() - (seed(id, 4) * 60 + 10) * 864e5);
  const float  = new Date(Date.now() - (seed(id, 5) * 120 + 30) * 864e5);
  return { temp, hr, rr, wt, deworm: fmtDate(deworm), float: fmtDate(float) };
}

function bseData(id: string) {
  const vol      = Math.round(40 + seed(id, 10) * 50);
  const conc     = Math.round(200 + seed(id, 11) * 200);
  const total    = (vol * conc).toLocaleString();
  const progMot  = Math.round(60 + seed(id, 12) * 20);
  const totalMot = Math.round(progMot + seed(id, 13) * 10);
  const morphNorm = Math.round(88 + seed(id, 14) * 8);
  const lLen     = (8 + seed(id, 15) * 5).toFixed(1);
  const rLen     = (parseFloat(lLen) * (0.95 + seed(id, 16) * 0.1)).toFixed(1);
  return { vol, conc, total, progMot, totalMot, morphNorm, morphAbn: 100 - morphNorm, lLen, rLen };
}

function policyNum(id: string): string {
  const yr     = new Date().getFullYear();
  const digits = Array.from({ length: 6 }, (_, i) => Math.floor(seed(id, i + 50) * 10)).join("");
  return `FEI-${yr}-${digits}`;
}

// ─── Shared Types ─────────────────────────────────────────────────────────────
export interface PdfHorse {
  id: string;
  name: string;
  breed: string | null;
  gender: string | null;
  coat: string | null;
  genotype: string | null;
  dob: string | null;
  regNumber: string | null;
  microchip: string | null;
  height: string | null;
  discipline: string | null;
  stablePrefix: string | null;
  ownerName: string | null;
  sireName: string | null;
  damName: string | null;
}

export interface PdfResult {
  id: string;
  event: string;
  placement: string | null;
  date: string | null;
  notes: string | null;
}

// ─── Shared Sub-components ────────────────────────────────────────────────────
function CrossIcon({ size = 28, color = TEAL }: { size?: number; color?: string }) {
  const arm = Math.round(size * 0.3);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 0, left: arm, width: size - arm * 2, height: size, background: color }} />
      <div style={{ position: "absolute", top: arm, left: 0, width: size, height: size - arm * 2, background: color }} />
    </div>
  );
}

function PageHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CrossIcon size={34} />
          <div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 18, fontWeight: 900, letterSpacing: "0.08em", color: TEAL_DARK }}>BELMONT</div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED, letterSpacing: "0.05em" }}>Veterinarian Clinic</div>
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 24, fontWeight: 900, letterSpacing: "0.08em", color: TEXT, textAlign: "center" }}>
          {title}
        </div>
        <div style={{ width: 70, height: 70, borderRadius: "50%", border: `2px solid ${TEAL}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CrossIcon size={32} color={TEAL} />
        </div>
      </div>
      <div style={{ height: 2, background: TEAL, marginTop: 14 }} />
    </div>
  );
}

function SectionBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: TEAL, color: WHITE, fontFamily: "var(--font-lato)", fontWeight: 900,
      fontSize: 13, letterSpacing: "0.08em", padding: "7px 14px", marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function Field({ label, value, grow = false }: { label: string; value: string | null | undefined; grow?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "baseline", marginBottom: 7, ...(grow ? { flexGrow: 1 } : {}) }}>
      <span style={{ fontFamily: "var(--font-lato)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: MUTED, textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}:</span>
      <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, borderBottom: `1px solid ${TEAL_LIGHT}`, flexGrow: 1 }}>{value || "—"}</span>
    </div>
  );
}

function SignBlock({ date, sigName = "E. Harlow", authorLine = VET, org = CLINIC, licLine = `License No. ${LIC}` }: {
  date?: string; sigName?: string; authorLine?: string; org?: string; licLine?: string;
}) {
  return (
    <div style={{ textAlign: "right", flexShrink: 0 }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontStyle: "italic", color: TEAL_DARK, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 4, marginBottom: 4, minWidth: 200 }}>
        {sigName}
      </div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: MUTED }}>Veterinarian&apos;s Signature</div>
      {licLine && <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: MUTED }}>{licLine}</div>}
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 900, color: TEXT, marginTop: 2 }}>{authorLine}</div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: MUTED }}>{org}</div>
      {date && <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: MUTED, marginTop: 4 }}>Date: {date}</div>}
    </div>
  );
}

function PgNum({ n }: { n: number }) {
  return (
    <div style={{ position: "absolute", bottom: 32, right: PAD, fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED, fontWeight: 700 }}>
      {n}
    </div>
  );
}

// ─── PAGE: Health Book Cover ───────────────────────────────────────────────────
function HealthCover({ h }: { h: PdfHorse }) {
  return (
    <div style={{ width: PW, height: PH, background: BG, position: "relative", overflow: "hidden", padding: PAD, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      {/* bg watermark */}
      <div style={{ position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)", opacity: 0.04 }}>
        <CrossIcon size={700} color={TEAL_DARK} />
      </div>
      {/* Clinic logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <CrossIcon size={38} />
        <div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 22, fontWeight: 900, letterSpacing: "0.08em", color: TEAL_DARK }}>BELMONT</div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED }}>Veterinarian Clinic</div>
        </div>
      </div>
      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ marginBottom: 52, opacity: 0.6 }}>
          <CrossIcon size={90} color={TEAL} />
        </div>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 80, color: TEAL, letterSpacing: "0.06em", textAlign: "center", lineHeight: 1, marginBottom: 6 }}>
          EQUINE HEALTH
        </div>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 66, color: TEAL, letterSpacing: "0.12em", textAlign: "center", lineHeight: 1.2, marginBottom: 20 }}>
          BOOK
        </div>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 17, color: MUTED, letterSpacing: "0.2em", textAlign: "center" }}>
          Your horse. Our priority.
        </div>
      </div>
      {/* Horse name */}
      <div style={{ marginBottom: 70 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, fontFamily: "Georgia, serif", fontSize: 20 }}>
          <span style={{ color: MUTED }}>Horse Name:</span>
          <span style={{ color: TEXT, fontStyle: "italic", borderBottom: `2px dotted ${TEAL}`, paddingBottom: 4, minWidth: 500 }}>{h.name}</span>
        </div>
      </div>
      {/* Badge */}
      <div style={{ position: "absolute", bottom: PAD, right: PAD }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", border: `3px solid ${TEAL}`, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(135,155,149,0.06)" }}>
          <CrossIcon size={44} color={TEAL} />
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: Health Report ───────────────────────────────────────────────────────
function HealthReport({ h }: { h: PdfHorse }) {
  const v = vitals(h.id);
  const today = fmtDate(new Date());
  const vax = ["TETANUS", "EHV-1 / EHV-4", "RABIES", "EQUINE INFLUENZA", "EEE / WEE", "STRANGLES", "WEST NILE VIRUS", "BOTULISM"];

  return (
    <div style={{ width: PW, height: PH, background: BG, position: "relative", overflow: "hidden", padding: PAD, boxSizing: "border-box" }}>
      <PageHeader title="EQUINE HEALTH REPORT" />

      {/* Horse Info */}
      <SectionBar>Horse Information</SectionBar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px", marginBottom: 8 }}>
        <div>
          <Field label="Horse's Name" value={h.name} />
          <Field label="Coat" value={h.coat} />
          <Field label="Genotype" value={h.genotype} />
        </div>
        <div>
          <Field label="Breed" value={h.breed} />
          <Field label="Foal Date" value={h.dob ? fmtDate(h.dob) : null} />
          <Field label="Registered Stable" value={h.stablePrefix || "Redfield Equestrian Centre"} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 24, marginBottom: 10, fontFamily: "var(--font-lato)", fontSize: 12 }}>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Gender:</span>
        {["Stallion", "Gelding", "Mare"].map(g => (
          <span key={g} style={{ color: TEXT }}>{h.gender === g ? "☑" : "☐"} {g.toUpperCase()}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 32, marginBottom: 12, fontFamily: "var(--font-lato)", fontSize: 12, alignItems: "center" }}>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>Reason for Visit:</span>
        {["ROUTINE", "LAMENESS", "VACCINATION", "CHECK-UP"].map((r, i) => (
          <span key={r} style={{ color: TEXT }}>{i === 0 ? "☑" : "☐"} {r}</span>
        ))}
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 14 }} />

      {/* Vaccinations + Deworming */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px", marginBottom: 14 }}>
        <div>
          <SectionBar>Vaccinations</SectionBar>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 0", fontFamily: "var(--font-lato)", fontSize: 12, color: TEXT }}>
            {vax.map(v2 => <div key={v2}>☑ {v2}</div>)}
          </div>
        </div>
        <div>
          <SectionBar>Deworming &amp; Hoof Care</SectionBar>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: TEXT, lineHeight: 1.9 }}>
            <div style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase", fontSize: 10 }}>Date of Last Deworming:</div>
            <div style={{ borderBottom: `1px solid ${TEAL_LIGHT}`, marginBottom: 10 }}>{v.deworm}</div>
            <div style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase", fontSize: 10 }}>Hoof Condition:</div>
            <div style={{ borderBottom: `1px solid ${TEAL_LIGHT}`, fontStyle: "italic" }}>Hooves well-shaped with normal growth, no abnormalities detected.</div>
          </div>
        </div>
      </div>

      {/* Vitals + Dental */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px", marginBottom: 14 }}>
        <div>
          <SectionBar>Medical Examination (Vitals)</SectionBar>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: TEXT, lineHeight: 2 }}>
            {[
              ["TEMPERATURE", `${v.temp} °F`],
              ["HEIGHT",      h.height ? `${h.height} hh` : "—"],
              ["HEART RATE",  `${v.hr} bpm`],
              ["WEIGHT",      `${v.wt} lbs`],
              ["RESP RATE",   `${v.rr} rpm`],
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ display: "flex", gap: 8 }}>
                <span style={{ fontWeight: 700, color: MUTED, fontSize: 10, textTransform: "uppercase", width: 130, flexShrink: 0 }}>{lbl}:</span>
                <span style={{ borderBottom: `1px solid ${TEAL_LIGHT}`, flexGrow: 1 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionBar>Dental</SectionBar>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: TEXT, lineHeight: 2 }}>
            <div><span style={{ fontWeight: 700, color: MUTED, fontSize: 10, textTransform: "uppercase" }}>GUMS: </span><span style={{ textDecoration: "underline" }}>pink</span> / pale / dark</div>
            <div><span style={{ fontWeight: 700, color: MUTED, fontSize: 10, textTransform: "uppercase" }}>LAST FLOAT: </span><span style={{ borderBottom: `1px solid ${TEAL_LIGHT}` }}>{v.float}</span></div>
            <div style={{ fontWeight: 700, color: MUTED, fontSize: 10, textTransform: "uppercase" }}>OVERALL:</div>
            <div style={{ borderBottom: `1px solid ${TEAL_LIGHT}`, fontStyle: "italic" }}>No issues. No sharp edges detected.</div>
          </div>
        </div>
      </div>

      {/* Medical History */}
      <SectionBar>Medical History (Injuries, Treatments etc.)</SectionBar>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, fontFamily: "var(--font-lato)", fontSize: 12 }}>
        <thead>
          <tr>
            {["DATE", "CONDITION", "TREATMENT"].map(col => (
              <th key={col} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "6px 10px", background: "rgba(135,155,149,0.1)", color: MUTED, fontWeight: 700, fontSize: 10, letterSpacing: "0.06em", textAlign: "left" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0,1,2].map(i => (
            <tr key={i}>
              {[0,1,2].map(j => <td key={j} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "13px 10px" }} />)}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Notes + Signature */}
      <SectionBar>Notes</SectionBar>
      <div style={{ display: "flex", gap: 32, alignItems: "flex-end" }}>
        <div style={{ flex: 1, fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: TEXT, lineHeight: 1.7, borderBottom: `1px solid ${TEAL_LIGHT}` }}>
          The horse was thoroughly examined, and no abnormalities were identified. All vitals, systems, and observations were within normal limits. Overall, the horse is clear and in good health at this time.
        </div>
        <SignBlock date={today} />
      </div>
      <PgNum n={2} />
    </div>
  );
}

// ─── PAGE: Physical Exam ───────────────────────────────────────────────────────
function PhysicalExam({ h }: { h: PdfHorse }) {
  const today = fmtDate(new Date());
  const systems: [string, string][] = [
    ["Musculoskeletal",   "No swelling, heat, or pain on palpation. Normal range of motion in all limbs. No lameness observed."],
    ["Cardiovascular",    "Heart sounds regular, no murmurs detected. Pulse strong and regular."],
    ["Respiratory",       "Lungs clear bilaterally. No abnormal sounds. Respiratory rate within normal limits."],
    ["Digestive",         "Gut sounds normal bilaterally. No signs of colic or gastrointestinal discomfort."],
    ["Ophthalmology",     "Clear eyes, no discharge or cloudiness. Pupillary light reflex normal bilaterally."],
    ["Integumentary",     `Coat ${h.coat ? h.coat.toLowerCase() : "healthy"} and clean. Skin elastic, no lesions or parasites.`],
    ["Neurological",      "Alert and responsive. No deficits in coordination, reflexes, or cranial nerve function."],
    ["Reproductive",
      h.gender === "Stallion" ? "External genitalia normal. No lesions, swelling, or abnormalities observed." :
      h.gender === "Mare"     ? "External genitalia normal. No abnormal discharge or abnormalities noted." :
                                "Not applicable."],
  ];

  return (
    <div style={{ width: PW, height: PH, background: BG, position: "relative", overflow: "hidden", padding: PAD, boxSizing: "border-box" }}>
      <PageHeader title="EQUINE PHYSICAL EXAM" />

      {/* Compact horse info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px", marginBottom: 8 }}>
        {([
          ["Horse's Name", h.name], ["Breed", h.breed],
          ["Coat", h.coat], ["Foal Date", h.dob ? fmtDate(h.dob) : null],
          ["Genotype", h.genotype], ["Registered Stable", h.stablePrefix || "Redfield Equestrian Centre"],
        ] as [string, string | null][]).map(([lbl, val]) => (
          <Field key={lbl} label={lbl} value={val} />
        ))}
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 16 }} />

      {/* Body systems */}
      <SectionBar>Body Systems Assessment</SectionBar>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {systems.map(([sys, note]) => (
          <div key={sys} style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 14, alignItems: "start" }}>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, fontWeight: 700, color: TEAL_DARK, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: GREEN_OK, fontSize: 15 }}>✓</span>{sys}
            </div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: TEXT, fontStyle: "italic", borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 4 }}>
              {note}
            </div>
          </div>
        ))}
      </div>

      {/* Overall assessment */}
      <SectionBar>Overall Assessment</SectionBar>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 14, fontStyle: "italic", color: TEXT, lineHeight: 1.7, marginBottom: 20, borderLeft: `4px solid ${TEAL}`, paddingLeft: 14 }}>
        All systems examined and found to be within normal physiological limits. The horse presents as healthy, alert, and in good condition. No further treatment indicated at this time.
      </div>

      {/* Notes + Signature */}
      <SectionBar>Notes</SectionBar>
      <div style={{ display: "flex", gap: 32, alignItems: "flex-end" }}>
        <div style={{ flex: 1, fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: TEXT, borderBottom: `1px solid ${TEAL_LIGHT}`, minHeight: 50 }}>
          All clear.
        </div>
        <SignBlock date={today} />
      </div>
      <PgNum n={3} />
    </div>
  );
}

// ─── PAGE: Microchip Registration ─────────────────────────────────────────────
function MicrochipPage({ h }: { h: PdfHorse }) {
  const chip    = chipNumber(h.microchip, h.id);
  const today   = fmtDate(new Date());
  const chipped = h.dob ? fmtDate(new Date(new Date(h.dob).getTime() + 90 * 864e5)) : today;

  return (
    <div style={{ width: PW, height: PH, background: BG, position: "relative", overflow: "hidden", padding: PAD, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.03 }}>
        <CrossIcon size={900} color={TEAL_DARK} />
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <CrossIcon size={38} />
          <div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 22, fontWeight: 900, letterSpacing: "0.08em", color: TEAL_DARK }}>BELMONT</div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED }}>Veterinarian Clinic</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 30, color: TEXT }}>MICROCHIP</div>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: MUTED }}>Registration Certificate</div>
        </div>
      </div>
      <div style={{ height: 2, background: TEAL, marginBottom: 48 }} />

      {/* Chip number */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>
          ISO 11784/85 Transponder Code
        </div>
        <div style={{ display: "inline-block", border: `3px solid ${TEAL}`, borderRadius: 12, padding: "20px 48px", background: "rgba(135,155,149,0.06)" }}>
          <div style={{ fontFamily: "Courier New, monospace", fontSize: 40, fontWeight: 900, letterSpacing: "0.22em", color: TEAL_DARK }}>
            {chip.slice(0, 5)}&nbsp;{chip.slice(5, 10)}&nbsp;{chip.slice(10)}
          </div>
        </div>
      </div>

      {/* Horse details */}
      <div style={{ background: WHITE, border: `1px solid ${TEAL_LIGHT}`, borderRadius: 8, padding: 36, marginBottom: 28 }}>
        <SectionBar>Registered Animal Details</SectionBar>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 48px" }}>
          {([
            ["Name", h.name], ["Breed", h.breed],
            ["Gender", h.gender], ["Foal Date", h.dob ? fmtDate(h.dob) : null],
            ["Coat", h.coat], ["Reg. Number", h.regNumber],
            ["Registered Stable", h.stablePrefix || "Redfield Equestrian Centre"], ["Date Chipped", chipped],
          ] as [string, string | null][]).map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{lbl}</div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 15, color: TEXT, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 6 }}>{val || "—"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Implant location */}
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, marginBottom: 28 }}>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em" }}>Implant Location: </span>
        Left side of the neck, crest of the nuchal ligament, mid-neck region — standard ICAR compliant placement.
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
        <SignBlock date={today} />
      </div>
      <PgNum n={1} />
    </div>
  );
}

// ─── PAGE: BSE / Fertility Report ─────────────────────────────────────────────
function FertilityPage({ h }: { h: PdfHorse }) {
  const b = bseData(h.id);
  const today = fmtDate(new Date());

  return (
    <div style={{ width: PW, height: PH, background: BG, position: "relative", overflow: "hidden", padding: PAD, boxSizing: "border-box" }}>
      <PageHeader title="BREEDING SOUNDNESS EVALUATION" />

      {/* Horse info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px", marginBottom: 8 }}>
        {([
          ["Horse's Name", h.name], ["Breed", h.breed],
          ["Coat", h.coat], ["Foal Date", h.dob ? fmtDate(h.dob) : null],
          ["Genotype", h.genotype], ["Registered Stable", h.stablePrefix || "Redfield Equestrian Centre"],
        ] as [string, string | null][]).map(([lbl, val]) => (
          <Field key={lbl} label={lbl} value={val} />
        ))}
      </div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: TEXT, marginBottom: 10 }}>
        <strong style={{ color: MUTED, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.08em" }}>Gender: </strong>☑ STALLION
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 16 }} />

      {/* Lab Analysis */}
      <SectionBar>Laboratory Analysis</SectionBar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 40px", marginBottom: 18, fontFamily: "var(--font-lato)", fontSize: 12 }}>
        {[
          ["Volume",                    `${b.vol} mL`],
          ["Concentration",             `${b.conc} million sperm / mL`],
          ["Total Sperm per Ejaculate", `${b.total} million`],
          ["Progressive Motility",      `${b.progMot}%`],
          ["Total Motility",            `${b.totalMot}%`],
          ["Morphology",                `${b.morphNorm}% normal / ${b.morphAbn}% abnormal`],
        ].map(([lbl, val]) => (
          <div key={lbl} style={{ display: "flex", gap: 8, alignItems: "baseline", borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 5 }}>
            <span style={{ color: MUTED, fontWeight: 700, fontSize: 10, textTransform: "uppercase", minWidth: 200, flexShrink: 0 }}>{lbl}:</span>
            <span style={{ color: TEXT }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Reproductive exam */}
      <SectionBar>Reproductive Examination</SectionBar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 40px", marginBottom: 18, fontFamily: "var(--font-lato)", fontSize: 12 }}>
        {[
          ["Left Testicle Size",     `${b.lLen} × ${(parseFloat(b.lLen) * 0.85).toFixed(1)} cm`],
          ["Right Testicle Size",    `${b.rLen} × ${(parseFloat(b.rLen) * 0.85).toFixed(1)} cm`],
          ["Symmetry & Firmness",    "Symmetrical, firm, uniform in texture"],
          ["Epididymis Palpation",   "Smooth, normal shape, no sensitivity"],
          ["Shaft & Prepuce",        "Clean, healthy tissue, no irritation"],
          ["Accessory Sex Glands",   "Normal on rectal palpation, no enlargement"],
          ["Abnormalities / Lesions","None observed"],
          ["Collection Method",      "Artificial mare / breeding phantom"],
        ].map(([lbl, val]) => (
          <div key={lbl} style={{ display: "flex", gap: 8, alignItems: "baseline", borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 5 }}>
            <span style={{ color: MUTED, fontWeight: 700, fontSize: 10, textTransform: "uppercase", minWidth: 200, flexShrink: 0 }}>{lbl}:</span>
            <span style={{ color: TEXT, fontStyle: "italic" }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Assessment */}
      <SectionBar>Assessment</SectionBar>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, display: "flex", gap: 32, marginBottom: 10 }}>
        <span style={{ fontWeight: 700, color: GREEN_OK }}>☑ FERTILE</span>
        <span style={{ color: MUTED }}>☐ SUBFERTILE</span>
        <span style={{ color: MUTED }}>☐ INFERTILE</span>
      </div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED, fontStyle: "italic", marginBottom: 16 }}>
        Recommendations: Cleared for full breeding. Continue routine conditioning and balanced nutrition. Recheck annually or if breeding difficulty arises.
      </div>

      {/* Findings + Sig */}
      <SectionBar>Findings</SectionBar>
      <div style={{ display: "flex", gap: 32, alignItems: "flex-end" }}>
        <div style={{ flex: 1, fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: TEXT, lineHeight: 1.7, borderBottom: `1px solid ${TEAL_LIGHT}` }}>
          All findings within normal limits. Semen quality and reproductive anatomy indicate excellent breeding potential.
        </div>
        <SignBlock date={today} />
      </div>
      <PgNum n={1} />
    </div>
  );
}

// ─── PAGE: Insurance Certificate ──────────────────────────────────────────────
function InsurancePage({ h }: { h: PdfHorse }) {
  const policy  = policyNum(h.id);
  const today   = fmtDate(new Date());
  const expiry  = fmtDate(new Date(Date.now() + 365 * 864e5));
  const mortality = `$${Math.round((15000 + seed(h.id, 30) * 35000) / 1000) * 1000}`;
  const surgical  = `$${Math.round((8000  + seed(h.id, 31) * 12000) / 1000) * 1000}`;
  const liability = `$${Math.round((50000 + seed(h.id, 32) * 100000) / 1000) * 1000}`;

  return (
    <div style={{ width: PW, height: PH, background: BG, position: "relative", overflow: "hidden", padding: PAD, boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.03 }}>
        <CrossIcon size={900} color={TEAL_DARK} />
      </div>

      {/* Insurer header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 34, color: TEAL_DARK, letterSpacing: "0.04em" }}>FRONTIER EQUINE INSURANCE CO.</div>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED, letterSpacing: "0.15em", textTransform: "uppercase" }}>Certificate of Insurance · Equine Mortality &amp; Liability</div>
      </div>
      <div style={{ height: 3, background: TEAL, marginBottom: 6 }} />
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 36 }} />

      {/* Title + policy */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 28, color: TEXT }}>CERTIFICATE OF INSURANCE</div>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: MUTED, marginTop: 6 }}>
          Policy No: <span style={{ fontWeight: 700, color: TEAL_DARK, letterSpacing: "0.1em" }}>{policy}</span>
        </div>
      </div>

      {/* Policy holder details */}
      <div style={{ background: WHITE, border: `1px solid ${TEAL_LIGHT}`, borderRadius: 8, padding: 32, marginBottom: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 48px" }}>
          {[
            ["Insured",          h.ownerName || h.stablePrefix || "Redfield Equestrian Centre"],
            ["Stable",           h.stablePrefix || "Redfield Equestrian Centre"],
            ["Policy Effective", today],
            ["Policy Expiry",    expiry],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{lbl}</div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 15, color: TEXT, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 6 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Insured animal */}
      <SectionBar>Insured Animal</SectionBar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 48px", marginBottom: 28 }}>
        {([
          ["Name", h.name], ["Breed", h.breed],
          ["Gender", h.gender], ["Foal Date", h.dob ? fmtDate(h.dob) : null],
          ["Coat", h.coat], ["Microchip / Reg.", h.microchip || h.regNumber],
        ] as [string, string | null][]).map(([lbl, val]) => (
          <div key={lbl}>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{lbl}</div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 6 }}>{val || "—"}</div>
          </div>
        ))}
      </div>

      {/* Coverage table */}
      <SectionBar>Coverage Summary</SectionBar>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28, fontFamily: "var(--font-lato)", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "rgba(135,155,149,0.12)" }}>
            {["Coverage Type", "Limit of Liability", "Status"].map(col => (
              <th key={col} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "10px 16px", color: MUTED, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ["Mortality / Theft", mortality, "ACTIVE"],
            ["Major Medical / Surgical", surgical, "ACTIVE"],
            ["Third-Party Liability", liability, "ACTIVE"],
          ].map(([type, lim, status]) => (
            <tr key={type}>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "12px 16px", color: TEXT }}>{type}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "12px 16px", color: TEXT, fontWeight: 700 }}>{lim}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "12px 16px", color: GREEN_OK, fontWeight: 700 }}>{status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ flex: 1 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontStyle: "italic", color: TEAL_DARK, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 4, marginBottom: 4 }}>M. Calloway</div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED }}>Underwriter — Frontier Equine Insurance Co.</div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED, marginBottom: 6 }}>DATE ISSUED</div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 15, color: TEXT }}>{today}</div>
        </div>
      </div>
      <PgNum n={1} />
    </div>
  );
}

// ─── PAGE: Training Log ────────────────────────────────────────────────────────
function TrainingLogPage({ h, results }: { h: PdfHorse; results: PdfResult[] }) {
  const today  = fmtDate(new Date());
  const rows   = results.slice(0, 20);

  return (
    <div style={{ width: PW, height: PH, background: BG, position: "relative", overflow: "hidden", padding: PAD, boxSizing: "border-box" }}>
      <PageHeader title="TRAINING LOG & PROGRESS REPORT" />

      {/* Horse info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px", marginBottom: 10 }}>
        {([
          ["Horse", h.name], ["Breed", h.breed],
          ["Gender", h.gender], ["Foal Date", h.dob ? fmtDate(h.dob) : null],
          ["Discipline", h.discipline], ["Height", h.height ? `${h.height} hh` : null],
        ] as [string, string | null][]).map(([lbl, val]) => (
          <Field key={lbl} label={lbl} value={val} />
        ))}
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 14 }} />

      {/* Trainer assessment */}
      <SectionBar>Trainer Assessment</SectionBar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 40px", marginBottom: 18 }}>
        {([
          ["Discipline Focus",   h.discipline || "General"],
          ["Training Level",     "Advanced"],
          ["Overall Condition",  "Excellent"],
          ["Current Programme",  "Ongoing competition conditioning"],
        ] as [string, string][]).map(([lbl, val]) => (
          <div key={lbl} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
            <span style={{ fontFamily: "var(--font-lato)", fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", whiteSpace: "nowrap" }}>{lbl}:</span>
            <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: TEXT, fontStyle: "italic", borderBottom: `1px solid ${TEAL_LIGHT}`, flexGrow: 1 }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Results */}
      <SectionBar>Competition &amp; Show Results</SectionBar>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontFamily: "var(--font-lato)", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "rgba(135,155,149,0.12)" }}>
            {["Date", "Event / Show", "Placement", "Notes"].map(col => (
              <th key={col} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "7px 12px", color: MUTED, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((r, i) => (
            <tr key={r.id} style={{ background: i % 2 === 0 ? WHITE : "rgba(135,155,149,0.04)" }}>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "7px 12px", color: TEXT, whiteSpace: "nowrap" }}>{r.date ? fmtDate(r.date) : "—"}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "7px 12px", color: TEXT }}>{r.event}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "7px 12px", color: TEXT, fontWeight: 700 }}>{r.placement || "—"}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "7px 12px", color: MUTED, fontStyle: "italic", fontSize: 11 }}>{r.notes || "—"}</td>
            </tr>
          )) : [0,1,2,3,4].map(i => (
            <tr key={i}>
              {[0,1,2,3].map(j => <td key={j} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "14px 12px" }} />)}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sign-off */}
      <SectionBar>Report Sign-Off</SectionBar>
      <div style={{ display: "flex", gap: 32, alignItems: "flex-end" }}>
        <div style={{ flex: 1, fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: TEXT, lineHeight: 1.7, borderBottom: `1px solid ${TEAL_LIGHT}` }}>
          This training log is an accurate record of the horse&apos;s competition history and current training status as maintained by Redfield Equestrian Centre.
        </div>
        <SignBlock
          date={today}
          sigName="A. Redfield"
          authorLine="Athena Redfield"
          org="Redfield Equestrian Centre"
          licLine=""
        />
      </div>
      <PgNum n={1} />
    </div>
  );
}

// ─── Main PdfDownloader ────────────────────────────────────────────────────────
interface Props {
  horse: PdfHorse;
  results: PdfResult[];
}

function PdfBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      background: disabled ? "var(--border)" : "var(--teal-dark)", color: "white",
      border: "none", borderRadius: 6, padding: "10px 18px",
      fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 13,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.65 : 1,
      whiteSpace: "nowrap",
    }}>
      {children}
    </button>
  );
}

export default function PdfDownloader({ horse, results }: Props) {
  const hb0  = useRef<HTMLDivElement>(null);
  const hb1  = useRef<HTMLDivElement>(null);
  const hb2  = useRef<HTMLDivElement>(null);
  const mcR  = useRef<HTMLDivElement>(null);
  const fert = useRef<HTMLDivElement>(null);
  const ins  = useRef<HTMLDivElement>(null);
  const tlog = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<string | null>(null);
  const sl = horseSlug(horse.name);

  async function capturePage(ref: React.RefObject<HTMLDivElement | null>): Promise<string | null> {
    if (!ref.current) return null;
    // Warm-up pass (embeds fonts)
    await toPng(ref.current, { pixelRatio: 1, cacheBust: true });
    return toPng(ref.current, { pixelRatio: 1, cacheBust: true });
  }

  async function makePdf(refs: React.RefObject<HTMLDivElement | null>[], filename: string, label: string) {
    setStatus(`Generating ${label}…`);
    try {
      const pages: string[] = [];
      for (const ref of refs) {
        const img = await capturePage(ref);
        if (img) {
          pages.push(img);
          await new Promise<void>(r => setTimeout(r, 200));
        }
      }
      // Dynamic import — works whether jsPDF exports named or default
      const jspdfMod = await import("jspdf");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const JsPDF: any = (jspdfMod as any).jsPDF ?? (jspdfMod as any).default;
      const doc = new JsPDF({ format: "a4", unit: "mm", orientation: "portrait" });
      pages.forEach((img, i) => {
        if (i > 0) doc.addPage();
        doc.addImage(img, "PNG", 0, 0, 210, 297);
      });
      doc.save(filename);
    } finally {
      setStatus(null);
    }
  }

  const isStallion = horse.gender === "Stallion";
  const PS: React.CSSProperties = { width: PW, height: PH, flexShrink: 0 };

  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <PdfBtn disabled={!!status} onClick={() => makePdf([hb0, hb1, hb2], `${sl}-health-book.pdf`, "Health Book")}>
          {status?.includes("Health Book") ? status : "↓ Health Book PDF"}
        </PdfBtn>
        <PdfBtn disabled={!!status} onClick={() => makePdf([mcR], `${sl}-microchip.pdf`, "Microchip Card")}>
          {status?.includes("Microchip") ? status : "↓ Microchip Card PDF"}
        </PdfBtn>
        {isStallion && (
          <PdfBtn disabled={!!status} onClick={() => makePdf([fert], `${sl}-bse.pdf`, "BSE Report")}>
            {status?.includes("BSE") ? status : "↓ BSE Report PDF"}
          </PdfBtn>
        )}
        <PdfBtn disabled={!!status} onClick={() => makePdf([ins], `${sl}-insurance.pdf`, "Insurance Cert")}>
          {status?.includes("Insurance") ? status : "↓ Insurance PDF"}
        </PdfBtn>
        <PdfBtn disabled={!!status} onClick={() => makePdf([tlog], `${sl}-training-log.pdf`, "Training Log")}>
          {status?.includes("Training") ? status : "↓ Training Log PDF"}
        </PdfBtn>
      </div>

      {/* Off-screen render targets */}
      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
        <div ref={hb0} style={PS}><HealthCover h={horse} /></div>
        <div ref={hb1} style={PS}><HealthReport h={horse} /></div>
        <div ref={hb2} style={PS}><PhysicalExam h={horse} /></div>
        <div ref={mcR} style={PS}><MicrochipPage h={horse} /></div>
        {isStallion && <div ref={fert} style={PS}><FertilityPage h={horse} /></div>}
        <div ref={ins} style={PS}><InsurancePage h={horse} /></div>
        <div ref={tlog} style={PS}><TrainingLogPage h={horse} results={results} /></div>
      </div>
    </>
  );
}
