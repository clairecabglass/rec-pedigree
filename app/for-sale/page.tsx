import { prisma } from "@/lib/db";
import Link from "next/link";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function ForSalePage() {
  const horses = await prisma.horse.findMany({
    where: { ownership: "For Sale" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 36, color: "var(--teal-dark)", marginBottom: 6 }}>
          Horses for Sale
        </h1>
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>
          {horses.length} horse{horses.length !== 1 ? "s" : ""} currently available from Redfield Equestrian Centre
        </p>
      </div>

      {horses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <Icon name="horse" size={40} color="var(--teal-light)" />
          </div>
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 15 }}>
            No horses are currently listed for sale.
          </p>
          <Link href="/registry" style={{ color: "var(--teal)", fontSize: 14, fontFamily: "var(--font-lato)", textDecoration: "none" }}>
            Browse the full registry →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {horses.map((horse) => (
            <Link key={horse.id} href={`/registry/${horse.id}`} style={{ textDecoration: "none" }}>
              <div
                className="hover-card"
                style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8, padding: 24, cursor: "pointer", height: "100%" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)", marginBottom: 2 }}>
                      {horse.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
                      {[horse.breed, horse.gender].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <span style={{ background: "#FFF3D0", borderRadius: 12, padding: "3px 10px", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: "#7A5C00", whiteSpace: "nowrap" }}>
                    For Sale
                  </span>
                </div>

                {horse.coat && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-lato)" }}>Coat </span>
                    <span style={{ fontSize: 13, color: "var(--gold)", fontFamily: "var(--font-lato)" }}>{horse.coat}</span>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 12, fontFamily: "var(--font-lato)", marginTop: 12 }}>
                  {horse.sireName && (
                    <>
                      <span style={{ color: "var(--text-muted)" }}>Sire</span>
                      <span style={{ color: "var(--teal)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{horse.sireName}</span>
                    </>
                  )}
                  {horse.damName && (
                    <>
                      <span style={{ color: "var(--text-muted)" }}>Dam</span>
                      <span style={{ color: "var(--gold)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{horse.damName}</span>
                    </>
                  )}
                  {horse.microchip && (
                    <>
                      <span style={{ color: "var(--text-muted)" }}>Microchip</span>
                      <span style={{ color: "var(--text)" }}>{horse.microchip}</span>
                    </>
                  )}
                  {horse.withFoal && (
                    <>
                      <span style={{ color: "var(--text-muted)" }}>With Foal</span>
                      <span style={{ color: "var(--gold)", fontWeight: 600 }}>Yes</span>
                    </>
                  )}
                </div>

                {horse.notes && (
                  <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)", lineHeight: 1.5, borderTop: "1px solid var(--border)", paddingTop: 10, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                    {horse.notes}
                  </div>
                )}

                <div style={{ marginTop: 16, fontSize: 12, color: "var(--teal)", fontFamily: "var(--font-lato)", fontWeight: 600 }}>
                  View pedigree →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
