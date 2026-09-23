"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckSquare, Square, Dumbbell } from "lucide-react";

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // per-horse overrides; if absent, uses bulk amount
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [bulkAmount, setBulkAmount] = useState("100");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? trainable.filter((h) => h.name.toLowerCase().includes(q) || (h.breed ?? "").toLowerCase().includes(q)) : trainable;
  }, [trainable, search]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((h) => selected.has(h.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((h) => next.delete(h.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((h) => next.add(h.id));
        return next;
      });
    }
  }

  function getAmount(id: string): number {
    const raw = overrides[id] !== undefined ? overrides[id] : bulkAmount;
    const n = parseInt(raw, 10);
    return isNaN(n) || n < 0 ? 0 : n;
  }

  async function handleSave() {
    if (selected.size === 0) return;
    setSaving(true);
    setDone(null);
    const payload = [...selected].map((id) => ({ id, amount: getAmount(id) })).filter((x) => x.amount > 0);
    try {
      const res = await fetch("/api/admin/bulk-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setDone(data.updated ?? 0);
      setSelected(new Set());
      setOverrides({});
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const selectedArr = trainable.filter((h) => selected.has(h.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Controls row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            style={{ ...inp, paddingLeft: 32, width: "100%" }}
            placeholder="Search horses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            Default EXP to add
          </label>
          <input
            type="number" min="0"
            style={{ ...inp, width: 90 }}
            value={bulkAmount}
            onChange={(e) => setBulkAmount(e.target.value)}
          />
        </div>
      </div>

      {/* Horse table */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "40px 1fr 120px 100px 110px",
          padding: "10px 16px", borderBottom: "1px solid var(--border)",
          background: "var(--bg)",
        }}>
          <button type="button" onClick={toggleAll} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--teal-dark)", display: "flex", alignItems: "center" }}>
            {allFilteredSelected ? <CheckSquare size={18} /> : <Square size={18} />}
          </button>
          {["Horse", "Current EXP", "Character", "EXP to Add"].map((h) => (
            <div key={h} style={{ fontFamily: "var(--font-lato)", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: "32px 16px", textAlign: "center", fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)" }}>
            No trainable horses found.
          </div>
        )}

        {filtered.map((h) => {
          const isSelected = selected.has(h.id);
          return (
            <div
              key={h.id}
              onClick={() => toggle(h.id)}
              style={{
                display: "grid", gridTemplateColumns: "40px 1fr 120px 100px 110px",
                padding: "12px 16px", borderBottom: "1px solid var(--border)",
                alignItems: "center", cursor: "pointer",
                background: isSelected ? "rgba(135,155,149,0.07)" : "transparent",
                transition: "background 0.1s",
              }}
            >
              <div style={{ color: isSelected ? "var(--teal-dark)" : "var(--text-muted)", display: "flex", alignItems: "center" }}>
                {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, fontWeight: 700, color: "var(--teal-dark)" }}>{h.name}</div>
                {h.breed && <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "var(--text-muted)" }}>{h.breed}</div>}
              </div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text)" }}>
                {h.trainingExp.toLocaleString()}
              </div>
              <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "var(--text-muted)" }}>
                {h.assignedCharacter ?? "—"}
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                {isSelected ? (
                  <input
                    type="number" min="0"
                    style={{ ...inp, width: 80 }}
                    value={overrides[h.id] !== undefined ? overrides[h.id] : bulkAmount}
                    onChange={(e) => setOverrides((prev) => ({ ...prev, [h.id]: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)" }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save bar */}
      {selected.size > 0 && (
        <div style={{
          position: "sticky", bottom: 20,
          background: "var(--teal-dark)", borderRadius: 12, padding: "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)", gap: 16, flexWrap: "wrap",
        }}>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "white" }}>
            <strong>{selected.size}</strong> horse{selected.size !== 1 ? "s" : ""} selected &mdash;{" "}
            adding {selectedArr.map((h) => `${getAmount(h.id).toLocaleString()} EXP to ${h.name}`).slice(0, 3).join(", ")}
            {selectedArr.length > 3 ? `, and ${selectedArr.length - 3} more` : ""}
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
            {saving ? "Saving..." : "Save Training"}
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
