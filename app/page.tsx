import Link from "next/link";
import { prisma } from "@/lib/db";
import Icon from "@/components/Icon";
import { Layers } from "lucide-react";

// Public counts: owned, [REC]-tagged horses (matches the public registry).
const OWNED = {
  AND: [
    { OR: [{ ownership: { notIn: ["Outside", "Void", "Expected"] } }, { ownership: null }] },
    { name: { startsWith: "[REC]" } },
  ],
};

export default async function Home() {
  const [total, forSale, stallions, mares] = await Promise.all([
    prisma.horse.count({ where: OWNED }),
    prisma.horse.count({ where: { ownership: "For Sale", name: { startsWith: "[REC]" } } }),
    prisma.horse.count({ where: { ...OWNED, gender: "Stallion" } }),
    prisma.horse.count({ where: { ...OWNED, gender: "Mare" } }),
  ]);

  return (
    <div>
      {/* Hero — brand logo forward */}
      <section style={{ background: "var(--cream)" }} className="pt-12 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-full.png" alt="Redfield Equestrian Centre"
            style={{ width: "100%", maxWidth: 380, margin: "0 auto 24px", display: "block" }} />
          <h1 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 38, fontWeight: 400, lineHeight: 1.2, marginBottom: 16, color: "var(--teal-dark)" }}>
            Horse Registry &amp; Pedigree Records
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 17, maxWidth: 560, margin: "0 auto 32px", fontFamily: "var(--font-lato)", fontWeight: 400 }}>
            Browse our full registry, explore bloodlines through interactive pedigree trees,
            and find horses available for purchase.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/registry" style={{ background: "var(--teal)", color: "var(--white)", padding: "12px 28px", borderRadius: 4, fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 14, letterSpacing: "0.08em", textDecoration: "none" }}>
              VIEW REGISTRY
            </Link>
            <Link href="/for-sale" style={{ border: "2px solid var(--teal)", color: "var(--teal-dark)", padding: "12px 28px", borderRadius: 4, fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 14, letterSpacing: "0.08em", textDecoration: "none" }}>
              HORSES FOR SALE
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "var(--cream-dark)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Registered Horses", value: total },
            { label: "For Sale", value: forSale },
            { label: "Stallions", value: stallions },
            { label: "Mares", value: mares },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: 36, color: "var(--teal)", fontWeight: 700 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, letterSpacing: "0.1em", color: "var(--text-muted)", fontFamily: "var(--font-lato)", textTransform: "uppercase" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              kind: "icon" as const,
              icon: "registry" as const,
              title: "Full Registry",
              desc: "Search and filter all registered horses by breed, gender, ownership status, and coat.",
              href: "/registry",
              cta: "Browse Registry",
            },
            {
              // Middle card: gateway to the public interactive utilities.
              kind: "lucide" as const,
              title: "Interactive Resources",
              desc: "Access our suite of player utilities. Design custom layouts with the Course Planner, simulate breeding outcomes with the Foal Calculator, or run live tournaments with the Show Scoreboard.",
              href: "/resources",
              cta: "Explore Resources",
            },
            {
              kind: "icon" as const,
              icon: "tag" as const,
              title: "For Sale",
              desc: "Browse horses currently available for purchase from Redfield Equestrian Centre.",
              href: "/for-sale",
              cta: "View Listings",
            },
          ].map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group flex flex-col rounded-2xl border bg-white p-8 no-underline transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(94,128,128,0.12)]"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="mb-4 inline-flex items-center justify-center rounded-xl"
                style={{ width: 56, height: 56, background: "var(--teal-muted)", border: "1px solid var(--teal-light)" }}
              >
                {f.kind === "lucide" ? (
                  <Layers size={28} strokeWidth={1.6} color="var(--teal-dark)" />
                ) : (
                  <Icon name={f.icon} size={28} color="var(--teal-dark)" />
                )}
              </div>
              <h3
                className="mb-2"
                style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", lineHeight: 1.2 }}
              >
                {f.title}
              </h3>
              <p
                className="mb-6 flex-1"
                style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55 }}
              >
                {f.desc}
              </p>
              <span
                className="inline-flex items-center gap-1.5 self-start text-sm font-semibold transition-colors group-hover:text-[var(--teal-dark)]"
                style={{ fontFamily: "var(--font-lato)", color: "var(--teal)" }}
              >
                {f.cta}
                <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
