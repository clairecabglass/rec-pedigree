"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { parseHorseCoat } from "@/lib/horseCoat";

const CHARACTERS = ["Athena Redfield", "Lucille"] as const;
type Character = (typeof CHARACTERS)[number];

interface StableHorse {
  id: string;
  name: string;
  breed: string | null;
  gender: string | null;
  coat: string | null;
  assignedCharacter: string | null;
  updatedAt: string;
}

export default function MyStableClient({ horses }: { horses: StableHorse[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Character | "all">("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  /* ---- Selection / bulk ---- */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkChar, setBulkChar] = useState<Character>("Athena Redfield");
  const [bulkBusy, setBulkBusy] = useState(false);
  const selectedCount = selected.size;

  const visible = useMemo(
    () => filter === "all" ? horses : horses.filter((h) => h.assignedCharacter === filter),
    [horses, filter]
  );
  const visibleIds = useMemo(() => visible.map((h) => h.id), [visible]);
  const allChecked = visible.length > 0 && visible.every((h) => selected.has(h.id));

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((s) => {
      if (allChecked) {
        const next = new Set(s);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...s, ...visibleIds]);
    });
  }

  const counts = useMemo(() => {
    const out = { Athena: 0, Lucille: 0, Other: 0 };
    for (const h of horses) {
      if (h.assignedCharacter === "Athena Redfield") out.Athena++;
      else if (h.assignedCharacter === "Lucille") out.Lucille++;
      else out.Other++;
    }
    return out;
  }, [horses]);

  /* ---- Single-row character toggle ---- */
  async function setCharacter(id: string, next: Character) {
    setPendingId(id);
    const res = await fetch(`/api/horses/${id}/character`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedCharacter: next }),
    });
    setPendingId(null);
    if (!res.ok) {
      alert("Could not update character.");
      return;
    }
    router.refresh();
  }

  /* ---- Bulk character migration ---- */
  async function bulkMove() {
    if (!selectedCount) return;
    setBulkBusy(true);
    const res = await fetch("/api/horses/bulk-character", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], character: bulkChar }),
    });
    setBulkBusy(false);
    setBulkOpen(false);
    if (!res.ok) {
      alert("Bulk move failed.");
      return;
    }
    setSelected(new Set());
    router.refresh();
  }

  const cardStyle = { background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 };
  const totalLabel = filter === "all" ? `${horses.length} Home horse${horses.length !== 1 ? "s" : ""}` : `${visible.length} on ${filter}`;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin" className="text-xs uppercase tracking-[0.12em] text-[var(--teal)] no-underline" style={{ fontFamily: "var(--font-lato)" }}>← Admin</Link>
          <h1 className="mt-1" style={{ fontFamily: "var(--font-playfair)", fontSize: 30, color: "var(--teal-dark)" }}>My Stable</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{totalLabel}</p>
        </div>
      </div>

      {/* Character tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {([
          { id: "all", label: `All (${horses.length})` },
          { id: "Athena Redfield", label: `Athena Redfield (${counts.Athena})` },
          { id: "Lucille", label: `Lucille (${counts.Lucille})` },
        ] as const).map((t) => {
          const active = filter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as Character | "all")}
              style={{
                background: active ? "var(--teal)" : "var(--white)",
                color: active ? "white" : "var(--teal-dark)",
                border: `1px solid ${active ? "var(--teal)" : "var(--border)"}`,
                borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700,
                fontFamily: "var(--font-lato)", cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Bulk slot — reserved height so the table doesn't jump (Task 4 lock). */}
      <div className="min-h-[56px] mb-2 flex items-center" aria-hidden={selectedCount === 0}>
        {selectedCount > 0 && (
          <div
            className="flex w-full items-center gap-3 rounded-md px-3 py-2"
            style={{ background: "var(--teal-muted)", border: "1px solid var(--teal-light)" }}
          >
            <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--teal-dark)", fontWeight: 700 }}>
              {selectedCount} selected
            </span>
            <button onClick={() => setSelected(new Set())} style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-lato)", textDecoration: "underline" }}>
              Clear
            </button>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setBulkOpen(true)}
                disabled={bulkBusy}
                style={{ background: "var(--gold)", color: "var(--teal-dark)", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: bulkBusy ? "wait" : "pointer", fontFamily: "var(--font-lato)" }}
              >
                Bulk Move to Character
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Horse table */}
      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-lato)" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              <th style={{ padding: "8px 12px", textAlign: "left", width: 28 }}>
                <input
                  type="checkbox"
                  aria-label="Select all visible"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = selectedCount > 0 && !allChecked; }}
                  onChange={toggleAll}
                />
              </th>
              {["Name", "Breed", "Gender", "Coat", "Assigned to", "Updated"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>No horses match this filter.</td></tr>
            ) : visible.map((h) => {
              const isSel = selected.has(h.id);
              const isPending = pendingId === h.id;
              return (
                <tr key={h.id} style={{ borderBottom: "1px solid var(--border)", background: isSel ? "var(--cream)" : undefined }}>
                  <td style={{ padding: "8px 12px" }}>
                    <input type="checkbox" aria-label={`Select ${h.name}`} checked={isSel} onChange={() => toggleOne(h.id)} />
                  </td>
                  <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                    <Link href={`/registry/${h.id}`} style={{ color: "var(--teal-dark)", textDecoration: "none" }}>{h.name}</Link>
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{h.breed ?? "—"}</td>
                  <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{h.gender ?? "—"}</td>
                  <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{parseHorseCoat(h.coat).cleanName || "—"}</td>
                  <td style={{ padding: "6px 12px" }}>
                    <CharacterToggle
                      value={(h.assignedCharacter as Character) || "Athena Redfield"}
                      disabled={isPending}
                      onChange={(next) => setCharacter(h.id, next)}
                    />
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--text-muted)", fontSize: 11 }}>
                    {new Date(h.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk move modal */}
      {bulkOpen && (
        <div onClick={() => !bulkBusy && setBulkOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,28,27,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          role="dialog" aria-modal="true"
        >
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--white)", borderRadius: 12, padding: 28, maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
          >
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 8 }}>
              Move {selectedCount} horse{selectedCount !== 1 ? "s" : ""}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text)", fontFamily: "var(--font-lato)", marginBottom: 16 }}>
              Reassign the selected horses to a character.
            </p>
            <div className="flex gap-2 mb-4">
              {CHARACTERS.map((c) => (
                <button key={c} type="button" onClick={() => setBulkChar(c)}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: 8, fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 13,
                    background: bulkChar === c ? "var(--teal)" : "var(--white)",
                    color: bulkChar === c ? "white" : "var(--teal-dark)",
                    border: `1px solid ${bulkChar === c ? "var(--teal)" : "var(--border)"}`,
                    cursor: "pointer",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setBulkOpen(false)} disabled={bulkBusy}
                style={{ background: "var(--white)", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "8px 16px", borderRadius: 6, fontSize: 13, cursor: bulkBusy ? "not-allowed" : "pointer", fontFamily: "var(--font-lato)" }}>
                Cancel
              </button>
              <button type="button" onClick={bulkMove} disabled={bulkBusy}
                style={{ background: "var(--teal)", color: "white", border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: bulkBusy ? "wait" : "pointer", fontFamily: "var(--font-lato)" }}>
                {bulkBusy ? "Moving…" : `Move to ${bulkChar}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Two-state toggle for the per-row character assignment. */
function CharacterToggle({
  value, onChange, disabled,
}: { value: Character; onChange: (next: Character) => void; disabled?: boolean }) {
  return (
    <div
      role="radiogroup"
      aria-label="Assigned character"
      style={{
        display: "inline-flex",
        background: "var(--cream)",
        border: "1px solid var(--border)",
        borderRadius: 999,
        padding: 2,
      }}
    >
      {CHARACTERS.map((c) => {
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => !active && !disabled && onChange(c)}
            disabled={disabled}
            style={{
              background: active ? "var(--teal)" : "transparent",
              color: active ? "white" : "var(--teal-dark)",
              border: "none",
              padding: "5px 12px",
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 700,
              fontFamily: "var(--font-lato)",
              cursor: active || disabled ? "default" : "pointer",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {c.split(" ")[0]}
          </button>
        );
      })}
    </div>
  );
}
