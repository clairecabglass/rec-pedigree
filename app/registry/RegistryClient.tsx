"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

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
}

const OWNERSHIP_COLORS: Record<string, string> = {
  "Home": "#D4E3E1",
  "For Sale": "#FFF3D0",
  "Sold": "#F0F0F0",
  "Outside": "#E8F4E8",
  "Void": "#FFE8E8",
};

export default function RegistryClient({ horses, breeds, ownerships }: {
  horses: Horse[];
  breeds: string[];
  ownerships: string[];
}) {
  const [search, setSearch] = useState("");
  const [breedFilter, setBreedFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 40;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return horses.filter((h) => {
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
  }, [horses, search, breedFilter, genderFilter, ownerFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function reset() {
    setSearch(""); setBreedFilter(""); setGenderFilter(""); setOwnerFilter(""); setPage(1);
  }

  const selectStyle = {
    border: "1px solid var(--border)", borderRadius: 4, padding: "8px 12px",
    fontSize: 13, background: "var(--white)", color: "var(--text)",
    fontFamily: "var(--font-lato)", outline: "none",
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 36, color: "var(--teal-dark)", marginBottom: 6 }}>
          Horse Registry
        </h1>
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>
          {horses.length} registered horses
        </p>
      </div>

      {/* Filters */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 20px", marginBottom: 24 }} className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)", fontFamily: "var(--font-lato)", textTransform: "uppercase" }}>Search</label>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Name, breed, sire, dam…"
            style={{ ...selectStyle, width: 240 }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)", fontFamily: "var(--font-lato)", textTransform: "uppercase" }}>Breed</label>
          <select value={breedFilter} onChange={(e) => { setBreedFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All Breeds</option>
            {breeds.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)", fontFamily: "var(--font-lato)", textTransform: "uppercase" }}>Gender</label>
          <select value={genderFilter} onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All</option>
            <option value="Stallion">Stallion</option>
            <option value="Mare">Mare</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)", fontFamily: "var(--font-lato)", textTransform: "uppercase" }}>Ownership</label>
          <select value={ownerFilter} onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }} style={selectStyle}>
            <option value="">All</option>
            {ownerships.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {(search || breedFilter || genderFilter || ownerFilter) && (
          <button onClick={reset} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "8px 14px", fontSize: 12, color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-lato)", marginTop: 18 }}>
            Clear
          </button>
        )}
        <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 18 }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-lato)" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)", background: "var(--cream)" }}>
              {["Name", "Breed", "Gender", "Coat", "Sire", "Dam", "Status"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((h, i) => (
              <tr key={h.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--white)" : "var(--cream)" }}>
                <td style={{ padding: "10px 14px" }}>
                  <Link href={`/registry/${h.id}`} style={{ color: "var(--teal-dark)", fontWeight: 600, textDecoration: "none" }}>
                    {h.name}
                  </Link>
                </td>
                <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{h.breed ?? "—"}</td>
                <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{h.gender ?? "—"}</td>
                <td style={{ padding: "10px 14px", color: "var(--text-muted)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.coat ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  {h.sireName
                    ? <Link href={`/registry?search=${encodeURIComponent(h.sireName)}`} style={{ color: "var(--teal)", textDecoration: "none" }}>{h.sireName}</Link>
                    : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  {h.damName
                    ? <Link href={`/registry?search=${encodeURIComponent(h.damName)}`} style={{ color: "var(--gold)", textDecoration: "none" }}>{h.damName}</Link>
                    : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  {h.ownership ? (
                    <span style={{ background: OWNERSHIP_COLORS[h.ownership] ?? "#EEE", borderRadius: 12, padding: "3px 10px", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>
                      {h.ownership}
                    </span>
                  ) : "—"}
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                  No horses found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: "6px 14px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--white)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1, fontFamily: "var(--font-lato)", fontSize: 13 }}>← Prev</button>
          <span style={{ padding: "6px 12px", fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "6px 14px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--white)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1, fontFamily: "var(--font-lato)", fontSize: 13 }}>Next →</button>
        </div>
      )}
    </div>
  );
}
