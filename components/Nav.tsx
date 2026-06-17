"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

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

const BREEDING_LINKS = [
  { href: "/breeding", label: "Policies" },
  { href: "/breeding/studs", label: "Studs" },
  { href: "/breeding/broodmares", label: "Broodmares" },
];

export default function Nav() {
  const path = usePathname();
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [breedingOpen, setBreedingOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileBreedingOpen, setMobileBreedingOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [path]);

  // Prevent body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    path === href || (href !== "/" && path.startsWith(href));

  const linkStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 14, lineHeight: 1, letterSpacing: "0.05em",
    fontFamily: "var(--font-lato)",
    color: active ? "var(--teal-dark)" : "var(--text-muted)",
    borderBottom: active ? "2px solid var(--teal)" : "2px solid transparent",
    paddingBottom: 2, textDecoration: "none", whiteSpace: "nowrap",
    transition: "color 0.1s",
  });

  const dropdownBtnStyle = (active: boolean): React.CSSProperties => ({
    background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none",
    borderBottom: active ? "2px solid var(--teal)" : "2px solid transparent",
    padding: "0 0 2px", margin: 0, fontSize: 14, lineHeight: 1,
    letterSpacing: "0.05em", fontFamily: "var(--font-lato)",
    color: active ? "var(--teal-dark)" : "var(--text-muted)",
    whiteSpace: "nowrap", cursor: "pointer", transition: "color 0.1s",
    display: "inline-flex", alignItems: "center", gap: 4,
  });

  const dropdownPanelStyle: React.CSSProperties = {
    position: "absolute", top: "calc(100% + 10px)", right: 0, minWidth: 200,
    background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.10)", padding: 6, zIndex: 50,
  };

  const dropdownItemStyle = (active: boolean): React.CSSProperties => ({
    display: "block", padding: "9px 12px", borderRadius: 6, fontSize: 13,
    fontFamily: "var(--font-lato)", textDecoration: "none",
    color: active ? "var(--teal-dark)" : "var(--text)",
    background: active ? "var(--teal-muted)" : "transparent",
    fontWeight: active ? 700 : 500,
  });

  const resourcesActive = RESOURCES_LINKS.some((r) => isActive(r.href));
  const breedingActive = path === "/breeding" || path.startsWith("/breeding/");

  /* ---- Mobile accordion row ---- */
  function MobileLink({ href, label }: { href: string; label: string }) {
    const active = isActive(href);
    return (
      <Link href={href} style={{
        display: "block", padding: "14px 24px", fontSize: 16,
        fontFamily: "var(--font-lato)", textDecoration: "none",
        color: active ? "var(--teal-dark)" : "var(--text)",
        fontWeight: active ? 700 : 400,
        borderLeft: active ? "3px solid var(--teal)" : "3px solid transparent",
        background: active ? "var(--teal-muted)" : "transparent",
      }}>
        {label}
      </Link>
    );
  }

  function MobileGroup({ label, links, open, onToggle, active }: {
    label: string; links: { href: string; label: string }[];
    open: boolean; onToggle: () => void; active: boolean;
  }) {
    return (
      <div>
        <button type="button" onClick={onToggle} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 24px", background: "none", border: "none", cursor: "pointer",
          fontSize: 16, fontFamily: "var(--font-lato)", textAlign: "left",
          color: active ? "var(--teal-dark)" : "var(--text)",
          fontWeight: active ? 700 : 400,
          borderLeft: active ? "3px solid var(--teal)" : "3px solid transparent",
        }}>
          {label}
          <ChevronDown size={18} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", color: "var(--text-muted)" }} />
        </button>
        {open && (
          <div style={{ background: "var(--cream)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            {links.map((l) => (
              <Link key={l.href} href={l.href} style={{
                display: "block", padding: "12px 36px", fontSize: 15,
                fontFamily: "var(--font-lato)", textDecoration: "none",
                color: isActive(l.href) ? "var(--teal-dark)" : "var(--text-muted)",
                fontWeight: isActive(l.href) ? 700 : 400,
              }}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <header style={{ background: "var(--white)", borderBottom: "1px solid var(--border)", position: "relative", zIndex: 40 }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
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

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-x-6 leading-none">
          {flatLinks.map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex items-center leading-none" style={linkStyle(isActive(l.href))}>
              {l.label}
            </Link>
          ))}

          {/* Breeding dropdown */}
          <div className="relative inline-flex items-center"
            onMouseEnter={() => setBreedingOpen(true)}
            onMouseLeave={() => setBreedingOpen(false)}
          >
            <button type="button" onClick={() => setBreedingOpen((o) => !o)} onFocus={() => setBreedingOpen(true)}
              style={dropdownBtnStyle(breedingActive)} aria-haspopup="true" aria-expanded={breedingOpen}>
              <span className="leading-none">Breeding</span>
              <ChevronDown size={14} aria-hidden style={{ transform: breedingOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, height: 10 }} />
            {breedingOpen && (
              <div style={dropdownPanelStyle} role="menu">
                {BREEDING_LINKS.map((r) => (
                  <Link key={r.href} href={r.href} role="menuitem" onClick={() => setBreedingOpen(false)}
                    style={dropdownItemStyle(isActive(r.href))}
                    onMouseEnter={(e) => { if (!isActive(r.href)) e.currentTarget.style.background = "var(--cream)"; }}
                    onMouseLeave={(e) => { if (!isActive(r.href)) e.currentTarget.style.background = "transparent"; }}>
                    {r.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Resources dropdown */}
          <div className="relative inline-flex items-center"
            onMouseEnter={() => setResourcesOpen(true)}
            onMouseLeave={() => setResourcesOpen(false)}
          >
            <button type="button" onClick={() => setResourcesOpen((o) => !o)} onFocus={() => setResourcesOpen(true)}
              style={dropdownBtnStyle(resourcesActive)} aria-haspopup="true" aria-expanded={resourcesOpen}>
              <span className="leading-none">Resources</span>
              <ChevronDown size={14} aria-hidden style={{ transform: resourcesOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, height: 10 }} />
            {resourcesOpen && (
              <div style={dropdownPanelStyle} role="menu">
                {RESOURCES_LINKS.map((r) => (
                  <Link key={r.href} href={r.href} role="menuitem" onClick={() => setResourcesOpen(false)}
                    style={dropdownItemStyle(isActive(r.href))}
                    onMouseEnter={(e) => { if (!isActive(r.href)) e.currentTarget.style.background = "var(--cream)"; }}
                    onMouseLeave={(e) => { if (!isActive(r.href)) e.currentTarget.style.background = "transparent"; }}>
                    {r.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Theme toggle — desktop only (mobile gets it in the drawer) */}
        <div className="hidden md:block">
          <ThemeToggle />
        </div>

        {/* Hamburger — mobile only */}
        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: "var(--teal-dark)" }}
        >
          {mobileOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{
          position: "fixed", top: 81, left: 0, right: 0, bottom: 0,
          background: "var(--white)", zIndex: 39,
          overflowY: "auto", borderTop: "1px solid var(--border)",
        }}>
          {/* Theme toggle row */}
          <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)" }}>Appearance</span>
            <ThemeToggle />
          </div>
          {flatLinks.map((l) => <MobileLink key={l.href} href={l.href} label={l.label} />)}
          <MobileGroup label="Breeding" links={BREEDING_LINKS} active={breedingActive}
            open={mobileBreedingOpen} onToggle={() => setMobileBreedingOpen((o) => !o)} />
          <MobileGroup label="Resources" links={RESOURCES_LINKS} active={resourcesActive}
            open={mobileResourcesOpen} onToggle={() => setMobileResourcesOpen((o) => !o)} />
        </div>
      )}
    </header>
  );
}
