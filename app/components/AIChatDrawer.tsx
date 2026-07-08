"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { Transaction } from "@/types";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function AIChatDrawer({
  open,
  onClose,
  transactions,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
  balance: number;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [payday, setPayday] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("spendly_payday");
    if (saved) setPayday(saved);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function savePayday(value: string) {
    setPayday(value);
    localStorage.setItem("spendly_payday", value);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          context: {
            balance,
            payday,
            recentTransactions: transactions.slice(0, 40).map((t) => ({
              type: t.type,
              amount: Number(t.amount),
              category: t.category,
              date: t.date,
            })),
          },
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Maaf, ada masalah." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Gagal terhubung ke AI. Coba lagi." }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
      <div className="bg-neutral-900 w-full max-w-md rounded-t-3xl flex flex-col h-[80vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-400" />
            <h3 className="text-lg font-semibold">Asisten Keuangan</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-2 border-b border-neutral-800">
          <label className="text-xs text-neutral-500">Tanggal gajian (buat hitung batas harian)</label>
          <input
            type="number"
            min={1}
            max={31}
            value={payday}
            onChange={(e) => savePayday(e.target.value)}
            placeholder="misal: 9"
            className="w-full mt-1 bg-neutral-800 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-sm text-neutral-500 space-y-2">
              <p>Coba tanya:</p>
              <button
                onClick={() => sendMessage("Hari ini maksimal boleh keluar berapa?")}
                className="block w-full text-left bg-neutral-800 rounded-lg px-3 py-2 text-neutral-300"
              >
                Hari ini maksimal boleh keluar berapa?
              </button>
              <button
                onClick={() => sendMessage("Pengeluaran terbesar bulan ini apa?")}
                className="block w-full text-left bg-neutral-800 rounded-lg px-3 py-2 text-neutral-300"
              >
                Pengeluaran terbesar bulan ini apa?
              </button>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user" ? "bg-emerald-600 text-white ml-auto" : "bg-neutral-800 text-neutral-100"
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && <div className="bg-neutral-800 text-neutral-400 text-sm rounded-2xl px-4 py-2.5 w-fit">Mikir...</div>}
        </div>

        <div className="p-4 border-t border-neutral-800 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Tanya soal keuanganmu..."
            className="flex-1 bg-neutral-800 rounded-full px-4 py-2.5 text-sm"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading}
            className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center disabled:opacity-50 shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}