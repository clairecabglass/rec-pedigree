"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Incorrect password.");
    }
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, padding: 40, width: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 24, color: "var(--teal-dark)", marginBottom: 4 }}>
            Admin Access
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-lato)" }}>
            Redfield Equestrian Centre
          </div>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{ border: "1px solid var(--border)", borderRadius: 6, padding: "10px 14px", fontSize: 14, fontFamily: "var(--font-lato)", color: "var(--text)", outline: "none" }}
            autoFocus
          />
          {error && <div style={{ color: "#C05050", fontSize: 13, fontFamily: "var(--font-lato)" }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ background: "var(--teal)", color: "var(--white)", border: "none", borderRadius: 6, padding: "11px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "var(--font-lato)", letterSpacing: "0.05em", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Checking…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
