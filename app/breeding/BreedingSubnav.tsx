import Link from "next/link";

const TABS = [
  { href: "/breeding", label: "Policies" },
  { href: "/breeding/studs", label: "Studs" },
  { href: "/breeding/broodmares", label: "Broodmares" },
];

export default function BreedingSubnav({ active }: { active: string }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
      {TABS.map((t) => {
        const isActive = t.href === active;
        return (
          <Link key={t.href} href={t.href} style={{
            padding: "7px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700,
            fontFamily: "var(--font-lato)", textDecoration: "none",
            background: isActive ? "var(--teal)" : "var(--white)",
            color: isActive ? "white" : "var(--teal-dark)",
            border: `1px solid ${isActive ? "var(--teal)" : "var(--border)"}`,
          }}>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
