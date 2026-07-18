"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { CertBody as CogginsCertBody } from "../coggins/CogginsClient";
import { CertBody as TrainingCertBody } from "../training-cert/TrainingCertClient";
import { CertBody as EcgcCertBody, parseGeno, buildRows, buildInterpretation } from "../genetics-cert/GeneticsCertClient";

const ECGC_W = 1240;
const ECGC_H = 1754;

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface Props {
  id: string;
  name: string;
  breed: string;
  gender: string;
  dob: string;
  regNumber: string;
  coat: string;
  genotype: string;
  templateDataUri: string;
  sigLab: string;
}

export default function BulkDownloader({ id, name, breed, gender, dob, regNumber, coat, genotype, templateDataUri, sigLab }: Props) {
  const ecgcRef     = useRef<HTMLDivElement>(null);
  const cogginsRef  = useRef<HTMLDivElement>(null);
  const trainingRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<string | null>(null);

  const geno        = parseGeno(genotype);
  const rows        = buildRows(geno, coat);
  const interpretation = buildInterpretation(geno, coat, name);
  const testDate    = new Date().toLocaleDateString("en-GB");
  const baseRows    = rows.slice(0, 2);
  const diluteRows  = rows.slice(2, 11);
  const patternRows = rows.slice(11);

  async function capture(ref: React.RefObject<HTMLDivElement | null>, label: string) {
    if (!ref.current) return;
    await toPng(ref.current, { pixelRatio: 2, cacheBust: true });
    return toPng(ref.current, { pixelRatio: 2, cacheBust: true });
  }

  async function handleBulkDownload() {
    setStatus("Generating ECGC…");
    const ecgcUrl = await capture(ecgcRef, "ecgc");
    if (ecgcUrl) { const a = document.createElement("a"); a.href = ecgcUrl; a.download = `${slugify(name)}-genetics-cert.png`; a.click(); }
    await new Promise(r => setTimeout(r, 600));

    setStatus("Generating Coggins…");
    const cogginsUrl = await capture(cogginsRef, "coggins");
    if (cogginsUrl) { const a = document.createElement("a"); a.href = cogginsUrl; a.download = `${slugify(name)}-coggins.png`; a.click(); }
    await new Promise(r => setTimeout(r, 600));

    setStatus("Generating Training Cert…");
    const trainingUrl = await capture(trainingRef, "training");
    if (trainingUrl) { const a = document.createElement("a"); a.href = trainingUrl; a.download = `${slugify(name)}-training-cert.png`; a.click(); }

    setStatus(null);
  }

  return (
    <>
      <button
        onClick={handleBulkDownload}
        disabled={!!status}
        style={{
          background: status ? "var(--border)" : "var(--teal-dark)",
          color: "white", border: "none", borderRadius: 8,
          padding: "10px 20px", fontFamily: "var(--font-lato)", fontWeight: 700,
          fontSize: 14, cursor: status ? "not-allowed" : "pointer",
          opacity: status ? 0.7 : 1, whiteSpace: "nowrap",
        }}
      >
        {status ?? "↓ Download All"}
      </button>

      {/* Off-screen render targets */}
      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
        <div ref={ecgcRef} style={{ width: ECGC_W, height: ECGC_H }}>
          <EcgcCertBody
            name={name} breed={breed} gender={gender} dob={dob}
            regNumber={regNumber} testDate={testDate}
            baseRows={baseRows} diluteRows={diluteRows} patternRows={patternRows}
            interpretation={interpretation} sigBreeder="" sigLab={sigLab}
          />
        </div>
        <div ref={cogginsRef}>
          <CogginsCertBody id={id} name={name} breed={breed} gender={gender} dob={dob} regNumber={regNumber} coat={coat} />
        </div>
        <div ref={trainingRef}>
          <TrainingCertBody name={name} templateDataUri={templateDataUri} />
        </div>
      </div>
    </>
  );
}
