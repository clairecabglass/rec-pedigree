import { isAdminLoggedIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminHorsesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");
  const { q } = await searchParams;

  const horses = await prisma.horse.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : {},
    orderBy: { name: "asc" },
    take: 60,
    select: { id: true, name: true, breed: true, gender: true, ownership: true, updatedAt: true },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)", display: "block", marginBottom: 8 }}>← Back</Link>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 28, color: "var(--teal-dark)" }}>Edit Registry</h1>
        </div>
        <Link href="/admin/horses/new" style={{ background: "var(--teal)", color: "var(--white)", borderRadius: 6, padding: "10px 20px", textDecoration: "none", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-lato)" }}>
          + Add Horse
        </Link>
      </div>

      <form style={{ marginBottom: 20 }}>
        <input name="q" defaultValue={q} placeholder="Search by name…" style={{ border: "1px solid var(--border)", borderRadius: 6, padding: "9px 14px", fontSize: 13, fontFamily: "var(--font-lato)", width: 320, outline: "none" }} />
        <button type="submit" style={{ marginLeft: 8, padding: "9px 16px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--white)", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-lato)" }}>Search</button>
      </form>

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-lato)" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)", background: "var(--cream)" }}>
              {["Name", "Breed", "Gender", "Status", "Updated", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horses.map((h, i) => (
              <tr key={h.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--white)" : "var(--cream)" }}>
                <td style={{ padding: "9px 14px", fontWeight: 600, color: "var(--teal-dark)" }}>{h.name}</td>
                <td style={{ padding: "9px 14px", color: "var(--text-muted)" }}>{h.breed ?? "—"}</td>
                <td style={{ padding: "9px 14px", color: "var(--text-muted)" }}>{h.gender ?? "—"}</td>
                <td style={{ padding: "9px 14px" }}>{h.ownership ?? "—"}</td>
                <td style={{ padding: "9px 14px", color: "var(--text-muted)" }}>{h.updatedAt.toLocaleDateString()}</td>
                <td style={{ padding: "9px 14px" }}>
                  <Link href={`/admin/horses/${h.id}`} style={{ color: "var(--teal)", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>Edit</Link>
                </td>
              </tr>
            ))}
            {horses.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No horses found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {!q && <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>Showing first 60. Search to find specific horses.</p>}
    </div>
  );
}
