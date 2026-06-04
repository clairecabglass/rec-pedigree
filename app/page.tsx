import Link from "next/link";
import { prisma } from "@/lib/db";
import Icon from "@/components/Icon";

// Horses we don't currently own are kept only for record-keeping.
// Explicitly include blank-ownership rows (SQL NOT IN drops NULLs otherwise).
const OWNED = {
  OR: [{ ownership: { notIn: ["Outside", "Void"] } }, { ownership: null }],
};

export default async function Home() {
  const [total, forSale, stallions, mares] = await Promise.all([
    prisma.horse.count({ where: OWNED }),
    prisma.horse.count({ where: { ownership: "For Sale" } }),
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
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "registry" as const,
              title: "Full Registry",
              desc: "Search and filter all registered horses by breed, gender, ownership status, and coat.",
              href: "/registry",
              cta: "Browse Registry",
            },
            {
              icon: "tree" as const,
              title: "Pedigree Trees",
              desc: "Interactive fan-tree pedigrees going as deep as your data allows. Inbreeding is highlighted automatically.",
              href: "/pedigree",
              cta: "Look Up Pedigree",
            },
            {
              icon: "tag" as const,
              title: "For Sale",
              desc: "Browse horses currently available for purchase from Redfield Equestrian Centre.",
              href: "/for-sale",
              cta: "View Listings",
            },
          ].map((f) => (
            <div key={f.title} style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 28 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--teal-muted)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Icon name={f.icon} size={24} color="var(--teal-dark)" />
              </div>
              <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20, fontFamily: "var(--font-lato)" }}>{f.desc}</p>
              <Link href={f.href} style={{ color: "var(--teal)", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textDecoration: "none", fontFamily: "var(--font-lato)" }}>
                {f.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
