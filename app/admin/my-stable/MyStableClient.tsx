"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { parseHorseCoat } from "@/lib/horseCoat";
import { LayoutList, LayoutGrid, Search } from "lucide-react";

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

type ViewMode = "list" | "gallery";

export default function MyStableClient({ horses }: { horses: StableHorse[] }) {
  const router = useRouter();

  /* ---------- View + filter state ---------- */
  const [view, setView] = useState<ViewMode>("list");
  const [character, setCharacter] = useState<Character | "all">("all");
  const [search, setSearch] = useState("");
  const [breedFilter, setBreedFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [coatFilter, setCoatFilter] = useState<string>("");

  /* ---------- Selection / bulk ---------- */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkChar, setBulkChar] = useState<Character>("Athena Redfield");
  const [bulkBusy, setBulkBusy] = useState(false);
  const selectedCount = selected.size;

  /* ---------- Filter option lists (derived once from full dataset) ---------- */
  const breedOptions = useMemo(
    () => [...new Set(horses.map((h) => h.breed).filter(Boolean))].sort() as string[],
    [horses]
  );
  const genderOptions = useMemo(
    () => [...new Set(horses.map((h) => h.gender).filter(Boolean))].sort() as string[],
    [horses]
  );
  // Use the parsed clean name so the dropdown reads "Black Tovero" not "Black Tovero (BL_TOV)".
  const coatOptions = useMemo(() => {
    const set = new Set<string>();
    for (const h of horses) {
      const name = parseHorseCoat(h.coat).cleanName;
      if (name) set.add(name);
    }
    return [...set].sort();
  }, [horses]);

  /* ---------- Compound filter — applies ALL active criteria together ---------- */
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return horses.filter((h) => {
      if (character !== "all" && h.assignedCharacter !== character) return false;
      if (breedFilter && h.breed !== breedFilter) return false;
      if (genderFilter && h.gender !== genderFilter) return false;
      if (coatFilter && parseHorseCoat(h.coat).cleanName !== coatFilter) return false;
      if (q) {
        const inName = h.name.toLowerCase().includes(q);
        const inId = h.id.toLowerCase().includes(q);
        if (!inName && !inId) return false;
      }
      return true;
    });
  }, [horses, character, breedFilter, genderFilter, coatFilter, search]);

  const visibleIds = useMemo(() => visible.map((h) => h.id), [visible]);
  // "Select all" only operates on the currently-filtered rows.
  const allChecked = visible.length > 0 && visible.every((h) => selected.has(h.id));
  const someChecked = visible.some((h) => selected.has(h.id));

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAllVisible() {
    setSelected((s) => {
      if (allChecked) {
        const next = new Set(s);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...s, ...visibleIds]);
    });
  }
  function clearSelection() {
    setSelected(new Set());
  }
  function clearFilters() {
    setSearch("");
    setBreedFilter("");
    setGenderFilter("");
    setCoatFilter("");
  }

  const counts = useMemo(() => {
    const out = { Athena: 0, Lucille: 0 };
    for (const h of horses) {
      if (h.assignedCharacter === "Athena Redfield") out.Athena++;
      else if (h.assignedCharacter === "Lucille") out.Lucille++;
    }
    return out;
  }, [horses]);

  /* ---------- Mutations ---------- */
  async function setHorseCharacter(id: string, next: Character) {
    setPendingId(id);
    const res = await fetch(`/api/horses/${id}/character`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedCharacter: next }),
    });
    setPendingId(null);
    if (!res.ok) { alert("Could not update character."); return; }
    router.refresh();
  }
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
    if (!res.ok) { alert("Bulk move failed."); return; }
    clearSelection();
    router.refresh();
  }

  const filtersActive = !!(search || breedFilter || genderFilter || coatFilter);
  const totalLabel = `${visible.length} of ${horses.length} Home horse${horses.length !== 1 ? "s" : ""}`;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* ===== Header with view toggle ===== */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin" className="text-xs uppercase tracking-[0.12em] text-[var(--teal)] no-underline" style={{ fontFamily: "var(--font-lato)" }}>← Admin</Link>
          <h1 className="mt-1" style={{ fontFamily: "var(--font-playfair)", fontSize: 30, color: "var(--teal-dark)" }}>My Stable</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{totalLabel}</p>
        </div>

        {/* View mode segmented control */}
        <div
          role="radiogroup"
          aria-label="View mode"
          className="inline-flex rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--border)", background: "var(--white)" }}
        >
          <ViewBtn label="List" Icon={LayoutList} active={view === "list"} onClick={() => setView("list")} />
          <ViewBtn label="Gallery" Icon={LayoutGrid} active={view === "gallery"} onClick={() => setView("gallery")} />
        </div>
      </div>

      {/* ===== Character tabs ===== */}
      <div className="mb-3 flex flex-wrap gap-2">
        {([
          { id: "all", label: `All (${horses.length})` },
          { id: "Athena Redfield", label: `Athena Redfield (${counts.Athena})` },
          { id: "Lucille", label: `Lucille (${counts.Lucille})` },
        ] as const).map((t) => {
          const active = character === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setCharacter(t.id as Character | "all")}
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

      {/* ===== Filter control bar ===== */}
      <div
        className="mb-3 grid gap-2 p-3 rounded-lg"
        style={{
          gridTemplateColumns: "minmax(220px, 2fr) 1fr 1fr 1fr auto",
          background: "var(--cream-dark)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Text search */}
        <div className="relative">
          <Search
            size={14}
            color="var(--text-muted)"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search horse name or ID..."
            className="w-full text-sm rounded-md border"
            style={{
              borderColor: "var(--border)",
              background: "var(--white)",
              fontFamily: "var(--font-lato)",
              padding: "8px 10px 8px 32px",
              color: "var(--text)",
            }}
          />
        </div>

        <FilterSelect
          value={breedFilter}
          onChange={setBreedFilter}
          options={breedOptions}
          placeholder="All breeds"
        />
        <FilterSelect
          value={genderFilter}
          onChange={setGenderFilter}
          options={genderOptions}
          placeholder="All genders"
        />
        <FilterSelect
          value={coatFilter}
          onChange={setCoatFilter}
          options={coatOptions}
          placeholder="All coats"
        />

        <button
          type="button"
          onClick={clearFilters}
          disabled={!filtersActive}
          title={filtersActive ? "Clear all filters" : "No filters active"}
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "0 14px",
            fontSize: 12,
            color: filtersActive ? "var(--teal-dark)" : "var(--text-muted)",
            cursor: filtersActive ? "pointer" : "not-allowed",
            opacity: filtersActive ? 1 : 0.6,
            fontFamily: "var(--font-lato)",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          Reset
        </button>
      </div>

      {/* ===== Reserved bulk slot — fixed height so the canvas never jumps ===== */}
      <div className="min-h-[56px] mb-2 flex items-center" aria-hidden={selectedCount === 0}>
        {selectedCount > 0 && (
          <div
            className="flex w-full items-center gap-3 rounded-md px-3 py-2"
            style={{ background: "var(--teal-muted)", border: "1px solid var(--teal-light)" }}
          >
            <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--teal-dark)", fontWeight: 700 }}>
              {selectedCount} selected
            </span>
            <button onClick={clearSelection} style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-lato)", textDecoration: "underline" }}>
              Clear
            </button>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
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

      {/* ===== Select-all-visible bar (shared by both views) ===== */}
      {visible.length > 0 && (
        <div className="mb-2 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
          <input
            type="checkbox"
            aria-label="Select all visible horses"
            checked={allChecked}
            ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
            onChange={toggleAllVisible}
          />
          <span>
            Select all <strong style={{ color: "var(--teal-dark)" }}>{visible.length}</strong> visible
            {filtersActive ? " (filtered)" : ""}
          </span>
        </div>
      )}

      {/* ===== Data canvas ===== */}
      {visible.length === 0 ? (
        <EmptyState filtersActive={filtersActive} onReset={clearFilters} />
      ) : view === "list" ? (
        <ListView
          horses={visible}
          selected={selected}
          pendingId={pendingId}
          onToggle={toggleOne}
          onSetCharacter={setHorseCharacter}
        />
      ) : (
        <GalleryView
          horses={visible}
          selected={selected}
          pendingId={pendingId}
          onToggle={toggleOne}
          onSetCharacter={setHorseCharacter}
        />
      )}

      {/* ===== Bulk-move modal ===== */}
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

/* ====================================================================== */
/*                              Subcomponents                              */
/* ====================================================================== */

function ViewBtn({
  label, Icon, active, onClick,
}: { label: string; Icon: typeof LayoutList; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        background: active ? "var(--teal)" : "var(--white)",
        color: active ? "white" : "var(--teal-dark)",
        border: "none",
        padding: "8px 14px",
        fontSize: 13,
        fontFamily: "var(--font-lato)",
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <Icon size={16} strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}

function FilterSelect({
  value, onChange, options, placeholder,
}: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm rounded-md border"
      style={{
        background: "var(--white)",
        borderColor: "var(--border)",
        padding: "8px 10px",
        color: value ? "var(--teal-dark)" : "var(--text-muted)",
        fontFamily: "var(--font-lato)",
        cursor: "pointer",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function EmptyState({ filtersActive, onReset }: { filtersActive: boolean; onReset: () => void }) {
  return (
    <div
      className="text-center py-16 px-6 rounded-lg"
      style={{ background: "var(--white)", border: "1px dashed var(--border)" }}
    >
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14, marginBottom: 10 }}>
        No horses match the current filters.
      </p>
      {filtersActive && (
        <button
          onClick={onReset}
          style={{
            background: "var(--teal)", color: "white", border: "none",
            padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "var(--font-lato)",
          }}
        >
          Reset filters
        </button>
      )}
    </div>
  );
}

/* ============================ List View ============================ */
function ListView({
  horses, selected, pendingId, onToggle, onSetCharacter,
}: {
  horses: StableHorse[];
  selected: Set<string>;
  pendingId: string | null;
  onToggle: (id: string) => void;
  onSetCharacter: (id: string, next: Character) => void;
}) {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-lato)" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border)" }}>
            <th style={{ width: 28, padding: "8px 12px" }} />
            {["Name", "Breed", "Gender", "Coat", "Assigned to", "Updated"].map((h) => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {horses.map((h) => {
            const isSel = selected.has(h.id);
            const isPending = pendingId === h.id;
            return (
              <tr key={h.id} style={{ borderBottom: "1px solid var(--border)", background: isSel ? "var(--cream)" : undefined }}>
                <td style={{ padding: "8px 12px" }}>
                  <input type="checkbox" aria-label={`Select ${h.name}`} checked={isSel} onChange={() => onToggle(h.id)} />
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
                    onChange={(next) => onSetCharacter(h.id, next)}
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
  );
}

/* ============================ Gallery View ============================ */
function GalleryView({
  horses, selected, pendingId, onToggle, onSetCharacter,
}: {
  horses: StableHorse[];
  selected: Set<string>;
  pendingId: string | null;
  onToggle: (id: string) => void;
  onSetCharacter: (id: string, next: Character) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {horses.map((h) => {
        const isSel = selected.has(h.id);
        const isPending = pendingId === h.id;
        const coat = parseHorseCoat(h.coat).cleanName;
        return (
          <div
            key={h.id}
            className="rounded-2xl p-6 flex flex-col gap-3 transition-shadow"
            style={{
              background: "var(--white)",
              border: `1px solid ${isSel ? "var(--teal-light)" : "var(--border)"}`,
              boxShadow: isSel ? "0 0 0 2px rgba(94,128,128,0.18)" : "none",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <input
                type="checkbox"
                aria-label={`Select ${h.name}`}
                checked={isSel}
                onChange={() => onToggle(h.id)}
                style={{ marginTop: 4 }}
              />
              <Link
                href={`/registry/${h.id}`}
                className="flex-1 no-underline"
                style={{ fontFamily: "var(--font-playfair)", fontSize: 17, color: "var(--teal-dark)", fontWeight: 700, lineHeight: 1.2 }}
              >
                {h.name}
              </Link>
            </div>

            {/* Pills row */}
            <div className="flex flex-wrap gap-1.5">
              {h.breed && <Pill>{h.breed}</Pill>}
              {h.gender && <Pill kind={h.gender === "Mare" ? "dam" : h.gender === "Stallion" ? "sire" : "muted"}>{h.gender}</Pill>}
            </div>

            {/* Coat */}
            <div className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
              <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Coat</span>
              <div className="mt-0.5" style={{ color: "var(--text)" }}>{coat || "—"}</div>
            </div>

            {/* Footer: character + updated */}
            <div className="mt-auto flex items-center justify-between gap-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <CharacterToggle
                value={(h.assignedCharacter as Character) || "Athena Redfield"}
                disabled={isPending}
                onChange={(next) => onSetCharacter(h.id, next)}
              />
              <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
                {new Date(h.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Pill({ children, kind = "muted" }: { children: React.ReactNode; kind?: "muted" | "sire" | "dam" }) {
  const palette = {
    muted: { bg: "var(--cream)", fg: "var(--text-muted)", border: "var(--border)" },
    sire:  { bg: "var(--sire-bg)", fg: "var(--sire-text)", border: "var(--sire-border)" },
    dam:   { bg: "var(--dam-bg)",  fg: "var(--dam-text)",  border: "var(--dam-border)" },
  }[kind];
  return (
    <span
      className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
      style={{
        background: palette.bg, color: palette.fg, border: `1px solid ${palette.border}`,
        fontFamily: "var(--font-lato)",
      }}
    >
      {children}
    </span>
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
              background: active ? "var(--teal-dark)" : "transparent",
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
