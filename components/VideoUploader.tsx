"use client";
import { useRef, useState } from "react";

interface UploadedVideo { id: string; url: string; caption: string | null; mimeType: string | null; }

const MAX_DIRECT = 50 * 1024 * 1024; // 50 MB direct; above this → presigned R2
const COMPRESS_THRESHOLD = 100 * 1024 * 1024; // compress if > 100 MB

export default function VideoUploader({
  horseId,
  onUploaded,
}: {
  horseId: string;
  onUploaded: (v: UploadedVideo) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "compressing" | "uploading" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFile(file: File) {
    setStatus("idle"); setErrorMsg(""); setProgress(0);

    let uploadFile = file;

    // Client-side compression for large videos using ffmpeg.wasm
    if (file.size > COMPRESS_THRESHOLD) {
      try {
        setStatus("compressing");
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { fetchFile, toBlobURL } = await import("@ffmpeg/util");
        const ffmpeg = new FFmpeg();
        // Load single-thread WASM (no SharedArrayBuffer required)
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        ffmpeg.on("progress", ({ progress: p }) => setProgress(Math.round(p * 100)));
        await ffmpeg.writeFile("input.mp4", await fetchFile(file));
        // Re-encode to H.264 720p, CRF 28 (good quality / small size balance)
        await ffmpeg.exec([
          "-i", "input.mp4",
          "-vf", "scale=-2:720",
          "-c:v", "libx264", "-crf", "28", "-preset", "fast",
          "-c:a", "aac", "-b:a", "128k",
          "-movflags", "+faststart",
          "output.mp4",
        ]);
        const data = await ffmpeg.readFile("output.mp4") as Uint8Array;
        uploadFile = new File([data.buffer as ArrayBuffer], file.name.replace(/\.[^.]+$/, "") + "_compressed.mp4", { type: "video/mp4" });
      } catch (err) {
        console.error("ffmpeg compression failed, uploading original:", err);
        // Fall through to upload original
        uploadFile = file;
      }
    }

    setStatus("uploading"); setProgress(0);

    // Decide direct vs presigned
    if (uploadFile.size > MAX_DIRECT) {
      await uploadPresigned(horseId, uploadFile, setProgress, onUploaded, setStatus, setErrorMsg);
    } else {
      await uploadDirect(horseId, uploadFile, onUploaded, setStatus, setErrorMsg);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/ogg"
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "compressing" || status === "uploading"}
        style={{
          background: "var(--cream)", border: "1px solid var(--border)", borderRadius: 6,
          padding: "8px 18px", fontSize: 13, cursor: status === "idle" || status === "done" || status === "error" ? "pointer" : "not-allowed",
          fontFamily: "var(--font-lato)", color: "var(--teal-dark)",
          opacity: status === "compressing" || status === "uploading" ? 0.6 : 1,
        }}
      >
        {status === "compressing" ? `Compressing… ${progress}%`
          : status === "uploading" ? `Uploading… ${progress > 0 ? `${progress}%` : ""}`
          : "＋ Add Video"}
      </button>
      {status === "error" && <p style={{ fontSize: 12, color: "#C05050", fontFamily: "var(--font-lato)", marginTop: 6 }}>{errorMsg}</p>}
    </div>
  );
}

async function uploadDirect(
  horseId: string,
  file: File,
  onUploaded: (v: UploadedVideo) => void,
  setStatus: (s: "done" | "error") => void,
  setErrorMsg: (m: string) => void,
) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api/horses/${horseId}/videos`, { method: "POST", body: fd });
  if (!res.ok) { const j = await res.json(); setErrorMsg(j.error ?? "Upload failed"); setStatus("error"); return; }
  const { video } = await res.json();
  onUploaded(video);
  setStatus("done");
}

async function uploadPresigned(
  horseId: string,
  file: File,
  setProgress: (n: number) => void,
  onUploaded: (v: UploadedVideo) => void,
  setStatus: (s: "done" | "error") => void,
  setErrorMsg: (m: string) => void,
) {
  // Step 1: get presigned URL
  const presRes = await fetch(`/api/horses/${horseId}/videos/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, contentType: file.type }),
  });
  const presData = await presRes.json();

  if (presData.mode === "local") {
    // R2 not configured — fall back to direct (will be > 50MB limit, warn)
    await uploadDirect(horseId, file, onUploaded, setStatus, setErrorMsg);
    return;
  }

  const { uploadUrl, key, publicUrl } = presData;

  // Step 2: PUT directly to R2
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  }).catch((err) => { setErrorMsg(String(err)); setStatus("error"); throw err; });

  // Step 3: register in DB
  const regRes = await fetch(`/api/horses/${horseId}/videos/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, publicUrl, mimeType: file.type }),
  });
  if (!regRes.ok) { setErrorMsg("Upload succeeded but failed to save"); setStatus("error"); return; }
  const { video } = await regRes.json();
  onUploaded(video);
  setStatus("done");
}
