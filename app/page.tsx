"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Transaction,
  TransactionType,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/types";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // form state
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

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalBalance = totalIncome - totalExpense;

  const formatRupiah = (n: number) =>
    "Rp" + n.toLocaleString("id-ID");

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-6">
        <h1 className="text-2xl font-bold">Spendly</h1>
      </div>

      {/* Summary Cards */}
      <div className="px-5 space-y-3">
        <div className="bg-neutral-900 rounded-2xl p-5">
          <p className="text-neutral-400 text-sm">Total Saldo</p>
          <p className={`text-3xl font-bold mt-1 ${totalBalance >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatRupiah(totalBalance)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-neutral-900 rounded-2xl p-4">
            <p className="text-neutral-400 text-xs">Total Pemasukan</p>
            <p className="text-lg font-semibold text-green-500 mt-1">
              {formatRupiah(totalIncome)}
            </p>
          </div>
          <div className="bg-neutral-900 rounded-2xl p-4">
            <p className="text-neutral-400 text-xs">Total Pengeluaran</p>
            <p className="text-lg font-semibold text-red-500 mt-1">
              {formatRupiah(totalExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-5 mt-8">
        <h2 className="text-lg font-semibold mb-3">Riwayat Transaksi</h2>

        {loading && <p className="text-neutral-500 text-sm">Memuat...</p>}

        {!loading && transactions.length === 0 && (
          <p className="text-neutral-500 text-sm">
            Belum ada transaksi. Tap tombol + untuk mulai catat.
          </p>
        )}

        <div className="space-y-2">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="bg-neutral-900 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{t.category}</p>
                {t.note && <p className="text-neutral-500 text-sm">{t.note}</p>}
                <p className="text-neutral-600 text-xs mt-1">
                  {new Date(t.date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p
                className={`font-semibold ${
                  t.type === "income" ? "text-green-500" : "text-red-500"
                }`}
              >
                {t.type === "income" ? "+" : "-"}
                {formatRupiah(Number(t.amount))}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 rounded-full flex items-center justify-center text-3xl shadow-lg active:scale-95 transition"
      >
        +
      </button>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
          <div className="bg-neutral-900 w-full max-w-md rounded-t-3xl p-6 pb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Tambah Transaksi</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-neutral-400 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType("expense");
                    setCategory(EXPENSE_CATEGORIES[0]);
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    type === "expense"
                      ? "bg-red-600 text-white"
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
                      ? "bg-green-600 text-white"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  Pemasukan
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="text-sm text-neutral-400">Jumlah</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3 text-lg"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm text-neutral-400">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="text-sm text-neutral-400">Tanggal</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3"
                />
              </div>

              {/* Note */}
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
                className="w-full bg-green-600 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}