"use client";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";

/* ============================================================================
   Live Show Scoreboard — Show Jumping & Cross Country
============================================================================ */

type Discipline = "jumping" | "xc";

interface Rider {
  id: string;
  name: string;
  horse: string;
  representing: string;
}

interface Score {
  riderId: string;
  name: string;
  horse: string;
  representing: string;
  timeMs: number;
  penalties: number;
  dnf: boolean;
  optimumS: number | null;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const fmtTime = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

interface DisciplineRules {
  label: string;
  penaltyLabel: string;
  quickActions: { label: string; delta: number; danger?: boolean }[];
  rankKey: (s: Score) => number[];
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
    rankKey: (s) => [s.dnf ? 1 : 0, s.penalties, s.timeMs],
  },
  xc: {
    label: "Cross Country",
    penaltyLabel: "Penalty Points",
    quickActions: [
      { label: "+20 Refusal", delta: 20 },
      { label: "+10 Time Violation", delta: 10 },
    ],
    rankKey: (s) => {
      const dev = s.optimumS != null ? Math.abs(s.timeMs / 1000 - s.optimumS) : 0;
      return [s.dnf ? 1 : 0, s.penalties + dev, s.timeMs];
    },
    deviationLabel: (s) => {
      if (s.optimumS == null) return "";
      const dev = s.timeMs / 1000 - s.optimumS;
      return `${dev > 0 ? "+" : ""}${dev.toFixed(1)}s vs target`;
    },
  },
};

interface TimerState {
  running: boolean;
  startedAt: number | null;
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
  const [optimumTime, setOptimumTime] = useState(150);
  const [roster, setRoster] = useState<Rider[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  const [timer, setTimer] = useState<TimerState>({ running: false, startedAt: null, accumulated: 0 });
  const [livePenalties, setLivePenalties] = useState(0);
  const [liveDnf, setLiveDnf] = useState(false);

  const [scores, setScores] = useState<Score[]>([]);
  const [exporting, setExporting] = useState(false);
  const leaderboardRef = useRef<HTMLDivElement | null>(null);

  // Mobile: collapse judge panel by default on small screens
  const [panelOpen, setPanelOpen] = useState(true);

  const rules = RULES[discipline];
  const activeRider = roster[activeIdx] ?? null;

  /* ---- Roster parser ---- */
  function parseRoster(raw: string) {
    const out: Rider[] = [];
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t) continue;
      const split = t.split(/\s*(?:\/|—|–|-|,| on | riding )\s*/i);
      out.push({
        id: uid(),
        name: (split[0] || "").trim(),
        horse: (split[1] || "").trim(),
        representing: (split[2] || "").trim(),
      });
    }
    setRoster(out);
    setActiveIdx(0);
    resetRun();
  }

  /* ---- Queue helpers ---- */
  // A rider is "scored" if their id appears in the scores array.
  const scoredIds = useMemo(() => new Set(scores.map((s) => s.riderId)), [scores]);

  function jumpToRider(idx: number) {
    if (idx === activeIdx) return;
    if (idx < 0 || idx >= roster.length) return;
    setActiveIdx(idx);
    resetRun();
  }

  // Remove a rider's score and bring them back to the hot seat.
  function redoRider(riderId: string, idx: number) {
    setScores((s) => s.filter((sc) => sc.riderId !== riderId));
    setActiveIdx(idx);
    resetRun();
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
  function addPenalty(n: number) { setLivePenalties((p) => Math.max(0, p + n)); }
  function disqualify() { setLiveDnf(true); pauseTimer(); }

  function submitScore() {
    if (!activeRider) return;
    pauseTimer();
    const finalMs = readElapsed(timer);
    setScores((s) => [
      ...s.filter((sc) => sc.riderId !== activeRider.id), // replace if re-doing
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
    // Advance to the next un-scored rider, if any.
    const nextIdx = roster.findIndex((r, i) => i > activeIdx && !scoredIds.has(r.id));
    setActiveIdx(nextIdx !== -1 ? nextIdx : activeIdx + 1);
    resetRun();
  }

  /* ---- Ranked leaderboard ---- */
  const ranked = useMemo(() => {
    return [...scores].sort((a, b) => {
      const ka = rules.rankKey(a);
      const kb = rules.rankKey(b);
      for (let i = 0; i < ka.length; i++) {
        if (ka[i] !== kb[i]) return ka[i] - kb[i];
      }
      return 0;
    });
  }, [scores, rules]);

  /* ---- Export PNG ---- */
  async function exportPng() {
    if (!leaderboardRef.current) return;
    setExporting(true);
    try {
      const url = await toPng(leaderboardRef.current, {
        pixelRatio: 2, cacheBust: true, skipFonts: true, backgroundColor: "#FBF8F4",
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

  const switchDiscipline = useCallback((d: Discipline) => {
    if (d === discipline) return;
    if (scores.length && !confirm("Switching discipline will clear existing scores. Continue?")) return;
    setDiscipline(d);
    setScores([]);
    resetRun();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discipline, scores.length]);

  return (
    <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-6 sm:py-10">
      {/* ---- Header ---- */}
      <header className="mb-5 flex flex-wrap items-center gap-3 justify-between">
        <Link href="/" className="text-xs uppercase tracking-[0.12em] text-[var(--teal)] no-underline" style={{ fontFamily: "var(--font-lato)" }}>← Back home</Link>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(22px, 5vw, 30px)", color: "var(--teal-dark)" }}>Show Scoreboard</h1>
        <label className="flex items-center gap-2 text-xs" style={{ fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>
          <input type="checkbox" checked={organizerMode} onChange={(e) => setOrganizerMode(e.target.checked)} />
          Organizer Mode
        </label>
      </header>

      {/* ---- Discipline + event meta ---- */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {(Object.keys(RULES) as Discipline[]).map((d) => (
          <button key={d} onClick={() => switchDiscipline(d)} style={{
            background: d === discipline ? "var(--teal)" : "var(--white)",
            color: d === discipline ? "white" : "var(--teal-dark)",
            border: `1px solid ${d === discipline ? "var(--teal)" : "var(--border)"}`,
            borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700,
            fontFamily: "var(--font-lato)", cursor: "pointer", whiteSpace: "nowrap",
          }}>{RULES[d].label}</button>
        ))}
        <input
          type="text" placeholder="Event name (e.g. REC Anniversary Grand Prix)"
          value={eventName} onChange={(e) => setEventName(e.target.value)}
          className="flex-1 min-w-[160px] text-sm rounded-md border bg-white px-3 py-2"
          style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)" }}
        />
        {discipline === "xc" && (
          <label className="flex items-center gap-2 text-xs whitespace-nowrap" style={{ fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>
            Optimum (s)
            <input type="number" min={1} value={optimumTime}
              onChange={(e) => setOptimumTime(Math.max(1, parseInt(e.target.value, 10) || 0))}
              className="w-20 text-sm rounded-md border bg-white px-2 py-1.5"
              style={{ borderColor: "var(--border)" }}
            />
          </label>
        )}
      </div>

      {/* ---- Mobile judge panel toggle ---- */}
      {organizerMode && (
        <button
          className="lg:hidden w-full mb-3 text-sm font-bold rounded-lg py-2.5"
          onClick={() => setPanelOpen((o) => !o)}
          style={{
            background: "var(--teal)", color: "white", border: "none",
            fontFamily: "var(--font-lato)", cursor: "pointer",
          }}
        >
          {panelOpen ? "▲ Hide Judge Panel" : "▼ Show Judge Panel"}
        </button>
      )}

      <div className="flex flex-col lg:grid gap-5" style={{ gridTemplateColumns: organizerMode ? "320px 1fr" : "1fr" }}>

        {/* ============ Judge controller ============ */}
        {organizerMode && (
          <aside
            style={{
              display: "grid",
              gridTemplateRows: panelOpen ? "1fr" : "0fr",
              transition: "grid-template-rows 0.25s cubic-bezier(0.4,0,0.2,1)",
              alignSelf: "start",
            }}
          >
          <div style={{
              minHeight: 0, overflow: "hidden",
              background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10,
              padding: panelOpen ? 16 : "0 16px",
              transition: "padding 0.25s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {/* Sticky only on large screens — on mobile it would lock the panel off-screen */}
            <div className="lg:sticky" style={{ top: 16 }}>
              <SectionLabel>Roster · Order of Go</SectionLabel>
              <RosterBox onParse={parseRoster} count={roster.length} />

              {!!roster.length && (
                <div className="mt-3 mb-3">
                  <SectionLabel>Queue (tap to jump · ↩ to redo)</SectionLabel>
                  <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {roster.map((r, i) => {
                      const isActive  = i === activeIdx;
                      const isScored  = scoredIds.has(r.id);
                      return (
                        <li key={r.id} className="flex items-center gap-1">
                          {/* Main jump button */}
                          <button
                            type="button"
                            onClick={() => !isActive && !isScored && jumpToRider(i)}
                            disabled={isActive || isScored}
                            title={isScored ? "Already scored — use ↩ to redo" : isActive ? "Currently on course" : "Jump to this rider"}
                            style={{
                              flex: 1,
                              textAlign: "left",
                              padding: "7px 10px",
                              borderRadius: 6,
                              fontSize: 12,
                              fontFamily: "var(--font-lato)",
                              background: isActive ? "var(--teal)" : isScored ? "var(--cream-dark)" : "var(--white)",
                              color: isActive ? "white" : isScored ? "var(--text-muted)" : "var(--teal-dark)",
                              border: `1px solid ${isActive ? "var(--teal)" : "var(--border)"}`,
                              cursor: isActive || isScored ? "default" : "pointer",
                            }}
                          >
                            <span style={{ fontWeight: 700 }}>{i + 1}. {r.name}</span>
                            {r.horse ? <span style={{ opacity: 0.8 }}> · {r.horse}</span> : null}
                            {r.representing ? <span style={{ opacity: 0.6 }}> · {r.representing}</span> : null}
                          </button>

                          {/* Redo button — only shown for scored riders */}
                          {isScored && (
                            <button
                              type="button"
                              onClick={() => redoRider(r.id, i)}
                              title="Redo this rider's run"
                              style={{
                                flexShrink: 0,
                                padding: "7px 9px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                fontFamily: "var(--font-lato)",
                                background: "#fffbeb",
                                color: "#92400e",
                                border: "1px solid #fde68a",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              ↩ Redo
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <hr className="my-3" style={{ borderColor: "var(--border)" }} />

              <SectionLabel>Live Timer</SectionLabel>
              <div className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-playfair)", color: timer.running ? "var(--teal-dark)" : "var(--text-muted)" }}>
                <LiveTimerDisplay timer={timer} />
              </div>
              <div className="flex gap-1.5 mb-4">
                <CtrlBtn onClick={startTimer} disabled={timer.running || !activeRider} primary>Start</CtrlBtn>
                <CtrlBtn onClick={pauseTimer} disabled={!timer.running}>Pause</CtrlBtn>
                <CtrlBtn onClick={resetRun}>Reset</CtrlBtn>
              </div>

              <SectionLabel>{rules.penaltyLabel}</SectionLabel>
              <div className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-playfair)", color: livePenalties > 0 ? "var(--inbreed-text)" : "var(--teal-dark)" }}>
                {liveDnf ? "DNF" : livePenalties}
              </div>
              <div className="flex flex-col gap-2 mb-4">
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
                  padding: "12px 14px", fontSize: 14, fontWeight: 700, width: "100%",
                  fontFamily: "var(--font-lato)", cursor: activeRider ? "pointer" : "not-allowed",
                  opacity: activeRider ? 1 : 0.5,
                  minHeight: 48, // good touch target
                }}
              >
                Submit Score &amp; Next Rider →
              </button>
            </div>
          </div>
          </aside>
        )}

        {/* ============ Spectator board ============ */}
        <section className="min-w-0">
          <ActiveSpotlight
            rider={activeRider}
            timer={timer}
            running={timer.running}
            penalties={livePenalties}
            dnf={liveDnf}
            penaltyLabel={rules.penaltyLabel}
          />

          <div className="mt-5 flex items-center justify-between flex-wrap gap-2 mb-2">
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(18px,4vw,22px)", color: "var(--teal-dark)" }}>
              Standings — {rules.label}
            </h2>
            <button
              onClick={exportPng}
              disabled={exporting || !ranked.length}
              style={{
                background: "var(--gold)", color: "var(--teal-dark)", border: "none",
                borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 700,
                fontFamily: "var(--font-lato)", cursor: exporting ? "wait" : (!ranked.length ? "not-allowed" : "pointer"),
                opacity: !ranked.length ? 0.5 : 1, whiteSpace: "nowrap",
              }}
            >
              {exporting ? "Generating…" : "Export PNG"}
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

function LiveTimerDisplay({ timer }: { timer: TimerState }) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => tick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [timer.running]);
  return <>{fmtTime(readElapsed(timer))}</>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.08em] font-semibold mb-2" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
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
        rows={5}
        className="w-full text-xs rounded-md border bg-white px-2 py-1.5"
        style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)", resize: "vertical" }}
      />
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10.5px]" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
          Loaded: {count} rider{count !== 1 ? "s" : ""}
        </span>
        <button
          onClick={() => onParse(raw)} disabled={!raw.trim()}
          style={{
            background: "var(--teal-muted)", color: "var(--teal-dark)", border: "1px solid var(--teal)",
            borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700,
            fontFamily: "var(--font-lato)", cursor: raw.trim() ? "pointer" : "not-allowed", opacity: raw.trim() ? 1 : 0.5,
          }}
        >
          Load order
        </button>
      </div>
    </div>
  );
}

function CtrlBtn({ children, onClick, disabled, primary, danger }: {
  children: React.ReactNode; onClick: () => void;
  disabled?: boolean; primary?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className="flex-1 text-xs px-2 rounded-md border font-bold disabled:opacity-40"
      style={{
        fontFamily: "var(--font-lato)",
        background: primary ? "var(--teal)" : "var(--white)",
        color: primary ? "white" : danger ? "var(--inbreed-text)" : "var(--teal-dark)",
        borderColor: primary ? "var(--teal)" : danger ? "var(--inbreed-border)" : "var(--border)",
        cursor: disabled ? "not-allowed" : "pointer",
        minHeight: 44, // accessible touch target
      }}
    >
      {children}
    </button>
  );
}

function ActiveSpotlight({ rider, timer, running, penalties, dnf, penaltyLabel }: {
  rider: Rider | null; timer: TimerState; running: boolean;
  penalties: number; dnf: boolean; penaltyLabel: string;
}) {
  return (
    <div style={{
      background: "linear-gradient(135deg, var(--teal-dark) 0%, #2A3F3F 100%)",
      color: "var(--cream)", borderRadius: 14, padding: "18px 20px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.18)", position: "relative", overflow: "hidden",
    }}>
      <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em]" style={{ fontFamily: "var(--font-lato)", opacity: 0.7 }}>
        Currently on course
      </div>
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3 mt-1">
        <div className="min-w-0">
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(20px, 5vw, 30px)", fontWeight: 700, lineHeight: 1.1 }}>
            {rider?.name || "— Waiting for rider —"}
          </div>
          {rider?.horse && (
            <div style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(12px,3vw,14px)", opacity: 0.85, marginTop: 2 }}>
              riding {rider.horse}
            </div>
          )}
          {rider?.representing && (
            <div style={{
              fontFamily: "var(--font-lato)", fontSize: 11, letterSpacing: "0.16em",
              textTransform: "uppercase", color: "rgba(251,248,244,0.55)", fontWeight: 600, marginTop: 2,
            }}>
              Representing · {rider.representing}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div style={{
            fontFamily: "var(--font-playfair)", fontSize: "clamp(28px, 8vw, 44px)", fontWeight: 700,
            color: running ? "var(--gold-light)" : "var(--cream)",
            lineHeight: 1,
          }}>
            <LiveTimerDisplay timer={timer} />
          </div>
          <div
            className={dnf || penalties > 0 ? "blink" : ""}
            style={{
              fontFamily: "var(--font-lato)", fontSize: "clamp(11px,3vw,13px)", fontWeight: 700, marginTop: 2,
              color: dnf ? "#FFB0B0" : penalties > 0 ? "#FFD37A" : "rgba(255,255,255,0.6)",
            }}
          >
            {dnf ? "ELIMINATED" : `${penalties} ${penaltyLabel.toLowerCase()}`}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spot-blink { 0%,60%{opacity:1} 70%,100%{opacity:0.55} }
        .blink { animation: spot-blink 1.2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ============================================================================
   Leaderboard
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
          [{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }],
          { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)", fill: "both" },
        );
      }
      next.set(id, top);
    });
    lastTops.current = next;
  }, [ranked]);

  return (
    <div ref={ref} style={{
      background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12,
      padding: "14px 12px", boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
    }}>
      <div className="flex items-end justify-between mb-3 pb-2" style={{ borderBottom: "2px solid var(--gold)" }}>
        <div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>
            {rules.label}{discipline === "xc" ? ` · optimum ${optimumTime}s` : ""}
          </div>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(16px,4vw,22px)", color: "var(--teal-dark)" }}>
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
          {/* Desktop table header — hidden on mobile */}
          <div className="hidden sm:grid items-center gap-2 px-3 py-1"
            style={{ gridTemplateColumns: LB_COLS, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
            {["Pl.", "Rider", "Horse", "Representing", "Time", "Pen.", "Detail"].map((h, i) => (
              <div key={h} className={`text-[10px] uppercase tracking-[0.08em]${i >= 4 ? " text-right" : ""}`}>{h}</div>
            ))}
          </div>

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

      {/* Logo + stable credit — appears on the exported standings image */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-icon.png" alt="" crossOrigin="anonymous" style={{ height: 20, width: "auto", opacity: 0.9 }} />
        <span style={{ fontFamily: "var(--font-lato)", fontSize: 10.5, color: "var(--text-muted)" }}>
          Redfield Equestrian Centre · made on redfieldec.site
        </span>
      </div>
    </div>
  );
});

const LB_COLS = "40px 1.1fr 1fr 0.9fr 80px 60px 110px";

const PODIUM_BG: Record<number, string> = {
  1: "linear-gradient(90deg,rgba(196,169,110,.20) 0%,rgba(196,169,110,.05) 100%)",
  2: "linear-gradient(90deg,rgba(180,180,180,.20) 0%,rgba(180,180,180,.05) 100%)",
  3: "linear-gradient(90deg,rgba(180,120,80,.18) 0%,rgba(180,120,80,.05) 100%)",
};
const PODIUM_BORDER: Record<number, string> = { 1: "#C4A96E", 2: "#9AA1A8", 3: "#B07A52" };
const PODIUM_LABEL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function Row({ place, score, rules, refSetter }: {
  place: number; score: Score; rules: DisciplineRules;
  rowKey: string; refSetter: (el: HTMLDivElement | null) => void;
}) {
  const podium = place <= 3;
  const dev = rules.deviationLabel ? rules.deviationLabel(score) : "";

  return (
    <div
      ref={refSetter}
      style={{
        background: podium ? PODIUM_BG[place] : (place % 2 === 0 ? "var(--cream)" : "var(--white)"),
        border: podium ? `2px solid ${PODIUM_BORDER[place]}` : "1px solid var(--border)",
        borderRadius: 8,
        fontFamily: "var(--font-lato)",
        color: "var(--text)",
        transition: "background-color 0.2s",
      }}
    >
      {/* ---- Desktop row: single grid line ---- */}
      <div
        className="hidden sm:grid items-center gap-2 px-3 py-2.5"
        style={{ gridTemplateColumns: LB_COLS, fontSize: 13 }}
      >
        <div className="text-base font-bold" style={{ color: podium ? PODIUM_BORDER[place] : "var(--text-muted)" }}>
          {podium ? PODIUM_LABEL[place] : place}
        </div>
        <div className="font-semibold truncate" style={{ color: "var(--teal-dark)" }}>{score.name}</div>
        <div className="truncate" style={{ color: "var(--text-muted)" }}>{score.horse || "—"}</div>
        <div className="truncate" style={{ color: "var(--text-muted)", fontStyle: score.representing ? "normal" : "italic" }}>
          {score.representing || "—"}
        </div>
        <div className="text-right tabular-nums">{score.dnf ? "—" : fmtTime(score.timeMs)}</div>
        <div className="text-right font-semibold" style={{ color: score.dnf ? "var(--inbreed-text)" : score.penalties > 0 ? "var(--inbreed-text)" : "var(--teal-dark)" }}>
          {score.dnf ? "DNF" : score.penalties}
        </div>
        <div className="text-right text-[11px]" style={{ color: "var(--text-muted)" }}>
          {score.dnf ? "Eliminated" : dev}
        </div>
      </div>

      {/* ---- Mobile card: two-line layout ---- */}
      <div className="sm:hidden px-3 py-2.5 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="text-lg font-bold shrink-0" style={{ color: podium ? PODIUM_BORDER[place] : "var(--text-muted)", minWidth: 26 }}>
            {podium ? PODIUM_LABEL[place] : place}
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: "var(--teal-dark)" }}>{score.name}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {[score.horse, score.representing].filter(Boolean).join(" · ") || "—"}
            </div>
            {!score.dnf && dev && (
              <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{dev}</div>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="tabular-nums text-sm font-semibold" style={{ color: "var(--teal-dark)" }}>
            {score.dnf ? "DNF" : fmtTime(score.timeMs)}
          </div>
          <div className="text-xs font-bold" style={{ color: score.dnf ? "var(--inbreed-text)" : score.penalties > 0 ? "var(--inbreed-text)" : "var(--text-muted)" }}>
            {score.dnf ? "Eliminated" : `${score.penalties} pen.`}
          </div>
        </div>
      </div>
    </div>
  );
}
