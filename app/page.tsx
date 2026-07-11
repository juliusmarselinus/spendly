"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Transaction,
  TransactionType,
  SavingsEntry,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/types";
import BottomNav from "./components/BottomNav";
import TransactionRow from "./components/TransactionRow";
import TransactionDetailSheet from "./components/TransactionDetailSheet";
import { getCategoryStyle } from "../lib/categoryMeta";
import { parseSmartInput, formatShorthandPreview } from "../lib/smartInput";
import { groupTransactionsByDate } from "../lib/dateGroup";
import { Search, X, Wallet, Sparkles, Coins, ChevronRight } from "lucide-react";

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// konversi input jumlah (termasuk shorthand 30k / 1jt) jadi angka murni
function parseAmountValue(input: string): number {
  const cleaned = input.trim().toLowerCase().replace(/\s+/g, "");
  if (!cleaned) return 0;

  const match = cleaned.match(/^([\d.,]+)(k|rb|jt|juta)?$/);
  if (!match) {
    const digits = input.replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }

  let num = parseFloat(match[1].replace(",", "."));
  const suffix = match[2];
  if (suffix === "k" || suffix === "rb") num *= 1000;
  if (suffix === "jt" || suffix === "juta") num *= 1000000;
  return Math.round(num);
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savings, setSavings] = useState<SavingsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [smartText, setSmartText] = useState("");

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getLocalDateString());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchSavings();
  }, []);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setShowForm(true);
      router.replace("/");
    }
  }, [searchParams, router]);

  async function fetchTransactions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (!error && data) setTransactions(data);
    setLoading(false);
  }

  async function fetchSavings() {
    const { data, error } = await supabase.from("savings").select("*");
    if (!error && data) setSavings(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountValue = parseAmountValue(amount);
    if (!amountValue || amountValue <= 0) return;

    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      type,
      amount: amountValue,
      category,
      note: note || null,
      date,
    });
    setSubmitting(false);
    if (!error) {
      setAmount("");
      setNote("");
      setShowForm(false);
      fetchTransactions();
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
  }

  async function handleSmartAdd() {
    const parsed = parseSmartInput(smartText);
    if (!parsed) return;
    const { error } = await supabase.from("transactions").insert({
      type: parsed.type,
      amount: parsed.amount,
      category: parsed.category,
      note: parsed.note || null,
      date: getLocalDateString(),
    });
    if (!error) {
      setSmartText("");
      fetchTransactions();
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
  }

  function handleDelete(id: string): void {
    supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (!error) {
          fetchTransactions();
        } else {
          alert("Gagal menghapus: " + error.message);
        }
      });
  }

  const todayStr = getLocalDateString();

  const totalIncomeAllTime = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenseAllTime = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const todayIncome = transactions
    .filter((t) => t.type === "income" && t.date === todayStr)
    .reduce((s, t) => s + Number(t.amount), 0);
  const todayExpense = transactions
    .filter((t) => t.type === "expense" && t.date === todayStr)
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalSavings = savings.reduce((s, entry) => {
    return entry.type === "deposit" ? s + Number(entry.amount) : s - Number(entry.amount);
  }, 0);

  const saldo = totalIncomeAllTime - totalExpenseAllTime - totalSavings;

  const formatRupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const smartPreview = parseSmartInput(smartText);
  const amountPreview = formatShorthandPreview(amount);
  const quickCategories = EXPENSE_CATEGORIES.slice(0, 6);

  function openFormWithCategory(cat: string) {
    setType("expense");
    setCategory(cat);
    setShowForm(true);
  }

  const recentGroups = useMemo(() => {
    const all = groupTransactionsByDate(transactions);
    return all.filter((g) => g.label === "Hari ini" || g.label === "Kemarin");
  }, [transactions]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  }, []);

  const todayLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="relative min-h-screen bg-[#0E1013] text-white pb-28 overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-1/3 -left-20 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl -z-10" />
      <div className="pointer-events-none absolute bottom-40 right-0 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl -z-10" />

      <div className="relative z-10 px-5 pt-8 pb-5 flex items-center justify-between">
        <div>
          <p className="text-neutral-500 text-xs">{todayLabel}</p>
          <h1 className="text-xl font-semibold mt-0.5">{greeting}</h1>
        </div>
        <Link
          href="/history"
          className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0"
        >
          <Search size={16} className="text-neutral-400" />
        </Link>
      </div>

      <div className="px-5">
        <Link
          href="/savings"
          className="block relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 active:scale-[0.99] transition"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-14 -left-8 w-32 h-32 rounded-full bg-white/10" />

          <div className="relative">
            <p className="text-emerald-950/70 text-sm">Saldo</p>
            <p className="text-4xl font-bold mt-1 text-emerald-950">
              {formatRupiah(saldo)}
            </p>
            <div className="flex gap-6 mt-4 pt-4 border-t border-emerald-950/15">
              <div>
                <p className="text-emerald-900/60 text-xs">Pemasukan hari ini</p>
                <p className="text-sm font-semibold text-emerald-950">
                  {formatRupiah(todayIncome)}
                </p>
              </div>
              <div>
                <p className="text-emerald-900/60 text-xs">Pengeluaran hari ini</p>
                <p className="text-sm font-semibold text-emerald-950">
                  {formatRupiah(todayExpense)}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="px-5 mt-5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={smartText}
            onChange={(e) => setSmartText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSmartAdd()}
            placeholder="ketik: kopi 18k, gaji 5jt..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm placeholder:text-neutral-600"
          />
          <button
            onClick={handleSmartAdd}
            disabled={!smartPreview}
            className="bg-gradient-to-br from-emerald-400 to-teal-600 disabled:opacity-30 disabled:cursor-not-allowed px-4 py-3 rounded-xl text-sm font-medium text-emerald-950 shrink-0"
          >
            Catat
          </button>
        </div>
        {smartPreview && (
          <p className="text-xs text-emerald-400 mt-2 px-1">
            {smartPreview.type === "income" ? "+" : "-"}
            {formatRupiah(smartPreview.amount)} · {smartPreview.category}
          </p>
        )}
      </div>

      <div className="mt-4 pl-5 overflow-x-auto">
        <div className="flex gap-2 pr-5 w-max">
          {quickCategories.map((cat) => {
            const style = getCategoryStyle(cat);
            const Icon = style.icon;
            return (
              <button
                key={cat}
                onClick={() => openFormWithCategory(cat)}
                className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full pl-2 pr-3.5 py-2 shrink-0 active:scale-95 transition"
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: style.bg }}
                >
                  <Icon size={13} style={{ color: style.color }} />
                </span>
                <span className="text-xs text-neutral-300">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Riwayat transaksi</h2>
          <Link href="/history" className="text-xs text-emerald-400 flex items-center gap-0.5">
            Lihat semua <ChevronRight size={14} />
          </Link>
        </div>

        {loading && <p className="text-neutral-500 text-sm">Memuat...</p>}

        {!loading && transactions.length === 0 && (
          <div className="relative flex flex-col items-center text-center py-12 px-4 bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800 overflow-hidden">
            <div className="relative w-20 h-20 mb-4">
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Wallet size={26} className="text-emerald-400" />
              </div>
              <div className="absolute -top-1 -right-2 w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
                <Coins size={14} className="text-amber-400" />
              </div>
              <div className="absolute -bottom-1 -left-2 w-7 h-7 rounded-full bg-purple-500/15 flex items-center justify-center">
                <Sparkles size={12} className="text-purple-400" />
              </div>
            </div>
            <p className="font-medium text-neutral-300">Belum ada transaksi</p>
            <p className="text-neutral-500 text-sm mt-1 max-w-[220px]">
              Yuk mulai catat biar keuanganmu makin ketauan arahnya.
            </p>
          </div>
        )}

        {!loading && transactions.length > 0 && recentGroups.length === 0 && (
          <p className="text-neutral-500 text-sm">
            Belum ada transaksi hari ini atau kemarin.
          </p>
        )}

        <div className="space-y-5">
          {recentGroups.map((group) => (
            <div key={group.date}>
              <p className="text-neutral-500 text-xs font-medium mb-2">{group.label}</p>
              <div className="space-y-2">
                {group.transactions.map((t) => (
                  <TransactionRow key={t.id} transaction={t} onClick={() => setSelectedTx(t)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTx && (
        <TransactionDetailSheet
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onDelete={handleDelete}
          onUpdated={fetchTransactions}
        />
      )}

      {showForm && (
        <div
          className="fixed inset-0 bg-black/70 flex items-end justify-center z-50"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-neutral-900 w-full max-w-md rounded-t-3xl p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tambah transaksi</h3>
              <button onClick={() => setShowForm(false)} className="text-neutral-400 text-xl">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType("expense");
                    setCategory(EXPENSE_CATEGORIES[0]);
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    type === "expense"
                      ? "bg-rose-600 text-white"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType("income");
                    setCategory(INCOME_CATEGORIES[0]);
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    type === "income"
                      ? "bg-emerald-600 text-white"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  Pemasukan
                </button>
              </div>

              <div>
                <label className="text-sm text-neutral-400">Jumlah</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3 text-lg"
                />
                {amountPreview && (
                  <p className="text-xs text-emerald-400 mt-1">{amountPreview}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-neutral-400">Kategori</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {categories.map((c) => {
                    const style = getCategoryStyle(c);
                    const Icon = style.icon;
                    const selected = category === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border transition ${
                          selected
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-neutral-800 bg-neutral-800/40"
                        }`}
                      >
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: style.bg }}
                        >
                          <Icon size={16} style={{ color: style.color }} />
                        </span>
                        <span
                          className={`text-[11px] text-center leading-tight ${
                            selected ? "text-emerald-400" : "text-neutral-400"
                          }`}
                        >
                          {c}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm text-neutral-400">Tanggal</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3"
                />
                {date && (
                  <p className="text-xs text-neutral-500 mt-1">
                    {new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm text-neutral-400">Catatan (opsional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="misal: makan siang"
                  className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-br from-emerald-400 to-teal-600 text-emerald-950 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}