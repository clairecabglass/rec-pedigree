import Link from "next/link";

export interface RosterHorse {
  id: string;
  name: string;
  breed: string | null;
  coat: string | null;
  gender: string | null;
  breedingFee: string | null;
  breedingPolicies: string | null;
  photoUrl: string | null;
}

export default function RosterGrid({ horses, emptyLabel, hrefPrefix }: { horses: RosterHorse[]; emptyLabel: string; hrefPrefix?: string }) {
  if (horses.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--white)", border: "1px dashed var(--border)", borderRadius: 12 }}>
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
      {horses.map((h) => (
        <Link key={h.id} href={hrefPrefix ? `${hrefPrefix}/${h.id}` : `/registry/${h.id}`} style={{ textDecoration: "none" }}>
          <div className="hover-card" style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", height: "100%", cursor: "pointer" }}>
            <div style={{ position: "relative", paddingTop: "78%", background: "linear-gradient(135deg, var(--teal-muted), var(--cream-dark))" }}>
              {h.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={h.photoUrl} alt={h.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ) : null}
              {h.breedingFee && (
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(248,244,236,0.92)", backdropFilter: "blur(4px)", borderTop: "1px solid var(--border)", padding: "6px 10px", display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontFamily: "var(--font-playfair)", fontSize: 16, fontWeight: 700, color: "var(--teal-dark)", lineHeight: 1 }}>{h.breedingFee}</span>
                  <span style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>per cover</span>
                </div>
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
  );
}
