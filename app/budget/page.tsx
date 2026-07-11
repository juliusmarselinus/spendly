"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Transaction, Budget, EXPENSE_CATEGORIES } from "@/types";
import BottomNav from "../components/BottomNav";

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [limit, setLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [budgetRes, txRes] = await Promise.all([
      supabase.from("budgets").select("*"),
      supabase.from("transactions").select("*").eq("type", "expense"),
    ]);
    if (budgetRes.data) setBudgets(budgetRes.data);
    if (txRes.data) setTransactions(txRes.data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!limit || Number(limit) <= 0) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("budgets")
      .upsert({ category, monthly_limit: Number(limit) }, { onConflict: "category" });

    setSubmitting(false);
    if (!error) {
      setLimit("");
      setShowForm(false);
      fetchData();
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus target budget ini?")) return;
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (!error) fetchData();
  }

  const formatRupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");

  const spentByCategory = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const grouped: Record<string, number> = {};
    thisMonth.forEach((t) => {
      grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount);
    });
    return grouped;
  }, [transactions]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24">
      <div className="px-5 pt-8 pb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Budget</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Target
        </button>
      </div>

      <div className="px-5 space-y-3">
        {loading && <p className="text-neutral-500 text-sm">Memuat...</p>}

        {!loading && budgets.length === 0 && (
          <p className="text-neutral-500 text-sm">
            Belum ada target budget. Tap &quot;+ Target&quot; untuk mulai.
          </p>
        )}

        {budgets.map((b) => {
          const spent = spentByCategory[b.category] || 0;
          const percent = Math.min((spent / Number(b.monthly_limit)) * 100, 100);
          const over = spent > Number(b.monthly_limit);

          return (
            <div key={b.id} className="bg-neutral-900 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium">{b.category}</p>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-neutral-600 text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${over ? "bg-red-600" : "bg-green-600"}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className={over ? "text-red-500" : "text-neutral-400"}>
                  {formatRupiah(spent)}
                </span>
                <span className="text-neutral-500">
                  dari {formatRupiah(Number(b.monthly_limit))}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
          <div className="bg-neutral-900 w-full max-w-md rounded-t-3xl p-6 pb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Set Target Budget</h3>
              <button onClick={() => setShowForm(false)} className="text-neutral-400 text-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-neutral-400">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-neutral-400">Limit per Bulan</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3 text-lg"
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

      <BottomNav />
    </div>
  );
}
