/**
 * 4-phase foal growth tracker.
 *
 * From the moment a pregnancy is registered (the `coverDate` / breedingDateTime
 * field on Pregnancy) the foal moves through five real-time states:
 *
 *   GESTATION  – 0..72  h post-breeding   "In Gestation"
 *   WEANLING   – 72..96 h post-breeding   "Born — Weanling Stage"
 *   YEARLING   – 96..120 h                "Yearling Stage"
 *   YOUNGSTER  – 120..144 h               "Youngster Stage"
 *   ADULT      – 144+ h (6 days total)    "Adult Horse"
 *
 * Adult is the terminal state — at that point the foal is transferred OUT of
 * the breeding menu and back into the main stable grid with full breeding
 * capabilities. The transfer is performed by the caller (server action) when
 * it reads a stage of "adult"; this module is pure data.
 */

const HOURS = 60 * 60 * 1000;

export const FOAL_PHASES = [
  { code: "gestation",  hourMin:   0, hourMax:  72, label: "In Gestation",          description: "Foal is unborn and unaccessible." },
  { code: "weanling",   hourMin:  72, hourMax:  96, label: "Born — Weanling Stage", description: "Weanling Phase: Horse can be made active, called out, or led around. Cannot be mounted. Leading and Lunging training points enabled." },
  { code: "yearling",   hourMin:  96, hourMax: 120, label: "Yearling Stage",        description: "Yearling Phase: Visual scale difference applied. Movement rules remain identical to the weanling profile." },
  { code: "youngster",  hourMin: 120, hourMax: 144, label: "Youngster Stage",       description: "Youngster Phase: Horse is mountable. Custom tack assembly is fully enabled. Full access to mounted training versions unlocked." },
  { code: "adult",      hourMin: 144, hourMax: Infinity, label: "Adult Horse",      description: "Fully grown — transferred to the main stable with full breeding capabilities unlocked." },
] as const;

export type FoalPhaseCode = (typeof FOAL_PHASES)[number]["code"];

export interface FoalStage {
  code: FoalPhaseCode;
  label: string;
  description: string;
  /** Hours elapsed since the breeding event (capped at 0 if in the future). */
  hoursElapsed: number;
  /** Hours remaining until the NEXT phase begins. Infinity once Adult. */
  hoursToNextPhase: number;
  /** True when the foal is ready to be promoted out of the breeding menu. */
  isAdult: boolean;
}

/**
 * Compute the current foal phase from a breeding date.
 * `now` defaults to Date.now() but is parameterised for testability.
 */
export function computeFoalStage(breedingDate: Date | string | null | undefined, now: number = Date.now()): FoalStage | null {
  if (!breedingDate) return null;
  const start = (typeof breedingDate === "string" ? new Date(breedingDate) : breedingDate).getTime();
  if (Number.isNaN(start)) return null;

  const elapsedH = Math.max(0, (now - start) / HOURS);
  const phase = FOAL_PHASES.find((p) => elapsedH < p.hourMax) ?? FOAL_PHASES[FOAL_PHASES.length - 1];
  const hoursToNextPhase = phase.hourMax === Infinity ? Infinity : phase.hourMax - elapsedH;

  return {
    code: phase.code,
    label: phase.label,
    description: phase.description,
    hoursElapsed: elapsedH,
    hoursToNextPhase,
    isAdult: phase.code === "adult",
  };
}

/** Pretty "1d 4h" style countdown string. */
export function fmtCountdown(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "—";
  const totalMin = Math.round(hours * 60);
  const d = Math.floor(totalMin / (24 * 60));
  const h = Math.floor((totalMin % (24 * 60)) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
