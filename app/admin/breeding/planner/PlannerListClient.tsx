"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface PlanSummary {
  id: string; title: string; status: string;
  goal: Record<string, unknown>; notes: string | null;
  createdAt: string; updatedAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  active:    { bg: "var(--teal-muted)",   text: "var(--teal-dark)",    border: "var(--teal)" },
  paused:    { bg: "var(--sand-bg)",      text: "var(--sand-text)",    border: "var(--sand-border)" },
  completed: { bg: "var(--sage-bg)",      text: "var(--sage-text)",    border: "var(--sage-border)" },
  archived:  { bg: "var(--cream-dark)",   text: "var(--text-muted)",   border: "var(--border)" },
};

export default function PlannerListClient({ plans: initial }: { plans: PlanSummary[] }) {
  const router = useRouter();
  const [plans, setPlans] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBreed, setNewBreed] = useState("");
  const [newGen, setNewGen] = useState("8");
  const [newCOI, setNewCOI] = useState("6.25");
  const [showForm, setShowForm] = useState(false);

  const btn: React.CSSProperties = {
    padding: "8px 18px", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-lato)",
    fontSize: 13, fontWeight: 700, border: "none",
  };
  const inp: React.CSSProperties = {
    border: "1px solid var(--border)", borderRadius: 4, padding: "7px 10px",
    fontSize: 13, fontFamily: "var(--font-lato)", background: "var(--white)",
    color: "var(--text)", width: "100%", boxSizing: "border-box",
  };

  async function createPlan() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/herd-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          goal: { breed: newBreed.trim() || null, targetGen: parseInt(newGen) || 8, coiCeiling: parseFloat(newCOI) || 6.25 },
        }),
      });
      const plan = await res.json();
      router.push(`/admin/breeding/planner/${plan.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function deletePlan(id: string) {
    if (!confirm("Delete this plan?")) return;
    await fetch(`/api/herd-plans/${id}`, { method: "DELETE" });
    setPlans((p) => p.filter((x) => x.id !== id));
  }

  const card: React.CSSProperties = {
    background: "var(--white)", border: "1px solid var(--border)", borderRadius: 8,
    padding: "20px 24px", marginBottom: 12,
  };

  return (
    <div>
      {/* Create new */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} style={{ ...btn, background: "var(--teal-dark)", color: "white", marginBottom: 28 }}>
          + New Plan
        </button>
      ) : (
        <div style={{ ...card, marginBottom: 28, borderColor: "var(--teal)", borderWidth: 2 }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 16, color: "var(--teal-dark)", marginBottom: 16 }}>New Breeding Plan</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Plan title *</span>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={inp} placeholder="e.g. Gen 8 KWPN Project" onKeyDown={(e) => e.key === "Enter" && createPlan()} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Target breed</span>
              <input value={newBreed} onChange={(e) => setNewBreed(e.target.value)} style={inp} placeholder="e.g. KWPN" />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Target gen</span>
              <input type="number" value={newGen} onChange={(e) => setNewGen(e.target.value)} style={inp} min={1} max={12} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>COI ceiling %</span>
              <input type="number" value={newCOI} onChange={(e) => setNewCOI(e.target.value)} style={inp} step={0.01} min={0} max={25} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={createPlan} disabled={creating || !newTitle.trim()} style={{ ...btn, background: "var(--teal-dark)", color: "white", opacity: creating || !newTitle.trim() ? 0.5 : 1 }}>
              {creating ? "Creating…" : "Create Plan"}
            </button>
            <button onClick={() => setShowForm(false)} style={{ ...btn, background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Plan list */}
      {plans.length === 0 && (
        <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "var(--text-muted)" }}>
          No plans yet. Create one above to get started.
        </p>
      )}
      {plans.map((plan) => {
        const goal = plan.goal;
        const sc = STATUS_COLORS[plan.status] ?? STATUS_COLORS.active;
        return (
          <div key={plan.id} style={card}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)" }}>{plan.title}</span>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-lato)", fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {plan.status}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text-muted)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {!!goal.breed      && <span>🐴 {goal.breed      as string}</span>}
                  {!!goal.targetGen  && <span>Gen {goal.targetGen  as number}</span>}
                  {!!goal.coiCeiling && <span>COI &lt; {goal.coiCeiling as number}%</span>}
                  {!!goal.discipline && <span>{goal.discipline as string}</span>}
                  <span style={{ marginLeft: "auto" }}>Updated {new Date(plan.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <a href={`/admin/breeding/planner/${plan.id}`} style={{ ...btn, background: "var(--teal)", color: "white", textDecoration: "none", display: "inline-block" }}>
                  Open
                </a>
                <button onClick={() => deletePlan(plan.id)} style={{ ...btn, background: "transparent", color: "var(--inbreed-text)", border: "1px solid var(--inbreed-border)" }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
