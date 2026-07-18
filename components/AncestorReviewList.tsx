"use client";
import { AncestorData } from "@/lib/types";

interface AncestorReviewListProps {
  ancestors: AncestorData[];
  onAncestorChange: (index: number, key: keyof AncestorData, value: string | boolean) => void;
  // onDuplicateResolve: (index: number, action: 'link' | 'create', existingHorseId?: string) => void;
}

export function AncestorReviewList({ ancestors, onAncestorChange }: AncestorReviewListProps) {
  const tableHeaderStyle: React.CSSProperties = { padding: "8px 12px", textAlign: "left", fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 };
  const tableCellStyle: React.CSSProperties = { padding: "8px 12px", color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-lato)" };
  const inputStyle: React.CSSProperties = {
    ...tableCellStyle,
    border: "1px solid var(--border)", borderRadius: 4, background: "var(--white)",
    outline: "none", margin: "-4px 0", padding: "4px 8px", width: "100%"
  };

  return (
    <div style={{ marginTop: 26, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
      <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 17, color: "var(--teal-dark)", marginBottom: 14 }}>Detected Ancestors</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "var(--font-lato)" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--border)" }}>
            <th style={{ ...tableHeaderStyle, width: "25%" }}>Name</th>
            <th style={{ ...tableHeaderStyle, width: "15%" }}>Gender</th>
            <th style={{ ...tableHeaderStyle, width: "15%" }}>Breed</th>
            <th style={{ ...tableHeaderStyle, width: "15%" }}>Coat</th>
            <th style={{ ...tableHeaderStyle, width: "15%" }}>Genotype</th>
            <th style={{ ...tableHeaderStyle, width: "15%" }}>Status</th>
            {/* <th style={{ ...tableHeaderStyle, width: "10%" }}>Actions</th> */}
          </tr>
        </thead>
        <tbody>
          {ancestors.map((a, index) => (
            <tr key={index} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={tableCellStyle}>
                <input value={a.name ?? ""} onChange={(e) => onAncestorChange(index, "name", e.target.value)} style={inputStyle} />
              </td>
              <td style={tableCellStyle}>
                <input value={a.gender ?? ""} onChange={(e) => onAncestorChange(index, "gender", e.target.value)} style={inputStyle} />
              </td>
              <td style={tableCellStyle}>
                <input value={a.breed ?? ""} onChange={(e) => onAncestorChange(index, "breed", e.target.value)} style={inputStyle} />
              </td>
              <td style={tableCellStyle}>
                <input value={a.coat ?? ""} onChange={(e) => onAncestorChange(index, "coat", e.target.value)} style={inputStyle} />
              </td>
              <td style={tableCellStyle}>
                <input value={a.genotype ?? ""} onChange={(e) => onAncestorChange(index, "genotype", e.target.value)} style={inputStyle} />
              </td>
              <td style={tableCellStyle}>
                {a.isDuplicate ? (
                  <span style={{ color: "var(--gold-dark)", fontWeight: 700 }}>Duplicate</span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>New (Placeholder)</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
