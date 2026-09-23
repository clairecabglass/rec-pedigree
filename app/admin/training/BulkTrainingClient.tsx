"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Dumbbell } from "lucide-react";

interface Horse {
  id: string;
  name: string;
  breed: string | null;
  lifeStage: string | null;
  assignedCharacter: string | null;
  trainingExp: number;
}

const inp: React.CSSProperties = {
  border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px",
  fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text)",
  background: "var(--white)", boxSizing: "border-box",
};

const FOAL_STAGES = ["Gestation", "Weanling", "Yearling", "Youngster"];

export default function BulkTrainingClient({ horses }: { horses: Horse[] }) {
  const router = useRouter();

  const trainable = useMemo(
    () => horses.filter((h) => !FOAL_STAGES.includes(h.lifeStage ?? "")),
    [horses]
  );

  const [search, setSearch] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? trainable.filter((h) => h.name.toLowerCase().includes(q) || (h.breed ?? "").toLowerCase().includes(q))
      : trainable;
  }, [trainable, search]);

  const dirty = Object.entries(values).filter(([, v]) => v.trim() !== "");

  async function handleSave() {
    if (dirty.length === 0) return;
    setSaving(true);
    setDone(null);

    const payload = dirty.map(([id, v]) => ({
      id,
      amount: Math.max(0, parseInt(v, 10) || 0),
      mode: "set" as const,
    }));

    try {
      const res = await fetch("/api/admin/bulk-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setDone(data.updated ?? 0);
      setValues({});
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 420 }}>
        <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
        <input
          style={{ ...inp, paddingLeft: 32, width: "100%" }}
          placeholder="Search horses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)" }}>
        Type a new EXP total in any row to update it. Leave blank to skip. Click Save when done.
      </div>

      {/* Table */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>

        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 140px 140px 140px",
          padding: "10px 18px", borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
        }}>
          {["Horse", "Character", "Current EXP", "New EXP"].map((h) => (
            <div key={h} style={{ fontFamily: "var(--font-lato)", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: "32px 18px", textAlign: "center", fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)" }}>
            No trainable horses found.
          </div>
        )}

        {filtered.map((h) => {
          const val = values[h.id] ?? "";
          const newTotal = val.trim() !== "" ? Math.max(0, parseInt(val, 10) || 0) : null;
          const changed = val.trim() !== "";

          return (
            <div
              key={h.id}
              style={{
                display: "grid", gridTemplateColumns: "1fr 140px 140px 140px",
                padding: "12px 18px", borderBottom: "1px solid var(--border)",
                alignItems: "center",
                background: changed ? "rgba(135,155,149,0.06)" : "transparent",
              }}
            >
              <div>
                <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, fontWeight: 700, color: "var(--teal-dark)" }}>{h.name}</div>
                {h.breed && <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "var(--text-muted)" }}>{h.breed}</div>}
              </div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)" }}>
                {h.assignedCharacter ?? "—"}
              </div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text)", fontWeight: changed ? 400 : 600 }}>
                {h.trainingExp.toLocaleString()}
                {newTotal !== null && newTotal !== h.trainingExp && (
                  <span style={{ color: "var(--teal)", marginLeft: 6, fontSize: 12 }}>→ {newTotal.toLocaleString()}</span>
                )}
              </div>
              <div>
                <input
                  type="number" min="0"
                  style={{ ...inp, width: 110, borderColor: changed ? "var(--teal)" : "var(--border)" }}
                  value={val}
                  placeholder={h.trainingExp.toString()}
                  onChange={(e) => setValues((prev) => ({ ...prev, [h.id]: e.target.value }))}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Save bar */}
      {dirty.length > 0 && (
        <div style={{
          position: "sticky", bottom: 20,
          background: "var(--teal-dark)", borderRadius: 12, padding: "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)", gap: 16,
        }}>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "white" }}>
            <strong>{dirty.length}</strong> horse{dirty.length !== 1 ? "s" : ""} to update
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: "white", color: "var(--teal-dark)", border: "none", borderRadius: 8,
              padding: "10px 22px", fontFamily: "var(--font-lato)", fontSize: 14, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <Dumbbell size={16} />
            {saving ? "Saving..." : "Save EXP"}
          </button>
        </div>
      )}

      {done !== null && (
        <div style={{
          background: "var(--white)", border: "1px solid var(--teal)", borderRadius: 8,
          padding: "14px 20px", fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--teal-dark)",
        }}>
          Updated training EXP for {done} horse{done !== 1 ? "s" : ""}.
        </div>
      )}
    </div>
  );
}
