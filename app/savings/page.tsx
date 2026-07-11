"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Transaction, SavingsEntry, SavingsType } from "@/types";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

export default function SavingsPage() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savings, setSavings] = useState<SavingsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<SavingsType>("deposit");
  const [amount, setAmount] = useState(""); // raw digits only, no dots
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [txRes, savingsRes] = await Promise.all([
      supabase.from("transactions").select("*"),
      supabase
        .from("savings")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);
    if (!txRes.error && txRes.data) setTransactions(txRes.data);
    if (!savingsRes.error && savingsRes.data) setSavings(savingsRes.data);
    setLoading(false);
  }

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalSavings = savings.reduce((s, entry) => {
    return entry.type === "deposit" ? s + Number(entry.amount) : s - Number(entry.amount);
  }, 0);

  const saldo = totalIncome - totalExpense - totalSavings;

  const earliestDate =
    transactions.length > 0
      ? transactions.reduce((min, t) => (t.date < min ? t.date : min), transactions[0].date)
      : null;

  const dateRangeLabel = earliestDate
    ? `${formatShortDate(earliestDate)} — ${formatShortDate(getLocalDateString())}`
    : null;

  const formatRupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");

  // handle input jumlah: cuma simpan digit mentah, tampilin dengan titik ribuan
  function handleAmountChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    setAmount(digits);
  }

  const amountDisplay = amount ? Number(amount).toLocaleString("id-ID") : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountValue = amount ? parseInt(amount, 10) : 0;
    if (!amountValue || amountValue <= 0) return;

    if (type === "withdraw" && amountValue > totalSavings) {
      alert("Jumlah tabungan tidak cukup untuk diambil.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("savings").insert({
      type,
      amount: amountValue,
      note: note || null,
      date: getLocalDateString(),
    });
    setSubmitting(false);

    if (!error) {
      setAmount("");
      setNote("");
      fetchAll();
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0E1013] text-white pb-16 overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/[0.10] blur-[90px] -z-10" />
      <div className="pointer-events-none absolute top-40 -left-20 w-56 h-56 rounded-full bg-blue-500/[0.08] blur-[90px] -z-10" />

      <div className="relative z-10 px-5 pt-8 pb-2 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 active:scale-95 transition"
        >
          <ArrowLeft size={18} className="text-neutral-400" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Tabungan</h1>
      </div>

      {loading ? (
        <p className="px-5 mt-6 text-neutral-500 text-sm">Memuat...</p>
      ) : (
        <>
          {dateRangeLabel && (
            <p className="px-5 mt-4 text-xs font-medium text-neutral-500">
              {dateRangeLabel}
            </p>
          )}

          <div className="px-5 mt-3 grid grid-cols-2 gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-neutral-500">
                  Pemasukan
                </span>
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              <p className="text-lg font-bold tracking-tight text-emerald-400">
                {formatRupiah(totalIncome)}
              </p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-neutral-500">
                  Pengeluaran
                </span>
                <TrendingDown size={14} className="text-rose-400" />
              </div>
              <p className="text-lg font-bold tracking-tight text-rose-400">
                {formatRupiah(totalExpense)}
              </p>
            </div>
          </div>

          {/* Kartu duotone: hijau buat Tabungan, biru buat Saldo */}
          <div className="px-5 mt-3">
            <div className="grid grid-cols-2 rounded-3xl overflow-hidden">
              <div className="relative overflow-hidden p-5 bg-gradient-to-br from-emerald-400 to-teal-600">
                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-emerald-950/10 flex items-center justify-center mb-3">
                    <PiggyBank size={17} className="text-emerald-950" />
                  </div>
                  <p className="text-emerald-950/60 text-xs font-medium">Tabungan</p>
                  <p className="text-xl font-bold tracking-tight mt-0.5 text-emerald-950">
                    {formatRupiah(totalSavings)}
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden p-5 bg-gradient-to-br from-blue-400 to-indigo-600">
                <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full bg-white/10" />
                <div className="relative text-right">
                  <div className="w-9 h-9 rounded-xl bg-blue-950/10 flex items-center justify-center mb-3 ml-auto">
                    <Wallet size={17} className="text-blue-950" />
                  </div>
                  <p className="text-blue-950/60 text-xs font-medium">Saldo</p>
                  <p className="text-xl font-bold tracking-tight mt-0.5 text-blue-950">
                    {formatRupiah(saldo)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 mt-7">
            <h2 className="text-sm font-bold mb-3">Tambah / Ambil Tabungan</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setType("deposit")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-medium text-sm transition ${
                    type === "deposit"
                      ? "bg-emerald-500 text-emerald-950"
                      : "text-neutral-500"
                  }`}
                >
                  <ArrowUpCircle size={15} />
                  Tambah
                </button>
                <button
                  type="button"
                  onClick={() => setType("withdraw")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-medium text-sm transition ${
                    type === "withdraw"
                      ? "bg-rose-500 text-white"
                      : "text-neutral-500"
                  }`}
                >
                  <ArrowDownCircle size={15} />
                  Ambil
                </button>
              </div>

              <div>
                <label className="text-xs text-neutral-500">Jumlah</label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountDisplay}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-lg font-semibold placeholder:text-neutral-700 placeholder:font-normal focus:outline-none focus:border-blue-500/50 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-500">Catatan (opsional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="misal: dp motor"
                  className="w-full mt-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 placeholder:text-neutral-700 focus:outline-none focus:border-blue-500/50 transition"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 transition active:scale-[0.98] ${
                  type === "deposit"
                    ? "bg-emerald-500 text-emerald-950"
                    : "bg-rose-500 text-white"
                }`}
              >
                {submitting
                  ? "Menyimpan..."
                  : type === "deposit"
                  ? "Simpan Tabungan"
                  : "Ambil Tabungan"}
              </button>
            </form>
          </div>

          {savings.length > 0 && (
            <div className="px-5 mt-8">
              <h2 className="text-sm font-bold mb-3">Riwayat</h2>
              <div className="space-y-2">
                {savings.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl p-3.5"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        s.type === "deposit" ? "bg-emerald-500/10" : "bg-rose-500/10"
                      }`}
                    >
                      {s.type === "deposit" ? (
                        <ArrowUpCircle size={16} className="text-emerald-400" />
                      ) : (
                        <ArrowDownCircle size={16} className="text-rose-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {s.type === "deposit" ? "Tambah ke Tabungan" : "Ambil dari Tabungan"}
                      </p>
                      {s.note && (
                        <p className="text-neutral-500 text-xs mt-0.5 truncate">{s.note}</p>
                      )}
                    </div>
                    <p
                      className={`font-semibold text-sm shrink-0 ${
                        s.type === "deposit" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {s.type === "deposit" ? "+" : "-"}
                      {formatRupiah(Number(s.amount))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}