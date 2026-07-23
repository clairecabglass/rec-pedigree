"use client";
import { useState } from "react";

export interface Player {
  id: string; ign: string; username: string;
  stableName: string | null; stablePrefix: string | null; notes: string | null;
}

const blank = (): Omit<Player, "id"> => ({ ign: "", username: "", stableName: "", stablePrefix: "", notes: "" });

const inp: React.CSSProperties = {
  border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px",
  fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text)",
  background: "var(--white)", width: "100%", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  fontFamily: "var(--font-lato)", fontSize: 11, fontWeight: 700,
  color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em",
  display: "block", marginBottom: 4,
};

function PlayerForm({ initial, onSave, onCancel, saving }: {
  initial: Omit<Player, "id">;
  onSave: (p: Omit<Player, "id">) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={lbl}>Character Name (IGN) *</label>
          <input style={inp} value={form.ign} onChange={set("ign")} placeholder="e.g. Elara Ashwood" />
        </div>
        <div>
          <label style={lbl}>Username *</label>
          <input style={inp} value={form.username} onChange={set("username")} placeholder="e.g. claire_w" />
        </div>
        <div>
          <label style={lbl}>Stable Name</label>
          <input style={inp} value={form.stableName || ""} onChange={set("stableName")} placeholder="e.g. Ashwood Stables" />
        </div>
        <div>
          <label style={lbl}>Stable Prefix</label>
          <input style={inp} value={form.stablePrefix || ""} onChange={set("stablePrefix")} placeholder="e.g. ASW" />
        </div>
      </div>
      <div>
        <label style={lbl}>Notes</label>
        <textarea style={{ ...inp, resize: "vertical", minHeight: 60 }} value={form.notes || ""} onChange={set("notes")} placeholder="Any extra info…" />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button" disabled={saving || !form.ign.trim()}
          onClick={() => onSave(form)}
          style={{ background: "var(--teal-dark)", color: "white", border: "none", borderRadius: 6, padding: "9px 20px", fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 13, cursor: saving || !form.ign.trim() ? "not-allowed" : "pointer", opacity: saving || !form.ign.trim() ? 0.6 : 1 }}
        >{saving ? "Saving…" : "Save"}</button>
        <button
          type="button" onClick={onCancel}
          style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 16px", fontFamily: "var(--font-lato)", fontSize: 13, cursor: "pointer" }}
        >Cancel</button>
      </div>
    </div>
  );
}

export default function PlayersClient({ initial }: { initial: Player[] }) {
  const [players, setPlayers]     = useState<Player[]>(initial);
  const [adding, setAdding]       = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState("");
  const [confirm, setConfirm]     = useState<string | null>(null);

  const filtered = players.filter(p =>
    [p.ign, p.username, p.stableName, p.stablePrefix].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleAdd(form: Omit<Player, "id">) {
    setSaving(true);
    try {
      const res = await fetch("/api/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const created = await res.json();
      setPlayers(p => [...p, created].sort((a, b) => a.ign.localeCompare(b.ign)));
      setAdding(false);
    } finally { setSaving(false); }
  }

  async function handleEdit(id: string, form: Omit<Player, "id">) {
    setSaving(true);
    try {
      const res = await fetch(`/api/players/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const updated = await res.json();
      setPlayers(p => p.map(x => x.id === id ? updated : x).sort((a, b) => a.ign.localeCompare(b.ign)));
      setEditId(null);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/players/${id}`, { method: "DELETE" });
    setPlayers(p => p.filter(x => x.id !== id));
    setConfirm(null);
  }

  const card: React.CSSProperties = {
    background: "var(--white)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "20px 24px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          style={{ ...inp, maxWidth: 300 }}
          placeholder="Search players…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <div style={{ flex: 1 }} />
        {!adding && (
          <button
            type="button" onClick={() => setAdding(true)}
            style={{ background: "var(--teal-dark)", color: "white", border: "none", borderRadius: 6, padding: "9px 18px", fontFamily: "var(--font-lato)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >+ Add Player</button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ ...card, border: "2px solid var(--teal)" }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 16, color: "var(--teal-dark)", marginBottom: 14 }}>New Player</div>
          <PlayerForm initial={blank()} onSave={handleAdd} onCancel={() => setAdding(false)} saving={saving} />
        </div>
      )}

      {/* Player list */}
      {filtered.length === 0 && !adding && (
        <div style={{ textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14, padding: "40px 0" }}>
          {search ? "No players match that search." : "No players yet — add one above."}
        </div>
      )}

      {filtered.map(p => (
        <div key={p.id} style={card}>
          {editId === p.id ? (
            <>
              <div style={{ fontFamily: "var(--font-playfair)", fontSize: 16, color: "var(--teal-dark)", marginBottom: 14 }}>Edit Player</div>
              <PlayerForm
                initial={{ ign: p.ign, username: p.username, stableName: p.stableName, stablePrefix: p.stablePrefix, notes: p.notes }}
                onSave={form => handleEdit(p.id, form)}
                onCancel={() => setEditId(null)}
                saving={saving}
              />
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              {/* Avatar letter */}
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--teal)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-lato)", fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
                {p.ign[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)", marginBottom: 2 }}>{p.ign}</div>
                <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>@{p.username}</div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {p.stableName   && <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text)" }}><strong style={{ color: "var(--text-muted)" }}>Stable:</strong> {p.stableName}</span>}
                  {p.stablePrefix && <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text)" }}><strong style={{ color: "var(--text-muted)" }}>Prefix:</strong> {p.stablePrefix}</span>}
                  {p.notes        && <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>{p.notes}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button type="button" onClick={() => setEditId(p.id)} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 14px", fontFamily: "var(--font-lato)", fontSize: 13, cursor: "pointer", color: "var(--text)" }}>Edit</button>
                {confirm === p.id ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "var(--text-muted)" }}>Delete?</span>
                    <button type="button" onClick={() => handleDelete(p.id)} style={{ background: "#c0392b", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", fontFamily: "var(--font-lato)", fontSize: 13, cursor: "pointer" }}>Yes</button>
                    <button type="button" onClick={() => setConfirm(null)} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", fontFamily: "var(--font-lato)", fontSize: 13, cursor: "pointer" }}>No</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirm(p.id)} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 14px", fontFamily: "var(--font-lato)", fontSize: 13, cursor: "pointer", color: "#c0392b" }}>Delete</button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
