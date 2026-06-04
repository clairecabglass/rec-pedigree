"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";

interface Horse {
  id: string;
  name: string;
  breed: string | null;
  gender: string | null;
  coat: string | null;
  ownership: string | null;
  sireName: string | null;
  damName: string | null;
  dob: string | null;
  withFoal: boolean;
  photo: string | null;
}

const OWNERSHIP_COLORS: Record<string, string> = {
  "Home": "#D4E3E1", "For Sale": "#FFF3D0", "Sold": "#E8E8E8",
  "Outside": "#E8F4E8", "Void": "#FFE8E8",
};

type SortKey = "name-asc" | "name-desc" | "breed" | "newest";

export default function RegistryClient({ horses, breeds, ownerships }: {
  horses: Horse[]; breeds: string[]; ownerships: string[];
}) {
  const [search, setSearch] = useState("");
  const [breedFilter, setBreedFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("name-asc");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);
  const PER_PAGE = view === "grid" ? 24 : 40;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const out = horses.filter((h) => {
      if (q && !h.name.toLowerCase().includes(q) &&
        !(h.breed?.toLowerCase().includes(q)) &&
        !(h.coat?.toLowerCase().includes(q)) &&
        !(h.sireName?.toLowerCase().includes(q)) &&
        !(h.damName?.toLowerCase().includes(q))) return false;
      if (breedFilter && h.breed !== breedFilter) return false;
      if (genderFilter && h.gender !== genderFilter) return false;
      if (ownerFilter && h.ownership !== ownerFilter) return false;
      return true;
    });
    out.sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      if (sort === "breed") return (a.breed ?? "～").localeCompare(b.breed ?? "～") || a.name.localeCompare(b.name);
      if (sort === "newest") return (b.dob ?? "").localeCompare(a.dob ?? "");
      return 0;
    });
    return out;
  }, [horses, search, breedFilter, genderFilter, ownerFilter, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const reset = () => { setSearch(""); setBreedFilter(""); setGenderFilter(""); setOwnerFilter(""); setPage(1); };
  const active = search || breedFilter || genderFilter || ownerFilter;

  const selectStyle = {
    border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px",
    fontSize: 13, background: "var(--white)", color: "var(--text)",
    fontFamily: "var(--font-lato)", outline: "none",
  };
  const labelStyle = { fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)", fontFamily: "var(--font-lato)", textTransform: "uppercase" as const };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 36, color: "var(--teal-dark)", marginBottom: 6 }}>Horse Registry</h1>
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>{horses.length} registered horses</p>
        </div>
        {/* View toggle */}
        <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
          {(["grid", "table"] as const).map((v) => (
            <button key={v} onClick={() => { setView(v); setPage(1); }}
              style={{ padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "var(--font-lato)", textTransform: "capitalize", background: view === v ? "var(--teal)" : "var(--white)", color: view === v ? "white" : "var(--text-muted)" }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }} className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label style={labelStyle}>Search</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Icon name="search" size={15} color="var(--text-muted)" />
            </span>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Name, breed, sire, dam…" style={{ ...selectStyle, width: 230, paddingLeft: 32 }} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label style={labelStyle}>Breed</label>
          <select value={breedFilter} onChange={(e) => { setBreedFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All Breeds</option>
            {breeds.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label style={labelStyle}>Gender</label>
          <select value={genderFilter} onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All</option>
            <option value="Stallion">Stallion</option>
            <option value="Mare">Mare</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label style={labelStyle}>Ownership</label>
          <select value={ownerFilter} onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All</option>
            {ownerships.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label style={labelStyle}>Sort</label>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={selectStyle}>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="breed">Breed</option>
            <option value="newest">Newest (DOB)</option>
          </select>
        </div>
        {active && (
          <button onClick={reset} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 14px", fontSize: 12, color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-lato)" }}>Clear</button>
        )}
        <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Grid view */}
      {view === "grid" && (
        paged.length === 0 ? <Empty /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {paged.map((h) => (
              <Link key={h.id} href={`/registry/${h.id}`} style={{ textDecoration: "none" }}>
                <div className="hover-card" style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", height: "100%", cursor: "pointer" }}>
                  <div style={{ position: "relative", paddingTop: "78%", background: "linear-gradient(135deg, var(--teal-muted), var(--cream-dark))" }}>
                    {h.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.photo} alt={h.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="horse" size={30} color="var(--teal-light)" />
                      </div>
                    )}
                    {h.ownership && (
                      <span style={{ position: "absolute", top: 8, right: 8, background: OWNERSHIP_COLORS[h.ownership] ?? "#EEE", borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", fontFamily: "var(--font-lato)" }}>
                        {h.ownership}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontFamily: "var(--font-playfair)", fontSize: 15, color: "var(--teal-dark)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontFamily: "var(--font-lato)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                      {[h.breed, h.gender].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Table view */}
      {view === "table" && (
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-lato)" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", background: "var(--cream)" }}>
                {["", "Name", "Breed", "Gender", "Coat", "Sire", "Dam", "Status"].map((h, i) => (
                  <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((h, i) => (
                <tr key={h.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--white)" : "var(--cream)" }}>
                  <td style={{ padding: "6px 10px 6px 14px", width: 44 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 6, overflow: "hidden", background: "var(--teal-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {h.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={h.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : <Icon name="horse" size={16} color="var(--teal-light)" />}
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Link href={`/registry/${h.id}`} style={{ color: "var(--teal-dark)", fontWeight: 600, textDecoration: "none" }}>{h.name}</Link>
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{h.breed ?? "—"}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{h.gender ?? "—"}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text-muted)", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.coat ?? "—"}</td>
                  <td style={{ padding: "10px 14px", color: "var(--sire-text)" }}>{h.sireName ?? "—"}</td>
                  <td style={{ padding: "10px 14px", color: "var(--dam-text)" }}>{h.damName ?? "—"}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {h.ownership ? <span style={{ background: OWNERSHIP_COLORS[h.ownership] ?? "#EEE", borderRadius: 12, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{h.ownership}</span> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paged.length === 0 && <Empty />}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button disabled={safePage === 1} onClick={() => setPage(safePage - 1)} style={pageBtn(safePage === 1)}>← Prev</button>
          <span style={{ padding: "6px 12px", fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>Page {safePage} of {totalPages}</span>
          <button disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} style={pageBtn(safePage === totalPages)}>Next →</button>
        </div>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div style={{ padding: 50, textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
      No horses match your filters.
    </div>
  );
}

function pageBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "6px 14px", border: "1px solid var(--border)", borderRadius: 4,
    background: "var(--white)", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1, fontFamily: "var(--font-lato)", fontSize: 13,
  };
}
