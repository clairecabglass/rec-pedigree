"use client";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { computeFoalStage, fmtCountdown, FOAL_PHASES } from "@/lib/foalGrowth";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
interface GrowingHorse {
  id: string; name: string; breed: string | null;
  lifeStage: string | null; lastBredDateTime: string | null;
}
interface RecentAdult {
  id: string; name: string; breed: string | null;
  lastBredDateTime: string | null;
}
interface CalendarEntry {
  id: string; damId: string; damName: string;
  sireName: string | null; dueDate: string; coverDate: string | null;
  foalId: string | null; foalName: string | null; foalGender: string | null;
  markedForDeletion: boolean;
}
interface BirthRecord {
  id: string; damName: string; sireName: string | null;
  foalId: string | null; foalName: string | null;
  foalCoat: string | null; foalGender: string | null;
  bornAt: string;
}
interface Stats { expecting: number; growing: number; bornThisMonth: number; }

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function ymd(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function fmtMs(ms: number) {
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000); const m = Math.floor((abs % 3600000) / 60000);
  const d = Math.floor(h / 24); const rh = h % 24;
  return d > 0 ? `${d}d ${rh}h ${m}m` : `${rh}h ${m}m`;
}

const PHASE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  gestation:  { bg: "var(--lilac-bg)",  border: "var(--lilac-border)",  text: "var(--lilac-text)",  dot: "#9E89AC" },
  weanling:   { bg: "var(--sage-bg)",   border: "var(--sage-border)",   text: "var(--sage-text)",   dot: "#8FA683" },
  yearling:   { bg: "var(--sand-bg)",   border: "var(--sand-border)",   text: "var(--sand-text)",   dot: "#B59A6E" },
  youngster:  { bg: "var(--dam-bg)",    border: "var(--dam-border)",    text: "var(--dam-text)",    dot: "#A85868" },
  adult:      { bg: "var(--teal-muted)", border: "var(--border)", text: "var(--teal-dark)",  dot: "var(--teal)" },
};

const GENDER_ICON: Record<string, string> = { Mare: "♀", Stallion: "♂", Gelding: "♂" };

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */
export default function NurseryClient({
  growing, recentAdults, calendarEntries, birthHistory, stats,
}: {
  growing: GrowingHorse[];
  recentAdults: RecentAdult[];
  calendarEntries: CalendarEntry[];
  birthHistory: BirthRecord[];
  stats: Stats;
}) {
  const today = new Date();
  const [now, setNow] = useState(Date.now());
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [calOpen, setCalOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  /* ---- Calendar ---- */
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of calendarEntries) {
      const key = ymd(new Date(e.dueDate));
      const list = map.get(key) ?? []; list.push(e); map.set(key, list);
    }
    return map;
  }, [calendarEntries]);

  const year = cursor.getFullYear(); const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const upcoming = calendarEntries
    .filter((e) => new Date(e.dueDate) >= new Date(ymd(today)))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const growingWithStage = growing.map((h) => ({ ...h, stage: computeFoalStage(h.lastBredDateTime, now) }));
  const youngsters   = growingWithStage.filter((h) => h.stage?.code === "youngster");
  const otherGrowing = growingWithStage.filter((h) => h.stage && h.stage.code !== "youngster" && h.stage.code !== "adult");

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/admin/breeding" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>‹ Breeding</Link>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", margin: 0 }}>Nursery</h1>
      </div>

      {/* ============================================================
          STATS BAR
          ============================================================ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Expecting", value: stats.expecting, color: "var(--lilac-text)", bg: "var(--lilac-bg)", border: "var(--lilac-border)" },
          { label: "Growing", value: stats.growing, color: "var(--sage-text)", bg: "var(--sage-bg)", border: "var(--sage-border)" },
          { label: "Born (30d)", value: stats.bornThisMonth, color: "var(--teal-dark)", bg: "var(--teal-muted)", border: "var(--border)" },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color, fontFamily: "var(--font-playfair)", lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ============================================================
          GROWING UP SOON — Youngsters
          ============================================================ */}
      {youngsters.length > 0 && (
        <Section title="Growing Up Soon" accent="var(--dam-text)" subtitle="These foals are in the Youngster stage — almost adult">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {youngsters.map((h) => <FoalCard key={h.id} horse={h} stage={h.stage!} />)}
          </div>
        </Section>
      )}

      {/* ============================================================
          CURRENTLY GROWING
          ============================================================ */}
      {otherGrowing.length > 0 && (
        <Section title="Currently Growing" subtitle="Active foals in the nursery">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {otherGrowing.map((h) => <FoalCard key={h.id} horse={h} stage={h.stage!} />)}
          </div>
        </Section>
      )}

      {growingWithStage.length === 0 && (
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 28, marginBottom: 28, textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>No foals currently growing.</p>
        </div>
      )}

      {/* ============================================================
          RECENTLY GROWN UP
          ============================================================ */}
      {recentAdults.length > 0 && (
        <Section title="Recently Grown Up" subtitle="Foals that became adults in the past two weeks">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentAdults.map((h) => {
              const becameAdultAt = h.lastBredDateTime
                ? new Date(new Date(h.lastBredDateTime).getTime() + 144 * 3600 * 1000) : null;
              const daysAgo = becameAdultAt ? Math.floor((Date.now() - becameAdultAt.getTime()) / 86400000) : null;
              return (
                <Link key={h.id} href={`/registry/${h.id}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 16px", textDecoration: "none", background: "var(--white)" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--teal-dark)", fontFamily: "var(--font-lato)" }}>{h.name}</div>
                    {h.breed && <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{h.breed}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, background: "var(--teal-muted)", color: "var(--teal-dark)", borderRadius: 20, padding: "3px 10px", fontFamily: "var(--font-lato)", fontWeight: 700 }}>Adult</span>
                    {daysAgo !== null && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 3 }}>
                        {daysAgo === 0 ? "today" : `${daysAgo}d ago`}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      {/* ============================================================
          UPCOMING FOALS + CALENDAR
          ============================================================ */}
      <Section title="Foal Due Calendar" subtitle={`${stats.expecting} mare${stats.expecting !== 1 ? "s" : ""} currently expecting`}>
        <div style={{ display: "grid", gridTemplateColumns: upcoming.length > 0 ? "1fr 300px" : "1fr", gap: 20 }}>

          <div>
            <button onClick={() => setCalOpen((o) => !o)}
              style={{ marginBottom: 14, background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 6, padding: "7px 16px", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-lato)", color: "var(--teal-dark)" }}>
              {calOpen ? "Hide Calendar" : "Show Calendar"}
            </button>

            {calOpen && (
              <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <button onClick={() => setCursor(new Date(year, month - 1, 1))} style={navBtn}>‹</button>
                  <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)", margin: 0 }}>{MONTH_NAMES[month]} {year}</h3>
                  <button onClick={() => setCursor(new Date(year, month + 1, 1))} style={navBtn}>›</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                  {WEEKDAYS.map((w) => (
                    <div key={w} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", fontFamily: "var(--font-lato)", letterSpacing: "0.05em", paddingBottom: 6 }}>{w}</div>
                  ))}
                  {cells.map((date, i) => {
                    const key = date ? ymd(date) : `e-${i}`;
                    const dayEntries = date ? byDay.get(ymd(date)) ?? [] : [];
                    const isToday = date && ymd(date) === ymd(today);
                    return (
                      <div key={key} style={{ minHeight: 52, border: isToday ? "1.5px solid var(--gold)" : "1px solid var(--border)", borderRadius: 5, padding: 4, background: date ? "var(--cream)" : "transparent", opacity: date ? 1 : 0 }}>
                        {date && <>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginBottom: 3 }}>{date.getDate()}</div>
                          {dayEntries.map((e) => (
                            <Link key={e.id} href={e.foalId ? `/registry/${e.foalId}` : `/registry/${e.damId}`}
                              style={{ display: "block", fontSize: 9.5, fontFamily: "var(--font-lato)", fontWeight: 700, color: e.markedForDeletion ? "#888" : "var(--dam-text)", background: e.markedForDeletion ? "var(--cream)" : "var(--dam-bg)", border: `1px solid ${e.markedForDeletion ? "var(--border)" : "var(--dam-border)"}`, borderRadius: 3, padding: "1px 4px", marginBottom: 2, textDecoration: e.markedForDeletion ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                              title={`${e.damName}${e.sireName ? ` × ${e.sireName}` : ""}${e.markedForDeletion ? " — flagged for deletion" : ""}`}
                            >{e.damName}</Link>
                          ))}
                        </>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Upcoming list */}
          {upcoming.length > 0 && (
            <div>
              <h4 style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Upcoming</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {upcoming.map((e) => {
                  const msLeft = new Date(e.dueDate).getTime() - now;
                  const overdue = msLeft < 0;
                  const imminent = !overdue && msLeft < 6 * 3600000;
                  const countdown = overdue ? "Overdue" : fmtMs(msLeft);
                  return (
                    <div key={e.id} style={{ border: `1px solid ${e.markedForDeletion ? "var(--border)" : overdue || imminent ? "var(--dam-border)" : "var(--border)"}`, borderRadius: 10, padding: "12px 14px", background: e.markedForDeletion ? "var(--cream)" : overdue || imminent ? "var(--dam-bg)" : "var(--white)", opacity: e.markedForDeletion ? 0.6 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--teal-dark)", fontFamily: "var(--font-lato)" }}>{e.damName}</span>
                            {e.markedForDeletion && <span style={{ fontSize: 10, background: "#f3e8e8", color: "#a05050", border: "1px solid #e0c0c0", borderRadius: 10, padding: "1px 7px", fontFamily: "var(--font-lato)", fontWeight: 700 }}>Flagged</span>}
                          </div>
                          {e.sireName && <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 1 }}>× {e.sireName}</div>}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: overdue ? "var(--dam-text)" : imminent ? "var(--dam-text)" : "var(--teal-dark)", fontFamily: "var(--font-lato)" }}>
                            {overdue && "⚠ "}{countdown}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 1 }}>
                            {new Date(e.dueDate).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                      {/* Foal row + quick-rename */}
                      {e.foalId && (
                        <QuickRenameFoal foalId={e.foalId} foalName={e.foalName ?? ""} foalGender={e.foalGender} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ============================================================
          BIRTH HISTORY
          ============================================================ */}
      {birthHistory.length > 0 && (
        <Section title="Birth History" subtitle="Foals born in the last 30 days">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {birthHistory.map((b) => {
              const daysAgo = Math.floor((now - new Date(b.bornAt).getTime()) / 86400000);
              return (
                <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 16px", background: "var(--white)", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {b.foalId
                        ? <Link href={`/registry/${b.foalId}`} style={{ fontSize: 14, fontWeight: 700, color: "var(--teal-dark)", fontFamily: "var(--font-lato)", textDecoration: "none" }}>{b.foalName ?? "Unnamed Foal"}</Link>
                        : <span style={{ fontSize: 14, fontWeight: 700, color: "var(--teal-dark)", fontFamily: "var(--font-lato)" }}>{b.foalName ?? "Unnamed Foal"}</span>
                      }
                      {b.foalGender && <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{GENDER_ICON[b.foalGender] ?? ""} {b.foalGender}</span>}
                      {b.foalCoat && <span style={{ fontSize: 11, background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 10, padding: "1px 8px", fontFamily: "var(--font-lato)", color: "var(--teal-dark)" }}>{b.foalCoat}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 2 }}>
                      {b.damName}{b.sireName ? ` × ${b.sireName}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, background: "var(--teal-muted)", color: "var(--teal-dark)", borderRadius: 20, padding: "3px 10px", fontFamily: "var(--font-lato)", fontWeight: 700 }}>Born</span>
                    <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 3 }}>
                      {daysAgo === 0 ? "today" : `${daysAgo}d ago`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick rename foal inline                                            */
/* ------------------------------------------------------------------ */
function QuickRenameFoal({ foalId, foalName, foalGender }: { foalId: string; foalName: string; foalGender: string | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(foalName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!value.trim() || value.trim() === foalName) { setEditing(false); return; }
    setSaving(true);
    await fetch(`/api/horses/${foalId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: value.trim() }),
    });
    setSaving(false); setEditing(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, paddingTop: 6, borderTop: "1px solid var(--border)" }}>
      {foalGender && <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{GENDER_ICON[foalGender] ?? ""}</span>}
      {editing ? (
        <>
          <input
            autoFocus value={value} onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
            style={{ flex: 1, fontSize: 12, fontFamily: "var(--font-lato)", border: "1px solid var(--teal)", borderRadius: 5, padding: "3px 7px", color: "var(--teal-dark)", background: "var(--white)", outline: "none" }}
          />
          <button onClick={save} disabled={saving} style={smallBtn("var(--teal-dark)", "var(--teal-muted)")}>
            {saving ? "…" : "Save"}
          </button>
          <button onClick={() => setEditing(false)} style={smallBtn("var(--text-muted)", "transparent")}>✕</button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontSize: 12, color: "var(--teal-dark)", fontFamily: "var(--font-lato)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {saved ? "✓ Saved" : (value || "Unnamed Foal")}
          </span>
          <button onClick={() => setEditing(true)} style={smallBtn("var(--teal)", "transparent")}>Rename</button>
          <Link href={`/registry/${foalId}`} style={{ ...smallBtn("var(--text-muted)", "transparent"), textDecoration: "none", display: "inline-block" }}>Profile →</Link>
        </>
      )}
    </div>
  );
}

function smallBtn(color: string, bg: string): React.CSSProperties {
  return { fontSize: 11, fontFamily: "var(--font-lato)", color, background: bg, border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 };
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */
function Section({ title, subtitle, accent, children }: { title: string; subtitle?: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: accent ?? "var(--teal-dark)", margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)", margin: "3px 0 0" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function FoalCard({ horse, stage }: { horse: GrowingHorse; stage: NonNullable<ReturnType<typeof computeFoalStage>> }) {
  const colors = PHASE_COLORS[stage.code] ?? PHASE_COLORS.gestation;
  const isAlmostNext = stage.hoursToNextPhase < 4 && Number.isFinite(stage.hoursToNextPhase);
  return (
    <Link href={`/registry/${horse.id}`} style={{ textDecoration: "none" }}>
      <div style={{ border: `1.5px solid ${colors.border}`, borderRadius: 10, padding: "14px 16px", background: colors.bg, transition: "box-shadow 0.15s" }} className="hover-card">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--teal-dark)", fontFamily: "var(--font-lato)" }}>{horse.name}</div>
            {horse.breed && <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{horse.breed}</div>}
          </div>
          <span style={{ fontSize: 10, background: "white", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 20, padding: "2px 8px", fontFamily: "var(--font-lato)", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0, marginLeft: 8 }}>
            {stage.label.replace("Born — ", "")}
          </span>
        </div>
        <PhaseProgress stage={stage} />
        <div style={{ marginTop: 8, fontSize: 11.5, color: colors.text, fontFamily: "var(--font-lato)", fontWeight: 600 }}>
          {stage.isAdult ? "Fully grown" : (
            <>{isAlmostNext && <span style={{ marginRight: 4 }}>⚡</span>}Next stage in {fmtCountdown(stage.hoursToNextPhase)}</>
          )}
        </div>
        <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 2 }}>
          {stage.description.split(":")[0]}
        </div>
      </div>
    </Link>
  );
}

function PhaseProgress({ stage }: { stage: NonNullable<ReturnType<typeof computeFoalStage>> }) {
  const phases = FOAL_PHASES.filter((p) => p.code !== "adult");
  const currentIdx = phases.findIndex((p) => p.code === stage.code);
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {phases.map((p, i) => {
        const done = i < currentIdx; const active = i === currentIdx;
        const pct = active && Number.isFinite(stage.hoursToNextPhase)
          ? ((p.hourMax - stage.hoursToNextPhase - p.hourMin) / (p.hourMax - p.hourMin)) * 100
          : done ? 100 : 0;
        return (
          <div key={p.code} style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, Math.max(0, done ? 100 : pct))}%`, height: "100%", background: PHASE_COLORS[p.code].dot, borderRadius: 3, transition: "width 0.5s" }} />
          </div>
        );
      })}
    </div>
  );
}

const navBtn: React.CSSProperties = { background: "var(--white)", border: "1px solid var(--border)", color: "var(--teal-dark)", borderRadius: 6, padding: "5px 11px", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-lato)" };
