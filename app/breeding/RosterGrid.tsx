import Link from "next/link";
import { parseHorseCoat } from "@/lib/horseCoat";

export interface RosterHorse {
  id: string;
  name: string;
  breed: string | null;
  coat: string | null;
  breedingFee: string | null;
  breedingPolicies: string | null;
  photoUrl: string | null;
}

export default function RosterGrid({ horses, emptyLabel }: { horses: RosterHorse[]; emptyLabel: string }) {
  if (horses.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--white)", border: "1px dashed var(--border)", borderRadius: 12 }}>
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {horses.map((h) => {
        const coat = parseHorseCoat(h.coat).cleanName || null;
        return (
          <Link key={h.id} href={`/registry/${h.id}`} style={{ textDecoration: "none" }}>
            <div className="hover-card" style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", height: "100%" }}>
              <div style={{ position: "relative", paddingTop: "70%", background: "linear-gradient(135deg, var(--teal-muted), var(--cream-dark))" }}>
                {h.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.photoUrl} alt={h.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                ) : null}
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)", fontWeight: 700, lineHeight: 1.2 }}>{h.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginTop: 2 }}>
                  {[h.breed, coat].filter(Boolean).join(" · ") || "—"}
                </div>
                {h.breedingFee && (
                  <div style={{ marginTop: 10, fontSize: 13, fontFamily: "var(--font-lato)", color: "var(--teal-dark)" }}>
                    <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Fee</span>
                    <div style={{ fontWeight: 700 }}>{h.breedingFee}</div>
                  </div>
                )}
                {h.breedingPolicies && (
                  <p style={{ marginTop: 8, fontSize: 12.5, color: "var(--text)", fontFamily: "var(--font-lato)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {h.breedingPolicies}
                  </p>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
