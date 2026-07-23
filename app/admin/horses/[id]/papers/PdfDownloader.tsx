"use client";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";

// ─── Layout ───────────────────────────────────────────────────────────────────
const PW  = 1240;
const PH  = 1754;
const PAD = 60;

// ─── Palette ──────────────────────────────────────────────────────────────────
const TEAL       = "#879b95";
const TEAL_DARK  = "#3d5450";
const TEAL_LIGHT = "#c5d0cd";
const BG         = "#eef0ef";
const WHITE      = "#ffffff";
const TEXT       = "#1e2c2a";
const MUTED      = "#6a8078";
const GREEN_OK   = "#3a7a50";
const VET        = "Dr. E. Harlow, DVM";
const LIC        = "US-VET-29541063";

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
  const parts = base.split("/");
  if (parts.length !== 3) return "—";
  const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
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
  return `FEI-${new Date().getFullYear()}-${Array.from({ length: 6 }, (_, i) => Math.floor(seed(id, i + 50) * 10)).join("")}`;
}

// ─── Seeded health data ───────────────────────────────────────────────────────
function buildHealth(id: string, gender: string | null, height: string | null) {
  const temp  = floatBetween(id, 0, 99.0, 101.5);
  const hr    = intBetween(id, 1, 28, 44);
  const rr    = intBetween(id, 2, 8, 16);
  const wt    = intBetween(id, 3, 900, 1500);
  const bcs   = floatBetween(id, 6, 4.5, 7.0);
  const crt   = seed(id, 7) > 0.15 ? "< 2 seconds" : "2 seconds";
  const mm    = pick(id, 8, ["Pink and moist", "Pink and moist", "Pink and moist", "Pale pink, moist"]);
  const dem   = pick(id, 9, ["Alert and responsive", "Bright and inquisitive", "Alert, standing squarely", "Quiet but bright"]);
  const hydra = pick(id, 10, ["Well hydrated — skin tent < 1 sec", "Well hydrated — skin tent < 2 sec"]);

  // Vaccinations
  const vaxList = [
    { name: "Tetanus",          product: "Tetanus Toxoid (Fort Dodge)",       date: daysAgo(id, 11, 180, 700), interval: 365 },
    { name: "Rabies",           product: "IMRAB Equine",                      date: daysAgo(id, 12, 60, 300),  interval: 365 },
    { name: "EHV-1 / EHV-4",   product: "Pneumabort-K+1b",                   date: daysAgo(id, 13, 30, 150),  interval: 180 },
    { name: "Equine Influenza", product: "Fluvac Innovator EHV",              date: daysAgo(id, 14, 30, 150),  interval: 180 },
    { name: "EEE / WEE / VEE", product: "Encephalomyelitis Bivalent (Boehringer)", date: daysAgo(id, 15, 60, 360), interval: 365 },
    { name: "West Nile Virus",  product: "West Nile-Innovator",               date: daysAgo(id, 16, 60, 300),  interval: 365 },
    { name: "Strangles",        product: "Pinnacle I.N. (Zoetis)",            date: daysAgo(id, 17, 60, 360),  interval: 365 },
    { name: "Botulism",         product: "BotVax B (Neogen)",                 date: daysAgo(id, 18, 60, 700),  interval: 365 },
  ].map(v => ({ ...v, nextDue: addDays(v.date, v.interval) }));

  // Parasite control
  const dewProducts = ["Ivermectin 1.87% (Eqvalan)", "Fenbendazole 10% (Panacur)", "Pyrantel Pamoate (Strongid P)", "Moxidectin 2% (Quest)", "Ivermectin + Praziquantel (Equimax)"];
  const lastDeworm  = daysAgo(id, 20, 14, 84);
  const dewProduct  = pick(id, 21, dewProducts);
  const fec         = intBetween(id, 22, 0, 180);
  const fecRisk     = fec < 50 ? "Low" : fec < 200 ? "Moderate" : "High";
  const nextDeworm  = addDays(lastDeworm, intBetween(id, 23, 56, 84));
  const prevProduct = pick(id, 24, dewProducts.filter(p => p !== dewProduct));

  // Hoof
  const hoofType  = pick(id, 25, ["Barefoot", "Shod — front pair", "Shod — all four", "Hind shoes only"]);
  const lastTrim  = daysAgo(id, 26, 21, 56);
  const nextTrim  = addDays(lastTrim, 42);
  const hoofNotes = pick(id, 27, [
    "Hooves well-balanced with adequate wall thickness. No cracks, white line disease, or thrush detected.",
    "Good hoof wall quality. Slight chipping on LH — monitor. No heat or tenderness on hoof testers.",
    "Excellent hoof condition. Even wear pattern consistent with work level. No pathology identified.",
    "Well-maintained hooves. Minor flare on RF corrected during trim. Wall integrity good.",
  ]);

  // Dental
  const lastFloat  = daysAgo(id, 30, 90, 400);
  const nextFloat  = addDays(lastFloat, 365);
  const dentalAge  = pick(id, 31, [
    "Dentition consistent with stated age. Smooth, even occlusal table.",
    "Age-appropriate Galvayne's groove present. Incisors show normal angulation for age.",
    "Cup wear and infundibulum consistent with estimated age. Arcade well-maintained.",
  ]);
  const dentalFind = pick(id, 32, [
    "No sharp points, hooks, or wave mouth detected. Bit seat well-established. Excellent dentition overall.",
    "Minor sharp enamel points on upper 08s — addressed and resolved during float. No further concerns.",
    "Mild step mouth forming on lower 06s — monitor at next visit. Bit seat maintained. No discomfort on manipulation.",
    "Good dental alignment. No loose or missing teeth. No periodontal pocketing. Upper incisors show minimal overgrowth — corrected.",
  ]);

  // Body systems
  const eyeNote   = pick(id, 40, [
    "Both eyes clear and moist. No ocular discharge, cloudiness, or lacrimation. Pupillary light reflex intact and equal bilaterally. Corneas transparent.",
    "Clear ocular surfaces. Minimal serous discharge OS — within normal limits. PLR intact. No corneal ulceration or uveitis signs.",
    "Eyes clear. No blepharospasm or photophobia. Cornea transparent, no fluorescein uptake. PLR brisk and symmetrical.",
  ]);
  const nasalNote = pick(id, 41, [
    "Nares patent. No nasal discharge. Upper airway sounds clear on auscultation. No facial swelling.",
    "Bilateral thin serous nasal discharge — seasonal norm. No mucopurulent secretion. No submandibular lymphadenopathy.",
    "No discharge. Nares clear and symmetrical. Nasal passages patent. No epistaxis or abnormal odour.",
  ]);
  const earNote   = pick(id, 42, [
    "Pinnae clean, no wax build-up or discharge. No sensitivity on palpation or manipulation. Auricular reflex present.",
    "Ears clean and dry bilaterally. No mite infestation, odour, or infection. Normal response to stimuli.",
    "Canal clear. No erythema or debris. Appropriate ceruminous secretion. No hypersensitivity.",
  ]);
  const lungNote  = pick(id, 43, [
    "Lung fields clear bilaterally on auscultation. Normal vesicular breath sounds throughout. No crackles, wheezes, or areas of dullness. Respiratory effort appropriate.",
    "Clear auscultation bilaterally. No adventitious lung sounds. Caudal lung fields checked — no dullness or consolidation. Tracheal sounds normal.",
    "Normal lung sounds throughout. Bilateral clear entry. No end-expiratory wheeze. Diaphragmatic excursion normal. No rebreather bag used.",
  ]);
  const heartNote = pick(id, 44, [
    "Regular sinus rhythm. No cardiac murmurs auscultated. S1 and S2 clearly discernible. Peripheral pulse quality strong and synchronous. Jugular fill < 2 sec.",
    "Normal rate and rhythm. No murmurs detected at all valve positions. Digital pulses equal and within normal limits. No jugular distension.",
    "Heart sounds normal. No pericardial friction rub. Rhythm regular, no dropped beats. Femoral pulse palpated — strong and symmetrical.",
  ]);
  const gutLDQ    = pick(id, 45, ["2–3 sounds/min", "3–4 sounds/min", "2 sounds/min (WNL)"]);
  const gutLVQ    = pick(id, 46, ["3–4 sounds/min", "2–3 sounds/min", "3 sounds/min"]);
  const gutRDQ    = pick(id, 47, ["1–2 sounds/min (WNL)", "2 sounds/min", "1–3 sounds/min"]);
  const gutRVQ    = pick(id, 48, ["2–3 sounds/min", "3–4 sounds/min", "2 sounds/min (WNL)"]);
  const fecalNote = pick(id, 49, ["Normal formed fecal balls. Appropriate moisture and colour. No undigested grain.", "Well-formed. Normal colour and consistency. No evidence of diarrhoea or mucus.", "Normal output. No diarrhoea, excessive firmness, or sand noted on rectal."]);
  const limbNote  = pick(id, 50, [
    "All four limbs free of heat, swelling, or pain on palpation. SDFT, DDFT, and suspensory ligaments palpated — within normal limits bilaterally. Fetlock, knee, carpus, and hock joints cool and non-effusive. Hoof testers negative on all four feet.",
    "No periarticular swelling or effusion detected. Digital flexor tendons palpate normal throughout. Flexion tests performed and negative bilaterally. No shortening of stride observed at walk or trot.",
    "Limbs clean with good musculature. No heat or filling in joints or tendons. Lateral digital extensor palpates normal. Coffin joint pressure test negative. No obvious lameness at walk.",
  ]);
  const skinNote  = pick(id, 51, [
    "Coat smooth and showing seasonal shine. Skin turgor normal — tent test < 2 sec. No alopecia, scaling, pruritus, or ectoparasite infestation. Mane and tail in good condition. No rain rot or dermatophytosis.",
    "Good coat condition appropriate for season. No skin lesions, wounds, or rubs. Sebaceous gland secretion normal. Skin supple and elastic throughout. No evidence of sweet itch or photosensitisation.",
    "Coat healthy and well-maintained. No ulcerations or dermatitis. Skin elasticity normal. Minor bug bite reaction on neck — treated. No scarring or hyperpigmentation of concern.",
  ]);
  const reproNote = gender === "Stallion"
    ? pick(id, 52, [
        "External genitalia normal. Scrotum cool and smooth. Testes descended, symmetrical, and uniform in consistency. Prepuce clean with normal smegma. No lesions, swelling, or asymmetry.",
        "Testicular palpation unremarkable. Epididymis palpated — smooth and non-painful bilaterally. Prepuce clean. Penis free of lesions. No inguinal herniation detected.",
      ])
    : gender === "Mare"
    ? pick(id, 52, [
        "External perineum clean and well-conformed. Vulvar conformation appropriate with adequate seal. No vulval discharge or perineal laxity. Mammary gland non-lactating and symmetric.",
        "Perineal conformation normal. No urovaginal pooling concerns. Vulval lips symmetric. No discharge. Mammary gland palpated — normal, no masses or secretion.",
      ])
    : "Not applicable — gelding. Castration site clean and fully healed. No evidence of cryptorchidism or inguinal herniation.";
  const neuroNote = pick(id, 53, [
    "Alert and orientated. Normal mentation. Gait assessed at walk and trot in hand — no ataxia, stumbling, or toe-dragging. Tail and anal tone present and normal. Cranial nerve assessment grossly intact.",
    "No neurological deficits detected. Cervical range of motion full. Proprioceptive placing normal bilaterally. Hopping test negative. Cranial nerves I–XII grossly evaluated and intact.",
    "Mentation appropriate and responsive. Spinal reflex arcs intact. Gait symmetrical at all gaits assessed. No head tilt or nystagmus. Backing test — no signs of weakness or spasticity.",
  ]);
  const lymphNote = pick(id, 54, [
    "Submandibular, prescapular, and mammary/inguinal lymph nodes palpated — non-enlarged, smooth, and non-painful.",
    "Peripheral lymph nodes within normal limits. No regional lymphadenopathy or firm nodularity detected.",
    "All accessible lymph nodes palpated and non-reactive. Normal consistency and size.",
  ]);

  // Nutrition
  const nutrition = pick(id, 56, [
    "Currently maintained on quality grass hay with vitamin/mineral supplementation. Body condition appropriate. No evidence of nutritional deficiency.",
    "Diet consisting of mixed grass/alfalfa hay and conditioning pellets. BCS reflects adequate caloric intake. Teeth support effective forage processing.",
    "Pasture-based diet supplemented with concentrated feed appropriate for workload. Water access unrestricted. No nutritional concerns identified.",
    "Hay-based ration with performance concentrate at maintenance-to-moderate work level. Diet well-matched to current exercise programme.",
  ]);

  // Recommendations
  const recs = [
    pick(id, 60, [
      "Continue current management regime. No changes required at this time.",
      "Maintain current feed, work, and healthcare programme.",
      "Horse in excellent health. Management programme commended.",
    ]),
    pick(id, 61, [
      `Next routine vaccination due: ${vaxList.reduce((a, v) => a.nextDue < v.nextDue ? a : v).nextDue}.`,
      `Booster vaccinations reviewed — earliest due: ${vaxList[0].nextDue}.`,
    ]),
    fec > 100 ? `FEC elevated at ${fec} EPG — schedule repeat deworming in 4–6 weeks using targeted product based on resistance profile.` : `Parasite burden low (FEC ${fec} EPG). Maintain current rotation protocol.`,
    `Next dental float recommended: ${nextFloat}.`,
    pick(id, 62, [
      "Annual recheck recommended. Contact clinic if behaviour, appetite, or gait changes.",
      "Recheck in 12 months. Present sooner if concerns arise regarding soundness or health.",
    ]),
  ];

  // Lab (60% of horses)
  const showLab = seed(id, 70) > 0.4;
  const lab = showLab ? {
    pcv: intBetween(id, 71, 35, 46),
    tp: floatBetween(id, 72, 6.0, 8.0),
    fibrinogen: intBetween(id, 73, 100, 350),
    wbc: floatBetween(id, 74, 5.4, 10.5),
    neutrophils: floatBetween(id, 75, 2.7, 6.7),
    lymphocytes: floatBetween(id, 76, 1.5, 5.0),
  } : null;

  // X-ray regions
  const xrayRegions = [
    { region: "Left Fore — Distal Limb (Foot & Pastern)", date: daysAgo(id, 80, 30, 365), views: "DP, LM, DLPMO, DMPLO", findings: pick(id, 81, ["No significant radiographic findings. Normal bone density and joint spacing.", "Mild bone remodelling at DIPJ — non-pathological, consistent with age and work.", "Normal radiographic findings. No periosteal reaction, joint effusion, or lysis.", "Joint spaces well-maintained. No osteophyte formation. Navicular bone within normal limits."]) },
    { region: "Right Fore — Distal Limb (Foot & Pastern)", date: daysAgo(id, 82, 30, 365), views: "DP, LM, DLPMO, DMPLO", findings: pick(id, 83, ["No significant radiographic findings. Normal bone density and joint spacing.", "Mild remodelling at DIPJ bilaterally — consistent with previous report.", "Navicular bone normal morphology. No fragmentation or cyst formation.", "Normal. No degenerative changes or new bone formation identified."]) },
    { region: "Hocks — Bilateral Tarsal Joints", date: daysAgo(id, 84, 30, 400), views: "DP, LM, DPO", findings: pick(id, 85, ["No significant changes. Joint spaces symmetrical and maintained.", "Early distal tarsal joint narrowing on left — early bone spavin changes, monitor closely.", "Normal hock radiographs bilaterally. No degenerative joint disease identified.", "Mild osteophytosis on distal IT and TMT joints bilaterally — common finding for age."]) },
    { region: "Stifles — Bilateral Femoropatellar",      date: daysAgo(id, 86, 60, 500), views: "CrCd, ML", findings: pick(id, 87, ["No significant radiographic abnormalities. Joint spaces well-maintained bilaterally.", "Normal stifle radiographs. No enthesiophyte formation on trochlear ridges.", "Minor osteochondral fragment noted on lateral trochlear ridge LH — under monitoring.", "Normal femoropatellar and femorotibial joint spaces. No subchondral bone changes."]) },
  ];

  return { temp, hr, rr, wt, bcs, crt, mm, dem, hydra, vaxList, lastDeworm, dewProduct, prevProduct, fec, fecRisk, nextDeworm, hoofType, lastTrim, nextTrim, hoofNotes, lastFloat, nextFloat, dentalAge, dentalFind, eyeNote, nasalNote, earNote, lungNote, heartNote, gutLDQ, gutLVQ, gutRDQ, gutRVQ, fecalNote, limbNote, skinNote, reproNote, neuroNote, lymphNote, nutrition, recs, lab, xrayRegions };
}

function buildBse(id: string) {
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

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PdfPlayer {
  id: string; ign: string; username: string;
  stableName: string | null; stablePrefix: string | null;
}

export interface PdfHorse {
  id: string; name: string; breed: string | null; gender: string | null;
  coat: string | null; genotype: string | null; dob: string | null;
  regNumber: string | null; microchip: string | null; height: string | null;
  discipline: string | null; stablePrefix: string | null;
  ownerName: string | null; sireName: string | null; damName: string | null;
}
export interface PdfResult { id: string; event: string; placement: string | null; date: string | null; notes: string | null; }

// ─── Layout atoms ─────────────────────────────────────────────────────────────
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
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <CrossIcon size={38} />
          <div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 20, fontWeight: 900, letterSpacing: "0.08em", color: TEAL_DARK }}>BELMONT</div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED }}>Veterinarian Clinic</div>
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 24, fontWeight: 900, letterSpacing: "0.07em", color: TEXT, textAlign: "center" }}>{title}</div>
        <div style={{ width: 72, height: 72, borderRadius: "50%", border: `2px solid ${TEAL}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CrossIcon size={34} />
        </div>
      </div>
      <div style={{ height: 2, background: TEAL, marginTop: 16 }} />
    </div>
  );
}

function Bar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: TEAL, color: WHITE, fontFamily: "var(--font-lato)", fontWeight: 900, fontSize: 14, letterSpacing: "0.08em", padding: "8px 16px", marginBottom: 12 }}>
      {children}
    </div>
  );
}

function LabelVal({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 10 }}>
      <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", color: MUTED, textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}:</span>
      <span style={{ fontFamily: "var(--font-lato)", fontSize: 15, color: TEXT, borderBottom: `1px solid ${TEAL_LIGHT}`, flexGrow: 1 }}>{value || "—"}</span>
    </div>
  );
}

function SignBlock({ date, sigName = "E. Harlow", line2 = VET, line3 = "Belmont Veterinarian Clinic", licLine = `License No. ${LIC}` }: { date?: string; sigName?: string; line2?: string; line3?: string; licLine?: string }) {
  return (
    <div style={{ textAlign: "right", flexShrink: 0 }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontStyle: "italic", color: TEAL_DARK, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 5, marginBottom: 5, minWidth: 240 }}>{sigName}</div>
      {licLine && <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED }}>{licLine}</div>}
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, fontWeight: 900, color: TEXT }}>{line2}</div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED }}>{line3}</div>
      {date && <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED, marginTop: 5 }}>Date: {date}</div>}
    </div>
  );
}

function PgNum({ n }: { n: number }) {
  return <div style={{ position: "absolute", bottom: 30, right: PAD, fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED, fontWeight: 700 }}>{n}</div>;
}

const base: React.CSSProperties = { width: PW, height: PH, background: BG, position: "relative", overflow: "hidden", padding: PAD, boxSizing: "border-box" };

// ─── HB PAGE 1: COVER ─────────────────────────────────────────────────────────
function HBCover({ h }: { h: PdfHorse }) {
  return (
    <div style={{ ...base, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)", opacity: 0.04 }}><CrossIcon size={720} color={TEAL_DARK} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <CrossIcon size={40} />
        <div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 22, fontWeight: 900, letterSpacing: "0.08em", color: TEAL_DARK }}>BELMONT</div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED }}>Veterinarian Clinic</div>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ marginBottom: 56, opacity: 0.55 }}><CrossIcon size={100} color={TEAL} /></div>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 88, color: TEAL, letterSpacing: "0.06em", textAlign: "center", lineHeight: 1 }}>EQUINE HEALTH</div>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 72, color: TEAL, letterSpacing: "0.14em", textAlign: "center", lineHeight: 1.2, marginBottom: 22 }}>BOOK</div>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 18, color: MUTED, letterSpacing: "0.22em", textAlign: "center" }}>Your horse. Our priority.</div>
      </div>
      <div style={{ marginBottom: 80 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, fontFamily: "Georgia, serif", fontSize: 22 }}>
          <span style={{ color: MUTED }}>Horse Name:</span>
          <span style={{ color: TEXT, fontStyle: "italic", borderBottom: `2px dotted ${TEAL}`, paddingBottom: 5, minWidth: 520 }}>{h.name}</span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: PAD, right: PAD }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", border: `3px solid ${TEAL}`, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(135,155,149,0.06)" }}>
          <CrossIcon size={48} color={TEAL} />
        </div>
      </div>
    </div>
  );
}

// ─── HB PAGE 2: VITALS + VACCINATIONS ─────────────────────────────────────────
function HBHealthReport({ h }: { h: PdfHorse }) {
  const hd = buildHealth(h.id, h.gender, h.height);
  const today = fmtDate(new Date());

  return (
    <div style={base}>
      <PageHeader title="EQUINE HEALTH REPORT" />

      {/* Horse info */}
      <Bar>Horse Information</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 36px", marginBottom: 10 }}>
        <LabelVal label="Horse's Name"      value={h.name} />
        <LabelVal label="Breed"             value={h.breed} />
        <LabelVal label="Coat"              value={h.coat} />
        <LabelVal label="Genotype"          value={h.genotype} />
        <LabelVal label="Foal Date"         value={h.dob ? fmtDate(h.dob) : null} />
        <LabelVal label="Reg. Number"       value={h.regNumber} />
        <LabelVal label="Sire"              value={h.sireName} />
        <LabelVal label="Dam"               value={h.damName} />
        <LabelVal label="Registered Stable" value={h.stablePrefix || "Redfield Equestrian Centre"} />
      </div>
      <div style={{ display: "flex", gap: 28, marginBottom: 8, fontFamily: "var(--font-lato)", fontSize: 13, alignItems: "center" }}>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Gender:</span>
        {["Stallion", "Gelding", "Mare"].map(g => <span key={g} style={{ color: TEXT }}>{h.gender === g ? "☑" : "☐"} {g.toUpperCase()}</span>)}
        <span style={{ marginLeft: 32, fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Date of Exam:</span>
        <span style={{ color: TEXT, fontStyle: "italic" }}>{today}</span>
        <span style={{ marginLeft: 20, fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Visit Type:</span>
        <span style={{ color: TEXT }}>☑ ROUTINE &nbsp;☐ LAMENESS &nbsp;☐ ILLNESS</span>
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 18 }} />

      {/* Vitals */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginBottom: 18 }}>
        <div>
          <Bar>Vital Signs</Bar>
          {[
            ["Temperature",           `${hd.temp} °F`],
            ["Heart Rate",            `${hd.hr} bpm`],
            ["Respiratory Rate",      `${hd.rr} rpm`],
            ["Body Weight (est.)",    `${hd.wt} lbs`],
            ["Height",                h.height ? `${h.height} hh` : "—"],
            ["Body Condition Score",  `${hd.bcs} / 9 (Henneke scale)`],
            ["Capillary Refill Time", hd.crt],
            ["Mucous Membranes",      hd.mm],
          ].map(([lbl, val]) => (
            <div key={lbl} style={{ display: "flex", borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "7px 0" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", minWidth: 220 }}>{lbl}</span>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT }}>{val}</span>
            </div>
          ))}
        </div>
        <div>
          <Bar>General Impression</Bar>
          {[
            ["Demeanour",   hd.dem],
            ["Hydration",   hd.hydra],
            ["Coat Quality", pick(h.id, 55, ["Excellent — glossy and well-maintained", "Good — healthy sheen", "Good — appropriate for season and work level"])],
            ["Lymph Nodes", hd.lymphNote],
            ["Nutrition",   hd.nutrition],
          ].map(([lbl, val]) => (
            <div key={lbl} style={{ borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "7px 0" }}>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", marginBottom: 2 }}>{lbl}</div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, fontStyle: "italic" }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vaccination table */}
      <Bar>Vaccination Record</Bar>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-lato)", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "rgba(135,155,149,0.14)" }}>
            {["Vaccine", "Product / Brand", "Date Given", "Next Due"].map(col => (
              <th key={col} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "8px 12px", color: MUTED, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hd.vaxList.map((v, i) => (
            <tr key={v.name} style={{ background: i % 2 === 0 ? WHITE : "rgba(135,155,149,0.04)" }}>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 12px", color: TEXT, fontWeight: 700 }}>☑ {v.name}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 12px", color: MUTED, fontStyle: "italic" }}>{v.product}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 12px", color: TEXT }}>{v.date}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 12px", color: TEXT }}>{v.nextDue}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <PgNum n={2} />
    </div>
  );
}

// ─── HB PAGE 3: PREVENTIVE CARE ───────────────────────────────────────────────
function HBPreventiveCare({ h }: { h: PdfHorse }) {
  const hd    = buildHealth(h.id, h.gender, h.height);
  const today = fmtDate(new Date());

  return (
    <div style={base}>
      <PageHeader title="PREVENTIVE CARE REPORT" />

      {/* Parasite control */}
      <Bar>Parasite Control — Deworming Programme</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginBottom: 22 }}>
        <div>
          {[
            ["Last Treatment Date",   hd.lastDeworm],
            ["Product Used",          hd.dewProduct],
            ["Administration",        "Oral paste — weight-based dosing"],
            ["Previous Rotation",     hd.prevProduct],
            ["Fecal Egg Count (FEC)", `${hd.fec} EPG`],
            ["Parasite Risk Level",   hd.fecRisk],
            ["Next Treatment Due",    hd.nextDeworm],
          ].map(([lbl, val]) => (
            <div key={lbl} style={{ display: "flex", borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "9px 0" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", minWidth: 240 }}>{lbl}</span>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, fontStyle: "italic" }}>{val}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, lineHeight: 1.8, background: WHITE, border: `1px solid ${TEAL_LIGHT}`, borderRadius: 6, padding: "16px 20px" }}>
            <div style={{ fontWeight: 700, color: TEAL_DARK, fontSize: 14, marginBottom: 10 }}>Parasite Programme Notes</div>
            <p style={{ marginTop: 0 }}>A targeted selective treatment (TST) programme is in place based on FEC monitoring. Horses with FEC below 200 EPG are treated seasonally; those above threshold receive immediate treatment.</p>
            <p>Product rotation minimises resistance risk. Current rotation avoids consecutive use of the same active ingredient.</p>
            <p style={{ marginBottom: 0 }}>Pasture management: manure removed {pick(h.id, 90, ["twice weekly", "weekly", "every 3–4 days"])}. Paddock harrowing scheduled post-treatment.</p>
          </div>
        </div>
      </div>

      {/* Hoof care */}
      <Bar>Hoof Care &amp; Farriery</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginBottom: 22 }}>
        <div>
          {[
            ["Shoeing / Trimming Type", hd.hoofType],
            ["Last Trim / Shoe Date",   hd.lastTrim],
            ["Next Appointment Due",    hd.nextTrim],
            ["Farrier",                 "E. Morrison (RFA)"],
            ["Trim Interval",           "6 weeks"],
          ].map(([lbl, val]) => (
            <div key={lbl} style={{ display: "flex", borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "9px 0" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", minWidth: 240 }}>{lbl}</span>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, fontStyle: "italic" }}>{val}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700, color: TEAL_DARK, fontSize: 14, marginBottom: 8 }}>Hoof Condition Notes</div>
            <div style={{ fontStyle: "italic", borderLeft: `3px solid ${TEAL}`, paddingLeft: 14 }}>{hd.hoofNotes}</div>
          </div>
        </div>
      </div>

      {/* Dental */}
      <Bar>Dental Examination</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginBottom: 22 }}>
        <div>
          {[
            ["Last Float / Examination", hd.lastFloat],
            ["Next Float Due",           hd.nextFloat],
            ["Veterinary Dentist",       VET],
            ["Dental Sedation Used",     seed(h.id, 35) > 0.4 ? "Yes — Detomidine 0.01 mg/kg IV" : "Yes — Romifidine 0.04 mg/kg IV"],
          ].map(([lbl, val]) => (
            <div key={lbl} style={{ display: "flex", borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "9px 0" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", minWidth: 240 }}>{lbl}</span>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, fontStyle: "italic" }}>{val}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700, color: TEAL_DARK, fontSize: 14, marginBottom: 8 }}>Dental Findings</div>
            <div style={{ fontStyle: "italic", borderLeft: `3px solid ${TEAL}`, paddingLeft: 14 }}>{hd.dentalAge} {hd.dentalFind}</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <Bar>Veterinary Recommendations</Bar>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {hd.recs.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ color: GREEN_OK, fontWeight: 900, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
            <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, lineHeight: 1.6 }}>{r}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <SignBlock date={today} />
      </div>
      <PgNum n={3} />
    </div>
  );
}

// ─── HB PAGE 4: CLINICAL EXAMINATION ─────────────────────────────────────────
function HBClinicalExam({ h }: { h: PdfHorse }) {
  const hd    = buildHealth(h.id, h.gender, h.height);
  const today = fmtDate(new Date());

  const systems: [string, string][] = [
    ["Head, Eyes & Nasal",   `${hd.eyeNote} ${hd.nasalNote}`],
    ["Ears",                 hd.earNote],
    ["Respiratory",          hd.lungNote],
    ["Cardiovascular",       hd.heartNote],
    ["Digestive / GI",       `Gut sounds: LDQ ${hd.gutLDQ} · LVQ ${hd.gutLVQ} · RDQ ${hd.gutRDQ} · RVQ ${hd.gutRVQ}. Fecal output: ${hd.fecalNote}`],
    ["Musculoskeletal",      hd.limbNote],
    ["Integumentary",        hd.skinNote],
    ["Reproductive",         hd.reproNote],
    ["Neurological",         hd.neuroNote],
  ];

  return (
    <div style={base}>
      <PageHeader title="CLINICAL EXAMINATION" />

      <div style={{ display: "flex", gap: 24, marginBottom: 12, fontFamily: "var(--font-lato)", fontSize: 13, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Horse:</span>
        <span style={{ color: TEXT, fontWeight: 700 }}>{h.name}</span>
        <span style={{ color: TEAL_LIGHT }}>|</span>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Breed:</span>
        <span style={{ color: TEXT }}>{h.breed || "—"}</span>
        <span style={{ color: TEAL_LIGHT }}>|</span>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Gender:</span>
        <span style={{ color: TEXT }}>{h.gender || "—"}</span>
        <span style={{ color: TEAL_LIGHT }}>|</span>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Examining Vet:</span>
        <span style={{ color: TEXT, fontStyle: "italic" }}>{VET}</span>
        <span style={{ color: TEAL_LIGHT }}>|</span>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>Date:</span>
        <span style={{ color: TEXT, fontStyle: "italic" }}>{today}</span>
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 18 }} />

      <Bar>Body Systems Assessment</Bar>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 22 }}>
        {systems.map(([sys, note]) => (
          <div key={sys} style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 18, alignItems: "start" }}>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, fontWeight: 700, color: TEAL_DARK, display: "flex", alignItems: "flex-start", gap: 8, paddingTop: 2 }}>
              <span style={{ color: GREEN_OK, fontSize: 16, lineHeight: 1 }}>✓</span>{sys}
            </div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, fontStyle: "italic", borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 6, lineHeight: 1.5 }}>{note}</div>
          </div>
        ))}
      </div>

      {hd.lab && (
        <>
          <Bar>Laboratory Panel — In-House Results</Bar>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontFamily: "var(--font-lato)", fontSize: 13 }}>
            <thead><tr style={{ background: "rgba(135,155,149,0.14)" }}>{["Parameter", "Result", "Reference Range", "Interpretation"].map(col => <th key={col} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "8px 14px", color: MUTED, fontWeight: 700, fontSize: 11, textTransform: "uppercase", textAlign: "left" }}>{col}</th>)}</tr></thead>
            <tbody>
              {[
                ["PCV (Packed Cell Volume)",  `${hd.lab.pcv}%`,                  "32–48%",             "Normal"],
                ["Total Protein",             `${hd.lab.tp} g/dL`,               "5.8–8.7 g/dL",       "Normal"],
                ["Fibrinogen",                `${hd.lab.fibrinogen} mg/dL`,       "100–400 mg/dL",      "Normal"],
                ["WBC",                       `${hd.lab.wbc} ×10³/µL`,           "5.4–14.3 ×10³/µL",   "Normal"],
                ["Neutrophils",               `${hd.lab.neutrophils} ×10³/µL`,   "2.7–6.7 ×10³/µL",    "Normal"],
                ["Lymphocytes",               `${hd.lab.lymphocytes} ×10³/µL`,   "1.5–5.0 ×10³/µL",    "Normal"],
              ].map(([p, r, ref, interp], i) => (
                <tr key={p} style={{ background: i % 2 === 0 ? WHITE : "rgba(135,155,149,0.04)" }}>
                  <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 14px", color: TEXT }}>{p}</td>
                  <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 14px", color: TEXT, fontWeight: 700 }}>{r}</td>
                  <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 14px", color: MUTED, fontStyle: "italic" }}>{ref}</td>
                  <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 14px", color: GREEN_OK, fontWeight: 700 }}>{interp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto" }}>
        <SignBlock date={today} />
      </div>
      <PgNum n={4} />
    </div>
  );
}

// ─── HB PAGE 5 & 6: X-RAY RECORDS ─────────────────────────────────────────────
function XRayPage({ h, pgOffset }: { h: PdfHorse; pgOffset: number }) {
  const hd   = buildHealth(h.id, h.gender, h.height);
  const xrs  = hd.xrayRegions.slice(pgOffset * 2, pgOffset * 2 + 2);
  const pgN  = 5 + pgOffset;
  const today = fmtDate(new Date());

  return (
    <div style={base}>
      <PageHeader title="RADIOGRAPHIC RECORDS (X-RAY)" />

      <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
        {xrs.map((xr, i) => (
          <div key={i}>
            {/* Meta row */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0 28px", marginBottom: 12 }}>
              <LabelVal label="Region Examined" value={xr.region} />
              <LabelVal label="Date Taken"      value={xr.date} />
              <LabelVal label="Views"           value={xr.views} />
            </div>
            {/* Image placeholder */}
            <div style={{
              width: "100%", height: 400, border: `2px dashed ${TEAL}`,
              borderRadius: 8, background: "rgba(135,155,149,0.04)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              marginBottom: 12,
            }}>
              <div style={{ opacity: 0.25, marginBottom: 14 }}><CrossIcon size={48} color={TEAL_DARK} /></div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 18, fontWeight: 700, color: TEAL, letterSpacing: "0.15em", textTransform: "uppercase" }}>X-RAY IMAGE</div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED, marginTop: 8, letterSpacing: "0.08em" }}>Insert radiograph image here</div>
            </div>
            {/* Findings */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", whiteSpace: "nowrap", marginTop: 2 }}>Findings:</span>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, fontStyle: "italic", borderBottom: `1px solid ${TEAL_LIGHT}`, flexGrow: 1, paddingBottom: 4 }}>{xr.findings}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: PAD, right: PAD }}>
        <SignBlock date={today} />
      </div>
      <PgNum n={pgN} />
    </div>
  );
}

// ─── MICROCHIP ─────────────────────────────────────────────────────────────────
function MicrochipPage({ h }: { h: PdfHorse }) {
  const chip    = chipNumber(h.microchip, h.id);
  const today   = fmtDate(new Date());
  const chipped = h.dob ? fmtDate(new Date(new Date(h.dob).getTime() + 90 * 864e5)) : today;
  return (
    <div style={{ ...base, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.03 }}><CrossIcon size={900} color={TEAL_DARK} /></div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <CrossIcon size={40} />
          <div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 22, fontWeight: 900, letterSpacing: "0.08em", color: TEAL_DARK }}>BELMONT</div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED }}>Veterinarian Clinic</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: TEXT }}>MICROCHIP</div>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: MUTED }}>Registration Certificate</div>
        </div>
      </div>
      <div style={{ height: 2, background: TEAL, marginBottom: 56 }} />
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 14 }}>ISO 11784/85 Transponder Code</div>
        <div style={{ display: "inline-block", border: `3px solid ${TEAL}`, borderRadius: 14, padding: "24px 56px", background: "rgba(135,155,149,0.06)" }}>
          <div style={{ fontFamily: "Courier New, monospace", fontSize: 44, fontWeight: 900, letterSpacing: "0.24em", color: TEAL_DARK }}>
            {chip.slice(0, 5)}&nbsp;{chip.slice(5, 10)}&nbsp;{chip.slice(10)}
          </div>
        </div>
      </div>
      <div style={{ background: WHITE, border: `1px solid ${TEAL_LIGHT}`, borderRadius: 8, padding: 40, marginBottom: 32 }}>
        <Bar>Registered Animal Details</Bar>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 56px" }}>
          {([["Name", h.name], ["Breed", h.breed], ["Gender", h.gender], ["Foal Date", h.dob ? fmtDate(h.dob) : null], ["Coat", h.coat], ["Reg. Number", h.regNumber], ["Registered Stable", h.stablePrefix || "Redfield Equestrian Centre"], ["Date Chipped", chipped]] as [string, string | null][]).map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>{lbl}</div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 16, color: TEXT, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 7 }}>{val || "—"}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, marginBottom: 32 }}>
        <span style={{ fontWeight: 700, color: MUTED, textTransform: "uppercase", fontSize: 11 }}>Implant Location: </span>
        Left side of the neck, crest of the nuchal ligament, mid-cervical region — standard ICAR compliant placement (ISO 11784/85).
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}><SignBlock date={today} /></div>
    </div>
  );
}

// ─── BSE ───────────────────────────────────────────────────────────────────────
function FertilityPage({ h }: { h: PdfHorse }) {
  const b = buildBse(h.id); const today = fmtDate(new Date());
  return (
    <div style={base}>
      <PageHeader title="BREEDING SOUNDNESS EVALUATION" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 36px", marginBottom: 10 }}>
        {([["Horse's Name", h.name], ["Breed", h.breed], ["Coat", h.coat], ["Foal Date", h.dob ? fmtDate(h.dob) : null], ["Genotype", h.genotype], ["Registered Stable", h.stablePrefix || "Redfield Equestrian Centre"]] as [string, string | null][]).map(([lbl, val]) => <LabelVal key={lbl} label={lbl} value={val} />)}
      </div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, marginBottom: 12 }}>
        <strong style={{ color: MUTED, textTransform: "uppercase", fontSize: 11 }}>Gender: </strong>☑ STALLION
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 18 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginBottom: 20 }}>
        <div>
          <Bar>Laboratory Analysis</Bar>
          {[["Ejaculate Volume", `${b.vol} mL`], ["Sperm Concentration", `${b.conc} million/mL`], ["Total Sperm Count", `${b.total} million`], ["Progressive Motility", `${b.progMot}%`], ["Total Motility", `${b.totalMot}%`], ["Normal Morphology", `${b.morphNorm}%`], ["Abnormal Morphology", `${b.morphAbn}%`]].map(([lbl, val]) => (
            <div key={lbl} style={{ display: "flex", borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "9px 0" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", minWidth: 230 }}>{lbl}</span>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 15, color: TEXT }}>{val}</span>
            </div>
          ))}
        </div>
        <div>
          <Bar>Reproductive Examination</Bar>
          {[["Left Testicle", `${b.lLen} × ${(parseFloat(b.lLen) * 0.85).toFixed(1)} cm`], ["Right Testicle", `${b.rLen} × ${(parseFloat(b.rLen) * 0.85).toFixed(1)} cm`], ["Symmetry & Firmness", "Symmetrical, firm, uniform texture"], ["Epididymis", "Smooth, non-painful bilaterally"], ["Prepuce & Shaft", "Clean, no lesions"], ["Accessory Sex Glands", "Normal on rectal palpation"], ["Lesions / Abnormalities", "None observed"], ["Collection Method", "Artificial mare / phantom"]].map(([lbl, val]) => (
            <div key={lbl} style={{ display: "flex", borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "9px 0" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", minWidth: 230 }}>{lbl}</span>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, fontStyle: "italic" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
      <Bar>Assessment</Bar>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 15, display: "flex", gap: 36, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, color: GREEN_OK }}>☑ FERTILE</span>
        <span style={{ color: MUTED }}>☐ SUBFERTILE</span>
        <span style={{ color: MUTED }}>☐ INFERTILE</span>
      </div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED, fontStyle: "italic", marginBottom: 20 }}>Cleared for full breeding use. Continue routine conditioning programme and balanced nutrition. Annual BSE recheck recommended.</div>
      <div style={{ display: "flex", gap: 32, alignItems: "flex-end" }}>
        <div style={{ flex: 1, fontFamily: "Georgia, serif", fontSize: 14, fontStyle: "italic", color: TEXT, lineHeight: 1.8, borderBottom: `1px solid ${TEAL_LIGHT}` }}>All findings within normal limits. Semen quality and reproductive anatomy are consistent with excellent breeding potential.</div>
        <SignBlock date={today} />
      </div>
    </div>
  );
}

// ─── INSURANCE ─────────────────────────────────────────────────────────────────
function InsurancePage({ h }: { h: PdfHorse }) {
  const policy = policyNum(h.id); const today = fmtDate(new Date()); const expiry = fmtDate(new Date(Date.now() + 365 * 864e5));
  const mortality = `$${Math.round((15000 + seed(h.id, 30) * 35000) / 1000) * 1000}`;
  const surgical  = `$${Math.round((8000  + seed(h.id, 31) * 12000) / 1000) * 1000}`;
  const liability = `$${Math.round((50000 + seed(h.id, 32) * 100000) / 1000) * 1000}`;
  return (
    <div style={{ ...base, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.03 }}><CrossIcon size={900} color={TEAL_DARK} /></div>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 36, color: TEAL_DARK }}>FRONTIER EQUINE INSURANCE CO.</div>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: MUTED, letterSpacing: "0.15em", textTransform: "uppercase" }}>Certificate of Insurance · Equine Mortality &amp; Liability</div>
      </div>
      <div style={{ height: 3, background: TEAL, marginBottom: 8 }} />
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 40 }} />
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 30, color: TEXT }}>CERTIFICATE OF INSURANCE</div>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: MUTED, marginTop: 8 }}>Policy No: <span style={{ fontWeight: 700, color: TEAL_DARK, letterSpacing: "0.1em" }}>{policy}</span></div>
      </div>
      <div style={{ background: WHITE, border: `1px solid ${TEAL_LIGHT}`, borderRadius: 8, padding: 36, marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 56px" }}>
          {[["Insured", h.ownerName || h.stablePrefix || "Redfield Equestrian Centre"], ["Stable", h.stablePrefix || "Redfield Equestrian Centre"], ["Policy Effective", today], ["Policy Expiry", expiry]].map(([lbl, val]) => (
            <div key={lbl}><div style={{ fontFamily: "var(--font-lato)", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>{lbl}</div><div style={{ fontFamily: "var(--font-lato)", fontSize: 16, color: TEXT, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 6 }}>{val}</div></div>
          ))}
        </div>
      </div>
      <Bar>Insured Animal</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 56px", marginBottom: 32 }}>
        {([["Name", h.name], ["Breed", h.breed], ["Gender", h.gender], ["Foal Date", h.dob ? fmtDate(h.dob) : null], ["Coat", h.coat], ["Microchip / Reg.", h.microchip || h.regNumber]] as [string, string | null][]).map(([lbl, val]) => (
          <div key={lbl}><div style={{ fontFamily: "var(--font-lato)", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>{lbl}</div><div style={{ fontFamily: "var(--font-lato)", fontSize: 15, color: TEXT, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 6 }}>{val || "—"}</div></div>
        ))}
      </div>
      <Bar>Coverage Summary</Bar>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32, fontFamily: "var(--font-lato)", fontSize: 14 }}>
        <thead><tr style={{ background: "rgba(135,155,149,0.14)" }}>{["Coverage Type", "Limit of Liability", "Status"].map(col => <th key={col} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "10px 18px", color: MUTED, fontWeight: 700, fontSize: 11, textTransform: "uppercase", textAlign: "left" }}>{col}</th>)}</tr></thead>
        <tbody>{[["Mortality / Theft", mortality, "ACTIVE"], ["Major Medical / Surgical", surgical, "ACTIVE"], ["Third-Party Liability", liability, "ACTIVE"]].map(([type, lim, status]) => <tr key={type}><td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "12px 18px", color: TEXT }}>{type}</td><td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "12px 18px", color: TEXT, fontWeight: 700 }}>{lim}</td><td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "12px 18px", color: GREEN_OK, fontWeight: 700 }}>{status}</td></tr>)}</tbody>
      </table>
      <div style={{ flex: 1 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56 }}>
        <div><div style={{ fontFamily: "Georgia, serif", fontSize: 28, fontStyle: "italic", color: TEAL_DARK, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 4, marginBottom: 4 }}>M. Calloway</div><div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED }}>Underwriter — Frontier Equine Insurance Co.</div></div>
        <div><div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED, marginBottom: 8 }}>DATE ISSUED</div><div style={{ fontFamily: "var(--font-lato)", fontSize: 16, color: TEXT }}>{today}</div></div>
      </div>
    </div>
  );
}

// ─── TRAINING LOG ──────────────────────────────────────────────────────────────
function TrainingLogPage({ h, results }: { h: PdfHorse; results: PdfResult[] }) {
  const today = fmtDate(new Date()); const rows = results.slice(0, 22);
  return (
    <div style={base}>
      <PageHeader title="TRAINING LOG & PROGRESS REPORT" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 36px", marginBottom: 12 }}>
        {([["Horse", h.name], ["Breed", h.breed], ["Gender", h.gender], ["Foal Date", h.dob ? fmtDate(h.dob) : null], ["Discipline", h.discipline], ["Height", h.height ? `${h.height} hh` : null]] as [string, string | null][]).map(([lbl, val]) => <LabelVal key={lbl} label={lbl} value={val} />)}
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginBottom: 20 }}>
        <div>
          <Bar>Trainer Assessment</Bar>
          {([["Discipline Focus", h.discipline || "General"], ["Training Level", "Advanced"], ["Overall Condition", "Excellent"], ["Current Programme", "Active competition conditioning"]] as [string, string][]).map(([lbl, val]) => (
            <div key={lbl} style={{ display: "flex", borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "9px 0" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", minWidth: 200 }}>{lbl}</span>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, fontStyle: "italic" }}>{val}</span>
            </div>
          ))}
        </div>
        <div>
          <Bar>Programme Notes</Bar>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, fontStyle: "italic", lineHeight: 1.7 }}>Training programme maintained under consistent supervision at Redfield Equestrian Centre. Horse in active work with regular exercise including flat work, conditioning, and competition preparation.</div>
        </div>
      </div>
      <Bar>Competition &amp; Show Results</Bar>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, fontFamily: "var(--font-lato)", fontSize: 13 }}>
        <thead><tr style={{ background: "rgba(135,155,149,0.14)" }}>{["Date", "Event / Show", "Placement", "Notes"].map(col => <th key={col} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 14px", color: MUTED, fontWeight: 700, fontSize: 11, textTransform: "uppercase", textAlign: "left" }}>{col}</th>)}</tr></thead>
        <tbody>
          {rows.length > 0 ? rows.map((r, i) => (
            <tr key={r.id} style={{ background: i % 2 === 0 ? WHITE : "rgba(135,155,149,0.04)" }}>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 14px", color: TEXT, whiteSpace: "nowrap" }}>{r.date ? fmtDate(r.date) : "—"}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 14px", color: TEXT }}>{r.event}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 14px", color: TEXT, fontWeight: 700 }}>{r.placement || "—"}</td>
              <td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 14px", color: MUTED, fontStyle: "italic" }}>{r.notes || "—"}</td>
            </tr>
          )) : [0,1,2,3,4,5].map(i => <tr key={i}>{[0,1,2,3].map(j => <td key={j} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "16px 14px" }} />)}</tr>)}
        </tbody>
      </table>
      <Bar>Sign-Off</Bar>
      <div style={{ display: "flex", gap: 36, alignItems: "flex-end" }}>
        <div style={{ flex: 1, fontFamily: "Georgia, serif", fontSize: 14, fontStyle: "italic", color: TEXT, lineHeight: 1.8, borderBottom: `1px solid ${TEAL_LIGHT}` }}>This training log is an accurate record of competition history and current training status as maintained by Redfield Equestrian Centre.</div>
        <SignBlock sigName="A. Redfield" line2="Athena Redfield" line3="Redfield Equestrian Centre" licLine="" date={today} />
      </div>
    </div>
  );
}

// ─── PPE data ─────────────────────────────────────────────────────────────────
function buildPPE(id: string) {
  const verdict = seed(id, 400) > 0.18 ? "PASS" : seed(id, 400) > 0.06 ? "CONDITIONAL PASS" : "FAIL";
  const gaitWalk   = pick(id, 401, ["1/5 — Sound at walk", "1/5 — Sound at walk"]);
  const gaitTrot   = pick(id, 402, ["1/5 — Sound at trot", "1/5 — Sound at trot", "2/5 — Mild, intermittent lameness at trot on hard surface"]);
  const gaitCanter = pick(id, 403, ["1/5 — Sound at canter", "1/5 — Sound at canter", "1/5 — Sound; mild disuniting noted once"]);
  const flexLF     = pick(id, 404, ["Negative", "Negative", "Mildly positive — resolved within 10 strides"]);
  const flexRF     = pick(id, 405, ["Negative", "Negative", "Negative"]);
  const flexLH     = pick(id, 406, ["Negative", "Negative", "Mildly positive — 3/5 strides post-flex"]);
  const flexRH     = pick(id, 407, ["Negative", "Negative", "Negative"]);
  const circLung   = pick(id, 408, ["Regular, no murmurs", "Regular sinus rhythm, no auscultatory defects"]);
  const scope      = seed(id, 409) > 0.5;
  const scopeGrade = scope ? pick(id, 410, ["Grade 0/4 — Clear larynx, full abduction", "Grade 1/4 — Left arytenoid asymmetry, no significant obstruction"]) : null;
  const eyeOph     = pick(id, 411, ["No evidence of uveitis, cataracts, or corneal opacity. PLR intact bilaterally.", "Eyes clear. No active intraocular inflammation. PLR brisk. No fundus abnormalities noted.", "Both eyes clear. No inflammatory changes. Fundoscopy unremarkable."]);
  const xraySum    = pick(id, 412, [
    "Distal limb radiographs within normal limits. No significant DJD, lysis, or periosteal new bone formation identified.",
    "Radiographic survey reviewed — mild remodelling at DIPJ noted, consistent with age and workload. No pathological changes identified.",
    "Radiographic findings unremarkable. Joint spaces maintained. Navicular bones normal morphology bilaterally.",
  ]);
  const condNote   = verdict === "PASS"
    ? pick(id, 413, ["No significant findings to limit intended use. Horse is suitable for purchase for its intended purpose.", "Horse presented sound and in good health. No conditions identified that would preclude purchase for stated purpose."])
    : verdict === "CONDITIONAL PASS"
    ? pick(id, 414, ["One or more findings noted. Prospective purchaser advised to seek further diagnostic evaluation prior to purchase decision.", "Findings noted as above. Horse may be suitable subject to further investigation and buyer accepting informed risk."])
    : "Significant findings identified that are likely to affect soundness for stated intended use. Purchase not recommended without further specialist evaluation.";
  const purpose = pick(id, 415, ["General leisure / pleasure riding", "Competitive show work", "Breeding programme", "Trail and endurance work", "Dressage competition"]);
  return { verdict, gaitWalk, gaitTrot, gaitCanter, flexLF, flexRF, flexLH, flexRH, circLung, scope, scopeGrade, eyeOph, xraySum, condNote, purpose };
}

// ─── PPE PAGE 1 ───────────────────────────────────────────────────────────────
function PPEPage1({ h }: { h: PdfHorse }) {
  const p = buildPPE(h.id); const today = fmtDate(new Date());
  const hd = buildHealth(h.id, h.gender, h.height);
  return (
    <div style={base}>
      <PageHeader title="PRE-PURCHASE EXAMINATION" />
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED, fontStyle: "italic", marginBottom: 10, borderBottom: `1px solid ${TEAL_LIGHT}`, paddingBottom: 10 }}>
        This examination was carried out at the request of the prospective purchaser. It is an opinion only and does not constitute a warranty of soundness. {VET} · Lic. {LIC}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 36px", marginBottom: 8 }}>
        {([["Horse's Name", h.name], ["Breed", h.breed], ["Coat / Colour", h.coat], ["Gender", h.gender], ["Foal Date", h.dob ? fmtDate(h.dob) : null], ["Reg. Number", h.regNumber], ["Microchip", chipNumber(h.microchip, h.id)], ["Date of Exam", today], ["Intended Use", p.purpose]] as [string, string | null][]).map(([lbl, val]) => <LabelVal key={lbl} label={lbl} value={val} />)}
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 16 }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginBottom: 20 }}>
        <div>
          <Bar>Vital Signs at Presentation</Bar>
          {[["Temperature", `${hd.temp} °F`], ["Heart Rate", `${hd.hr} bpm`], ["Respiratory Rate", `${hd.rr} rpm`], ["Body Weight (est.)", `${hd.wt} lbs`], ["Body Condition Score", `${hd.bcs} / 9`], ["Mucous Membranes", hd.mm], ["CRT", hd.crt], ["Demeanour", hd.dem]].map(([lbl, val]) => (
            <div key={lbl} style={{ display: "flex", borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "8px 0" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", minWidth: 220 }}>{lbl}</span>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT }}>{val}</span>
            </div>
          ))}
        </div>
        <div>
          <Bar>General Appearance</Bar>
          {[["Coat Quality", pick(h.id, 420, ["Good — healthy sheen, well-maintained", "Excellent — glossy and well-conditioned", "Good — appropriate for season"])], ["Musculature", pick(h.id, 421, ["Well-developed and symmetrical", "Good muscle mass, appropriate for workload", "Good topline; hindquarter development appropriate"])], ["Conformation", pick(h.id, 422, ["Good overall conformation. No notable deviations.", "Slightly over at the knee — within normal limits.", "Good balance and proportion. No conformational concerns."])], ["Lymph Nodes", hd.lymphNote], ["Skin & Coat", pick(h.id, 423, ["No skin conditions. Coat clean and parasite-free.", "No ectoparasites or dermatological concerns noted.", "Coat clean. No rain rot, sweet itch, or dermatitis."])]].map(([lbl, val]) => (
            <div key={lbl} style={{ borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "8px 0" }}>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>{lbl}</div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, fontStyle: "italic" }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <Bar>Gait Assessment (AAEP Scale 0–5)</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginBottom: 20 }}>
        <div>
          {[["Walk — in hand (hard surface)", p.gaitWalk], ["Trot — in hand (hard surface)", p.gaitTrot], ["Canter — on the lunge", p.gaitCanter], ["Trot — on lunge (soft surface)", pick(h.id, 424, ["1/5 — Sound on soft going", "1/5 — Sound on soft going", "1/5 — No change from hard surface"])]].map(([lbl, val]) => (
            <div key={lbl} style={{ borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "10px 0" }}>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>{lbl}</div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, fontStyle: "italic" }}>{val}</div>
            </div>
          ))}
        </div>
        <div>
          <Bar>Flexion Tests</Bar>
          {[["Left Fore", p.flexLF], ["Right Fore", p.flexRF], ["Left Hind", p.flexLH], ["Right Hind", p.flexRH]].map(([lbl, val]) => (
            <div key={lbl} style={{ display: "flex", borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "10px 0" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", minWidth: 140 }}>{lbl}</span>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: val === "Negative" ? GREEN_OK : TEXT, fontStyle: "italic" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, fontFamily: "var(--font-lato)", fontSize: 11, color: MUTED, fontStyle: "italic" }}>
        <span>AAEP Scale: 0 = Sound · 1 = Barely perceptible · 2 = Mild, intermittent · 3 = Consistent at trot · 4 = Obvious · 5 = Non-weight-bearing</span>
      </div>
      <PgNum n={1} />
    </div>
  );
}

// ─── PPE PAGE 2 ───────────────────────────────────────────────────────────────
function PPEPage2({ h }: { h: PdfHorse }) {
  const p = buildPPE(h.id); const hd = buildHealth(h.id, h.gender, h.height); const today = fmtDate(new Date());
  const verdictColor = p.verdict === "PASS" ? GREEN_OK : p.verdict === "CONDITIONAL PASS" ? "#8a6a00" : "#8a2020";
  return (
    <div style={base}>
      <PageHeader title="PRE-PURCHASE EXAMINATION (cont.)" />

      <Bar>Systems Examination</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginBottom: 18 }}>
        {([["Cardiovascular", p.circLung], ["Respiratory", hd.lungNote], ["Eyes / Ophthalmic", p.eyeOph], ["Musculoskeletal", hd.limbNote], ["Digestive", `Gut sounds: LDQ ${hd.gutLDQ} · RDQ ${hd.gutRDQ}. ${hd.fecalNote}`], ["Neurological", hd.neuroNote], ["Integumentary", hd.skinNote], ["Reproductive", hd.reproNote]] as [string, string][]).map(([sys, note]) => (
          <div key={sys} style={{ borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "9px 0" }}>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: TEAL_DARK, textTransform: "uppercase", marginBottom: 3 }}>{sys}</div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, fontStyle: "italic", lineHeight: 1.5 }}>{note}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginBottom: 18 }}>
        <div>
          <Bar>Radiographic Survey</Bar>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, fontStyle: "italic", lineHeight: 1.7, borderLeft: `3px solid ${TEAL}`, paddingLeft: 14 }}>{p.xraySum}</div>
        </div>
        <div>
          <Bar>Upper Airway Endoscopy</Bar>
          {p.scope
            ? <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, fontStyle: "italic", lineHeight: 1.7, borderLeft: `3px solid ${TEAL}`, paddingLeft: 14 }}>{p.scopeGrade}</div>
            : <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED, fontStyle: "italic" }}>Not performed at this examination.</div>}
        </div>
      </div>

      <Bar>Overall Assessment &amp; Verdict</Bar>
      <div style={{ border: `3px solid ${verdictColor}`, borderRadius: 8, padding: "22px 28px", marginBottom: 20, background: `${verdictColor}08` }}>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 28, fontWeight: 900, color: verdictColor, letterSpacing: "0.12em", marginBottom: 10 }}>{p.verdict}</div>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, lineHeight: 1.7 }}>{p.condNote}</div>
      </div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED, fontStyle: "italic", marginBottom: 28, lineHeight: 1.6 }}>
        This certificate represents the professional opinion of the examining veterinarian at the time of examination. It is not a guarantee of future soundness or health. The examination was conducted at the request of the prospective purchaser and findings are disclosed solely to them. Belmont Veterinarian Clinic accepts no liability for conditions not detectable at the time of examination.
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}><SignBlock date={today} /></div>
      <PgNum n={2} />
    </div>
  );
}

// ─── BILL OF SALE ─────────────────────────────────────────────────────────────
interface BillOfSaleProps { h: PdfHorse; buyerIgn: string; buyerUsername: string; buyerStable: string; mpLink: string; salePrice: string; saleDate: string; }
function BillOfSalePage({ h, buyerIgn, buyerUsername, buyerStable, mpLink, salePrice, saleDate }: BillOfSaleProps) {
  const chip   = chipNumber(h.microchip, h.id);
  const seller = h.ownerName || h.stablePrefix || "Redfield Equestrian Centre";
  const agrNum = `REC-${new Date().getFullYear()}-${Array.from({ length: 5 }, (_, i) => Math.floor(seed(h.id, i + 50) * 10)).join("")}`;
  const blankLine = "___________________________________";
  return (
    <div style={{ ...base, display: "flex", flexDirection: "column" }}>
      {/* Watermark */}
      <div style={{ position: "absolute", top: "38%", left: "50%", transform: "translate(-50%,-50%) rotate(-22deg)", opacity: 0.035, fontFamily: "var(--font-playfair)", fontSize: 130, color: TEAL_DARK, whiteSpace: "nowrap", pointerEvents: "none" }}>BILL OF SALE</div>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>Redfield Equestrian Centre</div>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 48, color: TEAL_DARK }}>BILL OF SALE</div>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: MUTED }}>Purchase Agreement — Equine</div>
      </div>
      <div style={{ height: 3, background: TEAL, marginBottom: 6 }} />
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 28 }} />

      <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, lineHeight: 2, marginBottom: 26 }}>
        This Bill of Sale and Purchase Agreement (Agreement No.&nbsp;<strong style={{ color: TEAL_DARK }}>{agrNum}</strong>) is entered into on&nbsp;<strong>{saleDate || fmtDate(new Date())}</strong>, between the Seller and the Buyer identified below, for the sale and transfer of ownership of the equine described herein.
      </div>

      {/* Parties */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 56px", marginBottom: 28 }}>
        <div>
          <Bar>Seller</Bar>
          <LabelVal label="Stable / Name"    value={seller} />
          <LabelVal label="Stable Prefix"    value={h.stablePrefix || "REC"} />
          <LabelVal label="Contact"          value="rec@therift.com" />
        </div>
        <div>
          <Bar>Buyer</Bar>
          <LabelVal label="Character Name (IGN)" value={buyerIgn     || blankLine} />
          <LabelVal label="Username"             value={buyerUsername ? `@${buyerUsername}` : blankLine} />
          <LabelVal label="Stable"               value={buyerStable  || blankLine} />
          <LabelVal label="MP Listing"           value={mpLink       || blankLine} />
        </div>
      </div>

      {/* Horse */}
      <Bar>Animal Description</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 36px", marginBottom: 28 }}>
        {([["Name", h.name], ["Breed", h.breed], ["Gender", h.gender], ["Coat / Colour", h.coat], ["Foal Date", h.dob ? fmtDate(h.dob) : null], ["Reg. Number", h.regNumber], ["Microchip (ISO)", chip], ["Height", h.height ? `${h.height} hh` : null], ["Seller's Stable", h.stablePrefix || "Redfield EC"]] as [string, string | null][]).map(([lbl, val]) => <LabelVal key={lbl} label={lbl} value={val} />)}
      </div>

      {/* Terms */}
      <Bar>Purchase Price &amp; Terms</Bar>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 56px", marginBottom: 28 }}>
        <div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", marginBottom: 8 }}>Agreed Sale Price</div>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 36, color: TEAL_DARK, borderBottom: `2px solid ${TEAL}`, paddingBottom: 6 }}>{salePrice ? `$${Number(salePrice).toLocaleString()}` : "$ _____________"}</div>
          </div>
          <LabelVal label="Payment Method" value={blankLine} />
          <LabelVal label="Payment Date"   value={blankLine} />
        </div>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, lineHeight: 2 }}>
          <div style={{ marginBottom: 10 }}><strong>1.</strong> The animal is sold as-is on the date of this agreement. The Seller makes no warranty of future soundness or health.</div>
          <div style={{ marginBottom: 10 }}><strong>2.</strong> Risk of loss and responsibility for care pass to the Buyer upon delivery or collection of the animal.</div>
          <div><strong>3.</strong> The Seller warrants lawful ownership and authority to sell. Title transfers to the Buyer upon receipt of full payment.</div>
        </div>
      </div>

      {/* Signatures */}
      <div style={{ marginTop: "auto" }}>
        <Bar>Signatures</Bar>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 40px" }}>
          {([[`Seller — ${seller}`, ""], [`Buyer — ${buyerIgn || blankLine}`, buyerUsername ? `@${buyerUsername}` : ""], ["Witness", ""]] as [string, string][]).map(([role, sub]) => (
            <div key={role}>
              <div style={{ height: 72, borderBottom: `2px solid ${TEXT}`, marginBottom: 10 }} />
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{role}</div>
              {sub && <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED }}>{sub}</div>}
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED, marginTop: 6 }}>Date: {saleDate || "___________"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MARE REPRODUCTIVE RECORD ─────────────────────────────────────────────────
function buildReproductive(id: string, dob: string | null) {
  const ageYears = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 864e5)) : 7;
  const cycleLen = intBetween(id, 600, 19, 23);
  const heatDays = intBetween(id, 601, 4, 7);
  const lastHeat = daysAgo(id, 602, 7, 30);
  const status   = pick(id, 603, ["Open — cycling normally", "Open — cycling normally", "Open — anestrus (transitional)"]);
  const reprExam = pick(id, 604, [
    "Uterus palpates normal on rectal — mild uterine tone consistent with luteal phase. Ovaries smooth, no active follicle palpated. Perineal conformation adequate.",
    "Uterine tone moderate — consistent with early follicular phase. Right ovary: 32 mm follicle palpated. Left ovary quiescent. Vulval conformation good with adequate perineal seal.",
    "Uterus small and tubular — consistent with anestrous state. No palpable follicles. Reproductive tract appears healthy. Recommend hormonal monitoring as season begins.",
  ]);
  const hpg = pick(id, 605, ["Progesterone < 1 ng/mL (follicular phase)", "Progesterone 3.2 ng/mL (mid-luteal)", "Progesterone < 0.5 ng/mL (anestrus)"]);
  const uterineFlush = pick(id, 606, ["Clear — no cytological evidence of endometritis", "Slight PMN infiltrate — treated with uterine lavage, resolved", "Clear — culture negative"]);
  const caslick = seed(id, 607) > 0.65;

  // Foaling history (mares 5+ years old have 0-3 foals)
  const numFoals = ageYears >= 5 ? intBetween(id, 610, 0, Math.min(ageYears - 3, 4)) : 0;
  const foals = Array.from({ length: numFoals }, (_, i) => {
    const foalYear = new Date().getFullYear() - numFoals + i;
    return {
      year: foalYear,
      sire: pick(id, 611 + i, ["Unknown Sire", "Distant Thunder", "Ashwood Blaze", "Rowanfield Echo", "Copperwind Bolt", "Black Heron"]),
      sex:  pick(id, 620 + i, ["Colt", "Filly"]),
      outcome: pick(id, 630 + i, ["Live foal, weaned normally", "Live foal, healthy", "Live foal — retained in herd", "Live foal, sold at weaning"]),
    };
  });
  const recs = [
    pick(id, 640, ["Continue monitoring cycle. No interventions required at this time.", "Progesterone monitoring recommended prior to next breeding attempt.", "Recommend repeat reproductive exam at next oestrus."]),
    caslick ? "Caslick's procedure has been performed — will require episiotomy prior to breeding." : "No Caslick's procedure in place. Perineal conformation suitable for natural covering.",
    pick(id, 641, ["Annual reproductive examination recommended.", "Uterine culture recommended prior to next breeding season.", "Ultrasound monitoring of follicular development advised for optimal breeding timing."]),
  ];
  return { cycleLen, heatDays, lastHeat, status, reprExam, hpg, uterineFlush, caslick, foals, recs };
}

function MareReproductivePage({ h }: { h: PdfHorse }) {
  const r = buildReproductive(h.id, h.dob); const today = fmtDate(new Date());
  return (
    <div style={base}>
      <PageHeader title="MARE REPRODUCTIVE RECORD" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 36px", marginBottom: 10 }}>
        {([["Mare's Name", h.name], ["Breed", h.breed], ["Coat", h.coat], ["Foal Date", h.dob ? fmtDate(h.dob) : null], ["Reg. Number", h.regNumber], ["Registered Stable", h.stablePrefix || "Redfield EC"]] as [string, string | null][]).map(([lbl, val]) => <LabelVal key={lbl} label={lbl} value={val} />)}
      </div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, marginBottom: 8 }}>
        <strong style={{ color: MUTED, textTransform: "uppercase", fontSize: 11 }}>Gender: </strong><span style={{ color: TEXT }}>☑ MARE</span>
        <span style={{ marginLeft: 32, fontWeight: 700, color: MUTED, textTransform: "uppercase", fontSize: 11 }}>Examining Vet: </span><span style={{ color: TEXT }}>{VET}</span>
        <span style={{ marginLeft: 32, fontWeight: 700, color: MUTED, textTransform: "uppercase", fontSize: 11 }}>Date: </span><span style={{ color: TEXT }}>{today}</span>
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 16 }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginBottom: 20 }}>
        <div>
          <Bar>Reproductive Status</Bar>
          {[["Current Status", r.status], ["Cycle Length", `${r.cycleLen} days`], ["Heat Duration", `${r.heatDays} days`], ["Last Observed Heat", r.lastHeat], ["Caslick's Procedure", r.caslick ? "Yes — in place" : "No"], ["Number of Previous Foals", r.foals.length.toString()]].map(([lbl, val]) => (
            <div key={lbl} style={{ display: "flex", borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "9px 0" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", minWidth: 240 }}>{lbl}</span>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, fontStyle: "italic" }}>{val}</span>
            </div>
          ))}
        </div>
        <div>
          <Bar>Hormonal &amp; Cytology</Bar>
          {[["Progesterone", r.hpg], ["Uterine Flush / Cytology", r.uterineFlush], ["Culture", pick(h.id, 642, ["Not performed", "Negative — no significant growth", "Streptococcus equi var. zooepidemicus — treated, resolved"])]].map(([lbl, val]) => (
            <div key={lbl} style={{ borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "9px 0" }}>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase" }}>{lbl}</div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, fontStyle: "italic" }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <Bar>Reproductive Examination Findings</Bar>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, fontStyle: "italic", lineHeight: 1.8, borderLeft: `3px solid ${TEAL}`, paddingLeft: 16, marginBottom: 20 }}>{r.reprExam}</div>

      {r.foals.length > 0 && (
        <>
          <Bar>Foaling History</Bar>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontFamily: "var(--font-lato)", fontSize: 13 }}>
            <thead><tr style={{ background: "rgba(135,155,149,0.14)" }}>{["Year", "Sire", "Sex of Foal", "Outcome"].map(col => <th key={col} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 14px", color: MUTED, fontWeight: 700, fontSize: 11, textTransform: "uppercase", textAlign: "left" }}>{col}</th>)}</tr></thead>
            <tbody>{r.foals.map((f, i) => <tr key={i} style={{ background: i % 2 === 0 ? WHITE : "rgba(135,155,149,0.04)" }}><td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "10px 14px", color: TEXT }}>{f.year}</td><td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "10px 14px", color: TEXT }}>{f.sire}</td><td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "10px 14px", color: TEXT }}>{f.sex}</td><td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "10px 14px", color: MUTED, fontStyle: "italic" }}>{f.outcome}</td></tr>)}</tbody>
          </table>
        </>
      )}

      <Bar>Recommendations</Bar>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {r.recs.map((rec, i) => <div key={i} style={{ display: "flex", gap: 12 }}><span style={{ color: GREEN_OK, fontWeight: 900, fontSize: 16, flexShrink: 0 }}>✓</span><span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, lineHeight: 1.6 }}>{rec}</span></div>)}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}><SignBlock date={today} /></div>
    </div>
  );
}

// ─── EQUINE PASSPORT ──────────────────────────────────────────────────────────
function EquinePassportPage({ h }: { h: PdfHorse }) {
  const chip   = chipNumber(h.microchip, h.id);
  const today  = fmtDate(new Date());
  const issued = h.dob ? fmtDate(new Date(new Date(h.dob).getTime() + 60 * 864e5)) : today;
  const expiry = fmtDate(new Date(Date.now() + 10 * 365 * 864e5));
  const passNo = `EP-${new Date().getFullYear()}-${Array.from({ length: 8 }, (_, i) => Math.floor(seed(h.id, i + 700) * 10)).join("")}`;
  const hd     = buildHealth(h.id, h.gender, h.height);
  const markings = pick(h.id, 710, [
    "Star on forehead. No other white markings. No brands.",
    "Blaze from forehead to muzzle. Three white socks (LF, RF, RH). No brands.",
    "Small star and snip. Left hind fetlock white. Freeze brand on left shoulder.",
    "No facial markings. LF coronet white. No brands or scars.",
    "Broad blaze. Four white socks. No brands. Small scar on left stifle — old injury, healed.",
    "Star. Stripe. RF sock. No brands. Freeze brand on neck.",
  ]);
  return (
    <div style={{ ...base, display: "flex", flexDirection: "column" }}>
      {/* Passport border */}
      <div style={{ position: "absolute", inset: 14, border: `3px double ${TEAL}`, borderRadius: 6, pointerEvents: "none" }} />

      {/* Header strip */}
      <div style={{ background: TEAL_DARK, color: WHITE, textAlign: "center", padding: "18px 0", marginBottom: 28, fontFamily: "var(--font-lato)", letterSpacing: "0.18em" }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, opacity: 0.8 }}>OFFICIAL DOCUMENT · THE RIFT EQUESTRIAN AUTHORITY</div>
        <div style={{ fontFamily: "var(--font-playfair)", fontSize: 32 }}>EQUINE PASSPORT</div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Document No: {passNo}</div>
      </div>

      {/* Main columns */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 36, marginBottom: 24 }}>
        {/* Left: photo + chip */}
        <div>
          {/* Photo placeholder */}
          <div style={{ width: "100%", aspectRatio: "3/4", border: `2px dashed ${TEAL}`, borderRadius: 6, background: "rgba(135,155,149,0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <div style={{ opacity: 0.2, marginBottom: 10 }}><CrossIcon size={40} /></div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED, letterSpacing: "0.1em", textAlign: "center" }}>OFFICIAL<br />PHOTOGRAPH</div>
          </div>
          {/* Chip box */}
          <div style={{ background: BG, border: `1px solid ${TEAL_LIGHT}`, borderRadius: 6, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Microchip (ISO 11784/85)</div>
            <div style={{ fontFamily: "Courier New, monospace", fontSize: 16, fontWeight: 900, color: TEAL_DARK, letterSpacing: "0.18em" }}>{chip.slice(0, 5)} {chip.slice(5, 10)} {chip.slice(10)}</div>
          </div>
          {/* Dates */}
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: MUTED }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}><span style={{ fontWeight: 700, textTransform: "uppercase", width: 70 }}>Issued:</span><span style={{ color: TEXT }}>{issued}</span></div>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}><span style={{ fontWeight: 700, textTransform: "uppercase", width: 70 }}>Expires:</span><span style={{ color: TEXT }}>{expiry}</span></div>
            <div style={{ display: "flex", gap: 8 }}><span style={{ fontWeight: 700, textTransform: "uppercase", width: 70 }}>Authority:</span><span style={{ color: TEXT }}>TREA</span></div>
          </div>
        </div>

        {/* Right: details */}
        <div>
          <Bar>Identification</Bar>
          <div style={{ marginBottom: 18 }}>
            {([["Name", h.name], ["Breed", h.breed], ["Gender", h.gender], ["Coat Colour", h.coat], ["Genotype", h.genotype], ["Date of Birth", h.dob ? fmtDate(h.dob) : null], ["Height", h.height ? `${h.height} hh` : null], ["Reg. Number", h.regNumber]] as [string, string | null][]).map(([lbl, val]) => (
              <div key={lbl} style={{ display: "flex", borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "8px 0" }}>
                <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", minWidth: 160 }}>{lbl}</span>
                <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT }}>{val || "—"}</span>
              </div>
            ))}
          </div>

          <Bar>Breeding</Bar>
          <div style={{ marginBottom: 18 }}>
            {([["Sire", h.sireName], ["Dam", h.damName], ["Breeder / Stable", h.stablePrefix || "Redfield Equestrian Centre"]] as [string, string | null][]).map(([lbl, val]) => (
              <div key={lbl} style={{ display: "flex", borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "8px 0" }}>
                <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", minWidth: 160 }}>{lbl}</span>
                <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT }}>{val || "—"}</span>
              </div>
            ))}
          </div>

          <Bar>Markings &amp; Description</Bar>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, fontStyle: "italic", lineHeight: 1.7, borderLeft: `3px solid ${TEAL}`, paddingLeft: 14 }}>{markings}</div>
        </div>
      </div>

      {/* Vaccination summary bar */}
      <Bar>Recent Vaccinations (Summary — see Health Book for full record)</Bar>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {hd.vaxList.slice(0, 5).map(v => (
          <div key={v.name} style={{ background: WHITE, border: `1px solid ${TEAL_LIGHT}`, borderRadius: 6, padding: "8px 14px" }}>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, fontWeight: 700, color: TEAL_DARK }}>{v.name}</div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: MUTED }}>{v.date}</div>
          </div>
        ))}
      </div>

      {/* Owner + seal */}
      <div style={{ display: "flex", gap: 48, alignItems: "flex-end", marginTop: "auto" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", marginBottom: 6 }}>Registered Owner</div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 16, color: TEXT, borderBottom: `2px solid ${TEAL}`, paddingBottom: 6, minWidth: 340 }}>{h.ownerName || "—"}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", border: `3px solid ${TEAL}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(135,155,149,0.05)" }}>
            <CrossIcon size={36} />
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: "0.08em", marginTop: 4 }}>OFFICIAL</div>
          </div>
        </div>
        <SignBlock date={today} />
      </div>
    </div>
  );
}

// ─── FARRIER HISTORY ──────────────────────────────────────────────────────────
function buildFarrier(id: string) {
  const interval   = intBetween(id, 500, 35, 49);
  const farrier    = "E. Morrison (RFA)";
  const setup      = pick(id, 501, ["Barefoot — trimmed and balanced", "Steel keg shoes — front pair", "Steel keg shoes — all four", "Aluminum wide-web — front pair", "Hind shoes only — steel keg"]);
  const notePool   = ["Good hoof growth. Balanced trim. No concerns.", "Minor flare on RF corrected. Wall integrity maintained.", "Hoof wall in excellent condition. Reset went well.", "Slight bruising on LF sole — monitor. Pad not required.", "Normal growth and wear. All four walls in good condition.", "Excellent wall thickness. Shoe fit well. No hot spots.", "LH shoe loose — re-set with additional clinch. Resolved.", "Even wear pattern. Hoof quality consistent.", "Good hoof quality. Mild thrush LH — treated with Thrushbuster.", "Short shoeing interval due to show schedule. No issues."];
  const typePool   = ["Full Reset (4 shoes)", "Trim & Balance", "Front Reset (2 shoes)", "Trim only", "Hind Reset (2 shoes)", "Full Reset — concave plates"];
  const rows       = Array.from({ length: 10 }, (_, i) => ({
    date: fmtDate(new Date(Date.now() - interval * (i + 1) * 864e5)),
    type: pick(id, 510 + i, typePool),
    notes: pick(id, 520 + i, notePool),
  }));
  const nextDue    = fmtDate(new Date(Date.now() + interval * 864e5));
  return { interval, farrier, setup, rows, nextDue };
}

function FarrierHistoryPage({ h }: { h: PdfHorse }) {
  const f = buildFarrier(h.id); const today = fmtDate(new Date());
  return (
    <div style={base}>
      <PageHeader title="FARRIERY RECORD" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 36px", marginBottom: 10 }}>
        {([["Horse", h.name], ["Breed", h.breed], ["Gender", h.gender], ["Foal Date", h.dob ? fmtDate(h.dob) : null], ["Height", h.height ? `${h.height} hh` : null], ["Stable", h.stablePrefix || "Redfield EC"]] as [string, string | null][]).map(([lbl, val]) => <LabelVal key={lbl} label={lbl} value={val} />)}
      </div>
      <div style={{ height: 1, background: TEAL_LIGHT, marginBottom: 16 }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginBottom: 20 }}>
        <div>
          <Bar>Current Setup</Bar>
          {[["Registered Farrier", f.farrier], ["Qualifications", "Registered Farriery Association (RFA)"], ["Current Shoeing", f.setup], ["Trim Interval", `${f.interval} days`], ["Next Appointment Due", f.nextDue]].map(([lbl, val]) => (
            <div key={lbl} style={{ display: "flex", borderBottom: `1px solid ${TEAL_LIGHT}`, padding: "10px 0" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", minWidth: 230 }}>{lbl}</span>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: TEXT, fontStyle: "italic" }}>{val}</span>
            </div>
          ))}
        </div>
        <div>
          <Bar>Hoof Notes</Bar>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: TEXT, lineHeight: 1.8, fontStyle: "italic", borderLeft: `3px solid ${TEAL}`, paddingLeft: 14 }}>
            {pick(h.id, 530, ["Hooves are well-balanced with good wall thickness. No chronic issues identified. Hoof quality has been consistently good under current management.", "Hoof quality generally good. Minor tendency for flaring on RF — managed through regular trimming intervals. No corrective shoeing required.", "Excellent hoof quality maintained on a strict 6-week schedule. Barefoot transition completed successfully — hoof wall has hardened well.", "Good hoof health throughout the record period. Some seasonal softening in wet months — monitored. No pathological changes."])}
          </div>
        </div>
      </div>

      <Bar>Appointment History</Bar>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 28, fontFamily: "var(--font-lato)", fontSize: 13 }}>
        <thead><tr style={{ background: "rgba(135,155,149,0.14)" }}>{["Date", "Service Performed", "Notes"].map(col => <th key={col} style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "9px 14px", color: MUTED, fontWeight: 700, fontSize: 11, textTransform: "uppercase", textAlign: "left" }}>{col}</th>)}</tr></thead>
        <tbody>{f.rows.map((row, i) => <tr key={i} style={{ background: i % 2 === 0 ? WHITE : "rgba(135,155,149,0.04)" }}><td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "10px 14px", color: TEXT, whiteSpace: "nowrap" }}>{row.date}</td><td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "10px 14px", color: TEXT, fontWeight: 700 }}>{row.type}</td><td style={{ border: `1px solid ${TEAL_LIGHT}`, padding: "10px 14px", color: MUTED, fontStyle: "italic" }}>{row.notes}</td></tr>)}</tbody>
      </table>

      <div style={{ display: "flex", gap: 36, alignItems: "flex-end" }}>
        <div style={{ flex: 1, fontFamily: "var(--font-lato)", fontSize: 13, color: MUTED, fontStyle: "italic" }}>Record maintained by {f.farrier} in partnership with Redfield Equestrian Centre. Last updated: {today}.</div>
        <SignBlock sigName="E. Morrison" line2="E. Morrison (RFA)" line3="Registered Farrier" licLine="" date={today} />
      </div>
    </div>
  );
}

// ─── Capture / download helpers ────────────────────────────────────────────────
const RATIO = 2;

async function capture(ref: React.RefObject<HTMLDivElement | null>): Promise<string | null> {
  if (!ref.current) return null;
  await toPng(ref.current, { pixelRatio: RATIO, cacheBust: true });
  return toPng(ref.current, { pixelRatio: RATIO, cacheBust: true });
}

async function asPng(ref: React.RefObject<HTMLDivElement | null>, filename: string) {
  const url = await capture(ref);
  if (!url) return;
  const a = document.createElement("a"); a.download = filename; a.href = url; a.click();
}

async function asPdf(refs: React.RefObject<HTMLDivElement | null>[], filename: string) {
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

// ─── Main component ────────────────────────────────────────────────────────────
export interface PdfDownloaderProps { horse: PdfHorse; results: PdfResult[]; players: PdfPlayer[]; }

function Btn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ background: disabled ? "var(--border)" : "var(--teal-dark)", color: "white", border: "none", borderRadius: 6, padding: "10px 18px", fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.65 : 1, whiteSpace: "nowrap" }}>{children}</button>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--border)", borderRadius: 5, padding: "6px 10px",
  fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text)", background: "var(--white)",
  width: "100%", boxSizing: "border-box",
};

export default function PdfDownloader({ horse, results, players }: PdfDownloaderProps) {
  // Health book
  const r0  = useRef<HTMLDivElement>(null);
  const r1  = useRef<HTMLDivElement>(null);
  const r2  = useRef<HTMLDivElement>(null);
  const r3  = useRef<HTMLDivElement>(null);
  const r4  = useRef<HTMLDivElement>(null);
  const r5  = useRef<HTMLDivElement>(null);
  // Existing docs
  const mcR = useRef<HTMLDivElement>(null);
  const frt = useRef<HTMLDivElement>(null);
  const ins = useRef<HTMLDivElement>(null);
  const tlg = useRef<HTMLDivElement>(null);
  // New docs
  const pp1 = useRef<HTMLDivElement>(null);
  const pp2 = useRef<HTMLDivElement>(null);
  const bos = useRef<HTMLDivElement>(null);
  const mrp = useRef<HTMLDivElement>(null);
  const epp = useRef<HTMLDivElement>(null);
  const fhr = useRef<HTMLDivElement>(null);

  const [status, setStatus]             = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [buyerIgn, setBuyerIgn]         = useState("");
  const [buyerUsername, setBuyerUsername] = useState("");
  const [buyerStable, setBuyerStable]   = useState("");
  const [mpLink, setMpLink]             = useState("");
  const [salePrice, setSalePrice]       = useState("");
  const [saleDate, setSaleDate]         = useState(fmtDate(new Date()));

  function applyPlayer(id: string) {
    setSelectedPlayer(id);
    const p = players.find(x => x.id === id);
    if (!p) return;
    setBuyerIgn(p.ign);
    setBuyerUsername(p.username);
    setBuyerStable(p.stableName || "");
  }

  const sl         = horseSlug(horse.name);
  const isStallion = horse.gender === "Stallion";
  const isMare     = horse.gender === "Mare";

  async function run(label: string, fn: () => Promise<void>) {
    setStatus(`Generating ${label}…`);
    try { await fn(); } finally { setStatus(null); }
  }

  const PS: React.CSSProperties = { width: PW, height: PH, flexShrink: 0 };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-lato)", fontSize: 11, fontWeight: 700,
    color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em",
    display: "block", marginBottom: 4,
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Row 1: existing docs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn disabled={!!status} onClick={() => run("Health Book", () => asPdf([r0, r1, r2, r3, r4, r5], `${sl}-health-book.pdf`))}>
            {status?.includes("Health Book") ? status : "↓ Health Book PDF"}
          </Btn>
          <Btn disabled={!!status} onClick={() => run("Microchip Card", () => asPng(mcR, `${sl}-microchip.png`))}>
            {status?.includes("Microchip") ? status : "↓ Microchip Card"}
          </Btn>
          {isStallion && (
            <Btn disabled={!!status} onClick={() => run("BSE Report", () => asPng(frt, `${sl}-bse.png`))}>
              {status?.includes("BSE") ? status : "↓ BSE Report"}
            </Btn>
          )}
          {isMare && (
            <Btn disabled={!!status} onClick={() => run("Reproductive Record", () => asPng(mrp, `${sl}-reproductive.png`))}>
              {status?.includes("Reproductive") ? status : "↓ Reproductive Record"}
            </Btn>
          )}
          <Btn disabled={!!status} onClick={() => run("Insurance", () => asPng(ins, `${sl}-insurance.png`))}>
            {status?.includes("Insurance") ? status : "↓ Insurance Cert"}
          </Btn>
          <Btn disabled={!!status} onClick={() => run("Training Log", () => asPdf([tlg], `${sl}-training-log.pdf`))}>
            {status?.includes("Training Log") ? status : "↓ Training Log PDF"}
          </Btn>
        </div>

        {/* Row 2: new docs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn disabled={!!status} onClick={() => run("PPE Report", () => asPdf([pp1, pp2], `${sl}-ppe-report.pdf`))}>
            {status?.includes("PPE") ? status : "↓ PPE Report PDF"}
          </Btn>
          <Btn disabled={!!status} onClick={() => run("Equine Passport", () => asPng(epp, `${sl}-passport.png`))}>
            {status?.includes("Passport") ? status : "↓ Equine Passport"}
          </Btn>
          <Btn disabled={!!status} onClick={() => run("Farrier History", () => asPng(fhr, `${sl}-farrier-history.png`))}>
            {status?.includes("Farrier") ? status : "↓ Farrier History"}
          </Btn>
        </div>

        {/* Bill of Sale — buyer form */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "18px 20px" }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 16, color: "var(--teal-dark)", marginBottom: 14 }}>Bill of Sale — Buyer Details</div>

          {/* Player picker */}
          {players.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Quick-fill from player directory</label>
              <select
                style={{ ...inputStyle, color: selectedPlayer ? "var(--text)" : "var(--text-muted)" }}
                value={selectedPlayer}
                onChange={e => applyPlayer(e.target.value)}
              >
                <option value="">Select a player…</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.ign} (@{p.username}){p.stableName ? ` — ${p.stableName}` : ""}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Character Name (IGN)</label>
              <input style={inputStyle} value={buyerIgn} onChange={e => setBuyerIgn(e.target.value)} placeholder="e.g. Elara Ashwood" />
            </div>
            <div>
              <label style={labelStyle}>Username</label>
              <input style={inputStyle} value={buyerUsername} onChange={e => setBuyerUsername(e.target.value)} placeholder="e.g. claire_w" />
            </div>
            <div>
              <label style={labelStyle}>Stable Name</label>
              <input style={inputStyle} value={buyerStable} onChange={e => setBuyerStable(e.target.value)} placeholder="e.g. Ashwood Stables" />
            </div>
            <div>
              <label style={labelStyle}>MP Listing Link</label>
              <input style={inputStyle} value={mpLink} onChange={e => setMpLink(e.target.value)} placeholder="e.g. forum.therift.com/…" />
            </div>
            <div>
              <label style={labelStyle}>Sale Price ($)</label>
              <input style={inputStyle} value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="0" type="number" min="0" />
            </div>
            <div>
              <label style={labelStyle}>Date of Sale</label>
              <input style={inputStyle} value={saleDate} onChange={e => setSaleDate(e.target.value)} placeholder="DD/MM/YYYY" />
            </div>
          </div>

          <Btn disabled={!!status} onClick={() => run("Bill of Sale", () => asPng(bos, `${sl}-bill-of-sale.png`))}>
            {status?.includes("Bill of Sale") ? status : "↓ Bill of Sale"}
          </Btn>
        </div>
      </div>

      {/* Off-screen render targets */}
      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
        <div ref={r0}  style={PS}><HBCover h={horse} /></div>
        <div ref={r1}  style={PS}><HBHealthReport h={horse} /></div>
        <div ref={r2}  style={PS}><HBPreventiveCare h={horse} /></div>
        <div ref={r3}  style={PS}><HBClinicalExam h={horse} /></div>
        <div ref={r4}  style={PS}><XRayPage h={horse} pgOffset={0} /></div>
        <div ref={r5}  style={PS}><XRayPage h={horse} pgOffset={1} /></div>
        {isStallion && <div ref={frt} style={PS}><FertilityPage h={horse} /></div>}
        {isMare     && <div ref={mrp} style={PS}><MareReproductivePage h={horse} /></div>}
        <div ref={mcR} style={PS}><MicrochipPage h={horse} /></div>
        <div ref={ins} style={PS}><InsurancePage h={horse} /></div>
        <div ref={tlg} style={PS}><TrainingLogPage h={horse} results={results} /></div>
        <div ref={pp1} style={PS}><PPEPage1 h={horse} /></div>
        <div ref={pp2} style={PS}><PPEPage2 h={horse} /></div>
        <div ref={bos} style={PS}><BillOfSalePage h={horse} buyerIgn={buyerIgn} buyerUsername={buyerUsername} buyerStable={buyerStable} mpLink={mpLink} salePrice={salePrice} saleDate={saleDate} /></div>
        <div ref={epp} style={PS}><EquinePassportPage h={horse} /></div>
        <div ref={fhr} style={PS}><FarrierHistoryPage h={horse} /></div>
      </div>
    </>
  );
}
