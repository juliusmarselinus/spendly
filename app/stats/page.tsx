"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Transaction } from "@/types";
import BottomNav from "../components/BottomNav";
import { TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#16A34A", "#DC2626", "#2563EB", "#D97706", "#7C3AED", "#DB2777", "#0891B2"];

export default function StatsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase.from("transactions").select("*");
    if (data) setTransactions(data);
    setLoading(false);
  }

  const formatRupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");
  const tooltipFormatter = (value: any) => formatRupiah(Number(value) || 0);

  // ringkasan hari ini
  const todayStr = new Date().toISOString().split("T")[0];
  const todayIncome = transactions
    .filter((t) => t.type === "income" && t.date === todayStr)
    .reduce((s, t) => s + Number(t.amount), 0);
  const todayExpense = transactions
    .filter((t) => t.type === "expense" && t.date === todayStr)
    .reduce((s, t) => s + Number(t.amount), 0);
  const todaySelisih = todayIncome - todayExpense;

  // insight tren minggu ini vs minggu lalu
  const insightText = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    const thisWeekExpense = transactions
      .filter((t) => t.type === "expense" && new Date(t.date) >= weekAgo)
      .reduce((s, t) => s + Number(t.amount), 0);
    const lastWeekExpense = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          new Date(t.date) >= twoWeeksAgo &&
          new Date(t.date) < weekAgo
      )
      .reduce((s, t) => s + Number(t.amount), 0);

    if (lastWeekExpense === 0) return "Belum cukup data untuk insight minggu ini";
    const diff = ((thisWeekExpense - lastWeekExpense) / lastWeekExpense) * 100;
    if (diff > 5) return `Pengeluaranmu naik ${Math.round(diff)}% dari minggu lalu`;
    if (diff < -5)
      return `Mantap, pengeluaranmu turun ${Math.round(Math.abs(diff))}% dari minggu lalu`;
    return "Pengeluaranmu cukup stabil minggu ini";
  }, [transactions]);

  // breakdown kategori pengeluaran bulan ini
  const categoryData = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        t.type === "expense" &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });

    const grouped: Record<string, number> = {};
    thisMonth.forEach((t) => {
      grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount);
    });

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // tren 6 bulan terakhir
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const months: { label: string; income: number; expense: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("id-ID", { month: "short" });
      const income = transactions
        .filter((t) => {
          const td = new Date(t.date);
          return (
            t.type === "income" &&
            td.getMonth() === d.getMonth() &&
            td.getFullYear() === d.getFullYear()
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = transactions
        .filter((t) => {
          const td = new Date(t.date);
          return (
            t.type === "expense" &&
            td.getMonth() === d.getMonth() &&
            td.getFullYear() === d.getFullYear()
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      months.push({ label, income, expense });
    }
    return months;
  }, [transactions]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24">
      <div className="px-5 pt-8 pb-6">
        <h1 className="text-2xl font-bold">Grafik</h1>
      </div>

      {loading && <p className="px-5 text-neutral-500 text-sm">Memuat...</p>}

      {!loading && (
        <div className="px-5 space-y-8">
          {/* Ringkasan hari ini + insight (pindahan dari Home) */}
          <div className="space-y-3">
            <div className="bg-neutral-900 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-neutral-500 text-xs mb-1">Hari ini</p>
                <p
                  className={`text-lg font-semibold ${
                    todaySelisih >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {todaySelisih >= 0 ? "+" : ""}
                  {formatRupiah(todaySelisih)}
                </p>
              </div>
              <div className="text-right text-xs text-neutral-500">
                <p>Masuk {formatRupiah(todayIncome)}</p>
                <p>Keluar {formatRupiah(todayExpense)}</p>
              </div>
            </div>

            <div className="bg-neutral-900 rounded-2xl p-4 flex items-center gap-3 border border-neutral-800">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-emerald-400" />
              </div>
              <p className="text-sm text-neutral-300">{insightText}</p>
            </div>
          </div>

          {/* Pie chart kategori */}
          <div>
            <h2 className="text-lg font-semibold mb-3">
              Breakdown Pengeluaran Bulan Ini
            </h2>
            {categoryData.length === 0 ? (
              <p className="text-neutral-500 text-sm">Belum ada pengeluaran bulan ini.</p>
            ) : (
              <div className="bg-neutral-900 rounded-2xl p-4">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => entry.name}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={tooltipFormatter} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-3 space-y-1.5">
                  {categoryData
                    .sort((a, b) => b.value - a.value)
                    .map((c, i) => (
                      <div key={c.name} className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          {c.name}
                        </span>
                        <span className="text-neutral-400">{formatRupiah(c.value)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Bar chart tren bulanan */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Tren 6 Bulan Terakhir</h2>
            <div className="bg-neutral-900 rounded-2xl p-4">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyTrend}>
                  <XAxis dataKey="label" stroke="#737373" fontSize={12} />
                  <YAxis stroke="#737373" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    formatter={tooltipFormatter}
                    contentStyle={{ backgroundColor: "#171717", border: "none" }}
                  />
                  <Bar dataKey="income" fill="#16A34A" name="Pemasukan" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#DC2626" name="Pengeluaran" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}