"use client";

import { useRef, useState, forwardRef } from "react";
import { toPng } from "html-to-image";
import Link from "next/link";

const CERT_W = 1240;
const CERT_H = 1754;
const PREVIEW_SCALE = 0.5;

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatDob(dob: string) {
  if (!dob) return "";
  const d = new Date(dob);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function fakeSerial(id: string) {
  const n = parseInt(id.replace(/\D/g, "").slice(0, 6) || "100000", 10);
  return `REC-EIA-${2024}-${String(n % 90000 + 10000)}`;
}

function fakeAccession(id: string) {
  const n = parseInt(id.replace(/\D/g, "").slice(2, 8) || "200000", 10);
  return `LAB-${String(n % 900000 + 100000)}`;
}

function bloodDrawn(id: string) {
  const seed = parseInt(id.replace(/\D/g, "").slice(0, 4) || "1015", 10);
  const month = (seed % 10) + 1;
  const day = (seed % 20) + 5;
  return `${2024}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function resultsDate(drawn: string) {
  const d = new Date(drawn);
  d.setDate(d.getDate() + 4);
  return d.toISOString().split("T")[0];
}

interface Props {
  id: string;
  name: string;
  breed: string;
  gender: string;
  dob: string;
  regNumber: string;
  coat: string;
}

export default function CogginsClient({ id, name, breed, gender, dob, regNumber, coat }: Props) {
  const certRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (!certRef.current) return;
    setLoading(true);
    try {
      await toPng(certRef.current, { pixelRatio: 2, cacheBust: true });
      const dataUrl = await toPng(certRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${slug(name)}-coggins.png`;
      a.click();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "32px 24px", fontFamily: "var(--font-lato)" }}>
      <div style={{ maxWidth: CERT_W * PREVIEW_SCALE + 48, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <Link href={`/admin/horses/${id}/papers`} style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none" }}>
            ← Back to Papers
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, color: "var(--teal-dark)", margin: 0 }}>
            Coggins Test (EIA)
          </h1>
          <button onClick={handleDownload} disabled={loading} style={{
            background: "var(--teal)", color: "white", border: "none", borderRadius: 8,
            padding: "10px 22px", fontFamily: "var(--font-lato)", fontWeight: 700,
            fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
          }}>
            {loading ? "Generating…" : "↓ Download PNG"}
          </button>
        </div>

        <div style={{ width: CERT_W * PREVIEW_SCALE, height: CERT_H * PREVIEW_SCALE, overflow: "hidden", border: "1px solid var(--border)", borderRadius: 8 }}>
          <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left", width: CERT_W, height: CERT_H }}>
            <CertBody ref={certRef} id={id} name={name} breed={breed} gender={gender} dob={dob} regNumber={regNumber} coat={coat} />
          </div>
        </div>
      </div>
    </div>
  );
}

const CertBody = forwardRef<HTMLDivElement, Props>(function CertBody(
  { id, name, breed, gender, dob, regNumber, coat }, ref
) {
  const serial = fakeSerial(id);
  const accession = fakeAccession(id);
  const drawn = bloodDrawn(id);
  const reported = resultsDate(drawn);
  const received = resultsDate(drawn.replace(/-\d+$/, "-" + String(parseInt(drawn.split("-")[2]) + 1)));

  const cell: React.CSSProperties = {
    border: "1px solid #999",
    padding: "4px 6px",
    fontSize: 13,
    fontFamily: "Arial, sans-serif",
    verticalAlign: "top",
    background: "#fff",
  };
  const label: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    color: "#333",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    marginBottom: 3,
    display: "block",
  };
  const value: React.CSSProperties = {
    fontSize: 13,
    color: "#111",
    fontFamily: "Arial, sans-serif",
  };
  const sectionHeader: React.CSSProperties = {
    background: "#4a90b8",
    color: "white",
    fontWeight: 700,
    fontSize: 11,
    padding: "5px 8px",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    fontFamily: "Arial, sans-serif",
    borderBottom: "1px solid #2d6e96",
  };

  return (
    <div ref={ref} style={{ width: CERT_W, height: CERT_H, background: "#fff", padding: "28px 32px", boxSizing: "border-box", fontFamily: "Arial, sans-serif", color: "#111" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, textAlign: "center", letterSpacing: "0.08em", color: "#111" }}>FORM SERIAL NUMBER</div>
          <div style={{ fontSize: 13, textAlign: "center", color: "#111", marginTop: 2 }}>{serial}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#1a7ab5", letterSpacing: "0.1em" }}>GVL</div>
          <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.05em" }}>GLOBAL VET LINK</div>
        </div>
      </div>

      {/* Section 1: Lab test info */}
      <div style={sectionHeader}>GVL – Equine Infectious Anemia Laboratory Test</div>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #999" }}>
        <tbody>
          <tr>
            <td style={{ ...cell, width: "22%" }}>
              <span style={label}>1. Lab/Accession Number</span>
              <span style={value}>{accession}</span>
            </td>
            <td style={{ ...cell, width: "20%" }}>
              <span style={label}>2. Date Blood Drawn</span>
              <span style={value}>{drawn}</span>
            </td>
            <td style={{ ...cell, width: "30%" }}>
              <span style={label}>3. Test Requested by Vet</span>
              <span style={value}>Dr. J. Nicks-Reyelle, DVM</span>
            </td>
            <td style={{ ...cell, width: "28%" }}>
              <span style={label}>4. Reason for Testing</span>
              <span style={value}>Annual</span>
            </td>
          </tr>
          <tr>
            <td style={{ ...cell, width: "40%" }} colSpan={2}>
              <span style={label}>5. Current Home Premises of Equine: Ranch / Farm / Stable / Market</span>
              <span style={value}>Redfield Equestrian Centre</span>
              <div style={{ ...value, fontSize: 11, color: "#444", marginTop: 2 }}>Southern Territories, The Rift</div>
            </td>
            <td style={{ ...cell, width: "30%" }}>
              <span style={label}>7. Name &amp; Address of Owner</span>
              <span style={value}>Redfield Equestrian Centre</span>
              <div style={{ ...value, fontSize: 11, color: "#444", marginTop: 2 }}>Southern Territories, The Rift</div>
            </td>
            <td style={{ ...cell, width: "30%" }}>
              <span style={label}>8. Name &amp; Address of Veterinarian</span>
              <span style={value}>Dr. J. Nicks-Reyelle, DVM</span>
              <div style={{ ...value, fontSize: 11, color: "#444", marginTop: 2 }}>REC Veterinary Services, The Rift</div>
            </td>
          </tr>
          <tr>
            <td style={{ ...cell }} colSpan={2}>
              <span style={label}>6. County of Current Home Premises of Equine</span>
              <span style={value}>Southern Territories</span>
            </td>
            <td style={{ ...cell }} colSpan={2}>
              <span style={label}>Veterinarian National Accreditation Number</span>
              <span style={value}>REC-VET-2024-0082</span>
            </td>
          </tr>
          <tr>
            <td style={{ ...cell }} colSpan={4}>
              <span style={label}>Certification of Federally Accredited Veterinarian</span>
              <span style={{ ...value, fontSize: 11, color: "#333" }}>
                I certify I am a category II federally accredited veterinarian, authorized, in the state where the sample was obtained, by me, from the animal described below.
              </span>
            </td>
          </tr>
          <tr>
            <td style={{ ...cell, height: 44 }} colSpan={4}>
              <span style={label}>Signature of Federally Accredited Veterinarian</span>
              <span style={{ fontFamily: "'Times New Roman', serif", fontSize: 22, fontStyle: "italic", color: "#1a1a1a" }}>J. Nicks-Reyelle</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Section 2: Horse */}
      <div style={{ marginTop: 10 }}>
        <div style={sectionHeader}>Horse</div>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #999" }}>
          <tbody>
            <tr>
              <td style={{ ...cell, width: "22%" }}>
                <span style={label}>9. Tube Number</span>
                <span style={value}>T-{accession.slice(-5)}</span>
              </td>
              <td style={{ ...cell, width: "20%" }}>
                <span style={label}>10. Freeze Brand</span>
                <span style={value}>—</span>
              </td>
              <td style={{ ...cell, width: "30%" }}>
                <span style={label}>11. Registered Name</span>
                <span style={value}>{name}</span>
              </td>
              <td style={{ ...cell, width: "28%" }}>
                <span style={label}>12. Color / Coat or Hair Color(s)</span>
                <span style={value}>{coat || "—"}</span>
              </td>
            </tr>
            <tr>
              <td style={{ ...cell }} colSpan={2}>
                <span style={label}>13. Breed or Species</span>
                <span style={value}>{breed || "—"}</span>
              </td>
              <td style={{ ...cell }}>
                <span style={label}>14. Age or DOB</span>
                <span style={value}>{dob ? formatDob(dob) : "—"}</span>
              </td>
              <td style={{ ...cell }}>
                <span style={label}>15. Gender</span>
                <span style={value}>{gender || "—"}</span>
              </td>
            </tr>
            <tr>
              <td style={{ ...cell }} colSpan={4}>
                <span style={label}>16. Microchip, Breed, or Registration Number</span>
                <span style={value}>{regNumber || "—"}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 3: Narrative description */}
      <div style={{ marginTop: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #999" }}>
          <tbody>
            <tr>
              <td style={{ ...cell, width: "50%", paddingBottom: 8 }}>
                <span style={label}>Narrative Description:</span>
              </td>
              <td style={{ ...cell, width: "50%", paddingBottom: 8 }}>
                <span style={label}>Other Marks and Brands:</span>
              </td>
            </tr>
            {[
              ["17. Head:", "18. Neck and Body:"],
              ["19. Left Forelimb:", "20. Right Forelimb:"],
              ["21. Left Hindlimb:", "22. Right Hindlimb:"],
            ].map(([l, r], i) => (
              <tr key={i}>
                <td style={{ ...cell, height: 28 }}>
                  <span style={label}>{l}</span>
                </td>
                <td style={{ ...cell, height: 28 }}>
                  <span style={label}>{r}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 4: Rabies vaccination */}
      <div style={{ marginTop: 10 }}>
        <div style={sectionHeader}>Rabies Vaccination</div>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #999" }}>
          <tbody>
            <tr>
              {["Type", "Vaccination Date", "Product", "Serial Number", "Expiration Date", "Administered By"].map((h) => (
                <td key={h} style={{ ...cell }}>
                  <span style={label}>{h}</span>
                  <span style={{ ...value, color: "#777", fontSize: 11 }}>—</span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 5: Lab use only */}
      <div style={{ marginTop: 10 }}>
        <div style={sectionHeader}>For Laboratory Use Only</div>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #999" }}>
          <tbody>
            <tr>
              <td style={{ ...cell, width: "28%" }}>
                <span style={label}>23. Laboratory</span>
                <span style={value}>GVL Veterinary Diagnostics</span>
                <div style={{ ...value, fontSize: 11, color: "#444", marginTop: 2 }}>Southwest Region</div>
              </td>
              <td style={{ ...cell, width: "18%" }}>
                <span style={label}>24. Date Sample Received</span>
                <span style={value}>{received}</span>
              </td>
              <td style={{ ...cell, width: "18%" }}>
                <span style={label}>25. Date Results Reported</span>
                <span style={value}>{reported}</span>
              </td>
              <td style={{ ...cell, width: "18%" }}>
                <span style={label}>26. Official Result</span>
                <span style={{ ...value, fontWeight: 700, color: "#1a7a2e" }}>Negative</span>
              </td>
              <td style={{ ...cell, width: "18%" }}>
                <span style={label}>27. Test Type Used</span>
                <span style={value}>AGID</span>
              </td>
            </tr>
            <tr>
              <td style={{ ...cell, height: 52 }} colSpan={5}>
                <span style={label}>28. Laboratory Remarks</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 6: Signatures */}
      <div style={{ marginTop: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #999" }}>
          <tbody>
            <tr>
              <td style={{ ...cell, height: 52, width: "60%" }}>
                <span style={label}>29. Signature of NVSL Approved EIA Technician</span>
                <span style={{ fontFamily: "'Times New Roman', serif", fontSize: 20, fontStyle: "italic", color: "#1a1a1a" }}>GVL Laboratory Services</span>
              </td>
              <td style={{ ...cell, width: "40%" }}>
                <span style={label}>30. Interim Result Referred for Confirmation</span>
                <span style={{ ...value, fontWeight: 700 }}>No</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 12, borderTop: "1px solid #ccc", paddingTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 9, color: "#555", fontFamily: "Arial, sans-serif" }}>
          Official EIA Test Form · Approved by USDA Veterinary Services · GVL
        </div>
        <div style={{ fontSize: 9, color: "#555", fontFamily: "Arial, sans-serif" }}>
          Form valid 12 months from date of draw · {drawn}
        </div>
      </div>
    </div>
  );
});
