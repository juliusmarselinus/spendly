"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Transaction,
  TransactionType,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/types";
import BottomNav from "./components/BottomNav";
import AIChatDrawer from "./components/AIChatDrawer";
import { getCategoryStyle } from "../lib/categoryMeta";
import { parseSmartInput, formatShorthandPreview } from "../lib/smartInput";
import { Sparkles, Search, X, TrendingUp, TrendingDown } from "lucide-react";

type FilterPeriod = "all" | "month" | "3months" | "custom";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAI, setShowAI] = useState(false);

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
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSubmitting(true);
    const { error } = await supabase.from("transactions").insert({
      type,
      amount: Number(amount),
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
      date: new Date().toISOString().split("T")[0],
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

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const totalBalance = totalIncome - totalExpense;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayIncome = transactions.filter((t) => t.type === "income" && t.date === todayStr).reduce((s, t) => s + Number(t.amount), 0);
  const todayExpense = transactions.filter((t) => t.type === "expense" && t.date === todayStr).reduce((s, t) => s + Number(t.amount), 0);
  const todaySelisih = todayIncome - todayExpense;

  const insightTeaser = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    const thisWeekExpense = transactions
      .filter((t) => t.type === "expense" && new Date(t.date) >= weekAgo)
      .reduce((s, t) => s + Number(t.amount), 0);
    const lastWeekExpense = transactions
      .filter((t) => t.type === "expense" && new Date(t.date) >= twoWeeksAgo && new Date(t.date) < weekAgo)
      .reduce((s, t) => s + Number(t.amount), 0);

    if (lastWeekExpense === 0) return "Tap buat tanya-tanya soal keuanganmu ke AI";
    const diff = ((thisWeekExpense - lastWeekExpense) / lastWeekExpense) * 100;
    if (diff > 5) return `Pengeluaranmu naik ${Math.round(diff)}% dari minggu lalu`;
    if (diff < -5) return `Mantap, pengeluaranmu turun ${Math.round(Math.abs(diff))}% dari minggu lalu`;
    return "Pengeluaranmu cukup stabil minggu ini";
  }, [transactions]);

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
      result = result.filter((t) => t.category.toLowerCase().includes(q) || (t.note && t.note.toLowerCase().includes(q)));
    }
    return result;
  }, [transactions, filterPeriod, customStart, customEnd, search]);

  const formatRupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const periodLabels: Record<FilterPeriod, string> = { all: "Semua", month: "Bulan Ini", "3months": "3 Bulan Terakhir", custom: "Custom" };
  const smartPreview = parseSmartInput(smartText);
  const amountPreview = formatShorthandPreview(amount);

  return (
    <div className="min-h-screen bg-[#0E1013] text-white pb-28">
      <div className="px-5 pt-8 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
            <TrendingUp size={18} className="text-emerald-950" />
          </div>
          <h1 className="text-xl font-semibold">Spendly</h1>
        </div>
        <button onClick={() => setShowSearch(!showSearch)} className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
          {showSearch ? <X size={16} className="text-neutral-400" /> : <Search size={16} className="text-neutral-400" />}
        </button>
      </div>

      <div className="px-5 space-y-3">
        <div className={`rounded-2xl p-5 ${totalBalance >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}>
          <p className={totalBalance >= 0 ? "text-emerald-950/80 text-sm" : "text-rose-950/80 text-sm"}>Total Saldo</p>
          <p className={`text-3xl font-semibold mt-1 ${totalBalance >= 0 ? "text-emerald-950" : "text-rose-950"}`}>
            {formatRupiah(totalBalance)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-neutral-900 rounded-2xl p-4">
            <p className="text-neutral-500 text-xs">Total Pemasukan</p>
            <p className="text-lg font-semibold text-emerald-400 mt-1">{formatRupiah(totalIncome)}</p>
          </div>
          <div className="bg-neutral-900 rounded-2xl p-4">
            <p className="text-neutral-500 text-xs">Total Pengeluaran</p>
            <p className="text-lg font-semibold text-rose-400 mt-1">{formatRupiah(totalExpense)}</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-neutral-500 text-xs mb-1">Hari ini</p>
            <p className={`text-lg font-semibold ${todaySelisih >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {todaySelisih >= 0 ? "+" : ""}
              {formatRupiah(todaySelisih)}
            </p>
          </div>
          <div className="text-right text-xs text-neutral-500">
            <p>Masuk {formatRupiah(todayIncome)}</p>
            <p>Keluar {formatRupiah(todayExpense)}</p>
          </div>
        </div>

        <button
          onClick={() => setShowAI(true)}
          className="w-full bg-neutral-900 rounded-2xl p-4 flex items-center gap-3 text-left border border-neutral-800"
        >
          <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-violet-400" />
          </div>
          <p className="text-sm text-neutral-300">{insightTeaser}</p>
        </button>
      </div>

      <div className="px-5 mt-6">
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
            className="bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed px-4 py-3 rounded-xl text-sm font-medium shrink-0"
          >
            Catat
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          {smartPreview ? (
            <p className="text-xs text-emerald-400">
              {smartPreview.type === "income" ? "+" : "-"}
              {formatRupiah(smartPreview.amount)} · {smartPreview.category}
            </p>
          ) : (
            <span />
          )}
          <button onClick={() => setShowForm(true)} className="text-xs text-neutral-500 underline underline-offset-2">
            input manual
          </button>
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
          <button onClick={() => setShowFilter(!showFilter)} className="text-sm text-neutral-400">
            Periode: <span className="text-white">{periodLabels[filterPeriod]}</span> ▾
          </button>
          {showFilter && (
            <div className="bg-neutral-900 rounded-lg p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                {(["all", "month", "3months", "custom"] as FilterPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPeriod(p)}
                    className={`px-3 py-1.5 rounded-full text-xs ${filterPeriod === p ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400"}`}
                  >
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
              {filterPeriod === "custom" && (
                <div className="flex gap-2 pt-1">
                  <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="flex-1 bg-neutral-800 rounded-lg px-3 py-2 text-sm" />
                  <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="flex-1 bg-neutral-800 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="px-5 mt-6">
        <h2 className="text-lg font-semibold mb-3">Riwayat Transaksi</h2>
        {loading && <p className="text-neutral-500 text-sm">Memuat...</p>}
        {!loading && filteredTransactions.length === 0 && <p className="text-neutral-500 text-sm">Belum ada transaksi.</p>}

        <div className="space-y-2">
          {filteredTransactions.map((t) => {
            const style = getCategoryStyle(t.category);
            const Icon = style.icon;
            return (
              <div key={t.id} className="bg-neutral-900 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: style.bg }}>
                  <Icon size={18} style={{ color: style.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{t.category}</p>
                  {t.note && <p className="text-neutral-500 text-sm truncate">{t.note}</p>}
                  <p className="text-neutral-600 text-xs mt-0.5">
                    {new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className={`font-semibold text-sm ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                    {t.type === "income" ? "+" : "-"}
                    {formatRupiah(Number(t.amount))}
                  </p>
                  <button onClick={() => handleDelete(t.id)} className="text-neutral-600 text-xs">
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
          <div className="bg-neutral-900 w-full max-w-md rounded-t-3xl p-6 pb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tambah Transaksi</h3>
              <button onClick={() => setShowForm(false)} className="text-neutral-400 text-xl">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setType("expense"); setCategory(EXPENSE_CATEGORIES[0]); }}
                  className={`flex-1 py-2 rounded-lg font-medium ${type === "expense" ? "bg-rose-600 text-white" : "bg-neutral-800 text-neutral-400"}`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => { setType("income"); setCategory(INCOME_CATEGORIES[0]); }}
                  className={`flex-1 py-2 rounded-lg font-medium ${type === "income" ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400"}`}
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
                  placeholder="0 atau 30k, 1jt"
                  required
                  className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3 text-lg"
                />
                {amountPreview && <p className="text-xs text-emerald-400 mt-1">{amountPreview}</p>}
              </div>

              <div>
                <label className="text-sm text-neutral-400">Kategori</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3">
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-neutral-400">Tanggal</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3" />
              </div>

              <div>
                <label className="text-sm text-neutral-400">Catatan (opsional)</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="misal: makan siang" className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3" />
              </div>

              <button
                type="submit"
                disabled={submitting}
                onClick={(e) => {
                  const parsed = formatShorthandPreview(amount);
                  if (parsed) {
                    e.preventDefault();
                    setAmount(String(parseInt(parsed.replace(/\D/g, ""))));
                    setTimeout(() => (document.activeElement as HTMLElement)?.blur(), 0);
                  }
                }}
                className="w-full bg-emerald-600 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}

      <AIChatDrawer open={showAI} onClose={() => setShowAI(false)} transactions={transactions} balance={totalBalance} />

      <BottomNav />
    </div>
  );
}