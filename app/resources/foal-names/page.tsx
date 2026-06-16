import type { Metadata } from "next";
import FoalNameClient from "./FoalNameClient";

export const metadata: Metadata = {
  title: "Foal Name Generator · Redfield Equestrian Centre",
  description: "Generate foal name ideas by blending sire and dam names.",
};

export default function FoalNamePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 40, color: "var(--teal-dark)", marginBottom: 8 }}>
          Foal Name Generator
        </h1>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Enter the sire and dam names to generate blended foal name suggestions. Useful as a starting point — mix, match, or adapt freely.
        </p>
      </div>
      <FoalNameClient />
    </main>
  );
}
