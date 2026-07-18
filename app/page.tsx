import Link from "next/link";
import { prisma } from "@/lib/db";
import type { HomepageData } from "./admin/homepage/HomepageEditor";

export const dynamic = "force-dynamic";

const OWNED = {
  AND: [
    { OR: [{ ownership: { notIn: ["Outside", "Void", "Expected"] } }, { ownership: null }] },
    { name: { startsWith: "[REC]" } },
  ],
};

const DEFAULTS: HomepageData = {
  announcement: { text: "", style: "info" },
  hero: {
    title: "Horse Registry & Pedigree Records",
    subtitle: "Browse our full registry, explore bloodlines through interactive pedigree trees, and find horses available for purchase.",
    cta1: { label: "View Registry", href: "/registry" },
    cta2: { label: "Horses for Sale", href: "/for-sale" },
  },
  cards: [
    { title: "Full Registry", desc: "All our registered horses in one place. Search by breed, colour, gender, or ownership and view full pedigree records.", href: "/registry", cta: "Browse Registry" },
    { title: "Resources", desc: "Player tools — plan show courses, work out foal genetics, or run a live scoreboard during events.", href: "/resources", cta: "Explore Resources" },
    { title: "For Sale", desc: "Horses currently available to buy from Redfield EC. Browse listings and get in touch.", href: "/for-sale", cta: "View Listings" },
  ],
  newsBlock: { enabled: false, heading: "Latest News", body: "" },
};

const ANN_STYLES = {
  info:    { bg: "var(--teal-muted)",  border: "var(--teal-light)", color: "var(--teal-dark)" },
  gold:    { bg: "#FFF3D0",            border: "#E8C96A",           color: "#7A5C00" },
  success: { bg: "#E8F4E8",            border: "#9AC49A",           color: "#2D5A2D" },
  warning: { bg: "#FDF0E8",            border: "#E8B894",           color: "#7A4020" },
};

/* Thin ornamental rule used between sections — soft sand tone, gold reserved for the tiny diamond accent */
function GoldRule() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "4px 0" }}>
      <div style={{ flex: 1, maxWidth: 120, height: 1, background: "linear-gradient(to right, transparent, var(--sand-border))" }} />
      <div style={{ width: 6, height: 6, background: "var(--gold)", transform: "rotate(45deg)", flexShrink: 0 }} />
      <div style={{ flex: 1, maxWidth: 120, height: 1, background: "linear-gradient(to left, transparent, var(--sand-border))" }} />
    </div>
  );
}

export default async function Home() {
  const [total, forSale, stallions, mares, contentRow] = await Promise.all([
    prisma.horse.count({ where: OWNED }),
    prisma.horse.count({ where: { ownership: "For Sale", name: { startsWith: "[REC]" } } }),
    prisma.horse.count({ where: { ...OWNED, gender: "Stallion" } }),
    prisma.horse.count({ where: { ...OWNED, gender: "Mare" } }),
    prisma.siteContent.findUnique({ where: { key: "homepage" } }),
  ]);

  let cms: HomepageData = DEFAULTS;
  if (contentRow?.value) {
    try {
      const p = JSON.parse(contentRow.value) as Partial<HomepageData>;
      cms = {
        announcement: { ...DEFAULTS.announcement, ...p.announcement },
        hero: { ...DEFAULTS.hero, ...p.hero, cta1: { ...DEFAULTS.hero.cta1, ...p.hero?.cta1 }, cta2: { ...DEFAULTS.hero.cta2, ...p.hero?.cta2 } },
        cards: p.cards?.length === 3 ? p.cards : DEFAULTS.cards,
        newsBlock: { ...DEFAULTS.newsBlock, ...p.newsBlock },
      };
    } catch { /* keep defaults */ }
  }

  const ann = ANN_STYLES[cms.announcement.style] ?? ANN_STYLES.info;

  return (
    <div>

      {/* ── Announcement banner ── */}
      {cms.announcement.text && (
        <div style={{ background: ann.bg, borderBottom: `1px solid ${ann.border}`, padding: "11px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: ann.color, margin: 0, letterSpacing: "0.02em" }}>
            {cms.announcement.text}
          </p>
        </div>
      )}

      {/* ── Hero ── */}
      <section style={{
        background: "linear-gradient(180deg, var(--cream) 0%, var(--cream-dark) 100%)",
        borderBottom: "1px solid var(--border)",
        paddingTop: 64, paddingBottom: 72, paddingLeft: 24, paddingRight: 24,
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>

          {/* Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-full.png"
            alt="Redfield Equestrian Centre"
            style={{ width: "100%", maxWidth: 320, margin: "0 auto 20px", display: "block" }}
          />

          {/* Wordmark line */}
          <p style={{
            fontFamily: "var(--font-lato)", fontSize: 11, letterSpacing: "0.28em",
            textTransform: "uppercase", color: "var(--teal)", margin: "0 0 18px",
          }}>
            The Rift &nbsp;·&nbsp; ReDM
          </p>

          <GoldRule />

          {/* Main heading */}
          <h1 style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 400, lineHeight: 1.2,
            color: "var(--teal-dark)",
            margin: "28px 0 18px",
          }}>
            {cms.hero.title}
          </h1>

          {/* Subtitle */}
          <p style={{
            color: "var(--text-muted)", fontSize: 16, lineHeight: 1.75,
            maxWidth: 520, margin: "0 auto 36px",
            fontFamily: "var(--font-lato)", fontWeight: 400,
          }}>
            {cms.hero.subtitle}
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            {cms.hero.cta1.label && (
              <Link href={cms.hero.cta1.href} style={{
                background: "var(--sand-bg)", border: "1.5px solid var(--sand-border)", color: "var(--teal-dark)",
                padding: "13px 32px", borderRadius: 3,
                fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 13,
                letterSpacing: "0.12em", textDecoration: "none", textTransform: "uppercase",
              }}>
                {cms.hero.cta1.label}
              </Link>
            )}
            {cms.hero.cta2.label && (
              <Link href={cms.hero.cta2.href} style={{
                border: "1.5px solid var(--sage-border)", color: "var(--teal-dark)",
                padding: "13px 32px", borderRadius: 3,
                fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 13,
                letterSpacing: "0.12em", textDecoration: "none", textTransform: "uppercase",
                background: "transparent",
              }}>
                {cms.hero.cta2.label}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats ribbon ── */}
      <section style={{ background: "var(--white)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[
            { label: "Registered Horses", value: total, bg: "var(--teal-muted)" },
            { label: "For Sale", value: forSale, bg: "var(--sand-bg)" },
            { label: "Stallions", value: stallions, bg: "var(--sire-bg)" },
            { label: "Mares", value: mares, bg: "var(--dam-bg)" },
          ].map((s, i) => (
            <div key={s.label} style={{
              textAlign: "center", padding: "28px 16px",
              borderLeft: i > 0 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 64, height: 64, borderRadius: "50%", background: s.bg, marginBottom: 10,
              }}>
                <span style={{
                  fontFamily: "var(--font-playfair)", fontSize: 26, fontWeight: 700,
                  color: "var(--teal-dark)", lineHeight: 1,
                }}>
                  {s.value}
                </span>
              </div>
              <div style={{
                fontSize: 11, letterSpacing: "0.14em", color: "var(--text-muted)",
                fontFamily: "var(--font-lato)", textTransform: "uppercase", marginTop: 6,
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── News block ── */}
      {cms.newsBlock.enabled && cms.newsBlock.body && (
        <section style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", padding: "64px 24px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            {cms.newsBlock.heading && (
              <>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--sand-text)", marginBottom: 10 }}>
                  {cms.newsBlock.heading}
                </p>
                <GoldRule />
                <div style={{ marginBottom: 24 }} />
              </>
            )}
            <div style={{ fontSize: 15, fontFamily: "var(--font-lato)", color: "var(--text)", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
              {cms.newsBlock.body}
            </div>
          </div>
        </section>
      )}

      {/* ── Feature cards ── */}
      <section style={{ background: "var(--cream)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>

          {/* Section heading */}
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--sand-text)", marginBottom: 10 }}>
              What we offer
            </p>
            <GoldRule />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 2 }}>
            {cms.cards.map((f, i) => {
              const accents = [
                { top: "var(--lilac-border)", num: "var(--lilac-text)", rule: "var(--lilac-text)" },
                { top: "var(--sand-border)", num: "var(--sand-text)", rule: "var(--sand-text)" },
                { top: "var(--sage-border)", num: "var(--sage-text)", rule: "var(--sage-text)" },
              ];
              const accent = accents[i % accents.length];
              return (
              <Link
                key={i}
                href={f.href}
                className="group"
                style={{
                  display: "flex", flexDirection: "column",
                  background: "var(--white)",
                  borderTop: `3px solid ${accent.top}`,
                  padding: "36px 32px 32px",
                  textDecoration: "none",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  position: "relative",
                }}
                onMouseEnter={undefined}
              >
                {/* Card number */}
                <span style={{
                  fontFamily: "var(--font-playfair)", fontSize: 13, fontWeight: 700,
                  color: accent.num, letterSpacing: "0.12em", marginBottom: 14,
                  display: "block",
                }}>
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h3 style={{
                  fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 400,
                  color: "var(--teal-dark)", lineHeight: 1.2, marginBottom: 16,
                }}>
                  {f.title}
                </h3>

                {/* thin accent rule */}
                <div style={{ width: 32, height: 2, background: accent.rule, marginBottom: 16 }} />

                <p style={{
                  fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)",
                  lineHeight: 1.65, flex: 1, marginBottom: 28,
                }}>
                  {f.desc}
                </p>

                <span style={{
                  fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--teal)",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  {f.cta}
                  <span style={{ fontSize: 14 }}>→</span>
                </span>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Footer accent ── */}
      <div style={{ background: "var(--cream-dark)", borderTop: "1px solid var(--border)", padding: "32px 24px", textAlign: "center" }}>
        <GoldRule />
        <p style={{ fontFamily: "var(--font-lato)", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 20 }}>
          Redfield Equestrian Centre &nbsp;·&nbsp; The Rift, ReDM
        </p>
      </div>

    </div>
  );
}
