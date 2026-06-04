"use client";
import { useState } from "react";

export interface ResultItem {
  id: string;
  date: string | null;
  event: string;
  placement: string | null;
  notes: string | null;
}

export default function ResultManager({ horseId, initial }: { horseId: string; initial: ResultItem[] }) {
  const [results, setResults] = useState<ResultItem[]>(initial);
  const [event, setEvent] = useState("");
  const [placement, setPlacement] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!event.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/horses/${horseId}/results`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, placement, date: date || null, notes }),
    });
    setBusy(false);
    if (res.ok) {
      const { result } = await res.json();
      setResults((r) => [...r, result]);
      setEvent(""); setPlacement(""); setDate(""); setNotes("");
    }
  }

  async function remove(id: string) {
    await fetch(`/api/results/${id}`, { method: "DELETE" });
    setResults((r) => r.filter((x) => x.id !== id));
  }

  const input = { border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", fontSize: 13, fontFamily: "var(--font-lato)", outline: "none", background: "var(--white)" };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <input value={event} onChange={(e) => setEvent(e.target.value)} placeholder="Event / show" style={{ ...input, flex: 2, minWidth: 160 }} />
        <input value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="Placement (e.g. 1st)" style={{ ...input, flex: 1, minWidth: 110 }} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={input} />
        <button type="button" onClick={add} disabled={busy} style={{ background: "var(--teal)", color: "white", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-lato)" }}>Add</button>
      </div>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" style={{ ...input, width: "100%", marginBottom: 16 }} />

      {results.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-lato)" }}>No results logged yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {results.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px", background: "var(--white)", fontFamily: "var(--font-lato)", fontSize: 13 }}>
              {r.placement && <span style={{ background: "var(--gold-light)", color: "#6B5A2A", borderRadius: 10, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>{r.placement}</span>}
              <span style={{ flex: 1, fontWeight: 600, color: "var(--teal-dark)" }}>{r.event}</span>
              {r.date && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(r.date).toLocaleDateString()}</span>}
              <button type="button" onClick={() => remove(r.id)} style={{ border: "none", background: "none", color: "#C05050", cursor: "pointer" }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
