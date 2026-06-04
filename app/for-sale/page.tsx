import { prisma } from "@/lib/db";
import Link from "next/link";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function ForSalePage() {
  const horses = await prisma.horse.findMany({
    where: { ownership: "For Sale" },
    orderBy: { name: "asc" },
    include: { photos: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1 } },
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
          {horses.map((horse) => {
            const photo = horse.photos[0];
            return (
              <Link key={horse.id} href={`/registry/${horse.id}`} style={{ textDecoration: "none" }}>
                <div
                  className="hover-card"
                  style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}
                >
                  {/* Image / placeholder */}
                  <div style={{ position: "relative", paddingTop: "66%", background: "linear-gradient(135deg, var(--teal-muted), var(--cream-dark))" }}>
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.url} alt={horse.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="horse" size={36} color="var(--teal-light)" />
                      </div>
                    )}
                    <span style={{ position: "absolute", top: 10, right: 10, background: "#FFF3D0", borderRadius: 12, padding: "3px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#7A5C00" }}>
                      For Sale
                    </span>
                    {horse.price && (
                      <span style={{ position: "absolute", bottom: 10, left: 10, background: "var(--teal-dark)", color: "white", borderRadius: 6, padding: "4px 10px", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-lato)" }}>
                        {horse.price}
                      </span>
                    )}
                  </div>

                  <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)", marginBottom: 2 }}>
                      {horse.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)", marginBottom: 10 }}>
                      {[horse.breed, horse.gender, horse.coat].filter(Boolean).join(" · ")}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 10px", fontSize: 12, fontFamily: "var(--font-lato)" }}>
                      {horse.sireName && (<><span style={{ color: "var(--text-muted)" }}>Sire</span><span style={{ color: "var(--sire-text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{horse.sireName}</span></>)}
                      {horse.damName && (<><span style={{ color: "var(--text-muted)" }}>Dam</span><span style={{ color: "var(--dam-text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{horse.damName}</span></>)}
                    </div>

                    {(horse.saleDescription || horse.notes) && (
                      <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                        {horse.saleDescription || horse.notes}
                      </div>
                    )}

                    <div style={{ marginTop: "auto", paddingTop: 14, fontSize: 12, color: "var(--teal)", fontFamily: "var(--font-lato)", fontWeight: 600 }}>
                      View details →
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
