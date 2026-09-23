import type { Metadata } from "next";
import Link from "next/link";
import CoiCalculatorClient from "./CoiCalculatorClient";

export const metadata: Metadata = {
  title: "COI Calculator · Redfield Equestrian Centre",
  description: "Calculate the coefficient of inbreeding for any horse or planned pairing using a pedigree JSON.",
};

export default function CoiCalculatorPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <div style={{ marginBottom: 20 }}>
        <Link href="/resources" style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none", fontFamily: "var(--font-lato)" }}>
          Resources
        </Link>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 36, color: "var(--teal-dark)", margin: "0 0 8px" }}>
          COI Calculator
        </h1>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
          Upload a pedigree JSON to calculate the coefficient of inbreeding (COI) for a horse or a planned pairing.
          The calculator runs entirely in your browser and shows which shared ancestors are driving the number.
        </p>
      </div>

      <div style={{ background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 18px", marginBottom: 24, fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
        Export your horse&apos;s pedigree JSON from its registry page, or build one manually.
        The JSON needs a <code style={{ color: "var(--teal-dark)" }}>name</code> field at the top level and optional <code style={{ color: "var(--teal-dark)" }}>sire</code> / <code style={{ color: "var(--teal-dark)" }}>dam</code> objects nested inside.
      </div>

      <CoiCalculatorClient />
    </main>
  );
}
