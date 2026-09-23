"use client";
import { useState, useCallback } from "react";

interface PedNode {
  name: string;
  sire?: PedNode | null;
  dam?: PedNode | null;
}

interface AncestorContribution {
  name: string;
  sireDepths: number[];
  damDepths: number[];
  contribution: number;
}

function isPlaceholder(name: string) {
  const n = name.trim().toLowerCase();
  return n.startsWith("foundation") || n.startsWith("unknown");
}

function collect(node: PedNode | null | undefined, depth: number, map: Map<string, number[]>) {
  if (!node) return;
  const key = node.name.trim().toLowerCase();
  if (!isPlaceholder(node.name)) {
    const arr = map.get(key);
    if (arr) arr.push(depth);
    else map.set(key, [depth]);
  }
  collect(node.sire, depth + 1, map);
  collect(node.dam, depth + 1, map);
}

function computeCoi(sire: PedNode, dam: PedNode): { coi: number; contributors: AncestorContribution[] } {
  const sireMap = new Map<string, number[]>();
  const damMap  = new Map<string, number[]>();
  collect(sire, 0, sireMap);
  collect(dam,  0, damMap);

  let coi = 0;
  const contributors: AncestorContribution[] = [];

  for (const [key, sireDepths] of sireMap) {
    const damDepths = damMap.get(key);
    if (!damDepths) continue;
    let contrib = 0;
    for (const n1 of sireDepths) for (const n2 of damDepths) contrib += Math.pow(0.5, n1 + n2 + 1);
    coi += contrib;
    contributors.push({ name: key, sireDepths, damDepths, contribution: contrib });
  }

  contributors.sort((a, b) => b.contribution - a.contribution);
  return { coi: Math.min(coi, 1), contributors };
}

function parseNode(raw: unknown): PedNode | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // Rift Trails flat export format: { app: "Rift Trails Pedigree Creator", horses: [...], rootHorse: "..." }
  if (r.app === "Rift Trails Pedigree Creator" && Array.isArray(r.horses)) {
    const horses = r.horses as Record<string, unknown>[];
    const byName = new Map<string, Record<string, unknown>>();
    for (const h of horses) if (typeof h.name === "string") byName.set(h.name, h);

    function buildFromFlat(name: string, seen = new Set<string>()): PedNode {
      const h = byName.get(name);
      if (!h || seen.has(name)) return { name };
      const next = new Set(seen); next.add(name);
      return {
        name,
        sire: typeof h.sire === "string" && h.sire ? buildFromFlat(h.sire, next) : null,
        dam:  typeof h.dam  === "string" && h.dam  ? buildFromFlat(h.dam,  next) : null,
      };
    }

    const root = typeof r.rootHorse === "string" ? r.rootHorse : horses[0]?.name as string;
    if (!root) return null;
    return buildFromFlat(root);
  }

  // Standard nested format: { name, sire: {...}, dam: {...} }
  const name = (typeof r.name === "string" ? r.name : typeof r.id === "string" ? r.id : "").trim();
  if (!name) return null;
  return {
    name,
    sire: parseNode(r.sire ?? r.father ?? null),
    dam:  parseNode(r.dam  ?? r.mother ?? null),
  };
}

const inp: React.CSSProperties = {
  border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px",
  fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text)",
  background: "var(--white)", width: "100%", boxSizing: "border-box",
};

function CoiBar({ value }: { value: number }) {
  const pct = value * 100;
  const color = pct < 6.25 ? "#3a7a50" : pct < 12.5 ? "#8a6a00" : "#8a2020";
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ height: 10, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(pct * 4, 100)}%`, background: color, borderRadius: 99, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

function CoiResult({ coi, contributors, label }: { coi: number; contributors: AncestorContribution[]; label: string }) {
  const pct = (coi * 100).toFixed(2);
  const risk = coi < 0.0625 ? { text: "Low", color: "#3a7a50" } : coi < 0.125 ? { text: "Moderate", color: "#8a6a00" } : { text: "High", color: "#8a2020" };

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: "24px 28px" }}>
      <div style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)", marginBottom: 16 }}>{label}</div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-playfair)", fontSize: 48, color: risk.color, lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontFamily: "var(--font-lato)", fontSize: 16, fontWeight: 700, color: risk.color }}>{risk.text}</span>
      </div>
      <CoiBar value={coi} />

      {contributors.length === 0 ? (
        <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)", marginTop: 16 }}>
          No shared ancestors found. COI is 0%.
        </p>
      ) : (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Shared ancestors driving inbreeding
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {contributors.map((c) => (
              <div key={c.name} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-lato)", fontSize: 15, fontWeight: 700, color: "var(--teal-dark)", textTransform: "capitalize" }}>{c.name}</span>
                  <span style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)" }}>+{(c.contribution * 100).toFixed(2)}%</span>
                </div>
                <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  Appears {c.sireDepths.length === 1 ? "once" : `${c.sireDepths.length}x`} in sire line (gen {c.sireDepths.map(d => d + 1).join(", ")}), {c.damDepths.length === 1 ? "once" : `${c.damDepths.length}x`} in dam line (gen {c.damDepths.map(d => d + 1).join(", ")})
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)", marginTop: 14, lineHeight: 1.6 }}>
            Generation 1 = parent, Generation 2 = grandparent, and so on.
            COI below 6.25% is generally considered low risk. Above 12.5% raises concern for expression of recessive traits.
          </p>
        </div>
      )}
    </div>
  );
}

function UploadBox({ label, onLoad, loaded }: { label: string; onLoad: (node: PedNode) => void; loaded: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  const handle = useCallback((file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        const node = parseNode(raw);
        if (!node) { setError("Could not read a horse name from this JSON."); return; }
        setName(node.name);
        onLoad(node);
      } catch {
        setError("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  }, [onLoad]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handle(file);
  }, [handle]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handle(file);
  };

  return (
    <div>
      <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
      <label
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          border: `2px dashed ${loaded ? "var(--teal)" : "var(--border)"}`,
          borderRadius: 10, padding: "28px 20px", cursor: "pointer",
          background: loaded ? "rgba(135,155,149,0.06)" : "var(--white)",
          transition: "border-color 0.2s, background 0.2s",
          textAlign: "center",
        }}
      >
        <input type="file" accept=".json,application/json" style={{ display: "none" }} onChange={onChange} />
        {loaded && name ? (
          <>
            <div style={{ fontFamily: "var(--font-playfair)", fontSize: 20, color: "var(--teal-dark)", marginBottom: 4 }}>{name}</div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--teal)" }}>Loaded. Click to replace.</div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)" }}>Drop JSON here or click to upload</div>
            <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Pedigree tree format</div>
          </>
        )}
      </label>
      {error && <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "#8a2020", marginTop: 6 }}>{error}</div>}
    </div>
  );
}

type Tab = "single" | "pairing";

export default function CoiCalculatorClient() {
  const [tab, setTab] = useState<Tab>("single");
  const [horse, setHorse] = useState<PedNode | null>(null);
  const [sire, setSire]   = useState<PedNode | null>(null);
  const [dam, setDam]     = useState<PedNode | null>(null);

  const singleResult  = horse ? computeCoi(horse.sire ?? { name: "__none__" }, horse.dam ?? { name: "__none__" }) : null;
  const pairingResult = sire && dam ? computeCoi(sire, dam) : null;

  const tabStyle = (t: Tab): React.CSSProperties => ({
    fontFamily: "var(--font-lato)", fontSize: 14, fontWeight: 700,
    padding: "10px 22px", borderRadius: 8, cursor: "pointer",
    border: tab === t ? "2px solid var(--teal-dark)" : "2px solid var(--border)",
    background: tab === t ? "var(--teal-dark)" : "var(--white)",
    color: tab === t ? "white" : "var(--text-muted)",
    transition: "background 0.15s, color 0.15s, border-color 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 4, background: "var(--bg)", borderRadius: 10, padding: 4, alignSelf: "flex-start" }}>
        <button type="button" style={tabStyle("single")} onClick={() => setTab("single")}>Single horse</button>
        <button type="button" style={tabStyle("pairing")} onClick={() => setTab("pairing")}>Mare and stallion pairing</button>
      </div>

      {tab === "single" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 24px" }}>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)", margin: "0 0 16px", lineHeight: 1.6 }}>
              Upload the pedigree JSON for a single horse to calculate its own coefficient of inbreeding.
            </p>
            <UploadBox label="Horse pedigree" onLoad={setHorse} loaded={!!horse} />
          </div>
          {singleResult && horse && (
            <CoiResult coi={singleResult.coi} contributors={singleResult.contributors} label={`COI for ${horse.name}`} />
          )}
        </div>
      )}

      {tab === "pairing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: "20px 24px" }}>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)", margin: "0 0 16px", lineHeight: 1.6 }}>
              Upload a stallion and a mare to calculate the expected COI of their foal.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <UploadBox label="Stallion" onLoad={setSire} loaded={!!sire} />
              <UploadBox label="Mare"     onLoad={setDam}  loaded={!!dam}  />
            </div>
          </div>
          {pairingResult && sire && dam && (
            <CoiResult coi={pairingResult.coi} contributors={pairingResult.contributors} label={`Foal COI: ${sire.name} x ${dam.name}`} />
          )}
        </div>
      )}
    </div>
  );
}
