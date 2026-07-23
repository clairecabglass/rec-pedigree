"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import Icon from "@/components/Icon";
import ThemePicker from "@/components/ThemePicker";

interface Recent {
  id: string; name: string; breed: string | null; gender: string | null;
  ownership: string | null; updatedAt: string;
}

interface Todo { id: string; text: string; done: boolean; }

export default function AdminDashboard({ stats, recent, initialTodos }: {
  stats: { total: number; forSale: number; withFoal: number; pregnant: number };
  recent: Recent[];
  initialTodos: Todo[];
}) {
  const router = useRouter();

  /* ---- To-do list (persisted as JSON via /api/admin/todos) ---- */
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [todoInput, setTodoInput] = useState("");
  const firstTodoRender = useRef(true);
  useEffect(() => {
    if (firstTodoRender.current) { firstTodoRender.current = false; return; }
    const t = setTimeout(() => {
      fetch("/api/admin/todos", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: todos }),
      });
    }, 400);
    return () => clearTimeout(t);
  }, [todos]);

  function addTodo() {
    const text = todoInput.trim();
    if (!text) return;
    setTodos((t) => [...t, { id: Math.random().toString(36).slice(2), text, done: false }]);
    setTodoInput("");
  }
  function toggleTodo(id: string) { setTodos((t) => t.map((x) => x.id === id ? { ...x, done: !x.done } : x)); }
  function removeTodo(id: string) { setTodos((t) => t.filter((x) => x.id !== id)); }

  /* ---- Bulk-select state ---- */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const selectedCount = selectedIds.size;
  const allChecked = recent.length > 0 && selectedCount === recent.length;

  const allIds = useMemo(() => recent.map((h) => h.id), [recent]);

  function toggleOne(id: string) {
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelectedIds((s) => (s.size === recent.length ? new Set() : new Set(allIds)));
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }
  async function bulkDelete() {
    setBulkBusy(true);
    const res = await fetch("/api/horses/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selectedIds] }),
    });
    setBulkBusy(false);
    setConfirmOpen(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Bulk delete failed.");
      return;
    }
    clearSelection();
    router.refresh();
  }

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Horses", value: stats.total },
          { label: "Pregnant", value: stats.pregnant },
          { label: "For Sale", value: stats.forSale },
          { label: "With Foal", value: stats.withFoal },
        ].map((s) => (
          <div key={s.label} style={{ ...cardStyle, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 32, color: "var(--teal)", fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)", fontFamily: "var(--font-lato)", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Theme picker */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <ThemePicker />
      </div>

      {/* To-do list + backup */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div style={{ ...cardStyle, gridColumn: "span 2" }}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)", marginBottom: 12 }}>To-Do</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addTodo(); }}
              placeholder="Add a task and press Enter…"
              style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px", fontSize: 13, fontFamily: "var(--font-lato)", background: "var(--white)", color: "var(--text)" }}
            />
            <button onClick={addTodo} style={{ background: "var(--teal)", color: "white", border: "none", borderRadius: 6, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-lato)" }}>Add</button>
          </div>
          {todos.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>Nothing on the list — add a task above.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {todos.map((t) => (
                <li key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 6, background: "var(--cream)", border: "1px solid var(--border)" }}>
                  <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} style={{ width: 15, height: 15, accentColor: "var(--teal)", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontFamily: "var(--font-lato)", color: t.done ? "var(--text-muted)" : "var(--text)", textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
                  <button onClick={() => removeTodo(t.id)} aria-label="Delete task" style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 2 }}>×</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)", marginBottom: 6 }}>Backup My Stable</h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginBottom: 14 }}>
            Download a full copy of your registry.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <a href="/api/admin/export?format=json" download
              style={{ textAlign: "center", background: "var(--teal)", color: "white", borderRadius: 6, padding: "9px 14px", fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "var(--font-lato)" }}>
              ↓ Download JSON
            </a>
            <a href="/api/admin/export?format=csv" download
              style={{ textAlign: "center", background: "var(--white)", color: "var(--teal-dark)", border: "1px solid var(--teal)", borderRadius: 6, padding: "9px 14px", fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: "var(--font-lato)" }}>
              ↓ Download CSV
            </a>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { href: "/admin/homepage", icon: "edit" as const, label: "Edit Homepage", desc: "Announcement banner, hero text, CTAs, news block, feature cards" },
          { href: "/admin/activity", icon: "registry" as const, label: "Activity Log", desc: "Recent changes, pregnancies, results, and timeline events" },
          { href: "/admin/my-stable", icon: "registry" as const, label: "My Stable", desc: "Owned horses + character assignment (Athena / Lucille)" },
          { href: "/admin/breeding", icon: "tree" as const, label: "Breeding", desc: "Pregnancies with auto-growth tracker, plan pairings" },
          { href: "/admin/breeding/calendar", icon: "tree" as const, label: "Nursery", desc: "Growing foals, recent adults & due calendar" },
          { href: "/admin/recommended-sales", icon: "edit" as const, label: "Recommended Sales", desc: "Horses with too few clean breeding partners left" },
          { href: "/admin/players", icon: "registry" as const, label: "Players", desc: "Player directory — IGN, username, stable info for auto-filling documents" },
          { href: "/admin/diary", icon: "edit" as const, label: "Diary & Services", desc: "Notes + favourite player services ledger" },
          { href: "/admin/spooner-builds", icon: "photo" as const, label: "Spooner Builds", desc: "Arena marker presets — photos, notes, and spawn-data .txt files" },
          { href: "/admin/horses/new", icon: "plus" as const, label: "Add Horse", desc: "Register a new horse manually" },
          { href: "/admin/pedigree-import", icon: "image" as const, label: "Import Pedigree Image", desc: "Upload image and OCR pedigree" },
          { href: "/admin/import", icon: "upload" as const, label: "Import Excel", desc: "Upload your .xlsx to sync the registry" },
          { href: "/admin/horses", icon: "edit" as const, label: "Edit Registry", desc: "Find and edit existing horse records" },
        ].map((a, i) => {
          const tones = [
            { bg: "var(--teal-muted)", text: "var(--teal-dark)" },
            { bg: "var(--sand-bg)", text: "var(--sand-text)" },
            { bg: "var(--sage-bg)", text: "var(--sage-text)" },
            { bg: "var(--lilac-bg)", text: "var(--lilac-text)" },
            { bg: "var(--dam-bg)", text: "var(--dam-text)" },
          ];
          const tone = tones[i % tones.length];
          return (
          <Link key={a.href} href={a.href} style={{ ...cardStyle, textDecoration: "none", display: "block", transition: "border-color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--teal-light)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <div style={{ width: 44, height: 44, borderRadius: 9, background: tone.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Icon name={a.icon} size={22} color={tone.text} />
            </div>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 17, color: "var(--teal-dark)", marginBottom: 4 }}>{a.label}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{a.desc}</div>
          </Link>
          );
        })}
      </div>

      {/* Recent */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)", marginBottom: 12 }}>Recently Updated</h2>

        {/* Bulk-action slot — fixed-height to prevent table jump when the
            contextual bar slides in / out (Task 3 layout-lock pattern). */}
        <div className="min-h-[52px] mb-2 flex items-center" aria-hidden={selectedCount === 0}>
          {selectedCount > 0 && (
            <div
              className="flex w-full items-center gap-3 rounded-md px-3 py-2"
              style={{ background: "var(--teal-muted)", border: "1px solid var(--teal-light)" }}
            >
              <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--teal-dark)", fontWeight: 700 }}>
                {selectedCount} selected
              </span>
              <button
                type="button"
                onClick={clearSelection}
                disabled={bulkBusy}
                style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-lato)", textDecoration: "underline" }}
              >
                Clear
              </button>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={bulkBusy}
                  style={{ background: "#C05050", color: "white", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: bulkBusy ? "wait" : "pointer", fontFamily: "var(--font-lato)" }}
                >
                  Bulk Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-lato)" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              <th style={{ padding: "8px 12px", textAlign: "left", width: 28 }}>
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = selectedCount > 0 && !allChecked; }}
                  onChange={toggleAll}
                />
              </th>
              {["Name", "Breed", "Gender", "Status", "Updated", ""].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((h) => {
              const checked = selectedIds.has(h.id);
              return (
                <tr key={h.id} style={{ borderBottom: "1px solid var(--border)", background: checked ? "var(--cream)" : undefined }}>
                  <td style={{ padding: "8px 12px" }}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${h.name}`}
                      checked={checked}
                      onChange={() => toggleOne(h.id)}
                    />
                  </td>
                  <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--teal-dark)" }}>{h.name}</td>
                  <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{h.breed ?? "—"}</td>
                  <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{h.gender ?? "—"}</td>
                  <td style={{ padding: "8px 12px" }}>{h.ownership ?? "—"}</td>
                  <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{new Date(h.updatedAt).toLocaleDateString("en-GB")}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <Link href={`/admin/horses/${h.id}`} style={{ color: "var(--teal)", fontSize: 12, textDecoration: "none" }}>Edit</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk confirm modal */}
      {confirmOpen && (
        <div
          onClick={() => !bulkBusy && setConfirmOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,28,27,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          role="dialog"
          aria-modal="true"
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--white)", borderRadius: 12, padding: 28, maxWidth: 460, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 8 }}>Delete {selectedCount} horse{selectedCount !== 1 ? "s" : ""}?</h2>
            <p style={{ fontSize: 13, color: "var(--text)", fontFamily: "var(--font-lato)", lineHeight: 1.55, marginBottom: 18 }}>
              Are you absolutely certain you want to permanently delete the selected horse{selectedCount !== 1 ? "s" : ""} from the database? This action is irreversible.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setConfirmOpen(false)} disabled={bulkBusy}
                style={{ background: "var(--white)", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "8px 16px", borderRadius: 6, fontSize: 13, cursor: bulkBusy ? "not-allowed" : "pointer", fontFamily: "var(--font-lato)" }}>
                Cancel
              </button>
              <button type="button" onClick={bulkDelete} disabled={bulkBusy}
                style={{ background: "#C05050", color: "white", border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: bulkBusy ? "wait" : "pointer", opacity: bulkBusy ? 0.7 : 1, fontFamily: "var(--font-lato)" }}>
                {bulkBusy ? "Deleting…" : "Yes, delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
