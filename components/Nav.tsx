"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/registry", label: "Registry" },
  { href: "/pedigree", label: "Pedigree Lookup" },
  { href: "/for-sale", label: "For Sale" },
];

export default function Nav() {
  const path = usePathname();

  return (
    <header style={{ background: "var(--white)", borderBottom: "1px solid var(--border)" }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image src="/brand/logo-icon.png" alt="Redfield Equestrian Centre" width={52} height={52}
            style={{ width: 52, height: 52, objectFit: "contain" }} priority />
          <div>
            <div style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 18, fontWeight: 700, color: "var(--teal-dark)", letterSpacing: "0.08em" }}>
              REDFIELD
            </div>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--teal)", fontFamily: "var(--font-lato)", textTransform: "uppercase" }}>
              Equestrian Centre
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontSize: 14,
                letterSpacing: "0.05em",
                fontFamily: "var(--font-lato)",
                color: path === l.href || (l.href !== "/" && path.startsWith(l.href))
                  ? "var(--teal-dark)"
                  : "var(--text-muted)",
                borderBottom: path === l.href || (l.href !== "/" && path.startsWith(l.href))
                  ? "2px solid var(--teal)"
                  : "2px solid transparent",
                paddingBottom: 2,
                textDecoration: "none",
                transition: "color 0.15s",
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
