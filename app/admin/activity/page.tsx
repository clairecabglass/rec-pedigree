import { redirect } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Activity Log — Redfield Admin" };

type Entry = { time: Date; icon: string; text: string; href?: string };

export default async function ActivityPage() {
  if (!(await isAdminLoggedIn())) redirect("/admin/login");

  const [recentHorses, recentPregnancies, recentResults, recentEvents] = await Promise.all([
    prisma.horse.findMany({ orderBy: { updatedAt: "desc" }, take: 30, select: { id: true, name: true, breed: true, ownership: true, createdAt: true, updatedAt: true } }),
    prisma.pregnancy.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: { id: true, damId: true, sireName: true, status: true, createdAt: true, updatedAt: true } }),
    prisma.result.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: { id: true, horseId: true, event: true, placement: true, createdAt: true } }),
    prisma.horseEvent.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: { id: true, horseId: true, horse: { select: { name: true } }, title: true, type: true, createdAt: true } }),
  ]);

  // Resolve dam names for pregnancies
  const damIds = [...new Set(recentPregnancies.map(p => p.damId))];
  const dams = await prisma.horse.findMany({ where: { id: { in: damIds } }, select: { id: true, name: true } });
  const damMap = new Map(dams.map(d => [d.id, d.name]));

  // Resolve horse names for results
  const resultHorseIds = [...new Set(recentResults.map(r => r.horseId))];
  const resultHorses = await prisma.horse.findMany({ where: { id: { in: resultHorseIds } }, select: { id: true, name: true } });
  const resultHorseMap = new Map(resultHorses.map(h => [h.id, h]));

  const entries: Entry[] = [];

  for (const h of recentHorses) {
    const isNew = Math.abs(h.createdAt.getTime() - h.updatedAt.getTime()) < 5000;
    entries.push({
      time: h.updatedAt,
      icon: isNew ? "➕" : "✏️",
      text: isNew ? `Horse added: ${h.name}${h.breed ? ` (${h.breed})` : ""}` : `Horse updated: ${h.name}`,
      href: `/registry/${h.id}`,
    });
  }
  for (const p of recentPregnancies) {
    const damName = damMap.get(p.damId) ?? "Unknown";
    entries.push({
      time: p.createdAt,
      icon: "🤰",
      text: `Pregnancy recorded — ${damName}${p.sireName ? ` × ${p.sireName}` : ""}`,
    });
  }
  for (const r of recentResults) {
    const h = resultHorseMap.get(r.horseId);
    entries.push({
      time: r.createdAt,
      icon: "🏆",
      text: `Result logged: ${h?.name ?? "Unknown"} — ${r.event}${r.placement ? ` (${r.placement})` : ""}`,
      href: h ? `/registry/${h.id}` : undefined,
    });
  }
  for (const e of recentEvents) {
    entries.push({
      time: e.createdAt,
      icon: "📅",
      text: `Event added: ${e.horse.name} — ${e.title}`,
      href: `/registry/${e.horseId}`,
    });
  }

  entries.sort((a, b) => b.time.getTime() - a.time.getTime());
  const shown = entries.slice(0, 60);

  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none" }}>‹ Admin</Link>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 30, color: "var(--teal-dark)", margin: 0 }}>Activity Log</h1>
      </div>

      {shown.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>No activity yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {shown.map((e, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontFamily: "var(--font-lato)" }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{e.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {e.href ? (
                  <Link href={e.href} style={{ fontSize: 13, color: "var(--teal-dark)", textDecoration: "none", fontWeight: 600 }}>{e.text}</Link>
                ) : (
                  <span style={{ fontSize: 13, color: "var(--text)" }}>{e.text}</span>
                )}
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}>{fmt(e.time)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
