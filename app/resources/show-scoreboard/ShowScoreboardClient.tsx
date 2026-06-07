"use client";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";

/* ============================================================================
   Live Show Scoreboard — Show Jumping & Cross Country
   Self-contained. Stays in browser state; refresh = new event.
============================================================================ */

type Discipline = "jumping" | "xc";

interface Rider {
  id: string;
  name: string;
  horse: string;
  /** Stable / faction / ranch / team the rider competes for. */
  representing: string;
}

interface Score {
  riderId: string;
  name: string;
  horse: string;
  representing: string;
  /** Elapsed time in milliseconds when the run was finalised. */
  timeMs: number;
  /** Show Jumping faults OR Cross Country penalty points. */
  penalties: number;
  /** Eliminated / disqualified. */
  dnf: boolean;
  /** Snapshot of the optimum time at the moment this score was logged (XC). */
  optimumS: number | null;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const fmtTime = (ms: number) => {
  const s = ms / 1000;
  return `${s.toFixed(2)}s`;
};

/* ============================================================================
   Discipline rules — keeping rank logic + quick-action buttons local to a
   single object per discipline so swapping disciplines is one switch.
============================================================================ */

interface DisciplineRules {
  label: string;
  penaltyLabel: string; // "Faults" / "Penalty Points"
  quickActions: { label: string; delta: number; danger?: boolean }[];
  /**
   * Compute a sortable "score" tuple for a finished score. Lower is better,
   * so each tuple element is compared in order.
   */
  rankKey: (s: Score) => number[];
  /** Optional deviation display (XC). */
  deviationLabel?: (s: Score) => string;
}

const RULES: Record<Discipline, DisciplineRules> = {
  jumping: {
    label: "Show Jumping",
    penaltyLabel: "Faults",
    quickActions: [
      { label: "+4 Knockdown", delta: 4 },
      { label: "+4 Refusal", delta: 4 },
    ],
    // DNF always last, then lowest faults, then fastest time.
    rankKey: (s) => [s.dnf ? 1 : 0, s.penalties, s.timeMs],
  },
  xc: {
    label: "Cross Country",
    penaltyLabel: "Penalty Points",
    quickActions: [
      { label: "+20 Refusal", delta: 20 },
      { label: "+10 Time Violation", delta: 10 },
    ],
    // DNF last, then lowest combined (penalties + |timeDev_s|), then time.
    rankKey: (s) => {
      const dev = s.optimumS != null ? Math.abs(s.timeMs / 1000 - s.optimumS) : 0;
      return [s.dnf ? 1 : 0, s.penalties + dev, s.timeMs];
    },
    deviationLabel: (s) => {
      if (s.optimumS == null) return "";
      const dev = s.timeMs / 1000 - s.optimumS;
      const sign = dev > 0 ? "+" : "";
      return `${sign}${dev.toFixed(1)}s vs target`;
    },
  },
};

/* ============================================================================
   Timer state — accumulator pattern so pause/resume always works.
============================================================================ */

interface TimerState {
  running: boolean;
  /** When the current run started — null when paused or never started. */
  startedAt: number | null;
  /** Milliseconds accumulated from previous start/stop cycles. */
  accumulated: number;
}

function readElapsed(t: TimerState): number {
  return t.accumulated + (t.running && t.startedAt != null ? Date.now() - t.startedAt : 0);
}

/* ============================================================================
   Component
============================================================================ */

export default function ShowScoreboardClient() {
  const [discipline, setDiscipline] = useState<Discipline>("jumping");
  const [organizerMode, setOrganizerMode] = useState(true);
  const [eventName, setEventName] = useState("");
  const [optimumTime, setOptimumTime] = useState(150); // XC target seconds
  const [roster, setRoster] = useState<Rider[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  // Live run state
  const [timer, setTimer] = useState<TimerState>({ running: false, startedAt: null, accumulated: 0 });
  const [livePenalties, setLivePenalties] = useState(0);
  const [liveDnf, setLiveDnf] = useState(false);
  const [, forceTick] = useState(0); // re-render every 100 ms while running

  // Submitted scores
  const [scores, setScores] = useState<Score[]>([]);
  const [exporting, setExporting] = useState(false);
  const leaderboardRef = useRef<HTMLDivElement | null>(null);

  const rules = RULES[discipline];
  const activeRider = roster[activeIdx] ?? null;

  /* ---- Tick the clock while running ---- */
  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => forceTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [timer.running]);

  /* ---- Roster parser ---- */
  // Accepts up to 3 segments per line: Rider / Horse / Representing.
  // Separators: "/", "-", "—", "–", ",", " on ", " riding ".
  // Examples:
  //   "Jane Doe / Lightning / REC"
  //   "John Smith - Wildfire"
  //   "Alex Lee on Echo, Wild Roses Stable"
  function parseRoster(raw: string) {
    const out: Rider[] = [];
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t) continue;
      const split = t.split(/\s*(?:\/|—|–|-|,| on | riding )\s*/i);
      const name = (split[0] || "").trim();
      const horse = (split[1] || "").trim();
      const representing = (split[2] || "").trim();
      if (!name) continue;
      out.push({ id: uid(), name, horse, representing });
    }
    setRoster(out);
    setActiveIdx(0);
    resetRun();
  }

  /* ---- Queue navigation ---- */
  function jumpToRider(idx: number) {
    if (idx === activeIdx) return;
    if (idx < 0 || idx >= roster.length) return;
    setActiveIdx(idx);
    resetRun(); // clear timer + live penalties for the new rider
  }

  /* ---- Timer controls ---- */
  function startTimer() {
    setTimer((t) => t.running ? t : { running: true, startedAt: Date.now(), accumulated: t.accumulated });
  }
  function pauseTimer() {
    setTimer((t) => {
      if (!t.running || t.startedAt == null) return t;
      return { running: false, startedAt: null, accumulated: t.accumulated + (Date.now() - t.startedAt) };
    });
  }
  function resetRun() {
    setTimer({ running: false, startedAt: null, accumulated: 0 });
    setLivePenalties(0);
    setLiveDnf(false);
  }

  function addPenalty(n: number) {
    setLivePenalties((p) => Math.max(0, p + n));
  }
  function disqualify() {
    setLiveDnf(true);
    pauseTimer();
  }

  function submitScore() {
    if (!activeRider) return;
    pauseTimer();
    const finalMs = readElapsed(timer);
    setScores((s) => [
      ...s,
      {
        riderId: activeRider.id,
        name: activeRider.name,
        horse: activeRider.horse,
        representing: activeRider.representing,
        timeMs: finalMs,
        penalties: livePenalties,
        dnf: liveDnf,
        optimumS: discipline === "xc" ? optimumTime : null,
      },
    ]);
    // Advance queue
    setActiveIdx((i) => i + 1);
    resetRun();
  }

  /* ---- Ranked leaderboard ---- */
  const ranked = useMemo(() => {
    const arr = [...scores].sort((a, b) => {
      const ka = rules.rankKey(a);
      const kb = rules.rankKey(b);
      for (let i = 0; i < ka.length; i++) {
        if (ka[i] !== kb[i]) return ka[i] - kb[i];
      }
      return 0;
    });
    return arr;
  }, [scores, rules]);

  /* ---- Export PNG ---- */
  async function exportPng() {
    if (!leaderboardRef.current) return;
    setExporting(true);
    try {
      const url = await toPng(leaderboardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
        backgroundColor: "#FBF8F4",
      });
      const a = document.createElement("a");
      a.download = `${(eventName || rules.label).replace(/[^a-z0-9]+/gi, "-")}-results.png`;
      a.href = url;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Could not generate PNG.");
    } finally {
      setExporting(false);
    }
  }

  // Switching discipline mid-event resets the live run + clears scores so the
  // leaderboard tuples stay homogeneous.
  const switchDiscipline = useCallback((d: Discipline) => {
    if (d === discipline) return;
    if (scores.length && !confirm("Switching discipline will clear existing scores. Continue?")) return;
    setDiscipline(d);
    setScores([]);
    resetRun();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discipline, scores.length]);

  const liveElapsed = readElapsed(timer);

  return (
    <main className="max-w-[1400px] mx-auto px-4 py-8">
      <header className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <Link href="/" className="text-xs uppercase tracking-[0.12em] text-[var(--teal)] no-underline" style={{ fontFamily: "var(--font-lato)" }}>← Back home</Link>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 30, color: "var(--teal-dark)" }}>Show Scoreboard</h1>
        <label className="flex items-center gap-2 text-xs" style={{ fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>
          <input type="checkbox" checked={organizerMode} onChange={(e) => setOrganizerMode(e.target.checked)} />
          Organizer Mode
        </label>
      </header>

      {/* Discipline + event meta */}
      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "1fr auto" }}>
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(RULES) as Discipline[]).map((d) => (
            <button
              key={d}
              onClick={() => switchDiscipline(d)}
              style={{
                background: d === discipline ? "var(--teal)" : "var(--white)",
                color: d === discipline ? "white" : "var(--teal-dark)",
                border: `1px solid ${d === discipline ? "var(--teal)" : "var(--border)"}`,
                borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700,
                fontFamily: "var(--font-lato)", cursor: "pointer",
              }}
            >
              {RULES[d].label}
            </button>
          ))}
          <input
            type="text" placeholder="Event name (e.g. REC Anniversary Grand Prix)"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="ml-2 flex-1 min-w-[200px] text-sm rounded-md border bg-white px-3 py-2"
            style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)" }}
          />
        </div>
        {discipline === "xc" && (
          <label className="flex items-center gap-2 text-xs" style={{ fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>
            Optimum time (s)
            <input
              type="number" min={1}
              value={optimumTime}
              onChange={(e) => setOptimumTime(Math.max(1, parseInt(e.target.value, 10) || 0))}
              className="w-24 text-sm rounded-md border bg-white px-2 py-1.5"
              style={{ borderColor: "var(--border)" }}
            />
          </label>
        )}
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: organizerMode ? "320px 1fr" : "1fr" }}>
        {/* ============ Judge controller ============ */}
        {organizerMode && (
          <aside style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, alignSelf: "start", position: "sticky", top: 16 }}>
            <SectionLabel>Roster · Order of Go</SectionLabel>
            <RosterBox onParse={parseRoster} count={roster.length} />

            {!!roster.length && (
              <div className="mt-3 mb-3">
                <SectionLabel>Pending queue (click to jump)</SectionLabel>
                <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {roster.map((r, i) => {
                    const isActive = i === activeIdx;
                    const isDone = i < activeIdx;
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => jumpToRider(i)}
                          disabled={isDone}
                          title={isDone ? "Already scored" : isActive ? "Currently on course" : "Make this rider active"}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "6px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontFamily: "var(--font-lato)",
                            background: isActive ? "var(--teal)" : isDone ? "var(--cream-dark)" : "var(--white)",
                            color: isActive ? "white" : isDone ? "var(--text-muted)" : "var(--teal-dark)",
                            border: `1px solid ${isActive ? "var(--teal)" : "var(--border)"}`,
                            cursor: isDone ? "not-allowed" : "pointer",
                            opacity: isDone ? 0.7 : 1,
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>{i + 1}. {r.name}</span>
                          {r.horse ? <span style={{ opacity: 0.85 }}> · {r.horse}</span> : null}
                          {r.representing ? <span style={{ opacity: 0.65 }}> · {r.representing}</span> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <hr className="my-3" style={{ borderColor: "var(--border)" }} />

            <SectionLabel>Live Timer</SectionLabel>
            <div className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-playfair)", color: timer.running ? "var(--teal-dark)" : "var(--text-muted)" }}>
              {fmtTime(liveElapsed)}
            </div>
            <div className="flex gap-1.5 mb-3">
              <CtrlBtn onClick={startTimer} disabled={timer.running || !activeRider} primary>Start</CtrlBtn>
              <CtrlBtn onClick={pauseTimer} disabled={!timer.running}>Pause</CtrlBtn>
              <CtrlBtn onClick={resetRun}>Reset</CtrlBtn>
            </div>

            <SectionLabel>{rules.penaltyLabel}</SectionLabel>
            <div className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-playfair)", color: livePenalties > 0 ? "var(--inbreed-text)" : "var(--teal-dark)" }}>
              {liveDnf ? "DNF" : livePenalties}
            </div>
            <div className="flex flex-col gap-1.5 mb-3">
              {rules.quickActions.map((qa) => (
                <CtrlBtn key={qa.label} onClick={() => addPenalty(qa.delta)} disabled={liveDnf || !activeRider}>{qa.label}</CtrlBtn>
              ))}
              <CtrlBtn onClick={disqualify} disabled={liveDnf || !activeRider} danger>
                {discipline === "xc" ? "Disqualify / Fall" : "Disqualify"}
              </CtrlBtn>
              <CtrlBtn onClick={() => setLivePenalties((p) => Math.max(0, p - 4))} disabled={liveDnf || livePenalties === 0}>− Undo last 4</CtrlBtn>
            </div>

            <button
              onClick={submitScore}
              disabled={!activeRider}
              style={{
                background: "var(--teal)", color: "white", border: "none", borderRadius: 8,
                padding: "10px 14px", fontSize: 13, fontWeight: 700, width: "100%",
                fontFamily: "var(--font-lato)", cursor: activeRider ? "pointer" : "not-allowed",
                opacity: activeRider ? 1 : 0.5,
              }}
            >
              Submit Score & Next Rider →
            </button>
          </aside>
        )}

        {/* ============ Spectator board ============ */}
        <section>
          {/* Active rider spotlight */}
          <ActiveSpotlight
            rider={activeRider}
            elapsedMs={liveElapsed}
            running={timer.running}
            penalties={livePenalties}
            dnf={liveDnf}
            penaltyLabel={rules.penaltyLabel}
          />

          {/* Leaderboard */}
          <div className="mt-5 flex items-center justify-between flex-wrap gap-2 mb-2">
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)" }}>Standings — {rules.label}</h2>
            <button
              onClick={exportPng}
              disabled={exporting || !ranked.length}
              style={{
                background: "var(--gold)", color: "var(--teal-dark)", border: "none",
                borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700,
                fontFamily: "var(--font-lato)", cursor: exporting ? "wait" : (!ranked.length ? "not-allowed" : "pointer"),
                opacity: !ranked.length ? 0.5 : 1,
              }}
            >
              {exporting ? "Generating…" : "Export Final Standings (PNG)"}
            </button>
          </div>

          <Leaderboard
            ref={leaderboardRef}
            ranked={ranked}
            rules={rules}
            eventName={eventName}
            discipline={discipline}
            optimumTime={optimumTime}
          />
        </section>
      </div>
    </main>
  );
}

/* ============================================================================
   Subcomponents
============================================================================ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] font-semibold mb-2" style={{ fontFamily: "var(--font-lato)" }}>
      {children}
    </div>
  );
}

function RosterBox({ onParse, count }: { onParse: (raw: string) => void; count: number }) {
  const [raw, setRaw] = useState("");
  return (
    <div>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={"One per line — Name / Horse / Representing\n\nJane Doe / Lightning / REC\nJohn Smith - Wildfire - Wild Roses\nAlex Lee on Echo"}
        rows={6}
        className="w-full text-xs rounded-md border bg-white px-2 py-1.5"
        style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)", resize: "vertical" }}
      />
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10.5px]" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
          Loaded: {count} rider{count !== 1 ? "s" : ""}
        </span>
        <button
          onClick={() => onParse(raw)}
          disabled={!raw.trim()}
          style={{
            background: "var(--teal-muted)", color: "var(--teal-dark)", border: "1px solid var(--teal)",
            borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700,
            fontFamily: "var(--font-lato)", cursor: raw.trim() ? "pointer" : "not-allowed", opacity: raw.trim() ? 1 : 0.5,
          }}
        >
          Load order
        </button>
      </div>
    </div>
  );
}

function CtrlBtn({
  children, onClick, disabled, primary, danger,
}: { children: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean; danger?: boolean }) {
  const base = "flex-1 text-xs px-2 py-2 rounded-md border font-bold transition-colors disabled:opacity-40";
  const style: React.CSSProperties = {
    fontFamily: "var(--font-lato)",
    background: primary ? "var(--teal)" : danger ? "var(--white)" : "var(--white)",
    color: primary ? "white" : danger ? "var(--inbreed-text)" : "var(--teal-dark)",
    borderColor: primary ? "var(--teal)" : danger ? "var(--inbreed-border)" : "var(--border)",
    cursor: disabled ? "not-allowed" : "pointer",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={base} style={style}>
      {children}
    </button>
  );
}

function ActiveSpotlight({
  rider, elapsedMs, running, penalties, dnf, penaltyLabel,
}: { rider: Rider | null; elapsedMs: number; running: boolean; penalties: number; dnf: boolean; penaltyLabel: string }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, var(--teal-dark) 0%, #2A3F3F 100%)",
        color: "var(--cream)",
        borderRadius: 14,
        padding: "20px 28px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="text-[11px] uppercase tracking-[0.18em]" style={{ fontFamily: "var(--font-lato)", opacity: 0.7 }}>
        Currently on course
      </div>
      <div className="flex items-center justify-between flex-wrap gap-4 mt-1">
        <div>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 30, fontWeight: 700, lineHeight: 1.05 }}>
            {rider?.name || "— Waiting for rider —"}
          </div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, opacity: 0.85, marginTop: 2 }}>
            {rider?.horse ? `riding ${rider.horse}` : ""}
          </div>
          {rider?.representing && (
            <div
              className="mt-1 inline-flex items-center"
              style={{
                fontFamily: "var(--font-lato)",
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(251, 248, 244, 0.55)",
                fontWeight: 600,
              }}
            >
              Representing&nbsp;·&nbsp;{rider.representing}
            </div>
          )}
        </div>
        <div className="text-right">
          <div
            style={{
              fontFamily: "var(--font-playfair)", fontSize: 44, fontWeight: 700,
              color: running ? "var(--gold-light)" : "var(--cream)",
            }}
          >
            {fmtTime(elapsedMs)}
          </div>
          <div
            className={dnf || penalties > 0 ? "blink" : ""}
            style={{
              fontFamily: "var(--font-lato)", fontSize: 13, fontWeight: 700,
              color: dnf ? "#FFB0B0" : penalties > 0 ? "#FFD37A" : "rgba(255,255,255,0.6)",
              marginTop: 2,
            }}
          >
            {dnf ? "ELIMINATED" : `${penalties} ${penaltyLabel.toLowerCase()}`}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spot-blink { 0%, 60% { opacity: 1; } 70%, 100% { opacity: 0.55; } }
        .blink { animation: spot-blink 1.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ============================================================================
   Leaderboard — FLIP-style row reorder animation.
============================================================================ */

interface LeaderboardProps {
  ranked: Score[];
  rules: DisciplineRules;
  eventName: string;
  discipline: Discipline;
  optimumTime: number;
}

const Leaderboard = forwardRef<HTMLDivElement, LeaderboardProps>(function Leaderboard(
  { ranked, rules, eventName, discipline, optimumTime }, ref,
) {
  // FLIP animation: remember each row's previous Y, then translate from
  // the delta so React's re-order looks like a smooth swap.
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastTops = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const next = new Map<string, number>();
    rowRefs.current.forEach((el, id) => {
      const top = el.getBoundingClientRect().top;
      const prev = lastTops.current.get(id);
      if (prev != null && prev !== top) {
        const dy = prev - top;
        el.animate(
          [
            { transform: `translateY(${dy}px)` },
            { transform: "translateY(0)" },
          ],
          { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" },
        );
      }
      next.set(id, top);
    });
    lastTops.current = next;
  }, [ranked]);

  return (
    <div
      ref={ref}
      style={{
        background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12,
        padding: 18, boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-end justify-between mb-3 pb-2" style={{ borderBottom: "2px solid var(--gold)" }}>
        <div>
          <div className="text-[11px] uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>
            {rules.label} {discipline === "xc" ? `· optimum ${optimumTime}s` : ""}
          </div>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)" }}>
            {eventName || "Event Standings"}
          </div>
        </div>
        <div className="text-xs" style={{ fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>
          {ranked.length} rider{ranked.length !== 1 ? "s" : ""}
        </div>
      </div>

      {ranked.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
          No scores submitted yet — start the timer in the judge panel.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Header />
          {ranked.map((s, i) => (
            <Row
              key={s.riderId + "-" + i}
              rowKey={s.riderId}
              place={i + 1}
              score={s}
              rules={rules}
              refSetter={(el) => {
                if (el) rowRefs.current.set(s.riderId, el);
                else rowRefs.current.delete(s.riderId);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Single source of truth for the leaderboard grid columns. Keep this
// identical between Header and Row so cells line up.
const LB_COLS = "44px 1.1fr 1fr 0.9fr 90px 70px 120px";

function Header() {
  const cell = "text-[10px] uppercase tracking-[0.08em]";
  return (
    <div
      className="grid items-center gap-2 px-3 py-1"
      style={{ gridTemplateColumns: LB_COLS, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}
    >
      <div className={cell}>Pl.</div>
      <div className={cell}>Rider</div>
      <div className={cell}>Horse</div>
      <div className={cell}>Representing</div>
      <div className={cell + " text-right"}>Time</div>
      <div className={cell + " text-right"}>Pen.</div>
      <div className={cell + " text-right"}>Detail</div>
    </div>
  );
}

const PODIUM_BG: Record<number, string> = {
  1: "linear-gradient(90deg, rgba(196,169,110,0.20) 0%, rgba(196,169,110,0.05) 100%)",
  2: "linear-gradient(90deg, rgba(180,180,180,0.20) 0%, rgba(180,180,180,0.05) 100%)",
  3: "linear-gradient(90deg, rgba(180,120,80,0.18) 0%, rgba(180,120,80,0.05) 100%)",
};
const PODIUM_BORDER: Record<number, string> = {
  1: "#C4A96E", // gold
  2: "#9AA1A8", // silver
  3: "#B07A52", // bronze
};
const PODIUM_LABEL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function Row({
  place, score, rules, refSetter,
}: {
  place: number;
  score: Score;
  rules: DisciplineRules;
  rowKey: string;
  refSetter: (el: HTMLDivElement | null) => void;
}) {
  const podium = place <= 3;
  return (
    <div
      ref={refSetter}
      className="grid items-center gap-2 px-3 py-2.5 rounded-md"
      style={{
        gridTemplateColumns: LB_COLS,
        background: podium ? PODIUM_BG[place] : (place % 2 === 0 ? "var(--cream)" : "var(--white)"),
        border: podium ? `2px solid ${PODIUM_BORDER[place]}` : "1px solid var(--border)",
        fontFamily: "var(--font-lato)",
        fontSize: 13,
        color: "var(--text)",
        transition: "background-color 0.2s",
      }}
    >
      <div className="text-base font-bold flex items-center gap-1" style={{ color: podium ? PODIUM_BORDER[place] : "var(--text-muted)" }}>
        {podium ? PODIUM_LABEL[place] : place}
      </div>
      <div className="font-semibold" style={{ color: "var(--teal-dark)" }}>{score.name}</div>
      <div style={{ color: "var(--text-muted)" }}>{score.horse || "—"}</div>
      <div style={{ color: "var(--text-muted)", fontStyle: score.representing ? "normal" : "italic" }}>
        {score.representing || "—"}
      </div>
      <div className="text-right tabular-nums">{score.dnf ? "—" : fmtTime(score.timeMs)}</div>
      <div className="text-right font-semibold" style={{ color: score.dnf ? "var(--inbreed-text)" : score.penalties > 0 ? "var(--inbreed-text)" : "var(--teal-dark)" }}>
        {score.dnf ? "DNF" : score.penalties}
      </div>
      <div className="text-right text-[11px]" style={{ color: "var(--text-muted)" }}>
        {score.dnf ? "Eliminated" : rules.deviationLabel ? rules.deviationLabel(score) : ""}
      </div>
    </div>
  );
}
