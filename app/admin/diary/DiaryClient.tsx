"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Service {
  id: string;
  providerName: string;
  serviceType: string;
  price: string | null;
  link: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const SERVICE_TYPES = ["Training", "Farrier", "Vet Check", "Custom Tack", "Other"] as const;

type Tab = "notes" | "services";

export default function DiaryClient({
  initialNote, noteUpdatedAt, services: initialServices,
}: { initialNote: string; noteUpdatedAt: string | null; services: Service[] }) {
  const [tab, setTab] = useState<Tab>("notes");

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-4">
        <Link href="/admin" className="text-xs uppercase tracking-[0.12em] text-[var(--teal)] no-underline" style={{ fontFamily: "var(--font-lato)" }}>← Admin</Link>
      </div>
      <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 30, color: "var(--teal-dark)" }}>Diary &amp; Services</h1>
      <p className="text-xs mb-6" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
        Private workspace for stable notes and your favourite player services.
      </p>

      <div className="flex gap-2 mb-5">
        {([
          { id: "notes",    label: "General Notes" },
          { id: "services", label: `Preferred Services (${initialServices.length})` },
        ] as { id: Tab; label: string }[]).map((t) => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                background: active ? "var(--teal)" : "var(--white)",
                color: active ? "white" : "var(--teal-dark)",
                border: `1px solid ${active ? "var(--teal)" : "var(--border)"}`,
                borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700,
                fontFamily: "var(--font-lato)", cursor: "pointer",
              }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "notes" ? (
        <NotesPanel initial={initialNote} updatedAt={noteUpdatedAt} />
      ) : (
        <ServicesPanel initial={initialServices} />
      )}
    </div>
  );
}

/* ============================ Notes panel ============================ */
function NotesPanel({ initial, updatedAt: initUpdatedAt }: { initial: string; updatedAt: string | null }) {
  const [body, setBody] = useState(initial);
  const [updatedAt, setUpdatedAt] = useState(initUpdatedAt);
  const [saving, setSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const skipFirstRef = useRef(true);

  useEffect(() => {
    if (skipFirstRef.current) { skipFirstRef.current = false; return; }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setSaving(true);
      const res = await fetch("/api/diary/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      setSaving(false);
      if (res.ok) {
        const j = await res.json();
        setUpdatedAt(j.updatedAt);
        setSavedRecently(true);
        window.setTimeout(() => setSavedRecently(false), 1800);
      }
    }, 1500);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [body]);

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 18 }}>
      <div className="flex items-center justify-between mb-2">
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)" }}>General Notes</h2>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
          {saving ? "Saving…" : savedRecently ? "Saved ✓" : updatedAt ? `Last saved ${new Date(updatedAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}` : "Unsaved"}
        </span>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={18}
        placeholder="Strategies, reminders, anything you want to keep in one place…"
        className="w-full text-sm rounded-md border bg-white px-3 py-2"
        style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)", color: "var(--text)", resize: "vertical", lineHeight: 1.55 }}
      />
    </div>
  );
}

/* ========================== Services ledger ========================== */
function ServicesPanel({ initial }: { initial: Service[] }) {
  const [services, setServices] = useState<Service[]>(initial);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  const [d, setD] = useState({ providerName: "", serviceType: "Training" as (typeof SERVICE_TYPES)[number], price: "", link: "", notes: "" });

  async function createService() {
    if (!d.providerName.trim()) return;
    setBusy(true);
    const res = await fetch("/api/diary/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerName: d.providerName.trim(),
        serviceType: d.serviceType,
        price: d.price.trim() || null,
        link: d.link.trim() || null,
        notes: d.notes || null,
      }),
    });
    setBusy(false);
    if (!res.ok) { alert("Could not save."); return; }
    const created = await res.json();
    setServices((s) => [created, ...s]);
    setD({ providerName: "", serviceType: "Training", price: "", link: "", notes: "" });
    setAdding(false);
  }

  async function deleteService(id: string) {
    if (!confirm("Remove this service entry?")) return;
    const res = await fetch(`/api/diary/services/${id}`, { method: "DELETE" });
    if (!res.ok) { alert("Delete failed."); return; }
    setServices((s) => s.filter((x) => x.id !== id));
  }

  async function patchService(id: string, patch: Partial<Service>) {
    const res = await fetch(`/api/diary/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) { alert("Save failed."); return; }
    const updated = await res.json();
    setServices((s) => s.map((x) => (x.id === id ? updated : x)));
  }

  const inputCls = "w-full text-sm rounded-md border bg-white px-2.5 py-1.5";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 18, color: "var(--teal-dark)" }}>Preferred Services</h2>
        <button
          onClick={() => setAdding((a) => !a)}
          style={{ background: "var(--teal)", color: "white", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-lato)" }}
        >
          {adding ? "× Cancel" : "+ Add Service"}
        </button>
      </div>

      {adding && (
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label>Provider / Player</Label>
              <input className={inputCls} value={d.providerName} onChange={(e) => setD({ ...d, providerName: e.target.value })} placeholder="e.g. PlayerName" style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)" }} />
            </div>
            <div>
              <Label>Service type</Label>
              <select className={inputCls} value={d.serviceType} onChange={(e) => setD({ ...d, serviceType: e.target.value as (typeof SERVICE_TYPES)[number] })} style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)" }}>
                {SERVICE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>Price</Label>
              <input
                className={inputCls}
                type="text"
                value={d.price}
                onChange={(e) => setD({ ...d, price: e.target.value })}
                placeholder="e.g. Free, 250k, Negotiable"
                style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)" }}
              />
            </div>
            <div className="col-span-2">
              <Label>Link (profile, shop, or thread URL)</Label>
              <input
                className={inputCls}
                type="url"
                value={d.link}
                onChange={(e) => setD({ ...d, link: e.target.value })}
                placeholder="https://…"
                style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)" }}
              />
            </div>
            <div className="col-span-2">
              <Label>Status / Notes</Label>
              <textarea className={inputCls} rows={2} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="Quality, location, anything to remember" style={{ borderColor: "var(--border)", fontFamily: "var(--font-lato)", resize: "vertical" }} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} disabled={busy} style={{ background: "var(--white)", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "7px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-lato)" }}>Cancel</button>
            <button onClick={createService} disabled={busy || !d.providerName.trim()} style={{ background: "var(--teal)", color: "white", border: "none", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: busy ? "wait" : "pointer", opacity: busy || !d.providerName.trim() ? 0.6 : 1, fontFamily: "var(--font-lato)" }}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <div style={{ background: "var(--white)", border: "1px dashed var(--border)", borderRadius: 10, padding: 28, textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 13 }}>
          No services tracked yet — add your first favourite provider.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {services.map((s) => (
            <ServiceCard key={s.id} svc={s} onDelete={() => deleteService(s.id)} onPatch={(patch) => patchService(s.id, patch)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceCard({ svc, onDelete, onPatch }: { svc: Service; onDelete: () => void; onPatch: (p: Partial<Service>) => void }) {
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState({
    providerName: svc.providerName,
    serviceType: svc.serviceType,
    price: svc.price ?? "",
    link: svc.link ?? "",
    notes: svc.notes ?? "",
  });

  if (editing) {
    const inputCls = "w-full text-xs rounded-md border bg-white px-2 py-1.5";
    return (
      <div style={{ background: "var(--white)", border: "1px solid var(--teal-light)", borderRadius: 10, padding: 14 }}>
        <input className={inputCls} value={d.providerName} onChange={(e) => setD({ ...d, providerName: e.target.value })} style={{ borderColor: "var(--border)", marginBottom: 6 }} />
        <select className={inputCls} value={d.serviceType} onChange={(e) => setD({ ...d, serviceType: e.target.value })} style={{ borderColor: "var(--border)", marginBottom: 6 }}>
          {SERVICE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input
          className={inputCls}
          type="text"
          value={d.price}
          onChange={(e) => setD({ ...d, price: e.target.value })}
          placeholder="e.g. Free, 250k, Negotiable"
          style={{ borderColor: "var(--border)", marginBottom: 6 }}
        />
        <input
          className={inputCls}
          type="url"
          value={d.link}
          onChange={(e) => setD({ ...d, link: e.target.value })}
          placeholder="https://…"
          style={{ borderColor: "var(--border)", marginBottom: 6 }}
        />
        <textarea className={inputCls} rows={2} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="Notes" style={{ borderColor: "var(--border)", marginBottom: 8 }} />
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(false)} style={{ background: "var(--white)", border: "1px solid var(--border)", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "var(--font-lato)" }}>Cancel</button>
          <button
            onClick={() => {
              onPatch({
                providerName: d.providerName.trim(),
                serviceType: d.serviceType,
                price: d.price.trim() || null,
                link: d.link.trim() || null,
                notes: d.notes || null,
              });
              setEditing(false);
            }}
            style={{ background: "var(--teal)", color: "white", border: "none", padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-lato)" }}
          >Save</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 16, color: "var(--teal-dark)" }}>{svc.providerName}</div>
          <div style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>
            {svc.serviceType}{svc.price ? ` · ${svc.price}` : ""}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setEditing(true)} title="Edit"
            style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-lato)", color: "var(--teal-dark)" }}>Edit</button>
          <button onClick={onDelete} title="Delete"
            style={{ background: "none", border: "1px solid var(--inbreed-border)", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-lato)", color: "var(--inbreed-text)" }}>✕</button>
        </div>
      </div>
      {svc.link && (
        <a
          href={svc.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", marginTop: 8, fontSize: 11, color: "var(--teal)", fontFamily: "var(--font-lato)", wordBreak: "break-all" }}
        >
          {svc.link.replace(/^https?:\/\//, "")}
        </a>
      )}
      {svc.notes && (
        <p style={{ marginTop: 6, fontSize: 12, color: "var(--text)", fontFamily: "var(--font-lato)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{svc.notes}</p>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.1em] font-semibold mb-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
      {children}
    </div>
  );
}
