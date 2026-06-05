"use client";
import { HorseData } from "@/lib/types";

interface PedigreeReviewFormProps {
  horse: HorseData;
  onChange: (key: keyof HorseData, value: string | boolean) => void;
}

export function PedigreeReviewForm({ horse, onChange }: PedigreeReviewFormProps) {
  // Reuse the fieldStyle and labelStyle from HorseForm for consistency
  const fieldStyle: React.CSSProperties = {
    border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px",
    fontSize: 13, background: "var(--white)", color: "var(--text)",
    fontFamily: "var(--font-lato)", outline: "none", width: "100%",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, letterSpacing: "0.1em", color: "var(--text-muted)",
    textTransform: "uppercase", fontFamily: "var(--font-lato)", fontWeight: 600,
    display: "block", marginBottom: 4,
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginTop: 26, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
      <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 17, color: "var(--teal-dark)", marginBottom: 14 }}>{title}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {children}
      </div>
    </div>
  );

  const Text = ({ k, label, ph, full }: { k: keyof HorseData; label: string; ph?: string; full?: boolean }) => (
    <div style={full ? { gridColumn: "1 / -1" } : undefined}>
      <label style={labelStyle}>{label}</label>
      <input value={(horse[k] as string) ?? ""} onChange={(e) => onChange(k, e.target.value)} style={fieldStyle} placeholder={ph} />
    </div>
  );

  return (
    <Section title="Root Horse Details (Detected from Pedigree)">
      <Text k="name" label="Horse Name *" ph="[REC] HORSE NAME" full />
      <Text k="breed" label="Breed" ph="e.g. Arabian" />
      <Text k="gender" label="Gender" ph="e.g. Mare" />
      <Text k="coat" label="Coat" ph="e.g. Bay" />
      <Text k="genotype" label="Genotype" ph="e.g. E_A_" />
      <Text k="sireName" label="Sire Name" ph="[TAG] SIRE NAME" />
      <Text k="damName" label="Dam Name" ph="[TAG] DAM NAME" />
    </Section>
  );
}
