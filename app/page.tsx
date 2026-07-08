"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Transaction,
  TransactionType,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/types";
import BottomNav from "./components/BottomNav";
import { getCategoryStyle } from "../lib/categoryMeta";
import { parseSmartInput, formatShorthandPreview } from "../lib/smartInput";
import { Search, X, Wallet, Sparkles, Coins } from "lucide-react";

type FilterPeriod = "all" | "month" | "3months" | "custom";

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseAmountInput(raw: string): number {
  const preview = formatShorthandPreview(raw);
  if (preview) {
    const digits = preview.replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }
  const digits = raw.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const [smartText, setSmartText] = useState("");

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getLocalDateString());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
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

  function closeForm() {
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const finalAmount = parseAmountInput(amount);
    if (!finalAmount || finalAmount <= 0) return;

    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      type,
      amount: finalAmount,
      category,
      note: note || null,
      date,
    });
    setSubmitting(false);
    if (!error) {
      setAmount("");
      setNote("");
      closeForm();
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

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) fetchTransactions();
  }

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalBalance = totalIncome - totalExpense;

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    const now = new Date();
    if (filterPeriod === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      result = result.filter((t) => new Date(t.date) >= start);
    } else if (filterPeriod === "3months") {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      result = result.filter((t) => new Date(t.date) >= start);
    } else if (filterPeriod === "custom" && customStart && customEnd) {
      result = result.filter((t) => t.date >= customStart && t.date <= customEnd);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.category.toLowerCase().includes(q) ||
          (t.note && t.note.toLowerCase().includes(q))
      );
    }
    return result;
  }, [transactions, filterPeriod, customStart, customEnd, search]);

  const formatRupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const periodLabels: Record<FilterPeriod, string> = {
    all: "Semua",
    month: "Bulan Ini",
    "3months": "3 Bulan Terakhir",
    custom: "Custom",
  };
  const smartPreview = parseSmartInput(smartText);
  const amountPreview = formatShorthandPreview(amount);

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

  const quickCategories = EXPENSE_CATEGORIES.slice(0, 6);

  function openFormWithCategory(cat: string) {
    setType("expense");
    setCategory(cat);
    setShowForm(true);
  }

  return (
    <div className="relative min-h-screen bg-[#0E1013] text-white pb-28 overflow-hidden">
      {/* Blob dekoratif di background, biar nggak flat polos */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl -z-10" />
      <div className="pointer-events-none absolute top-1/3 -left-20 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl -z-10" />
      <div className="pointer-events-none absolute bottom-40 right-0 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl -z-10" />

      <div className="relative z-10 px-5 pt-8 pb-5 flex items-center justify-between">
        <div>
          <p className="text-neutral-500 text-xs">{todayLabel}</p>
          <h1 className="text-xl font-semibold mt-0.5">{greeting}</h1>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0"
        >
          {showSearch ? (
            <X size={16} className="text-neutral-400" />
          ) : (
            <Search size={16} className="text-neutral-400" />
          )}
        </button>
      </div>

      <div className="px-5">
        <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-14 -left-8 w-32 h-32 rounded-full bg-white/10" />

          <div className="relative">
            <p className="text-emerald-950/70 text-sm">Total saldo</p>
            <p className="text-4xl font-bold mt-1 text-emerald-950">
              {formatRupiah(totalBalance)}
            </p>
            <div className="flex gap-6 mt-4 pt-4 border-t border-emerald-950/15">
              <div>
                <p className="text-emerald-900/60 text-xs">Pemasukan</p>
                <p className="text-sm font-semibold text-emerald-950">
                  {formatRupiah(totalIncome)}
                </p>
              </div>
              <div>
                <p className="text-emerald-900/60 text-xs">Pengeluaran</p>
                <p className="text-sm font-semibold text-emerald-950">
                  {formatRupiah(totalExpense)}
                </p>
              </div>
            </div>
          </div>
        </div>
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

      {/* Quick category chips */}
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

      {showSearch && (
        <div className="px-5 mt-4 space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari transaksi (kategori/catatan)..."
            className="w-full bg-neutral-900 rounded-lg px-4 py-2.5 text-sm placeholder:text-neutral-600"
          />
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="text-sm text-neutral-400"
          >
            Periode: <span className="text-white">{periodLabels[filterPeriod]}</span> ▾
          </button>
          {showFilter && (
            <div className="bg-neutral-900 rounded-lg p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                {(["all", "month", "3months", "custom"] as FilterPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPeriod(p)}
                    className={`px-3 py-1.5 rounded-full text-xs ${
                      filterPeriod === p
                        ? "bg-emerald-600 text-white"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
              {filterPeriod === "custom" && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="flex-1 bg-neutral-800 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="flex-1 bg-neutral-800 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="px-5 mt-7">
        <h2 className="text-lg font-semibold mb-3">Riwayat transaksi</h2>
        {loading && <p className="text-neutral-500 text-sm">Memuat...</p>}

        {!loading && filteredTransactions.length === 0 && (
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

        <div className="space-y-2">
          {filteredTransactions.map((t) => {
            const style = getCategoryStyle(t.category);
            const Icon = style.icon;
            return (
              <div
                key={t.id}
                className="bg-neutral-900 rounded-xl p-4 flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: style.bg }}
                >
                  <Icon size={18} style={{ color: style.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{t.category}</p>
                  {t.note && (
                    <p className="text-neutral-500 text-sm truncate">{t.note}</p>
                  )}
                  <p className="text-neutral-600 text-xs mt-0.5">
                    {new Date(t.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p
                    className={`font-semibold text-sm ${
                      t.type === "income" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatRupiah(Number(t.amount))}
                  </p>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-neutral-600 text-xs"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/70 flex items-end justify-center z-50"
          onClick={closeForm}
        >
          <div
            className="bg-neutral-900 w-full max-w-md rounded-t-3xl p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tambah transaksi</h3>
              <button onClick={closeForm} className="text-neutral-400 text-xl">
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