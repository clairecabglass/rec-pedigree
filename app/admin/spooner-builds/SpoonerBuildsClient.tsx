"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Search, X as XIcon, Copy, Check, Download, Pencil, Trash2, Plus, FileText, UploadCloud, MessageSquare } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  key: string;
  order: number;
  createdAt: string;
}

interface TxtFile {
  id: string;
  fileName: string;
  url: string;
  key: string;
  content: string;
  order: number;
  createdAt: string;
}

interface Build {
  id: string;
  title: string;
  location: string | null;
  category: string | null;
  description: string | null;
  discordUrl: string | null;
  photos: Photo[];
  txtFiles: TxtFile[];
  createdAt: string;
  updatedAt: string;
}

interface FormState {
  title: string;
  location: string;
  category: string;
  description: string;
  discordUrl: string;
}

const EMPTY_FORM: FormState = { title: "", location: "", category: "", description: "", discordUrl: "" };

// 413s and other infra-level failures don't come back as JSON, so fall back
// to the raw response text rather than swallowing the real cause.
async function readError(res: Response): Promise<string> {
  if (res.status === 413) return "That upload was too large for the server to relay — try again, it should now go straight to storage.";
  try {
    const j = await res.clone().json();
    if (j?.error) return j.error;
  } catch { /* not JSON */ }
  const text = await res.text().catch(() => "");
  return text.slice(0, 200) || `Failed to save (HTTP ${res.status})`;
}

interface UploadedFile {
  url: string;
  key: string;
}

// Uploads a file directly to R2 with a presigned URL, so the bytes never
// pass through our serverless function (which Vercel caps at ~4.5MB per
// request). Falls back to routing through the server when R2 isn't
// configured (local dev), where there's no such cap anyway.
async function uploadDirect(file: File, folder: string): Promise<UploadedFile | null> {
  const presignRes = await fetch("/api/spooner-builds/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, fileName: file.name, contentType: file.type || "application/octet-stream" }),
  });
  if (!presignRes.ok) throw new Error(await readError(presignRes));
  const presigned = await presignRes.json();

  if (presigned.mode === "local") return null; // caller falls back to multipart

  const putRes = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!putRes.ok) throw new Error(`Upload to storage failed (HTTP ${putRes.status})`);
  return { url: presigned.publicUrl, key: presigned.key };
}

export default function SpoonerBuildsClient({ initialBuilds }: { initialBuilds: Build[] }) {
  const [builds, setBuilds] = useState<Build[]>(initialBuilds);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Build | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const b of builds) if (b.category) set.add(b.category);
    return Array.from(set).sort();
  }, [builds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return builds.filter((b) => {
      if (category && b.category !== category) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        (b.location ?? "").toLowerCase().includes(q) ||
        (b.description ?? "").toLowerCase().includes(q) ||
        (b.category ?? "").toLowerCase().includes(q)
      );
    });
  }, [builds, search, category]);

  function upsertBuild(b: Build) {
    setBuilds((prev) => {
      const idx = prev.findIndex((x) => x.id === b.id);
      if (idx === -1) return [b, ...prev];
      const next = [...prev];
      next[idx] = b;
      return next;
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this build permanently? Photos and all .txt versions will also be removed.")) return;
    const res = await fetch(`/api/spooner-builds/${id}`, { method: "DELETE" });
    if (res.ok) setBuilds((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-4">
        <Link href="/admin" className="text-xs uppercase tracking-[0.12em] text-[var(--teal)] no-underline" style={{ fontFamily: "var(--font-lato)" }}>← Admin</Link>
      </div>

      <div className="flex items-end justify-between flex-wrap gap-3 mb-2">
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 30, color: "var(--teal-dark)" }}>Spooner Builds</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
            Arena marker presets and spawn-data builds — photos, notes, and the raw .txt for each.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--sand-bg)", border: "1px solid var(--sand-border)", color: "var(--teal-dark)",
            borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700,
            fontFamily: "var(--font-lato)", cursor: "pointer",
          }}
        >
          <Plus size={15} /> Add Build
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex gap-2 flex-wrap mt-6 mb-6">
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, location, description…"
            style={{
              width: "100%", padding: "9px 12px 9px 34px", borderRadius: 8, border: "1px solid var(--border)",
              fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text)", background: "var(--white)",
            }}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)",
            fontFamily: "var(--font-lato)", fontSize: 13, color: "var(--text)", background: "var(--white)",
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(search || category) && (
          <button
            onClick={() => { setSearch(""); setCategory(""); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-lato)" }}
          >
            <XIcon size={13} /> Clear
          </button>
        )}
      </div>

      <p className="text-xs mb-3" style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
        {filtered.length} build{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 40, textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: 14 }}>
            {builds.length === 0 ? "No builds logged yet." : "No builds match your search."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <BuildCard
              key={b.id}
              build={b}
              onEdit={() => { setEditing(b); setShowForm(true); }}
              onDelete={() => handleDelete(b.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <BuildFormModal
          build={editing}
          onClose={() => setShowForm(false)}
          onSaved={(b) => { upsertBuild(b); setShowForm(false); }}
        />
      )}
    </div>
  );
}

/* ============================ Build card ============================ */

function BuildCard({ build, onEdit, onDelete }: { build: Build; onEdit: () => void; onDelete: () => void }) {
  const cover = build.photos[0];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {cover ? (
        <div
          onClick={() => setLightboxIndex(0)}
          style={{ position: "relative", width: "100%", height: 150, background: "var(--cream-dark)", cursor: "pointer" }}
          title="Click to view photos"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover.url} alt={build.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          {build.photos.length > 1 && (
            <span style={{
              position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.55)", color: "white",
              fontSize: 11, padding: "2px 7px", borderRadius: 10, fontFamily: "var(--font-lato)",
            }}>
              +{build.photos.length - 1} more
            </span>
          )}
        </div>
      ) : (
        <div style={{ width: "100%", height: 80, background: "var(--cream-dark)" }} />
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={build.photos}
          index={lightboxIndex}
          title={build.title}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div className="flex items-start justify-between gap-2">
          <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: 17, color: "var(--teal-dark)", lineHeight: 1.25 }}>{build.title}</h3>
          <div className="flex gap-1 flex-shrink-0">
            {build.discordUrl && (
              <a href={build.discordUrl} target="_blank" rel="noopener noreferrer" title="Open original Discord message" style={{ ...iconBtnStyle("var(--sage-text)"), textDecoration: "none" }}>
                <MessageSquare size={13} />
              </a>
            )}
            <button onClick={onEdit} title="Edit" style={iconBtnStyle()}><Pencil size={13} /></button>
            <button onClick={onDelete} title="Delete" style={iconBtnStyle("var(--inbreed-text)")}><Trash2 size={13} /></button>
          </div>
        </div>

        {build.location && (
          <div>
            <span style={badgeStyle("var(--sand-bg)", "var(--sand-border)", "var(--sand-text)")}>{build.location}</span>
          </div>
        )}

        {build.category && (
          <div>
            <span style={badgeStyle("var(--sage-bg)", "var(--sage-border)", "var(--sage-text)")}>{build.category}</span>
          </div>
        )}

        {build.description && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)", lineHeight: 1.5, flex: 1 }}>
            {build.description}
          </p>
        )}

        {build.txtFiles.length > 0 && (
          <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
            {build.txtFiles.map((t) => (
              <TxtFileRow key={t.id} txtFile={t} buildTitle={build.title} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoLightbox({
  photos, index, title, onClose, onIndexChange,
}: { photos: Photo[]; index: number; title: string; onClose: () => void; onIndexChange: (i: number) => void }) {
  const photo = photos[index];
  const hasMultiple = photos.length > 1;

  function prev(e: React.MouseEvent) {
    e.stopPropagation();
    onIndexChange((index - 1 + photos.length) % photos.length);
  }
  function next(e: React.MouseEvent) {
    e.stopPropagation();
    onIndexChange((index + 1) % photos.length);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(20,30,30,0.85)", zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <button
        onClick={onClose}
        title="Close"
        style={{
          position: "absolute", top: 18, right: 22, background: "none", border: "none",
          color: "white", cursor: "pointer",
        }}
      >
        <XIcon size={26} />
      </button>

      {hasMultiple && (
        <span style={{
          position: "absolute", top: 18, left: 22, color: "white", fontSize: 13,
          fontFamily: "var(--font-lato)", opacity: 0.85,
        }}>
          {title} — {index + 1} / {photos.length}
        </span>
      )}

      {hasMultiple && (
        <button
          onClick={prev}
          title="Previous"
          style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
            width: 44, height: 44, color: "white", cursor: "pointer", fontSize: 22,
          }}
        >
          ‹
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={title}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 6 }}
      />

      {hasMultiple && (
        <button
          onClick={next}
          title="Next"
          style={{
            position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
            background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
            width: 44, height: 44, color: "white", cursor: "pointer", fontSize: 22,
          }}
        >
          ›
        </button>
      )}

      {hasMultiple && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 6, maxWidth: "90vw", overflowX: "auto", padding: "4px 2px",
          }}
        >
          {photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.id}
              src={p.url}
              alt=""
              onClick={() => onIndexChange(i)}
              style={{
                width: 48, height: 48, objectFit: "cover", borderRadius: 4, cursor: "pointer",
                border: i === index ? "2px solid var(--gold)" : "2px solid transparent", opacity: i === index ? 1 : 0.65,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TxtFileRow({ txtFile, buildTitle }: { txtFile: TxtFile; buildTitle: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(txtFile.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    const blob = new Blob([txtFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = txtFile.fileName || `${buildTitle || "build"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5" style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
        <FileText size={13} /> <span className="truncate">{txtFile.fileName}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={handleCopy} style={actionBtnStyle()}>
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
        </button>
        <button onClick={handleDownload} style={actionBtnStyle()}>
          <Download size={13} /> Download
        </button>
      </div>
    </div>
  );
}

function iconBtnStyle(color = "var(--teal-dark)"): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 26, height: 26, borderRadius: 6, border: "1px solid var(--border)",
    background: "var(--white)", color, cursor: "pointer",
  };
}

function badgeStyle(bg: string, border: string, text: string): React.CSSProperties {
  return {
    background: bg, border: `1px solid ${border}`, color: text,
    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
    fontFamily: "var(--font-lato)",
  };
}

function actionBtnStyle(): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 5,
    background: "var(--teal-muted)", border: "1px solid var(--teal-light)", color: "var(--teal-dark)",
    borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 700,
    fontFamily: "var(--font-lato)", cursor: "pointer",
  };
}

/* ============================ Drag & drop zone ============================ */

function DropZone({
  accept, multiple, onFiles, label, hint,
}: { accept: string; multiple?: boolean; onFiles: (files: File[]) => void; label: string; hint?: string }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? "var(--teal)" : "var(--border)"}`,
        borderRadius: 8, padding: "18px 14px", textAlign: "center", cursor: "pointer",
        background: dragging ? "var(--teal-muted)" : "var(--cream-dark)",
        transition: "background 0.15s, border-color 0.15s",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => { onFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }}
        style={{ display: "none" }}
      />
      <UploadCloud size={18} color="var(--teal)" />
      <p style={{ fontSize: 12.5, fontFamily: "var(--font-lato)", color: "var(--teal-dark)", fontWeight: 700, margin: 0 }}>{label}</p>
      {hint && <p style={{ fontSize: 11, fontFamily: "var(--font-lato)", color: "var(--text-muted)", margin: 0 }}>{hint}</p>}
    </div>
  );
}

/* ============================ Add / edit modal ============================ */

function BuildFormModal({ build, onClose, onSaved }: { build: Build | null; onClose: () => void; onSaved: (b: Build) => void }) {
  const isEdit = Boolean(build);
  const [form, setForm] = useState<FormState>(
    build
      ? { title: build.title, location: build.location ?? "", category: build.category ?? "", description: build.description ?? "", discordUrl: build.discordUrl ?? "" }
      : EMPTY_FORM
  );
  const [txtFiles, setTxtFiles] = useState<File[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>(build?.photos ?? []);
  const [existingTxtFiles, setExistingTxtFiles] = useState<TxtFile[]>(build?.txtFiles ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleRemovePhoto(photoId: string) {
    if (!build) return;
    const res = await fetch(`/api/spooner-builds/${build.id}/photos/${photoId}`, { method: "DELETE" });
    if (res.ok) setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  async function handleRemoveTxtFile(txtId: string) {
    if (!build) return;
    const res = await fetch(`/api/spooner-builds/${build.id}/txtfiles/${txtId}`, { method: "DELETE" });
    if (res.ok) setExistingTxtFiles((prev) => prev.filter((t) => t.id !== txtId));
  }

  async function handleSubmit() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    setError("");
    try {
      // Step 1: create/update the build with text fields only — every later
      // step uploads exactly one file per request, so no single request can
      // ever approach Vercel's ~4.5MB body limit (the original bug here:
      // bundling several photos into one request could 413).
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("location", form.location.trim());
      fd.append("category", form.category.trim());
      fd.append("description", form.description.trim());
      fd.append("discordUrl", form.discordUrl.trim());

      let id: string;
      if (!isEdit) {
        const res = await fetch("/api/spooner-builds", { method: "POST", body: fd });
        if (!res.ok) throw new Error(await readError(res));
        id = (await res.json()).id;
      } else {
        const res = await fetch(`/api/spooner-builds/${build!.id}`, { method: "PATCH", body: fd });
        if (!res.ok) throw new Error(await readError(res));
        id = build!.id;
      }

      // Step 2: .txt files — upload straight to R2, then just register the
      // resulting url/key (server reads the content back for Copy/Download).
      // Falls back to routing the bytes through the server when R2 isn't
      // configured (uploadDirect returns null), where there's no size cap.
      for (const f of txtFiles) {
        const folder = `spooner-builds/${id}`;
        const uploaded = await uploadDirect(f, folder);
        if (uploaded) {
          const r = await fetch(`/api/spooner-builds/${id}/txtfiles/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...uploaded, fileName: f.name }),
          });
          if (!r.ok) throw new Error(await readError(r));
        } else {
          const tfd = new FormData();
          tfd.append("txtFiles", f);
          const r = await fetch(`/api/spooner-builds/${id}`, { method: "PATCH", body: tfd });
          if (!r.ok) throw new Error(await readError(r));
        }
      }

      // Step 3: build photos, one upload + one tiny register call each
      for (const f of photoFiles) {
        const folder = `spooner-builds/${id}`;
        const uploaded = await uploadDirect(f, folder);
        if (uploaded) {
          const r = await fetch(`/api/spooner-builds/${id}/photos/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(uploaded),
          });
          if (!r.ok) throw new Error(await readError(r));
        } else {
          const pfd = new FormData();
          pfd.append("files", f);
          const r = await fetch(`/api/spooner-builds/${id}/photos`, { method: "POST", body: pfd });
          if (!r.ok) throw new Error(await readError(r));
        }
      }

      const final = await fetch(`/api/spooner-builds/${id}`).then((r) => r.json());
      onSaved(final);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(63,95,95,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}
    >
      <div
        style={{ background: "var(--white)", borderRadius: 12, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 28 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, color: "var(--teal-dark)" }}>
            {isEdit ? "Edit Build" : "Add Build"}
          </h2>
          <button onClick={onClose} title="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <XIcon size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Title *">
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={inputStyle()} placeholder="Dressage Arena Markers" />
          </Field>

          <Field label="Location name">
            <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} style={inputStyle()} placeholder="TREC Dressage Arena [Middle & Smol Arena]" />
          </Field>

          <Field label="Category">
            <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={inputStyle()} placeholder="Dressage, Show Jumping, Cross Country…" />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputStyle(), resize: "vertical" }} />
          </Field>

          <Field label="Discord message link">
            <input value={form.discordUrl} onChange={(e) => setForm((f) => ({ ...f, discordUrl: e.target.value }))} style={inputStyle()} placeholder="https://discord.com/channels/.../.../..." />
          </Field>

          <Field label="Build photos">
            {existingPhotos.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {existingPhotos.map((p) => (
                  <div key={p.id} style={{ position: "relative", width: 64, height: 64 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
                    <button
                      onClick={() => handleRemovePhoto(p.id)}
                      style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "var(--inbreed-text)", color: "white", border: "none", cursor: "pointer", fontSize: 11, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <DropZone
              accept="image/*"
              multiple
              onFiles={(files) => setPhotoFiles((prev) => [...prev, ...files])}
              label="Drop photos here, or click to browse"
              hint="You can drop as many as you like, any size"
            />
            {photoFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {photoFiles.map((f, i) => (
                  <span key={i} style={{ fontSize: 11.5, color: "var(--teal-dark)", background: "var(--teal-muted)", borderRadius: 6, padding: "3px 8px", fontFamily: "var(--font-lato)" }}>
                    {f.name}
                  </span>
                ))}
              </div>
            )}
          </Field>

          <Field label="Spawn-data .txt files">
            {existingTxtFiles.length > 0 && (
              <div className="flex flex-col gap-1.5 mb-2">
                {existingTxtFiles.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2" style={{ background: "var(--cream-dark)", borderRadius: 6, padding: "6px 10px" }}>
                    <span className="flex items-center gap-1.5 truncate" style={{ fontSize: 12.5, color: "var(--teal-dark)", fontFamily: "var(--font-lato)" }}>
                      <FileText size={13} /> {t.fileName}
                    </span>
                    <button
                      onClick={() => handleRemoveTxtFile(t.id)}
                      style={{ fontSize: 11, color: "var(--inbreed-text)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-lato)", flexShrink: 0 }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <DropZone
              accept=".txt,text/plain"
              multiple
              onFiles={(files) => setTxtFiles((prev) => [...prev, ...files])}
              label="Drop .txt files here, or click to browse"
              hint="Different versions of the same build are added as separate files"
            />
            {txtFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {txtFiles.map((f, i) => (
                  <span key={i} style={{ fontSize: 11.5, color: "var(--teal-dark)", background: "var(--teal-muted)", borderRadius: 6, padding: "3px 8px", fontFamily: "var(--font-lato)" }}>
                    {f.name}
                  </span>
                ))}
              </div>
            )}
          </Field>

          {error && <p style={{ color: "var(--inbreed-text)", fontSize: 12.5, fontFamily: "var(--font-lato)" }}>{error}</p>}

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                background: "var(--teal)", color: "white", border: "none", borderRadius: 8,
                padding: "10px 18px", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-lato)",
                cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Build"}
            </button>
            <button
              onClick={onClose}
              style={{ background: "var(--white)", color: "var(--teal-dark)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-lato)", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "var(--font-lato)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid var(--border)",
    fontFamily: "var(--font-lato)", fontSize: 13.5, color: "var(--text)", background: "var(--white)",
  };
}
