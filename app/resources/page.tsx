import type { Metadata } from "next";
import Link from "next/link";
import { Dna, Grid3x3, Trophy, BookOpen, ArrowRight, type LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Resources · Redfield Equestrian Centre",
  description:
    "Public utilities for The Rift equestrian community — foal genetics, course design, and live show scoreboards.",
};

interface ResourceCard {
  href: string;
  title: string;
  description: string;
  cta: string;
  Icon: LucideIcon;
  tone: { bg: string; border: string; text: string };
}

const TEAL_TONE = { bg: "var(--teal-muted)", border: "var(--teal-light)", text: "var(--teal-dark)" };
const SAND_TONE = { bg: "var(--sand-bg)", border: "var(--sand-border)", text: "var(--sand-text)" };
const SAGE_TONE = { bg: "var(--sage-bg)", border: "var(--sage-border)", text: "var(--sage-text)" };
const LILAC_TONE = { bg: "var(--lilac-bg)", border: "var(--lilac-border)", text: "var(--lilac-text)" };

const CARDS: ResourceCard[] = [
  {
    href: "/resources/foal-calculator",
    title: "Foal Calculator",
    description:
      "Simulate genetic pairings client-side to instantly preview potential base colors, modifiers, and matching coat variants from the catalogue.",
    cta: "Open Calculator",
    Icon: Dna,
    tone: TEAL_TONE,
  },
  {
    href: "/resources/course-planner",
    title: "Course Planner",
    description:
      "Design 2D layouts for Show Jumping and Cross Country fields. Arrange resizable obstacles and calculate sequence-connected tracking lines.",
    cta: "Build a Course",
    Icon: Grid3x3,
    tone: SAND_TONE,
  },
  {
    href: "/resources/show-scoreboard",
    title: "Show Scoreboard",
    description:
      "Run live-updating equestrian show brackets. Toggle judge controller panels to calculate real-time times, faults, and export final result graphics.",
    cta: "Launch Scoreboard",
    Icon: Trophy,
    tone: SAGE_TONE,
  },
  {
    href: "/resources/sports-compendium",
    title: "Sports Compendium",
    description:
      "A reference guide to vocabulary, judging, and attire across English, Western, racing, and other equestrian sports.",
    cta: "Browse Compendium",
    Icon: BookOpen,
    tone: LILAC_TONE,
  },
];

export default function ResourcesIndexPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-10 text-center">
        <h1
          className="mb-3"
          style={{ fontFamily: "var(--font-playfair)", fontSize: 40, color: "var(--teal-dark)", letterSpacing: "0.01em" }}
        >
          Resources
        </h1>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CARDS.map((c) => (
          <ResourceCardTile key={c.href} card={c} />
        ))}
      </div>
    </main>
  );
}

function ResourceCardTile({ card }: { card: ResourceCard }) {
  const { Icon } = card;
  return (
    <Link
      href={card.href}
      className="group flex flex-col rounded-2xl border bg-white p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(94,128,128,0.12)] no-underline"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Icon tile */}
      <div
        className="mb-5 inline-flex items-center justify-center rounded-xl"
        style={{
          width: 56,
          height: 56,
          background: card.tone.bg,
          border: `1px solid ${card.tone.border}`,
        }}
      >
        <Icon size={28} strokeWidth={1.6} color={card.tone.text} />
      </div>

      <h2
        className="mb-2"
        style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", lineHeight: 1.2 }}
      >
        {card.title}
      </h2>
      <p
        className="mb-6 flex-1"
        style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55 }}
      >
        {card.description}
      </p>

      <span
        className="inline-flex items-center gap-1.5 self-start text-sm font-semibold transition-colors group-hover:text-[var(--teal-dark)]"
        style={{ fontFamily: "var(--font-lato)", color: "var(--teal)" }}
      >
        {card.cta}
        <ArrowRight
          size={16}
          strokeWidth={2}
          className="transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden
        />
      </span>
    </Link>
  );
}
