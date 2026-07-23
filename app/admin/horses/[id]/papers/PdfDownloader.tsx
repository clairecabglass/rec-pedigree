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
                ["Lymphocytes",               `${hd.lab.lymphocytes} ×10³/µL`,   "1.5–5.0 ×10³/µL`,    "Normal"],
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
export interface PdfDownloaderProps { horse: PdfHorse; results: PdfResult[]; }

function Btn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ background: disabled ? "var(--border)" : "var(--teal-dark)", color: "white", border: "none", borderRadius: 6, padding: "10px 18px", fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.65 : 1, whiteSpace: "nowrap" }}>{children}</button>
  );
}

export default function PdfDownloader({ horse, results }: PdfDownloaderProps) {
  const r0  = useRef<HTMLDivElement>(null); // HB cover
  const r1  = useRef<HTMLDivElement>(null); // HB health report
  const r2  = useRef<HTMLDivElement>(null); // HB preventive care
  const r3  = useRef<HTMLDivElement>(null); // HB clinical exam
  const r4  = useRef<HTMLDivElement>(null); // HB xray pg1
  const r5  = useRef<HTMLDivElement>(null); // HB xray pg2
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
        {/* Health book: 6 pages → PDF */}
        <Btn disabled={!!status} onClick={() => run("Health Book", () => asPdf([r0, r1, r2, r3, r4, r5], `${sl}-health-book.pdf`))}>
          {status?.includes("Health Book") ? status : "↓ Health Book PDF"}
        </Btn>
        {/* Single-page → PNG */}
        <Btn disabled={!!status} onClick={() => run("Microchip Card", () => asPng(mcR, `${sl}-microchip.png`))}>
          {status?.includes("Microchip") ? status : "↓ Microchip Card"}
        </Btn>
        {isStallion && (
          <Btn disabled={!!status} onClick={() => run("BSE Report", () => asPng(frt, `${sl}-bse.png`))}>
            {status?.includes("BSE") ? status : "↓ BSE Report"}
          </Btn>
        )}
        <Btn disabled={!!status} onClick={() => run("Insurance", () => asPng(ins, `${sl}-insurance.png`))}>
          {status?.includes("Insurance") ? status : "↓ Insurance Cert"}
        </Btn>
        {/* Training log → PDF */}
        <Btn disabled={!!status} onClick={() => run("Training Log", () => asPdf([tlg], `${sl}-training-log.pdf`))}>
          {status?.includes("Training Log") ? status : "↓ Training Log PDF"}
        </Btn>
      </div>

      {/* Off-screen render targets */}
      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
        <div ref={r0} style={PS}><HBCover h={horse} /></div>
        <div ref={r1} style={PS}><HBHealthReport h={horse} /></div>
        <div ref={r2} style={PS}><HBPreventiveCare h={horse} /></div>
        <div ref={r3} style={PS}><HBClinicalExam h={horse} /></div>
        <div ref={r4} style={PS}><XRayPage h={horse} pgOffset={0} /></div>
        <div ref={r5} style={PS}><XRayPage h={horse} pgOffset={1} /></div>
        {isStallion && <div ref={frt} style={PS}><FertilityPage h={horse} /></div>}
        <div ref={mcR} style={PS}><MicrochipPage h={horse} /></div>
        <div ref={ins} style={PS}><InsurancePage h={horse} /></div>
        <div ref={tlg} style={PS}><TrainingLogPage h={horse} results={results} /></div>
      </div>
    </>
  );
}
