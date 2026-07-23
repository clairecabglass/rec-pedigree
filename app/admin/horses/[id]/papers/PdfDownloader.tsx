"use client";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";

// ─── Layout ───────────────────────────────────────────────────────────────────
const PW = 1240;
const PH = 1754;
const PAD = 52;

// ─── Palette ──────────────────────────────────────────────────────────────────
const TEAL       = "#879b95";
const TEAL_DARK  = "#3d5450";
const TEAL_LIGHT = "#c5d0cd";
const BG         = "#eef0ef";
const WHITE      = "#ffffff";
const TEXT       = "#1e2c2a";
const MUTED      = "#6a8078";
const GREEN_OK   = "#3a7a50";

const VET  = "Dr. E. Harlow, DVM";
const LIC  = "US-VET-29541063";

// ─── Seed / utils ─────────────────────────────────────────────────────────────
function seed(id: string, i: number): number {
  let h = (i * 2654435761) >>> 0;
  for (let j = 0; j < id.length; j++) h = (Math.imul(h ^ id.charCodeAt(j), 1664525) + 1013904223) >>> 0;
  return h / 0xffffffff;
}
function pick<T>(id: string, i: number, arr: T[]): T { return arr[Math.floor(seed(id, i) * arr.length)]; }
function intBetween(id: string, i: number, lo: number, hi: number) { return Math.round(lo + seed(id, i) * (hi - lo)); }
function floatBetween(id: string, i: number, lo: number, hi: number, dp = 1) { return (lo + seed(id, i) * (hi - lo)).toFixed(dp); }

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB");
}
function daysAgo(id: string, i: number, lo: number, hi: number) {
  return fmtDate(new Date(Date.now() - intBetween(id, i, lo, hi) * 864e5));
}
function addDays(base: string, days: number) {
  const d = new Date(base.split("/").reverse().join("-"));
  d.setDate(d.getDate() + days);
  return fmtDate(d);
}
function horseSlug(n: string) { return n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

function chipNumber(microchip: string | null | undefined, id: string): string {
  if (microchip) return microchip;
  const d = Array.from({ length: 15 }, (_, i) => Math.floor(seed(id, i + 200) * 10));
  d[0] = 9; return d.join("");
}
function policyNum(id: string) {
  const yr = new Date().getFullYear();
  return `FEI-${yr}-${Array.from({ length: 6 }, (_, i) => Math.floor(seed(id, i + 50) * 10)).join("")}`;
}

// ─── Seeded realistic health data ─────────────────────────────────────────────
function buildHealthData(id: string, gender: string | null) {
  const temp  = floatBetween(id,  0, 99.0, 101.5);
  const hr    = intBetween(id,   1, 28, 44);
  const rr    = intBetween(id,   2, 8,  16);
  const wt    = intBetween(id,   3, 900, 1500);
  const bcs   = floatBetween(id, 6, 4.5, 7.0);
  const crt   = seed(id, 7) > 0.15 ? "< 2 sec" : "2 sec";
  const mm    = pick(id, 8,  ["Pink and moist", "Pink and moist", "Pink and moist", "Pale pink, moist"]);
  const dem   = pick(id, 9,  ["Alert and responsive", "Bright and inquisitive", "Alert, standing squarely", "Quiet but bright and alert"]);
  const hydra = pick(id, 10, ["Good — skin tuck < 1 sec", "Good — skin tuck < 2 sec", "Good — skin tuck < 2 sec"]);

  // Vaccinations — date given + product + interval → compute next due
  const vaxRecords: { name: string; date: string; product: string; nextDue: string }[] = [
    { name: "Tetanus",              ...vax(id, 11, 180, 365, "Tetanus Toxoid") },
    { name: "Rabies",               ...vax(id, 12, 60, 300, "IMRAB Equine") },
    { name: "EHV-1 / EHV-4",       ...vax(id, 13, 30, 150, "Pneumabort-K+1b", 180) },
    { name: "Equine Influenza",     ...vax(id, 14, 30, 150, "Fluvac Innovator", 180) },
    { name: "EEE / WEE",           ...vax(id, 15, 60, 360, "Encephalomyelitis Bivalent", 365) },
    { name: "West Nile Virus",      ...vax(id, 16, 60, 300, "West Nile-Innovator", 365) },
    { name: "Strangles",            ...vax(id, 17, 60, 360, "Pinnacle I.N.", 365) },
    { name: "Botulism",             ...vax(id, 18, 60, 700, "BotVax B", 365) },
  ];

  // Deworming
  const dewProducts = ["Ivermectin (Eqvalan)", "Fenbendazole (Panacur)", "Pyrantel (Strongid)", "Moxidectin (Quest)", "Ivermectin + Praziquantel (Equimax)"];
  const lastDewormDate = daysAgo(id, 20, 14, 84);
  const dewProduct = pick(id, 21, dewProducts);
  const fec = intBetween(id, 22, 0, 150);
  const fecRisk = fec < 50 ? "Low" : fec < 200 ? "Moderate" : "High";
  const nextDeworm = addDays(lastDewormDate, intBetween(id, 23, 56, 84));

  // Hoof
  const hoofType = pick(id, 25, ["Barefoot", "Shod — front pair", "Shod — all four"]);
  const lastTrim = daysAgo(id, 26, 21, 56);
  const nextTrim = addDays(lastTrim, 42);
  const hoofNotes = pick(id, 27, [
    "Hooves well-balanced, adequate wall thickness. No cracks or thrush.",
    "Good hoof wall quality. Slight chipping on LH. No pathology.",
    "Excellent hoof condition. Even wear pattern. No heat or tenderness.",
  ]);

  // Dental
  const lastFloat = daysAgo(id, 30, 90, 400);
  const nextFloat = addDays(lastFloat, 365);
  const dentalFindings = pick(id, 31, [
    "No sharp points, hooks, or wave mouth. Bit seat well-established. Overall excellent dentition.",
    "Minor sharp enamel points present on upper 08s — floated and resolved. No further concerns.",
    "Age-appropriate wear. No significant malocclusion. Lower 06s show mild step — monitor at next visit.",
    "Good dental alignment. No loose teeth or periodontal pocketing. Incisors and cheek teeth within normal limits.",
  ]);

  // Body systems
  const eyeNote = pick(id, 40, [
    "Both eyes clear and moist. No discharge, cloudiness, or lacrimation. Pupillary light reflex intact bilaterally.",
    "Clear ocular surfaces. Minimal serous discharge OD — within normal limits. PLR intact and equal.",
    "Eyes clear, cornea transparent, no ulceration. No lacrimation or blepharospasm. PLR normal.",
  ]);
  const earNote = pick(id, 41, [
    "Ears clean, no wax build-up or discharge. No sensitivity on palpation.",
    "Canals clear. No odour. Normal auricular reflex. No hypersensitivity.",
    "Clean and dry bilaterally. No evidence of mite infestation or infection.",
  ]);
  const nasalNote = pick(id, 42, [
    "No nasal discharge. Nares patent. Upper airway sounds clear on auscultation.",
    "Bilateral thin serous discharge — within normal limits for season. No mucopurulent secretion.",
    "Nares clear. Minimal clear discharge. No facial swelling or submandibular lymphadenopathy.",
  ]);
  const lungNote = pick(id, 43, [
    "Lung fields clear bilaterally. Normal vesicular breath sounds throughout. No crackles or wheezes on auscultation.",
    "Clear auscultation bilaterally. No adventitious lung sounds. Diaphragmatic excursion appears normal.",
    "Normal lung sounds. Caudal dorsal fields clear. No areas of dullness or increased broncho-vesicular sounds.",
  ]);
  const heartNote = pick(id, 44, [
    "Regular rate and rhythm. No cardiac murmurs auscultated. S1 and S2 clearly discernible. Peripheral pulses strong and synchronous.",
    "Normal sinus rhythm. No murmurs detected. Jugular pulses absent. Digital pulses symmetrical and within normal limits.",
    "Heart rhythm regular. No abnormal sounds detected. Pulse quality good. No evidence of arrhythmia.",
  ]);
  const gutNotes = {
    LDQ: pick(id, 45, ["2–3 sounds/min", "3–4 sounds/min", "2 sounds/min — normal"]),
    LVQ: pick(id, 46, ["2–4 sounds/min", "3 sounds/min", "2–3 sounds/min"]),
    RDQ: pick(id, 47, ["1–2 sounds/min", "2 sounds/min", "1–3 sounds/min — normal"]),
    RVQ: pick(id, 48, ["2–3 sounds/min", "3–4 sounds/min", "2 sounds/min"]),
  };
  const fecalNote = pick(id, 49, ["Normal formed balls, appropriate moisture.", "Well-formed. Normal colour and consistency.", "Normal. No diarrhoea or abnormal firmness."]);
  const limbNote = pick(id, 50, [
    "All four limbs free of heat, swelling, or pain on palpation. Tendons, ligaments, and joint capsules within normal limits. No effusion detected.",
    "Limbs clean. No periarticular swelling. Digital flexor tendons palpate normal. Fetlock, knee, and hock joints cool and non-painful.",
    "No heat or swelling in any limb. Hoof testers negative. Flexion tests negative bilaterally.",
  ]);
  const skinNote = pick(id, 51, [
    "Coat smooth and glossy. Skin turgor normal. No lesions, alopecia, or ectoparasites noted.",
    "Good coat quality. No rubs, rashes, or skin abnormalities. Mane and tail in good condition.",
    "Skin supple and elastic. Coat reflects good nutritional status. No abrasions or dermatophytosis.",
  ]);
  const reproNote = gender === "Stallion"
    ? pick(id, 52, [
        "External genitalia normal. Scrotum smooth, no asymmetry. Testes descended and uniform in size. No lesions or swelling.",
        "Prepuce clean, no smegma accumulation beyond normal. Penis free of lesions. Testes symmetrical.",
      ])
    : gender === "Mare"
    ? pick(id, 52, [
        "External perineum clean and well-conformed. No discharge. Vulvar lips symmetric with adequate seal.",
        "Normal perineal conformation. No vulval discharge. Mammary gland non-lactating and symmetric.",
      ])
    : "Not applicable (gelding).";
  const neuroNote = pick(id, 53, [
    "Alert and oriented. Normal mentation. Gait assessed at walk and trot — no ataxia or stumbling. Tail and anal tone normal.",
    "No neurological deficits detected. Cranial nerves grossly intact. Proprioceptive placing normal bilaterally.",
    "Mentation appropriate. No head tilt or nystagmus. Spinal reflex arcs intact. Normal locomotion.",
  ]);
  const lymphNote = pick(id, 54, [
    "Submandibular and prescapular lymph nodes non-enlarged and non-painful.",
    "Peripheral lymph nodes within normal limits. No regional lymphadenopathy.",
    "Lymph nodes palpated — not enlarged. Normal consistency.",
  ]);

  // Recommendations
  const recs = pick(id, 60, [
    "Continue current management regime. Maintain vaccination and deworming schedule. Annual dental float recommended.",
    "Monitor body condition score monthly. Adjust nutrition if needed. Next FEC in 12 weeks.",
    "Horse is in excellent health. No changes to current programme required. Recheck in 12 months or sooner if concerns arise.",
    "Schedule farrier within 2 weeks per notes. Continue nutritional supplementation. Vaccinations up to date.",
  ]);

  // Lab (shown for ~60% of horses)
  const showLab = seed(id, 70) > 0.4;
  const lab = showLab ? {
    pcv: intBetween(id, 71, 35, 45),
    tp: floatBetween(id, 72, 6.0, 8.0),
    fibrinogen: intBetween(id, 73, 100, 350),
    wbc: floatBetween(id, 74, 5.0, 10.5),
  } : null;

  return {
    temp, hr, rr, wt, bcs, crt, mm, dem, hydra, vaxRecords,
    lastDewormDate, dewProduct, fec, fecRisk, nextDeworm,
    hoofType, lastTrim, nextTrim, hoofNotes,
    lastFloat, nextFloat, dentalFindings,
    eyeNote, earNote, nasalNote, lungNote, heartNote,
    gutNotes, fecalNote, limbNote, skinNote, reproNote, neuroNote,
    lymphNote, recs, lab,
  };
}

function vax(id: string, i: number, lo: number, hi: number, product: string, nextDays = 365) {
  const date = daysAgo(id, i, lo, hi);
  return { date, product, nextDue: addDays(date, nextDays) };
}

// ─── BSE ──────────────────────────────────────────────────────────────────────
function bseData(id: string) {
  const vol      = intBetween(id, 10, 40, 90);
  const conc     = intBetween(id, 11, 200, 400);
  const total    = (vol * conc).toLocaleString();
  const progMot  = intBetween(id, 12, 60, 80);
  const totalMot = intBetween(id, 13, progMot, Math.min(progMot + 12, 95));
  const morphNorm = intBetween(id, 14, 88, 97);
  const lLen     = floatBetween(id, 15, 8.5, 13.0);
  const rLen     = floatBetween(id, 16, parseFloat(lLen) * 0.95, parseFloat(lLen) * 1.05);
  return { vol, conc, total, progMot, totalMot, morphNorm, morphAbn: 100 - morphNorm, lLen, rLen };
}

// ─── Shared types ─────────────────────────────────────────────────────────────
export interface PdfHorse {
  id: string; name: string; breed: string | null; gender: string | null;
  coat: string | null; genotype: string | null; dob: string | null;
  regNumber: string | null; microchip: string | null; height: string | null;
  discipline: string | null; stablePrefix: string | null;
  ownerName: string | null; sireName: string | null; damName: string | null;
}
export interface PdfResult { id: string; event: string; placement: string | null; date: string | null; notes: string | null; }

// ─── Shared layout components ─────────────────────────────────────────────────
function CrossIcon({ size = 28, color = TEAL }: { size?: number; color?: string }) {
  const a = Math.round(size * 0.3);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 0, left: a, width: size - a * 2, height: size, background: color }} />
      <div style={{ position: "absolute", top: a, left: 0, width: size, height: size - a * 2, background: color }} />
    </div>
  );
}

function PageHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CrossIcon size={32} />
          <div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 17, fontWeight: 900, letterSpacing: "0.08em", color: TEAL_DARK }}>BELMONT</div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: MUTED }}>Veterinarian Clinic</div>
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 20, fontWeight: 900, letterSpacing: "0.07em", color: TEXT }}>{title}</div>
        <div style={{ width: 60, height: 60, borderRadius: "50%", border: `2px solid ${TEAL}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CrossIcon size={28} />
        </div>
      </div>
      <div style={{ height: 2, background: TEAL, marginTop: 12 }} />
    </div>
  );
}

function Bar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: TEAL, color: WHITE, fontFamily: "var(--font-lato)", fontWeight: 900, fontSize: 11, letterSpacing: "0.09em", padding: "5px 12px", marginBottom: 8 }}>
      {children}
    </div>
  );
}

function F({ label, value, span }: { label: string; value: string | null | undefined; span?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "baseline", marginBottom: 5, ...(span ? { gridColumn: "1/-1" } : {}) }}>
      <span style={{ fontFamily: "var(--font-lato)", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: MUTED, textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}:</span>
      <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: TEXT, borderBottom: `1px solid ${TEAL_LIGHT}`, flexGrow: 1 }}>{value || "—"}</span>
    </div>
  );
}

function SignBlock({ date, sigName = "E. Harlow", line2 = VET, line3 = "Belmont Veterinarian Clinic", licLine = `License No. ${LIC}` }: {
  date?: string; sigName?: string; line2?: string; line3?: string; licLine?: string;
}) {
  return (
    <div style={{ textAlign: "right", flexShrink: 0 }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontStyle: "italic", color: TEAL_DARK, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 3, marginBottom: 3, minWidth: 190 }}>{sigName}</div>
      {licLine && <div style={{ fontFamily: "var(--font-lato)", fontSize: 10, color: MUTED }}>{licLine}</div>}
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 900, color: TEXT }}>{line2}</div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 10, color: MUTED }}>{line3}</div>
      {date && <div style={{ fontFamily: "var(--font-lato)", fontSize: 10, color: MUTED, marginTop: 3 }}>Date: {date}</div>}
    </div>
  );
}

function PgNum({ n }: { n: number }) {
  return <div style={{ position: "absolute", bottom: 28, right: PAD, fontFamily: "var(--font-lato)", fontSize: 11, color: MUTED, fontWeight: 700 }}>{n}</div>;
}

const pageBase: React.CSSProperties = { width: PW, height: PH, background: BG, position: "relative", overflow: "hidden", padding: PAD, boxSizing: "border-box" };

// ─── COVER ────────────────────────────────────────────────────────────────────
function HealthCover({ h }: { h: PdfHorse }) {
  return (
    <div style={{ ...pageBase, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)", opacity: 0.04 }}>
        <CrossIcon size={700} color={TEAL_DARK} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <CrossIcon size={36} />
        <div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 20, fontWeight: 900, letterSpacing: "0.08em", color: TEAL_DARK }}>BELMONT</div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED }}>Veterinarian Clinic</div>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ marginBottom: 48, opacity: 0.6 }}><CrossIcon size={88} color={TEAL} /></div>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 78, color: TEAL, letterSpacing: "0.06em", textAlign: "center", lineHeight: 1 }}>EQUINE HEALTH</div>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 64, color: TEAL, letterSpacing: "0.12em", textAlign: "center", lineHeight: 1.2, marginBottom: 18 }}>BOOK</div>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 16, color: MUTED, letterSpacing: "0.2em", textAlign: "center" }}>Your horse. Our priority.</div>
      </div>
      <div style={{ marginBottom: 64 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, fontFamily: "Georgia, serif", fontSize: 19 }}>
          <span style={{ color: MUTED }}>Horse Name:</span>
          <span style={{ color: TEXT, fontStyle: "italic", borderBottom: `2px dotted ${TEAL}`, paddingBottom: 4, minWidth: 480 }}>{h.name}</span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: PAD, right: PAD }}>
        <div style={{ width: 92, height: 92, borderRadius: "50%", border: `3px solid ${TEAL}`, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(135,155,149,0.06)" }}>
          <CrossIcon size={42} color={TEAL} />
        </div>
      </div>
    </div>
  );
}

// ─── HEALTH REPORT (page 2) ───────────────────────────────────────────────────
function HealthReport({ h }: { h: PdfHorse }) {
  const hd    = buildHealthData(h.id, h.gender);
  const today = fmtDate(new Date());

  return (
    <div style={pageBase}>
      <PageHeader title="EQUINE HEALTH REPORT" />

      {/* Horse info */}
      <Bar>Horse Information</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 28px", marginBottom: 6 }}>
        <F label="Horse's Name" value={h.name} />
        <F label="Breed" value={h.breed} />
        <F label="Coat" value={h.coat} />
        <F label="Genotype" value={h.genotype} />
        <F label="Foal Date" value={h.dob ? fmtDate(h.dob) : null} />
        <F label="Reg. Number" value={h.regNumber} />
        <F label="Sire" value={h.sireName} />
        <F label="Dam" value={h.damName} />
        <F label="Registered Stable" value={h.stablePrefix || "Redfield Equestrian Centre"} />
      </div>
      <div style={{ display: "flex", gap: 20, marginBottom: 4, fontFamily: "var(--font-lato)", fontSize: 11 }}>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Gender:</span>
        {["Stallion", "Gelding", "Mare"].map(g => <span key={g} style={{ color: TEXT }}>{h.gender === g ? "☑" : "☐"} {g.toUpperCase()}</span>)}
        <span style={{ marginLeft: 24, fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Date of Exam:</span>
        <span style={{ color: TEXT, fontStyle: "italic" }}>{today}</span>
        <span style={{ marginLeft: 24, fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Visit Type:</span>
        <span style={{ color: TEXT }}>☑ ROUTINE &nbsp; ☐ LAMENESS &nbsp; ☐ ILLNESS</span>
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 10 }} />

      {/* Vitals + General */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px", marginBottom: 10 }}>
        <div>
          <Bar>Vital Signs</Bar>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-lato)", fontSize: 11 }}>
            <tbody>
              {[
                ["Temperature",          `${hd.temp} °F`],
                ["Heart Rate",           `${hd.hr} bpm`],
                ["Respiratory Rate",     `${hd.rr} rpm`],
                ["Body Weight (est.)",   `${hd.wt} lbs`],
                ["Height",               h.height ? `${h.height} hh` : "—"],
                ["Body Condition Score", `${hd.bcs} / 9 (Henneke)`],
                ["Cap. Refill Time",     hd.crt],
                ["Mucous Membranes",     hd.mm],
              ].map(([lbl, val]) => (
                <tr key={lbl} style={{ borderBottom: `1px solid ${TEAL_LIGHT}` }}>
                  <td style={{ padding: "4px 8px 4px 0", color: MUTED, fontWeight: 700, textTransform: "uppercase", fontSize: 10, whiteSpace: "nowrap" }}>{lbl}</td>
                  <td style={{ padding: "4px 0", color: TEXT }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <Bar>General Impression</Bar>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-lato)", fontSize: 11 }}>
            <tbody>
              {[
                ["Demeanour",    hd.dem],
                ["Hydration",    hd.hydra],
                ["Coat Quality", pick(h.id, 55, ["Excellent — glossy and well-groomed", "Good — healthy shine", "Good — appropriate for season"])],
                ["Lymph Nodes",  hd.lymphNote],
              ].map(([lbl, val]) => (
                <tr key={lbl} style={{ borderBottom: `1px solid ${TEAL_LIGHT}` }}>
                  <td style={{ padding: "4px 8px 4px 0", color: MUTED, fontWeight: 700, textTransform: "uppercase", fontSize: 10, whiteSpace: "nowrap", verticalAlign: "top" }}>{lbl}</td>
                  <td style={{ padding: "4px 0", color: TEXT, fontStyle: "italic" }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vaccination record */}
      <Bar>Vaccination Record</Bar>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10, fontFamily: "var(--font-lato)", fontSize: 11 }}>
        <thead>
          <tr style={{ background: "rgba(135,155,149,0.12)" }}>
            {["Vaccine", "Product / Brand", "Date Given", "Next Due"].map(col => (
              <th key={col} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "5px 8px", color: MUTED, fontWeight: 700, fontSize: 10, textTransform: "uppercase", textAlign: "left" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hd.vaxRecords.map((v, i) => (
            <tr key={v.name} style={{ background: i % 2 === 0 ? WHITE : "rgba(135,155,149,0.04)" }}>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "4px 8px", color: TEXT, fontWeight: 700 }}>☑ {v.name}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "4px 8px", color: MUTED, fontStyle: "italic" }}>{v.product}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "4px 8px", color: TEXT }}>{v.date}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "4px 8px", color: TEXT }}>{v.nextDue}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Parasite + Hoof */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px", marginBottom: 10 }}>
        <div>
          <Bar>Parasite Control</Bar>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-lato)", fontSize: 11 }}>
            <tbody>
              {[
                ["Last Treatment",    hd.lastDewormDate],
                ["Product Used",      hd.dewProduct],
                ["Method",            "Oral paste (weight-based dosing)"],
                ["FEC Result",        `${hd.fec} EPG — ${hd.fecRisk} risk`],
                ["Next Treatment",    hd.nextDeworm],
              ].map(([lbl, val]) => (
                <tr key={lbl} style={{ borderBottom: `1px solid ${TEAL_LIGHT}` }}>
                  <td style={{ padding: "4px 8px 4px 0", color: MUTED, fontWeight: 700, textTransform: "uppercase", fontSize: 10, whiteSpace: "nowrap", verticalAlign: "top" }}>{lbl}</td>
                  <td style={{ padding: "4px 0", color: TEXT, fontStyle: "italic" }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <Bar>Hoof Care</Bar>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-lato)", fontSize: 11 }}>
            <tbody>
              {[
                ["Shoe Type",       hd.hoofType],
                ["Last Trim / Shoe", hd.lastTrim],
                ["Next Due",         hd.nextTrim],
                ["Farrier",          "E. Morrison"],
                ["Condition",        hd.hoofNotes],
              ].map(([lbl, val]) => (
                <tr key={lbl} style={{ borderBottom: `1px solid ${TEAL_LIGHT}` }}>
                  <td style={{ padding: "4px 8px 4px 0", color: MUTED, fontWeight: 700, textTransform: "uppercase", fontSize: 10, whiteSpace: "nowrap", verticalAlign: "top" }}>{lbl}</td>
                  <td style={{ padding: "4px 0", color: TEXT, fontStyle: "italic" }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PgNum n={2} />
    </div>
  );
}

// ─── CLINICAL EXAMINATION (page 3) ───────────────────────────────────────────
function ClinicalExam({ h }: { h: PdfHorse }) {
  const hd    = buildHealthData(h.id, h.gender);
  const today = fmtDate(new Date());

  const systems: [string, string][] = [
    ["Head, Eyes & Nasal",  `${hd.eyeNote} ${hd.nasalNote}`],
    ["Ears",                hd.earNote],
    ["Respiratory",         hd.lungNote],
    ["Cardiovascular",      hd.heartNote],
    ["Digestive / GI", `Gut sounds — LDQ: ${hd.gutNotes.LDQ}, LVQ: ${hd.gutNotes.LVQ}, RDQ: ${hd.gutNotes.RDQ}, RVQ: ${hd.gutNotes.RVQ}. ${hd.fecalNote}`],
    ["Musculoskeletal",     hd.limbNote],
    ["Integumentary",       hd.skinNote],
    ["Reproductive",        hd.reproNote],
    ["Neurological",        hd.neuroNote],
  ];

  return (
    <div style={pageBase}>
      <PageHeader title="CLINICAL EXAMINATION" />

      {/* ID strip */}
      <div style={{ display: "flex", gap: 24, marginBottom: 8, fontFamily: "var(--font-lato)", fontSize: 11 }}>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Horse:</span>
        <span style={{ color: TEXT, fontWeight: 700 }}>{h.name}</span>
        <span style={{ color: TEAL_LIGHT }}>|</span>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Breed:</span>
        <span style={{ color: TEXT }}>{h.breed || "—"}</span>
        <span style={{ color: TEAL_LIGHT }}>|</span>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Gender:</span>
        <span style={{ color: TEXT }}>{h.gender || "—"}</span>
        <span style={{ color: TEAL_LIGHT }}>|</span>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Date:</span>
        <span style={{ color: TEXT, fontStyle: "italic" }}>{today}</span>
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 10 }} />

      {/* Body systems */}
      <Bar>Clinical Findings — Body Systems Assessment</Bar>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
        {systems.map(([sys, note]) => (
          <div key={sys} style={{ display: "grid", gridTemplateColumns: "185px 1fr", gap: 12, alignItems: "start" }}>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: TEAL_DARK, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: GREEN_OK, fontSize: 14 }}>✓</span>{sys}
            </div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: TEXT, fontStyle: "italic", borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 3 }}>{note}</div>
          </div>
        ))}
      </div>

      {/* Dental */}
      <Bar>Dental Examination</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 28px", marginBottom: 10 }}>
        <F label="Last Float" value={hd.lastFloat} />
        <F label="Next Float Due" value={hd.nextFloat} />
        <F label="Dentist" value="Dr. E. Harlow, DVM" />
      </div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: TEXT, fontStyle: "italic", borderLeft: `3px solid ${TEAL}`, paddingLeft: 10, marginBottom: 12 }}>
        {hd.dentalFindings}
      </div>

      {/* Lab (conditional) */}
      {hd.lab && (
        <>
          <Bar>Laboratory Results (In-House Panel)</Bar>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12, fontFamily: "var(--font-lato)", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "rgba(135,155,149,0.12)" }}>
                {["Parameter", "Result", "Reference Range", "Status"].map(col => (
                  <th key={col} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "5px 8px", color: MUTED, fontWeight: 700, fontSize: 10, textTransform: "uppercase", textAlign: "left" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["PCV (Packed Cell Volume)",   `${hd.lab.pcv}%`,           "32–48%",            "Normal"],
                ["Total Protein",              `${hd.lab.tp} g/dL`,        "5.8–8.7 g/dL",      "Normal"],
                ["Fibrinogen",                 `${hd.lab.fibrinogen} mg/dL`, "100–400 mg/dL",   "Normal"],
                ["WBC",                        `${hd.lab.wbc} ×10³/µL`,    "5.4–14.3 ×10³/µL", "Normal"],
              ].map(([param, res, ref, status], i) => (
                <tr key={param} style={{ background: i % 2 === 0 ? WHITE : "rgba(135,155,149,0.04)" }}>
                  <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "4px 8px", color: TEXT }}>{param}</td>
                  <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "4px 8px", color: TEXT, fontWeight: 700 }}>{res}</td>
                  <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "4px 8px", color: MUTED, fontStyle: "italic" }}>{ref}</td>
                  <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "4px 8px", color: GREEN_OK, fontWeight: 700 }}>{status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Recommendations */}
      <Bar>Recommendations &amp; Notes</Bar>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", color: TEXT, lineHeight: 1.7, borderLeft: `3px solid ${TEAL}`, paddingLeft: 12, marginBottom: 14 }}>
        {hd.recs}
      </div>

      {/* Signature */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <SignBlock date={today} />
      </div>
      <PgNum n={3} />
    </div>
  );
}

// ─── MICROCHIP (single page → PNG) ───────────────────────────────────────────
function MicrochipPage({ h }: { h: PdfHorse }) {
  const chip    = chipNumber(h.microchip, h.id);
  const today   = fmtDate(new Date());
  const chipped = h.dob ? fmtDate(new Date(new Date(h.dob).getTime() + 90 * 864e5)) : today;
  return (
    <div style={{ ...pageBase, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.03 }}><CrossIcon size={900} color={TEAL_DARK} /></div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CrossIcon size={36} />
          <div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 20, fontWeight: 900, letterSpacing: "0.08em", color: TEAL_DARK }}>BELMONT</div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED }}>Veterinarian Clinic</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 28, color: TEXT }}>MICROCHIP</div>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: MUTED }}>Registration Certificate</div>
        </div>
      </div>
      <div style={{ height: 2, background: TEAL, marginBottom: 46 }} />
      <div style={{ textAlign: "center", marginBottom: 46 }}>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>ISO 11784/85 Transponder Code</div>
        <div style={{ display: "inline-block", border: `3px solid ${TEAL}`, borderRadius: 12, padding: "18px 44px", background: "rgba(135,155,149,0.06)" }}>
          <div style={{ fontFamily: "Courier New, monospace", fontSize: 38, fontWeight: 900, letterSpacing: "0.22em", color: TEAL_DARK }}>
            {chip.slice(0, 5)}&nbsp;{chip.slice(5, 10)}&nbsp;{chip.slice(10)}
          </div>
        </div>
      </div>
      <div style={{ background: WHITE, border: `1px solid ${TEAL_LIGHT}`, borderRadius: 8, padding: 32, marginBottom: 24 }}>
        <Bar>Registered Animal Details</Bar>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 44px" }}>
          {([["Name", h.name], ["Breed", h.breed], ["Gender", h.gender], ["Foal Date", h.dob ? fmtDate(h.dob) : null], ["Coat", h.coat], ["Reg. Number", h.regNumber], ["Registered Stable", h.stablePrefix || "Redfield Equestrian Centre"], ["Date Chipped", chipped]] as [string, string | null][]).map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{lbl}</div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 5 }}>{val || "—"}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: TEXT, marginBottom: 24 }}>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase", fontSize: 10 }}>Implant Location: </span>
        Left side of the neck, crest of the nuchal ligament, mid-neck region — standard ICAR compliant placement.
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}><SignBlock date={today} /></div>
    </div>
  );
}

// ─── BSE (single page → PNG) ─────────────────────────────────────────────────
function FertilityPage({ h }: { h: PdfHorse }) {
  const b = bseData(h.id); const today = fmtDate(new Date());
  return (
    <div style={pageBase}>
      <PageHeader title="BREEDING SOUNDNESS EVALUATION" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 28px", marginBottom: 6 }}>
        {([["Horse's Name", h.name], ["Breed", h.breed], ["Coat", h.coat], ["Foal Date", h.dob ? fmtDate(h.dob) : null], ["Genotype", h.genotype], ["Registered Stable", h.stablePrefix || "Redfield Equestrian Centre"]] as [string, string | null][]).map(([lbl, val]) => <F key={lbl} label={lbl} value={val} />)}
      </div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: TEXT, marginBottom: 8 }}>
        <strong style={{ color: MUTED, textTransform: "uppercase", fontSize: 10 }}>Gender: </strong>☑ STALLION
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 12 }} />
      <Bar>Laboratory Analysis</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 36px", marginBottom: 14, fontFamily: "var(--font-lato)", fontSize: 11 }}>
        {[["Volume", `${b.vol} mL`], ["Concentration", `${b.conc} million/mL`], ["Total Sperm per Ejaculate", `${b.total} million`], ["Progressive Motility", `${b.progMot}%`], ["Total Motility", `${b.totalMot}%`], ["Morphology", `${b.morphNorm}% normal / ${b.morphAbn}% abnormal`]].map(([lbl, val]) => (
          <div key={lbl} style={{ display: "flex", gap: 6, alignItems: "baseline", borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 4 }}>
            <span style={{ color: MUTED, fontWeight: 700, fontSize: 10, textTransform: "uppercase", minWidth: 200, flexShrink: 0 }}>{lbl}:</span>
            <span style={{ color: TEXT }}>{val}</span>
          </div>
        ))}
      </div>
      <Bar>Reproductive Examination</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 36px", marginBottom: 14, fontFamily: "var(--font-lato)", fontSize: 11 }}>
        {[["Left Testicle", `${b.lLen} × ${(parseFloat(b.lLen) * 0.85).toFixed(1)} cm`], ["Right Testicle", `${b.rLen} × ${(parseFloat(b.rLen) * 0.85).toFixed(1)} cm`], ["Symmetry & Firmness", "Symmetrical, firm, uniform"], ["Epididymis", "Smooth, normal shape, no sensitivity"], ["Shaft & Prepuce", "Clean, healthy, no irritation"], ["Accessory Glands", "Normal on rectal palpation"], ["Abnormalities", "None observed"], ["Collection", "Artificial mare / phantom"]].map(([lbl, val]) => (
          <div key={lbl} style={{ display: "flex", gap: 6, alignItems: "baseline", borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 4 }}>
            <span style={{ color: MUTED, fontWeight: 700, fontSize: 10, textTransform: "uppercase", minWidth: 200, flexShrink: 0 }}>{lbl}:</span>
            <span style={{ color: TEXT, fontStyle: "italic" }}>{val}</span>
          </div>
        ))}
      </div>
      <Bar>Assessment</Bar>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, display: "flex", gap: 28, marginBottom: 8 }}>
        <span style={{ fontWeight: 700, color: GREEN_OK }}>☑ FERTILE</span>
        <span style={{ color: MUTED }}>☐ SUBFERTILE</span>
        <span style={{ color: MUTED }}>☐ INFERTILE</span>
      </div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: MUTED, fontStyle: "italic", marginBottom: 14 }}>Cleared for full breeding. Continue routine conditioning. Recheck annually or sooner if difficulty arises.</div>
      <div style={{ display: "flex", gap: 28, alignItems: "flex-end" }}>
        <div style={{ flex: 1, fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: TEXT, lineHeight: 1.7, borderBottom: `1px solid ${TEAL_LIGHT}` }}>All findings within normal limits. Semen quality and reproductive anatomy indicate excellent breeding potential.</div>
        <SignBlock date={today} />
      </div>
    </div>
  );
}

// ─── INSURANCE (single page → PNG) ───────────────────────────────────────────
function InsurancePage({ h }: { h: PdfHorse }) {
  const policy = policyNum(h.id); const today = fmtDate(new Date()); const expiry = fmtDate(new Date(Date.now() + 365 * 864e5));
  const mortality = `$${Math.round((15000 + seed(h.id, 30) * 35000) / 1000) * 1000}`;
  const surgical  = `$${Math.round((8000  + seed(h.id, 31) * 12000) / 1000) * 1000}`;
  const liability = `$${Math.round((50000 + seed(h.id, 32) * 100000) / 1000) * 1000}`;
  return (
    <div style={{ ...pageBase, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.03 }}><CrossIcon size={900} color={TEAL_DARK} /></div>
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: TEAL_DARK, letterSpacing: "0.04em" }}>FRONTIER EQUINE INSURANCE CO.</div>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED, letterSpacing: "0.15em", textTransform: "uppercase" }}>Certificate of Insurance · Equine Mortality &amp; Liability</div>
      </div>
      <div style={{ height: 3, background: TEAL, marginBottom: 6 }} />
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 34 }} />
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 26, color: TEXT }}>CERTIFICATE OF INSURANCE</div>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED, marginTop: 5 }}>Policy No: <span style={{ fontWeight: 700, color: TEAL_DARK, letterSpacing: "0.1em" }}>{policy}</span></div>
      </div>
      <div style={{ background: WHITE, border: `1px solid ${TEAL_LIGHT}`, borderRadius: 8, padding: 28, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 44px" }}>
          {[["Insured", h.ownerName || h.stablePrefix || "Redfield Equestrian Centre"], ["Stable", h.stablePrefix || "Redfield Equestrian Centre"], ["Policy Effective", today], ["Policy Expiry", expiry]].map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{lbl}</div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 5 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
      <Bar>Insured Animal</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 44px", marginBottom: 24 }}>
        {([["Name", h.name], ["Breed", h.breed], ["Gender", h.gender], ["Foal Date", h.dob ? fmtDate(h.dob) : null], ["Coat", h.coat], ["Microchip / Reg.", h.microchip || h.regNumber]] as [string, string | null][]).map(([lbl, val]) => (
          <div key={lbl}>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{lbl}</div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 5 }}>{val || "—"}</div>
          </div>
        ))}
      </div>
      <Bar>Coverage Summary</Bar>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontFamily: "var(--font-lato)", fontSize: 12 }}>
        <thead><tr style={{ background: "rgba(135,155,149,0.12)" }}>{["Coverage Type", "Limit of Liability", "Status"].map(col => <th key={col} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "8px 14px", color: MUTED, fontWeight: 700, fontSize: 10, textTransform: "uppercase", textAlign: "left" }}>{col}</th>)}</tr></thead>
        <tbody>{[["Mortality / Theft", mortality, "ACTIVE"], ["Major Medical / Surgical", surgical, "ACTIVE"], ["Third-Party Liability", liability, "ACTIVE"]].map(([type, lim, status]) => <tr key={type}><td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "10px 14px", color: TEXT }}>{type}</td><td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "10px 14px", color: TEXT, fontWeight: 700 }}>{lim}</td><td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "10px 14px", color: GREEN_OK, fontWeight: 700 }}>{status}</td></tr>)}</tbody>
      </table>
      <div style={{ flex: 1 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44 }}>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontStyle: "italic", color: TEAL_DARK, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 3, marginBottom: 3 }}>M. Calloway</div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: MUTED }}>Underwriter — Frontier Equine Insurance Co.</div>
        </div>
        <div><div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: MUTED, marginBottom: 5 }}>DATE ISSUED</div><div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT }}>{today}</div></div>
      </div>
    </div>
  );
}

// ─── TRAINING LOG (single page → PNG) ────────────────────────────────────────
function TrainingLogPage({ h, results }: { h: PdfHorse; results: PdfResult[] }) {
  const today = fmtDate(new Date()); const rows = results.slice(0, 20);
  return (
    <div style={pageBase}>
      <PageHeader title="TRAINING LOG & PROGRESS REPORT" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 28px", marginBottom: 8 }}>
        {([["Horse", h.name], ["Breed", h.breed], ["Gender", h.gender], ["Foal Date", h.dob ? fmtDate(h.dob) : null], ["Discipline", h.discipline], ["Height", h.height ? `${h.height} hh` : null]] as [string, string | null][]).map(([lbl, val]) => <F key={lbl} label={lbl} value={val} />)}
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 10 }} />
      <Bar>Trainer Assessment</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 32px", marginBottom: 14 }}>
        {([["Discipline Focus", h.discipline || "General"], ["Training Level", "Advanced"], ["Overall Condition", "Excellent"], ["Current Programme", "Ongoing competition conditioning"]] as [string, string][]).map(([lbl, val]) => (
          <div key={lbl} style={{ display: "flex", gap: 5, alignItems: "baseline" }}>
            <span style={{ fontFamily: "var(--font-lato)", fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", whiteSpace: "nowrap" }}>{lbl}:</span>
            <span style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: TEXT, fontStyle: "italic", borderBottom: `1px solid ${TEAL_LIGHT}`, flexGrow: 1 }}>{val}</span>
          </div>
        ))}
      </div>
      <Bar>Competition &amp; Show Results</Bar>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18, fontFamily: "var(--font-lato)", fontSize: 11 }}>
        <thead><tr style={{ background: "rgba(135,155,149,0.12)" }}>{["Date", "Event / Show", "Placement", "Notes"].map(col => <th key={col} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "6px 10px", color: MUTED, fontWeight: 700, fontSize: 10, textTransform: "uppercase", textAlign: "left" }}>{col}</th>)}</tr></thead>
        <tbody>
          {rows.length > 0 ? rows.map((r, i) => (
            <tr key={r.id} style={{ background: i % 2 === 0 ? WHITE : "rgba(135,155,149,0.04)" }}>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "6px 10px", color: TEXT, whiteSpace: "nowrap" }}>{r.date ? fmtDate(r.date) : "—"}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "6px 10px", color: TEXT }}>{r.event}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "6px 10px", color: TEXT, fontWeight: 700 }}>{r.placement || "—"}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "6px 10px", color: MUTED, fontStyle: "italic", fontSize: 10 }}>{r.notes || "—"}</td>
            </tr>
          )) : [0,1,2,3,4].map(i => <tr key={i}>{[0,1,2,3].map(j => <td key={j} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "12px 10px" }} />)}</tr>)}
        </tbody>
      </table>
      <Bar>Report Sign-Off</Bar>
      <div style={{ display: "flex", gap: 28, alignItems: "flex-end" }}>
        <div style={{ flex: 1, fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", color: TEXT, lineHeight: 1.7, borderBottom: `1px solid ${TEAL_LIGHT}` }}>
          This training log is an accurate record of the horse&apos;s competition history and current training status as maintained by Redfield Equestrian Centre.
        </div>
        <SignBlock date={today} sigName="A. Redfield" line2="Athena Redfield" line3="Redfield Equestrian Centre" licLine="" />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export interface PdfDownloaderProps { horse: PdfHorse; results: PdfResult[]; }

function Btn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      background: disabled ? "var(--border)" : "var(--teal-dark)", color: "white",
      border: "none", borderRadius: 6, padding: "10px 18px",
      fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 13,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.65 : 1,
      whiteSpace: "nowrap",
    }}>{children}</button>
  );
}

const RATIO = 2; // high-res capture for both PDF and PNG

async function capture(ref: React.RefObject<HTMLDivElement | null>): Promise<string | null> {
  if (!ref.current) return null;
  await toPng(ref.current, { pixelRatio: RATIO, cacheBust: true }); // font warmup
  return toPng(ref.current, { pixelRatio: RATIO, cacheBust: true });
}

async function downloadAsPng(ref: React.RefObject<HTMLDivElement | null>, filename: string) {
  const url = await capture(ref);
  if (!url) return;
  const a = document.createElement("a");
  a.download = filename; a.href = url; a.click();
}

async function downloadAsPdf(refs: React.RefObject<HTMLDivElement | null>[], filename: string) {
  const pages: string[] = [];
  for (const ref of refs) {
    const img = await capture(ref);
    if (img) { pages.push(img); await new Promise<void>(r => setTimeout(r, 250)); }
  }
  const mod = await import("jspdf");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const JsPDF: any = (mod as any).jsPDF ?? (mod as any).default;
  const doc = new JsPDF({ format: "a4", unit: "mm", orientation: "portrait" });
  pages.forEach((img, i) => { if (i > 0) doc.addPage(); doc.addImage(img, "PNG", 0, 0, 210, 297); });
  doc.save(filename);
}

export default function PdfDownloader({ horse, results }: PdfDownloaderProps) {
  const hb0 = useRef<HTMLDivElement>(null); // cover
  const hb1 = useRef<HTMLDivElement>(null); // health report
  const hb2 = useRef<HTMLDivElement>(null); // clinical exam
  const mcR = useRef<HTMLDivElement>(null);
  const frt = useRef<HTMLDivElement>(null);
  const ins = useRef<HTMLDivElement>(null);
  const tlg = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<string | null>(null);
  const sl = horseSlug(horse.name);
  const isStallion = horse.gender === "Stallion";

  async function run(label: string, fn: () => Promise<void>) {
    setStatus(`Generating ${label}…`);
    try { await fn(); } finally { setStatus(null); }
  }

  const PS: React.CSSProperties = { width: PW, height: PH, flexShrink: 0 };

  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Btn disabled={!!status} onClick={() => run("Health Book", () => downloadAsPdf([hb0, hb1, hb2], `${sl}-health-book.pdf`))}>
          {status?.includes("Health Book") ? status : "↓ Health Book PDF"}
        </Btn>
        <Btn disabled={!!status} onClick={() => run("Microchip Card", () => downloadAsPng(mcR, `${sl}-microchip.png`))}>
          {status?.includes("Microchip") ? status : "↓ Microchip Card"}
        </Btn>
        {isStallion && (
          <Btn disabled={!!status} onClick={() => run("BSE Report", () => downloadAsPng(frt, `${sl}-bse.png`))}>
            {status?.includes("BSE") ? status : "↓ BSE Report"}
          </Btn>
        )}
        <Btn disabled={!!status} onClick={() => run("Insurance", () => downloadAsPng(ins, `${sl}-insurance.png`))}>
          {status?.includes("Insurance") ? status : "↓ Insurance Cert"}
        </Btn>
        <Btn disabled={!!status} onClick={() => run("Training Log", () => downloadAsPng(tlg, `${sl}-training-log.png`))}>
          {status?.includes("Training") ? status : "↓ Training Log"}
        </Btn>
      </div>

      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
        <div ref={hb0} style={PS}><HealthCover h={horse} /></div>
        <div ref={hb1} style={PS}><HealthReport h={horse} /></div>
        <div ref={hb2} style={PS}><ClinicalExam h={horse} /></div>
        <div ref={mcR} style={PS}><MicrochipPage h={horse} /></div>
        {isStallion && <div ref={frt} style={PS}><FertilityPage h={horse} /></div>}
        <div ref={ins} style={PS}><InsurancePage h={horse} /></div>
        <div ref={tlg} style={PS}><TrainingLogPage h={horse} results={results} /></div>
      </div>
    </>
  );
}
