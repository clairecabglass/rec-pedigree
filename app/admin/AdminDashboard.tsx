"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";

interface Recent {
  id: string; name: string; breed: string | null; gender: string | null;
  ownership: string | null; updatedAt: string;
}

export default function AdminDashboard({ stats, recent }: {
  stats: { total: number; forSale: number; withFoal: number };
  recent: Recent[];
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  const cardStyle = { background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 24 };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal-dark)", marginBottom: 4 }}>Admin Panel</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-lato)" }}>Redfield Equestrian Centre — registry management</p>
        </div>
        <button onClick={logout} style={{ border: "1px solid var(--border)", background: "var(--white)", borderRadius: 4, padding: "8px 16px", cursor: "pointer", fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
          Sign Out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Horses", value: stats.total },
          { label: "For Sale", value: stats.forSale },
          { label: "With Foal", value: stats.withFoal },
        ].map((s) => (
          <div key={s.label} style={{ ...cardStyle, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal)", fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)", fontFamily: "var(--font-lato)", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { href: "/admin/breeding", icon: "tree" as const, label: "Breeding", desc: "Manage pregnancies, plan pairings, and explore genetics" },
          { href: "/admin/horses/new", icon: "plus" as const, label: "Add Horse", desc: "Register a new horse manually" },
          { href: "/admin/pedigree-import", icon: "image" as const, label: "Import Pedigree Image", desc: "Upload image and OCR pedigree" },
          { href: "/admin/import", icon: "upload" as const, label: "Import Excel", desc: "Upload your .xlsx to sync the registry" },
          { href: "/admin/horses", icon: "edit" as const, label: "Edit Registry", desc: "Find and edit existing horse records" },
        ].map((a) => (
          <Link key={a.href} href={a.href} style={{ ...cardStyle, textDecoration: "none", display: "block", transition: "border-color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--teal-light)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <div style={{ width: 44, height: 44, borderRadius: 9, background: "var(--teal-muted)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Icon name={a.icon} size={22} color="var(--teal-dark)" />
            </div>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 17, color: "var(--teal-dark)", marginBottom: 4 }}>{a.label}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{a.desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)", marginBottom: 16 }}>Recently Updated</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-lato)" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              {["Name", "Breed", "Gender", "Status", "Updated", ""].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((h) => (
              <tr key={h.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--teal-dark)" }}>{h.name}</td>
                <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{h.breed ?? "—"}</td>
                <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{h.gender ?? "—"}</td>
                <td style={{ padding: "8px 12px" }}>{h.ownership ?? "—"}</td>
                <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{new Date(h.updatedAt).toLocaleDateString()}</td>
                <td style={{ padding: "8px 12px" }}>
                  <Link href={`/admin/horses/${h.id}`} style={{ color: "var(--teal)", fontSize: 12, textDecoration: "none" }}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
