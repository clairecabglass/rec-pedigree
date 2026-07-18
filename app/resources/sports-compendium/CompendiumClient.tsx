"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ExternalLink } from "lucide-react";
import { DISCIPLINES, BASIC_VOCAB, JUMP_TYPE_IMAGES, type Discipline, type CompendiumLink } from "./data";
import { getJumpIcon } from "./JumpIcons";

const CATEGORIES: Discipline["category"][] = ["English Sports", "Western Sports", "Racing", "Other"];

const CATEGORY_ACCENT: Record<Discipline["category"], { text: string; border: string; bg: string }> = {
  "English Sports": { text: "var(--teal-dark)", border: "var(--teal-light)", bg: "var(--teal-muted)" },
  "Western Sports": { text: "var(--sand-text)", border: "var(--sand-border)", bg: "var(--sand-bg)" },
  Racing: { text: "var(--sage-text)", border: "var(--sage-border)", bg: "var(--sage-bg)" },
  Other: { text: "var(--lilac-text)", border: "var(--lilac-border)", bg: "var(--lilac-bg)" },
};

// Discipline sections whose Key Terms list mostly enumerates obstacle/jump types we have icons for
const JUMP_GRID_DISCIPLINES = new Set(["Show Jumping", "Cross Country"]);

type ActiveKey = "vocab" | string;
type ParsedLine = { term: string | null; rest: string; isBullet: boolean };

function parseLine(raw: string): ParsedLine {
  const isBullet = raw.startsWith("• ");
  const text = isBullet ? raw.slice(2) : raw;
  const m = text.match(/^([A-Za-z][A-Za-z0-9 '/]{0,44}?)\s*[-–:]\s+([\s\S]*)$/);
  if (m) return { term: m[1], rest: m[2], isBullet };
  return { term: null, rest: text, isBullet };
}

// Phrases embedded mid-paragraph in the PDF that link out to a diagram/photo
const INLINE_LINKS: Record<string, string> = {
  "Helpful diagram": "https://www.successful-horse-training-and-care.com/uploads/1/1/8/2/11828927/published/1535621.png?1718977388",
};

function linkifyInline(text: string): React.ReactNode {
  for (const phrase of Object.keys(INLINE_LINKS)) {
    const idx = text.indexOf(phrase);
    if (idx === -1) continue;
    const before = text.slice(0, idx);
    const after = text.slice(idx + phrase.length);
    return (
      <>
        {before}
        <a href={INLINE_LINKS[phrase]} target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal)", textDecoration: "underline" }}>
          {phrase}
        </a>
        {after}
      </>
    );
  }
  return text;
}

function TextBlock({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div style={{ fontSize: 13.5, fontFamily: "var(--font-lato)", color: "var(--text)", lineHeight: 1.7 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
        const { term, rest, isBullet } = parseLine(line);
        return (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
            {isBullet && <span style={{ color: "var(--gold)", flexShrink: 0 }}>•</span>}
            <span>
              {term && <strong style={{ color: "var(--teal-dark)" }}>{term}</strong>}
              {term ? " — " : ""}
              {linkifyInline(rest)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LinkList({ links }: { links: CompendiumLink[] }) {
  if (!links.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {links.map((l, i) =>
        l.url ? (
          <a
            key={i}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontFamily: "var(--font-lato)", color: "var(--teal)", textDecoration: "none" }}
          >
            {l.text}
            <ExternalLink size={11} style={{ flexShrink: 0 }} />
          </a>
        ) : (
          <span key={i} style={{ fontSize: 12.5, fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>
            {l.text}
          </span>
        )
      )}
    </div>
  );
}

function findImageLink(name: string): CompendiumLink | undefined {
  const key = name.replace(/[\s-]+/g, "").toLowerCase();
  return JUMP_TYPE_IMAGES.find((l) => l.text.replace(/[\s-]+/g, "").toLowerCase() === key);
}

function JumpTypeGrid({ names }: { names: { term: string; rest: string }[] }) {
  if (!names.length) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {names.map(({ term, rest }) => {
          const Icon = getJumpIcon(term);
          if (!Icon) return null;
          const photo = findImageLink(term);
          return (
            <div key={term} style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 10px 8px", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                <Icon size={64} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal-dark)", fontFamily: "var(--font-lato)" }}>{term.replace(/\s*-$/, "")}</div>
              {rest && <div style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "var(--font-lato)", lineHeight: 1.4, marginTop: 2 }}>{rest}</div>}
              {photo?.url && (
                <a href={photo.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, color: "var(--teal)", textDecoration: "none", marginTop: 4 }}>
                  Real photo <ExternalLink size={9} />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, content, links }: { title: string; content: string; links?: CompendiumLink[] }) {
  if (!content && !links?.length) return null;
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: links ? "var(--text-muted)" : "var(--gold)", fontWeight: 700, fontFamily: "var(--font-lato)", marginBottom: 6 }}>
        {title}
      </div>
      {links ? <LinkList links={links} /> : <TextBlock text={content} />}
    </div>
  );
}

function DisciplinePanel({ d }: { d: Discipline }) {
  const accent = CATEGORY_ACCENT[d.category];

  // Pull out jump/obstacle-type lines from Key Terms for the icon grid, leaving the rest as plain text
  let keyTermsText = d.key_terms;
  let jumpNames: { term: string; rest: string }[] = [];
  if (JUMP_GRID_DISCIPLINES.has(d.name)) {
    const lines = d.key_terms.split("\n");
    const restLines: string[] = [];
    for (const line of lines) {
      const { term, rest } = parseLine(line);
      if (term && getJumpIcon(term)) {
        jumpNames.push({ term, rest });
      } else {
        restLines.push(line);
      }
    }
    keyTermsText = restLines.join("\n");
  }

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ background: accent.bg, borderBottom: `1px solid ${accent.border}`, padding: "20px 28px" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: accent.text, fontFamily: "var(--font-lato)", fontWeight: 700 }}>
          {d.category}
        </span>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 28, color: "var(--teal-dark)", marginTop: 4 }}>{d.name}</h1>
      </div>
      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
        <Section title="The Sport" content={d.the_sport} />
        {jumpNames.length > 0 && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 700, fontFamily: "var(--font-lato)", marginBottom: 8 }}>
              Types of Jumps &amp; Obstacles
            </div>
            <JumpTypeGrid names={jumpNames} />
          </div>
        )}
        <Section title="Key Terms" content={keyTermsText} />
        <Section title="Judging" content={d.judging} />
        <Section title="Attire" content={d.attire} />
        <Section title="Extra" content="" links={d.extra_links} />
      </div>
    </div>
  );
}

function VocabPanel() {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 28 }}>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 28, color: "var(--teal-dark)", marginBottom: 18 }}>Basic Vocabulary</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {BASIC_VOCAB.map((b, i) => {
          const tones = [
            { bg: "var(--teal-muted)", border: "var(--teal-light)" },
            { bg: "var(--sand-bg)", border: "var(--sand-border)" },
            { bg: "var(--sage-bg)", border: "var(--sage-border)" },
            { bg: "var(--lilac-bg)", border: "var(--lilac-border)" },
            { bg: "var(--dam-bg)", border: "var(--dam-border)" },
          ];
          const tone = tones[i % tones.length];
          return (
            <div key={b.name} style={{ background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: 10, padding: 18 }}>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: 15, color: "var(--teal-dark)", marginBottom: 8 }}>{b.name}</div>
              <TextBlock text={b.content} />
              {b.links.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                  <LinkList links={b.links} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CompendiumClient() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<ActiveKey>("vocab");

  const filteredDisciplines = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DISCIPLINES;
    return DISCIPLINES.filter(
      (d) => d.name.toLowerCase().includes(q) || d.the_sport.toLowerCase().includes(q) || d.key_terms.toLowerCase().includes(q)
    );
  }, [search]);

  const activeDiscipline = DISCIPLINES.find((d) => d.name === active);

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div style={{ marginBottom: 8 }}>
        <Link href="/resources" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>‹ Resources</Link>
      </div>

      <header style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 38, color: "var(--teal-dark)", marginBottom: 6 }}>
          Equine Sports Compendium
        </h1>
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14, maxWidth: 560, margin: "0 auto" }}>
          A reference guide to vocabulary, judging, and attire across English, Western, racing, and other equestrian sports.
        </p>
      </header>

      <div style={{ background: "var(--cream-dark)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 20px", marginBottom: 24, textAlign: "center" }}>
        <p style={{ fontSize: 12.5, fontFamily: "var(--font-lato)", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
          Compiled with thanks to <strong style={{ color: "var(--teal-dark)" }}>The Rift team &amp; staff</strong>, who created and maintain this compendium —
          <em> created by horse lovers, for horse lovers.</em>
        </p>
      </div>

      <div className="grid md:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar */}
        <div>
          <div style={{ position: "relative", marginBottom: 14 }}>
            <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search disciplines…"
              style={{
                width: "100%", padding: "9px 12px 9px 34px", borderRadius: 6, border: "1px solid var(--border)",
                fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text)", background: "var(--white)",
              }}
            />
          </div>

          <div className="md:sticky md:top-6" style={{ maxHeight: "calc(100vh - 160px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingRight: 4 }}>
            {!search && (
              <button onClick={() => setActive("vocab")} style={navItemStyle(active === "vocab")}>
                Basic Vocabulary
              </button>
            )}

            {search ? (
              filteredDisciplines.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 13, padding: "8px 4px" }}>No matches.</p>
              ) : (
                filteredDisciplines.map((d) => (
                  <button key={d.name} onClick={() => setActive(d.name)} style={navItemStyle(active === d.name)}>
                    {d.name}
                  </button>
                ))
              )
            ) : (
              CATEGORIES.map((cat) => {
                const items = DISCIPLINES.filter((d) => d.category === cat);
                if (items.length === 0) return null;
                const accent = CATEGORY_ACCENT[cat];
                return (
                  <div key={cat}>
                    <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: accent.text, fontWeight: 700, fontFamily: "var(--font-lato)", marginBottom: 6, borderLeft: `3px solid ${accent.border}`, paddingLeft: 8 }}>
                      {cat}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {items.map((d) => (
                        <button key={d.name} onClick={() => setActive(d.name)} style={navItemStyle(active === d.name)}>
                          {d.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Content panel */}
        <div>
          {active === "vocab" ? <VocabPanel /> : activeDiscipline ? <DisciplinePanel d={activeDiscipline} /> : <VocabPanel />}
        </div>
      </div>
    </main>
  );
}

function navItemStyle(isActive: boolean): React.CSSProperties {
  return {
    display: "block", width: "100%", textAlign: "left", background: isActive ? "var(--teal-muted)" : "transparent",
    border: "none", borderRadius: 6, padding: "7px 10px", fontSize: 13, fontFamily: "var(--font-lato)",
    color: isActive ? "var(--teal-dark)" : "var(--text)", fontWeight: isActive ? 700 : 400, cursor: "pointer",
  };
}
