"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Transaction } from "@/types";
import TransactionRow from "../components/TransactionRow";
import TransactionDetailSheet from "../components/TransactionDetailSheet";
import { groupTransactionsByDate } from "../../lib/dateGroup";
import { ArrowLeft, Search } from "lucide-react";

type FilterPeriod = "all" | "month" | "3months" | "custom";

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showFilter, setShowFilter] = useState(false);

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

  const groups = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions]
  );

  const periodLabels: Record<FilterPeriod, string> = {
    all: "Semua",
    month: "Bulan Ini",
    "3months": "3 Bulan Terakhir",
    custom: "Custom",
  };

  return (
    <div className="min-h-screen bg-[#0E1013] text-white pb-10">
      <div className="px-5 pt-8 pb-4 flex items-center gap-3">
        <Link
          href="/"
          className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={16} className="text-neutral-400" />
        </Link>
        <h1 className="text-xl font-semibold">Riwayat Transaksi</h1>
      </div>

      <div className="px-5 space-y-2">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari transaksi (kategori/catatan)..."
            className="w-full bg-neutral-900 rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-neutral-600"
          />
        </div>

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

      <div className="px-5 mt-6">
        {loading && <p className="text-neutral-500 text-sm">Memuat...</p>}

        {!loading && groups.length === 0 && (
          <p className="text-neutral-500 text-sm">Tidak ada transaksi yang cocok.</p>
        )}

        <div className="space-y-5">
          {groups.map((group) => (
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
    </div>
  );
}