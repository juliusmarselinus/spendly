"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.message || "PIN salah");
      setPin("");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0a0a0a",
      color: "white",
      padding: 24,
    }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Spendly</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 300 }}>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="Masukkan 6 digit PIN"
          autoFocus
          style={{
            padding: 16,
            fontSize: 20,
            textAlign: "center",
            letterSpacing: 8,
            borderRadius: 8,
            border: "1px solid #333",
            backgroundColor: "#1a1a1a",
            color: "white",
          }}
        />
        {error && <p style={{ color: "#ef4444", textAlign: "center", fontSize: 14 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading || pin.length !== 6}
          style={{
            padding: 14,
            fontSize: 16,
            borderRadius: 8,
            border: "none",
            backgroundColor: "#16A34A",
            color: "white",
            fontWeight: 600,
            cursor: pin.length === 6 ? "pointer" : "not-allowed",
            opacity: pin.length === 6 ? 1 : 0.5,
          }}
        >
          {loading ? "Memeriksa..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}