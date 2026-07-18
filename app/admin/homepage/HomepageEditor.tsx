"use client";
import { useState, useCallback } from "react";

export interface HomepageData {
  announcement: { text: string; style: "info" | "warning" | "success" | "gold" };
  hero: {
    title: string;
    subtitle: string;
    cta1: { label: string; href: string };
    cta2: { label: string; href: string };
  };
  cards: Array<{ title: string; desc: string; href: string; cta: string }>;
  newsBlock: { enabled: boolean; heading: string; body: string };
}

const ANNOUNCEMENT_STYLES: Record<HomepageData["announcement"]["style"], { bg: string; border: string; color: string; label: string }> = {
  info:    { bg: "var(--teal-muted)",  border: "var(--teal-light)", color: "var(--teal-dark)",  label: "Teal" },
  gold:    { bg: "#FFF3D0",            border: "#E8C96A",           color: "#7A5C00",           label: "Gold" },
  success: { bg: "#E8F4E8",            border: "#9AC49A",           color: "#2D5A2D",           label: "Green" },
  warning: { bg: "#FDF0E8",            border: "#E8B894",           color: "#7A4020",           label: "Amber" },
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--teal-dark)", marginBottom: 6, fontFamily: "var(--font-lato)" }}>
        {label}
      </label>
      {hint && <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, fontFamily: "var(--font-lato)" }}>{hint}</div>}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 6,
  fontSize: 14, fontFamily: "var(--font-lato)", color: "var(--text)", background: "var(--white)",
};
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 90, resize: "vertical" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, marginBottom: 20 }}>
      <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function HomepageEditor({ initial }: { initial: HomepageData }) {
  const [data, setData] = useState<HomepageData>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = useCallback((path: string, value: unknown) => {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as HomepageData;
      const parts = path.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let obj: any = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return next;
    });
    setSaved(false);
  }, []);

  const updateCard = useCallback((i: number, field: string, value: string) => {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as HomepageData;
      (next.cards[i] as Record<string, string>)[field] = value;
      return next;
    });
    setSaved(false);
  }, []);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const ann = ANNOUNCEMENT_STYLES[data.announcement.style];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)" }}>Homepage Editor</h1>
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14, marginTop: 4 }}>Changes save to the database and appear on the public homepage immediately.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--teal)", fontFamily: "var(--font-lato)", textDecoration: "none" }}>
            Preview site →
          </a>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{ background: saving ? "var(--teal-light)" : saved ? "#4A7C4A" : "var(--teal-dark)", color: "white", border: "none", borderRadius: 7, padding: "10px 24px", fontSize: 14, fontWeight: 700, fontFamily: "var(--font-lato)", cursor: saving ? "default" : "pointer", letterSpacing: "0.05em" }}
          >
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Announcement Banner */}
      <Section title="Announcement Banner">
        <Field label="Banner Text" hint="Leave empty to hide the banner.">
          <textarea
            value={data.announcement.text}
            onChange={(e) => update("announcement.text", e.target.value)}
            placeholder="e.g. New horses added this week — check the registry!"
            style={textareaStyle}
          />
        </Field>
        <Field label="Banner Style">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {(Object.keys(ANNOUNCEMENT_STYLES) as Array<HomepageData["announcement"]["style"]>).map((s) => {
              const st = ANNOUNCEMENT_STYLES[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => update("announcement.style", s)}
                  style={{
                    padding: "8px 18px", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-lato)", cursor: "pointer",
                    background: st.bg, border: `2px solid ${data.announcement.style === s ? st.color : st.border}`,
                    color: st.color, fontWeight: data.announcement.style === s ? 700 : 400,
                    outline: data.announcement.style === s ? `2px solid ${st.color}` : "none",
                    outlineOffset: 2,
                  }}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </Field>
        {data.announcement.text && (
          <div style={{ background: ann.bg, border: `1px solid ${ann.border}`, borderRadius: 8, padding: "12px 18px", fontSize: 14, color: ann.color, fontFamily: "var(--font-lato)", marginTop: 4 }}>
            <strong>Preview:</strong> {data.announcement.text}
          </div>
        )}
      </Section>

      {/* Hero */}
      <Section title="Hero Section">
        <Field label="Main Heading">
          <input type="text" value={data.hero.title} onChange={(e) => update("hero.title", e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Subtitle Paragraph">
          <textarea value={data.hero.subtitle} onChange={(e) => update("hero.subtitle", e.target.value)} style={textareaStyle} />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Field label="Primary Button Label">
              <input type="text" value={data.hero.cta1.label} onChange={(e) => update("hero.cta1.label", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Primary Button Link">
              <input type="text" value={data.hero.cta1.href} onChange={(e) => update("hero.cta1.href", e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div>
            <Field label="Secondary Button Label">
              <input type="text" value={data.hero.cta2.label} onChange={(e) => update("hero.cta2.label", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Secondary Button Link">
              <input type="text" value={data.hero.cta2.href} onChange={(e) => update("hero.cta2.href", e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>
      </Section>

      {/* News / Text Block */}
      <Section title="News / Text Block">
        <Field label="">
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text)" }}>
            <input
              type="checkbox"
              checked={data.newsBlock.enabled}
              onChange={(e) => update("newsBlock.enabled", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--teal)" }}
            />
            Show a news / text block on the homepage
          </label>
        </Field>
        {data.newsBlock.enabled && (
          <>
            <Field label="Heading">
              <input type="text" value={data.newsBlock.heading} onChange={(e) => update("newsBlock.heading", e.target.value)} style={inputStyle} placeholder="e.g. Latest News" />
            </Field>
            <Field label="Body" hint="Supports line breaks.">
              <textarea value={data.newsBlock.body} onChange={(e) => update("newsBlock.body", e.target.value)} style={{ ...textareaStyle, minHeight: 140 }} placeholder="Write any announcement, lore update, or message here…" />
            </Field>
          </>
        )}
      </Section>

      {/* Feature Cards */}
      <Section title="Feature Cards">
        <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginBottom: 20, marginTop: -8 }}>
          The three cards in the grid below the stats bar.
        </p>
        {data.cards.map((card, i) => (
          <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 18, marginBottom: 16, background: "var(--cream)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--teal)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-lato)", marginBottom: 14 }}>
              Card {i + 1}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Title">
                <input type="text" value={card.title} onChange={(e) => updateCard(i, "title", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="CTA Button Text">
                <input type="text" value={card.cta} onChange={(e) => updateCard(i, "cta", e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <Field label="Description">
              <textarea value={card.desc} onChange={(e) => updateCard(i, "desc", e.target.value)} style={{ ...textareaStyle, minHeight: 70 }} />
            </Field>
            <Field label="Link">
              <input type="text" value={card.href} onChange={(e) => updateCard(i, "href", e.target.value)} style={inputStyle} />
            </Field>
          </div>
        ))}
      </Section>

      {/* Save bottom */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 8 }}>
        <a href="/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--teal)", fontFamily: "var(--font-lato)", textDecoration: "none", alignSelf: "center" }}>
          Preview site →
        </a>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{ background: saving ? "var(--teal-light)" : saved ? "#4A7C4A" : "var(--teal-dark)", color: "white", border: "none", borderRadius: 7, padding: "11px 28px", fontSize: 14, fontWeight: 700, fontFamily: "var(--font-lato)", cursor: saving ? "default" : "pointer", letterSpacing: "0.05em" }}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
