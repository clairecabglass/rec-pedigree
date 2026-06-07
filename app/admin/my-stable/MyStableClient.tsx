"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useRef, useEffect } from "react";
import { parseHorseCoat } from "@/lib/horseCoat";
import { LayoutList, LayoutGrid, Search, X } from "lucide-react";

const CHARACTERS = ["Athena Redfield", "Lucille"] as const;
type Character = (typeof CHARACTERS)[number];

const FOAL_STAGES = ["Gestation", "Weanling", "Yearling", "Youngster"] as const;

interface StableHorse {
  id: string;
  name: string;
  breed: string | null;
  gender: string | null;
  coat: string | null;
  assignedCharacter: string | null;
  lifeStage: string | null;
  updatedAt: string;
}

type ViewMode = "list" | "gallery";
type MaturityFilter = "all" | "adults" | "foals";

export default function MyStableClient({ horses }: { horses: StableHorse[] }) {
  const router = useRouter();

  /* ---------- View + filter state ---------- */
  const [view, setView] = useState<ViewMode>("list");
  const [character, setCharacter] = useState<Character | "all">("all");
  const [search, setSearch] = useState("");
  const [breedFilter, setBreedFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [maturityFilter, setMaturityFilter] = useState<MaturityFilter>("all");
  const [coatQuery, setCoatQuery] = useState("");      // raw combobox text
  const [coatValue, setCoatValue] = useState("");      // committed coat filter (raw string from DB)

  /* ---------- Selection / bulk ---------- */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkChar, setBulkChar] = useState<Character>("Athena Redfield");
  const [bulkBusy, setBulkBusy] = useState(false);
  const selectedCount = selected.size;

  /* ---------- Filter option lists ---------- */
  const breedOptions = useMemo(
    () => [...new Set(horses.map((h) => h.breed).filter(Boolean))].sort() as string[],
    [horses]
  );
  const genderOptions = useMemo(
    () => [...new Set(horses.map((h) => h.gender).filter(Boolean))].sort() as string[],
    [horses]
  );
  // All unique raw coat strings — combobox matches against both clean name and genotype code.
  const coatRawOptions = useMemo(() => {
    const set = new Set<string>();
    for (const h of horses) if (h.coat) set.add(h.coat);
    return [...set].sort();
  }, [horses]);

  /* ---------- Compound filter ---------- */
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return horses.filter((h) => {
      if (character !== "all" && h.assignedCharacter !== character) return false;
      if (breedFilter && h.breed !== breedFilter) return false;
      if (genderFilter && h.gender !== genderFilter) return false;
      if (maturityFilter === "foals") {
        if (!h.lifeStage || !(FOAL_STAGES as readonly string[]).includes(h.lifeStage)) return false;
      } else if (maturityFilter === "adults") {
        if (h.lifeStage && (FOAL_STAGES as readonly string[]).includes(h.lifeStage)) return false;
      }
      if (coatValue && h.coat !== coatValue) return false;
      if (q) {
        if (!h.name.toLowerCase().includes(q) && !h.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [horses, character, breedFilter, genderFilter, maturityFilter, coatValue, search]);

  const visibleIds = useMemo(() => visible.map((h) => h.id), [visible]);
  const allChecked = visible.length > 0 && visible.every((h) => selected.has(h.id));
  const someChecked = visible.some((h) => selected.has(h.id));

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
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
  function clearSelection() { setSelected(new Set()); }
  function clearFilters() {
    setSearch(""); setBreedFilter(""); setGenderFilter("");
    setMaturityFilter("all"); setCoatQuery(""); setCoatValue("");
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

  const filtersActive = !!(search || breedFilter || genderFilter || maturityFilter !== "all" || coatValue);
  const totalLabel = `${visible.length} of ${horses.length} Home horse${horses.length !== 1 ? "s" : ""}`;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* ===== Header ===== */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          {/* Back to the central registry panel, not the admin root */}
          <Link href="/admin/horses" className="text-xs uppercase tracking-[0.12em] text-[var(--teal)] no-underline" style={{ fontFamily: "var(--font-lato)" }}>← Registry</Link>
          <h1 className="mt-1" style={{ fontFamily: "var(--font-playfair)", fontSize: 30, color: "var(--teal-dark)" }}>My Stable</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>{totalLabel}</p>
        </div>

        <div role="radiogroup" aria-label="View mode" className="inline-flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--white)" }}>
          <ViewBtn label="List"    Icon={LayoutList} active={view === "list"}    onClick={() => setView("list")} />
          <ViewBtn label="Gallery" Icon={LayoutGrid} active={view === "gallery"} onClick={() => setView("gallery")} />
        </div>
      </div>

      {/* ===== Character tabs ===== */}
      <div className="mb-3 flex flex-wrap gap-2">
        {([
          { id: "all",            label: `All (${horses.length})` },
          { id: "Athena Redfield", label: `Athena Redfield (${counts.Athena})` },
          { id: "Lucille",        label: `Lucille (${counts.Lucille})` },
        ] as const).map((t) => {
          const active = character === t.id;
          return (
            <button key={t.id} onClick={() => setCharacter(t.id as Character | "all")} style={{
              background: active ? "var(--teal)" : "var(--white)",
              color: active ? "white" : "var(--teal-dark)",
              border: `1px solid ${active ? "var(--teal)" : "var(--border)"}`,
              borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700,
              fontFamily: "var(--font-lato)", cursor: "pointer",
            }}>{t.label}</button>
          );
        })}
      </div>

      {/* ===== Filter control bar ===== */}
      <div className="mb-3 p-3 rounded-lg" style={{ background: "var(--cream-dark)", border: "1px solid var(--border)" }}>
        {/* Row 1: search + dropdowns */}
        <div className="grid gap-2" style={{ gridTemplateColumns: "minmax(200px,2fr) 1fr 1fr 1fr auto" }}>
          {/* Text search */}
          <div className="relative">
            <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search horse name or ID..."
              className="w-full text-sm rounded-md border"
              style={{ borderColor: "var(--border)", background: "var(--white)", fontFamily: "var(--font-lato)", padding: "8px 10px 8px 32px", color: "var(--text)" }}
            />
          </div>

          <FilterSelect value={breedFilter}  onChange={setBreedFilter}  options={breedOptions}  placeholder="All breeds" />
          <FilterSelect value={genderFilter} onChange={setGenderFilter} options={genderOptions} placeholder="All genders" />

          {/* Foal / maturity stage */}
          <select
            value={maturityFilter}
            onChange={(e) => setMaturityFilter(e.target.value as MaturityFilter)}
            className="text-sm rounded-md border"
            style={{
              background: "var(--white)", borderColor: "var(--border)", padding: "8px 10px",
              color: maturityFilter !== "all" ? "var(--teal-dark)" : "var(--text-muted)",
              fontFamily: "var(--font-lato)", cursor: "pointer",
            }}
          >
            <option value="all">All ages</option>
            <option value="adults">Adults only</option>
            <option value="foals">Foals / Developing</option>
          </select>

          <button
            type="button" onClick={clearFilters} disabled={!filtersActive}
            title={filtersActive ? "Clear all filters" : "No filters active"}
            style={{
              background: "var(--white)", border: "1px solid var(--border)", borderRadius: 6,
              padding: "0 14px", fontSize: 12, fontFamily: "var(--font-lato)", fontWeight: 700,
              color: filtersActive ? "var(--teal-dark)" : "var(--text-muted)",
              cursor: filtersActive ? "pointer" : "not-allowed", opacity: filtersActive ? 1 : 0.6,
              whiteSpace: "nowrap",
            }}
          >
            Reset
          </button>
        </div>

        {/* Row 2: coat combobox (full width so the popover has room) */}
        <div className="mt-2">
          <CoatCombobox
            rawOptions={coatRawOptions}
            query={coatQuery}
            onQueryChange={setCoatQuery}
            value={coatValue}
            onSelect={(raw) => { setCoatValue(raw); setCoatQuery(raw ? parseHorseCoat(raw).cleanName || raw : ""); }}
            onClear={() => { setCoatValue(""); setCoatQuery(""); }}
          />
        </div>
      </div>

      {/* ===== Bulk action slot — fixed height prevents canvas jump ===== */}
      <div className="min-h-[56px] mb-2 flex items-center" aria-hidden={selectedCount === 0}>
        {selectedCount > 0 && (
          <div className="flex w-full items-center gap-3 rounded-md px-3 py-2"
            style={{ background: "var(--teal-muted)", border: "1px solid var(--teal-light)" }}>
            <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--teal-dark)", fontWeight: 700 }}>
              {selectedCount} selected
            </span>
            <button onClick={clearSelection} style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-lato)", textDecoration: "underline" }}>
              Clear
            </button>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setBulkOpen(true)} disabled={bulkBusy}
                style={{ background: "var(--gold)", color: "var(--teal-dark)", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: bulkBusy ? "wait" : "pointer", fontFamily: "var(--font-lato)" }}>
                Bulk Move to Character
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== Select-all bar ===== */}
      {visible.length > 0 && (
        <div className="mb-2 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
          <input
            type="checkbox" aria-label="Select all visible horses"
            checked={allChecked}
            ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
            onChange={toggleAllVisible}
          />
          <span>Select all <strong style={{ color: "var(--teal-dark)" }}>{visible.length}</strong> visible{filtersActive ? " (filtered)" : ""}</span>
        </div>
      )}

      {/* ===== Data canvas ===== */}
      {visible.length === 0 ? (
        <EmptyState filtersActive={filtersActive} onReset={clearFilters} />
      ) : view === "list" ? (
        <ListView horses={visible} selected={selected} pendingId={pendingId} onToggle={toggleOne} onSetCharacter={setHorseCharacter} />
      ) : (
        <GalleryView horses={visible} selected={selected} pendingId={pendingId} onToggle={toggleOne} onSetCharacter={setHorseCharacter} />
      )}

      {/* ===== Bulk-move modal ===== */}
      {bulkOpen && (
        <div onClick={() => !bulkBusy && setBulkOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(20,28,27,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          role="dialog" aria-modal="true"
        >
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--white)", borderRadius: 12, padding: 28, maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)", marginBottom: 8 }}>
              Move {selectedCount} horse{selectedCount !== 1 ? "s" : ""}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text)", fontFamily: "var(--font-lato)", marginBottom: 16 }}>
              Reassign the selected horses to a character.
            </p>
            <div className="flex gap-2 mb-4">
              {CHARACTERS.map((c) => (
                <button key={c} type="button" onClick={() => setBulkChar(c)} style={{
                  flex: 1, padding: "10px 12px", borderRadius: 8, fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 13,
                  background: bulkChar === c ? "var(--teal)" : "var(--white)",
                  color: bulkChar === c ? "white" : "var(--teal-dark)",
                  border: `1px solid ${bulkChar === c ? "var(--teal)" : "var(--border)"}`,
                  cursor: "pointer",
                }}>{c}</button>
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
/*                           Coat Combobox                                 */
/* ====================================================================== */

function CoatCombobox({
  rawOptions, query, onQueryChange, value, onSelect, onClear,
}: {
  rawOptions: string[];
  query: string;
  onQueryChange: (q: string) => void;
  value: string;
  onSelect: (raw: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click.
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return rawOptions;
    return rawOptions.filter((raw) => {
      const { cleanName, genotype } = parseHorseCoat(raw);
      return (
        cleanName.toLowerCase().includes(q) ||
        (genotype && genotype.toLowerCase().includes(q))
      );
    });
  }, [rawOptions, q]);

  const hasValue = !!value;

  return (
    <div ref={containerRef} className="relative" style={{ maxWidth: 380 }}>
      <div className="relative">
        <Search size={14} color="var(--text-muted)"
          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          type="text"
          value={query}
          placeholder="Search coat name or genotype (e.g. Tovero, TOV)…"
          onChange={(e) => {
            onQueryChange(e.target.value);
            // If user edits after committing a value, clear the committed filter until they re-select.
            if (value) onSelect("");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full text-sm rounded-md border"
          style={{
            borderColor: hasValue ? "var(--teal)" : "var(--border)",
            background: "var(--white)",
            fontFamily: "var(--font-lato)",
            padding: "8px 32px 8px 32px",
            color: "var(--text)",
            outline: hasValue ? "1px solid var(--teal-light)" : undefined,
          }}
        />
        {(query || value) && (
          <button
            type="button"
            onClick={() => { onClear(); setOpen(false); }}
            aria-label="Clear coat filter"
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", padding: 2,
              color: "var(--text-muted)", display: "flex", alignItems: "center",
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
            background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 260, overflowY: "auto",
          }}
        >
          {filtered.map((raw) => {
            const { cleanName, genotype } = parseHorseCoat(raw);
            const isActive = raw === value;
            return (
              <button
                key={raw}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click
                  onSelect(raw);
                  setOpen(false);
                }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "9px 14px", background: isActive ? "var(--cream)" : "transparent",
                  border: "none", textAlign: "left", cursor: "pointer", gap: 8,
                  borderBottom: "1px solid var(--border)",
                  fontFamily: "var(--font-lato)",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--text)", fontWeight: isActive ? 700 : 400 }}>
                  {cleanName || raw}
                </span>
                {genotype && (
                  <span style={{
                    fontSize: 10, color: "var(--text-muted)", background: "var(--cream-dark)",
                    border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px",
                    fontFamily: "var(--font-lato)", letterSpacing: "0.04em", whiteSpace: "nowrap",
                  }}>
                    {genotype}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {open && q.length > 0 && filtered.length === 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
          background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8,
          padding: "12px 14px", fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)",
        }}>
          No coats match "{query}"
        </div>
      )}
    </div>
  );
}

/* ====================================================================== */
/*                              Subcomponents                              */
/* ====================================================================== */

function ViewBtn({ label, Icon, active, onClick }: { label: string; Icon: typeof LayoutList; active: boolean; onClick: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={active} aria-label={label} title={label} onClick={onClick}
      style={{
        background: active ? "var(--teal)" : "var(--white)", color: active ? "white" : "var(--teal-dark)",
        border: "none", padding: "8px 14px", fontSize: 13, fontFamily: "var(--font-lato)", fontWeight: 700,
        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
      }}>
      <Icon size={16} strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}

function FilterSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="text-sm rounded-md border"
      style={{
        background: "var(--white)", borderColor: "var(--border)", padding: "8px 10px",
        color: value ? "var(--teal-dark)" : "var(--text-muted)", fontFamily: "var(--font-lato)", cursor: "pointer",
      }}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function EmptyState({ filtersActive, onReset }: { filtersActive: boolean; onReset: () => void }) {
  return (
    <div className="text-center py-16 px-6 rounded-lg" style={{ background: "var(--white)", border: "1px dashed var(--border)" }}>
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14, marginBottom: 10 }}>
        No horses match the current filters.
      </p>
      {filtersActive && (
        <button onClick={onReset} style={{
          background: "var(--teal)", color: "white", border: "none",
          padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: "var(--font-lato)",
        }}>Reset filters</button>
      )}
    </div>
  );
}

/* ============================ List View ============================ */
function ListView({ horses, selected, pendingId, onToggle, onSetCharacter }: {
  horses: StableHorse[]; selected: Set<string>; pendingId: string | null;
  onToggle: (id: string) => void; onSetCharacter: (id: string, next: Character) => void;
}) {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-lato)" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border)" }}>
            <th style={{ width: 28, padding: "10px 12px" }} />
            {["Name", "Breed", "Gender", "Coat", "Stage", "Assigned to", "Updated"].map((h) => (
              <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
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
                <td style={{ padding: "8px 12px" }}>
                  {h.lifeStage ? (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                      background: "var(--gold-muted, #fef3c7)", color: "var(--gold-text, #92400e)",
                      border: "1px solid var(--gold-border, #fde68a)", fontFamily: "var(--font-lato)",
                    }}>{h.lifeStage}</span>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Adult</span>
                  )}
                </td>
                <td style={{ padding: "6px 12px" }}>
                  <CharacterToggle value={(h.assignedCharacter as Character) || "Athena Redfield"} disabled={isPending} onChange={(next) => onSetCharacter(h.id, next)} />
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
function GalleryView({ horses, selected, pendingId, onToggle, onSetCharacter }: {
  horses: StableHorse[]; selected: Set<string>; pendingId: string | null;
  onToggle: (id: string) => void; onSetCharacter: (id: string, next: Character) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {horses.map((h) => {
        const isSel = selected.has(h.id);
        const isPending = pendingId === h.id;
        const coat = parseHorseCoat(h.coat).cleanName;
        return (
          <div key={h.id} className="rounded-2xl p-6 flex flex-col gap-3 transition-shadow"
            style={{
              background: "var(--white)",
              border: `1px solid ${isSel ? "var(--teal-light)" : "var(--border)"}`,
              boxShadow: isSel ? "0 0 0 2px rgba(94,128,128,0.18)" : "none",
            }}>
            <div className="flex items-start justify-between gap-2">
              <input type="checkbox" aria-label={`Select ${h.name}`} checked={isSel} onChange={() => onToggle(h.id)} style={{ marginTop: 4 }} />
              <Link href={`/registry/${h.id}`} className="flex-1 no-underline"
                style={{ fontFamily: "var(--font-playfair)", fontSize: 17, color: "var(--teal-dark)", fontWeight: 700, lineHeight: 1.2 }}>
                {h.name}
              </Link>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {h.breed && <Pill>{h.breed}</Pill>}
              {h.gender && <Pill kind={h.gender === "Mare" ? "dam" : h.gender === "Stallion" ? "sire" : "muted"}>{h.gender}</Pill>}
              {h.lifeStage && <Pill kind="stage">{h.lifeStage}</Pill>}
            </div>

            <div className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
              <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Coat</span>
              <div className="mt-0.5" style={{ color: "var(--text)" }}>{coat || "—"}</div>
            </div>

            <div className="mt-auto flex items-center justify-between gap-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <CharacterToggle value={(h.assignedCharacter as Character) || "Athena Redfield"} disabled={isPending} onChange={(next) => onSetCharacter(h.id, next)} />
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

function Pill({ children, kind = "muted" }: { children: React.ReactNode; kind?: "muted" | "sire" | "dam" | "stage" }) {
  const palettes = {
    muted:  { bg: "var(--cream)",    fg: "var(--text-muted)", border: "var(--border)" },
    sire:   { bg: "var(--sire-bg)",  fg: "var(--sire-text)",  border: "var(--sire-border)" },
    dam:    { bg: "var(--dam-bg)",   fg: "var(--dam-text)",   border: "var(--dam-border)" },
    stage:  { bg: "#fef3c7",         fg: "#92400e",           border: "#fde68a" },
  };
  const p = palettes[kind];
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
      style={{ background: p.bg, color: p.fg, border: `1px solid ${p.border}`, fontFamily: "var(--font-lato)" }}>
      {children}
    </span>
  );
}

function CharacterToggle({ value, onChange, disabled }: { value: Character; onChange: (next: Character) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Assigned character"
      style={{ display: "inline-flex", background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 999, padding: 2 }}>
      {CHARACTERS.map((c) => {
        const active = value === c;
        return (
          <button key={c} type="button" role="radio" aria-checked={active}
            onClick={() => !active && !disabled && onChange(c)}
            disabled={disabled}
            style={{
              background: active ? "var(--teal-dark)" : "transparent",
              color: active ? "white" : "var(--teal-dark)",
              border: "none", padding: "5px 12px", borderRadius: 999,
              fontSize: 11.5, fontWeight: 700, fontFamily: "var(--font-lato)",
              cursor: active || disabled ? "default" : "pointer",
              opacity: disabled ? 0.6 : 1,
            }}>
            {c.split(" ")[0]}
          </button>
        );
      })}
    </div>
  );
}
