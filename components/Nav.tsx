"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Flat top-level links. The "Resources" dropdown is rendered separately
// because it needs hover state for the submenu.
const flatLinks = [
  { href: "/", label: "Home" },
  { href: "/registry", label: "Registry" },
  { href: "/for-sale", label: "For Sale" },
];

const RESOURCES_LINKS = [
  { href: "/resources/foal-calculator", label: "Foal Genetics" },
  { href: "/resources/course-planner", label: "Course Planner" },
  { href: "/resources/show-scoreboard", label: "Show Scoreboard" },
];

export default function Nav() {
  const path = usePathname();
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const isActive = (href: string) =>
    path === href || (href !== "/" && path.startsWith(href));

  const linkStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 14,
    letterSpacing: "0.05em",
    fontFamily: "var(--font-lato)",
    color: active ? "var(--teal-dark)" : "var(--text-muted)",
    borderBottom: active ? "2px solid var(--teal)" : "2px solid transparent",
    paddingBottom: 2,
    textDecoration: "none",
    transition: "color 0.15s",
  });

  const resourcesActive = RESOURCES_LINKS.some((r) => isActive(r.href));

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
          {flatLinks.map((l) => (
            <Link key={l.href} href={l.href} style={linkStyle(isActive(l.href))}>
              {l.label}
            </Link>
          ))}

          {/* Resources — hover dropdown */}
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setResourcesOpen(true)}
            onMouseLeave={() => setResourcesOpen(false)}
          >
            <button
              type="button"
              onClick={() => setResourcesOpen((o) => !o)}
              onFocus={() => setResourcesOpen(true)}
              style={{
                ...linkStyle(resourcesActive),
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: 0,
                paddingBottom: 2,
              }}
              aria-haspopup="true"
              aria-expanded={resourcesOpen}
            >
              Resources
              <span style={{ fontSize: 9, lineHeight: 1, transform: resourcesOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▼</span>
            </button>

            {/* Hover bridge — invisible strip so the menu doesn't close while
                the cursor crosses the gap between trigger and panel. */}
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, height: 10 }} />

            {resourcesOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  minWidth: 200,
                  background: "var(--white)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                  padding: 6,
                  zIndex: 50,
                }}
                role="menu"
              >
                {RESOURCES_LINKS.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    role="menuitem"
                    onClick={() => setResourcesOpen(false)}
                    style={{
                      display: "block",
                      padding: "9px 12px",
                      borderRadius: 6,
                      fontSize: 13,
                      fontFamily: "var(--font-lato)",
                      color: isActive(r.href) ? "var(--teal-dark)" : "var(--text)",
                      background: isActive(r.href) ? "var(--teal-muted)" : "transparent",
                      textDecoration: "none",
                      fontWeight: isActive(r.href) ? 700 : 500,
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(r.href)) e.currentTarget.style.background = "var(--cream)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(r.href)) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
