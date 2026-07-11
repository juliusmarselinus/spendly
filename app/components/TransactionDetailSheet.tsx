"use client";

import { useState } from "react";
import { Transaction, TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/types";
import { getCategoryStyle } from "@/lib/categoryMeta";
import { supabase } from "@/lib/supabase";
import { X, Trash2, Pencil } from "lucide-react";

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

interface TransactionDetailSheetProps {
  transaction: Transaction;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdated: () => void;
}

export default function TransactionDetailSheet({
  transaction,
  onClose,
  onDelete,
  onUpdated,
}: TransactionDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editType, setEditType] = useState<TransactionType>(transaction.type);
  const [editAmount, setEditAmount] = useState(String(transaction.amount));
  const [editCategory, setEditCategory] = useState(transaction.category);
  const [editNote, setEditNote] = useState(transaction.note || "");
  const [editDate, setEditDate] = useState(transaction.date);

  const style = getCategoryStyle(isEditing ? editCategory : transaction.category);
  const Icon = style.icon;
  const formatRupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
  const categories = editType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function startEdit() {
    setEditType(transaction.type);
    setEditAmount(String(transaction.amount));
    setEditCategory(transaction.category);
    setEditNote(transaction.note || "");
    setEditDate(transaction.date);
    setIsEditing(true);
  }

  function handleClose() {
    if (isEditing) {
      setIsEditing(false);
      return;
    }
    onClose();
  }

  async function handleSave() {
    const amountValue = parseAmountValue(editAmount);
    if (!amountValue || amountValue <= 0) return;

    setSaving(true);
    const { error } = await supabase
      .from("transactions")
      .update({
        type: editType,
        amount: amountValue,
        category: editCategory,
        note: editNote || null,
        date: editDate,
      })
      .eq("id", transaction.id);
    setSaving(false);

    if (!error) {
      onUpdated();
      onClose();
    } else {
      alert("Gagal update: " + error.message);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-neutral-900 w-full max-w-md rounded-t-3xl p-6 pb-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-semibold">
            {isEditing ? "Edit Transaksi" : "Detail Transaksi"}
          </h3>
          <div className="flex items-center gap-3">
            {!isEditing && (
              <button onClick={startEdit} className="text-neutral-400 active:scale-95 transition">
                <Pencil size={18} />
              </button>
            )}
            <button onClick={handleClose} className="text-neutral-400 active:scale-95 transition">
              <X size={20} />
            </button>
          </div>
        </div>

        {!isEditing ? (
          <>
            <div className="flex flex-col items-center text-center mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: style.bg }}
              >
                <Icon size={28} style={{ color: style.color }} />
              </div>
              <p
                className={`text-3xl font-bold ${
                  transaction.type === "income" ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatRupiah(Number(transaction.amount))}
              </p>
              <p className="text-neutral-400 text-sm mt-1">{transaction.category}</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2.5 border-b border-neutral-800">
                <span className="text-neutral-500 text-sm">Jenis</span>
                <span className="text-sm font-medium">
                  {transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}
                </span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-neutral-800">
                <span className="text-neutral-500 text-sm">Tanggal</span>
                <span className="text-sm font-medium">
                  {new Date(transaction.date + "T00:00:00").toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              {transaction.note && (
                <div className="flex justify-between py-2.5 border-b border-neutral-800">
                  <span className="text-neutral-500 text-sm">Catatan</span>
                  <span className="text-sm font-medium text-right max-w-[60%] break-words">
                    {transaction.note}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                onDelete(transaction.id);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-rose-600/10 text-rose-400 font-medium active:scale-[0.99] transition"
            >
              <Trash2 size={16} />
              Hapus Transaksi
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditType("expense");
                  if (!EXPENSE_CATEGORIES.includes(editCategory)) {
                    setEditCategory(EXPENSE_CATEGORIES[0]);
                  }
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  editType === "expense"
                    ? "bg-rose-600 text-white"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditType("income");
                  if (!INCOME_CATEGORIES.includes(editCategory)) {
                    setEditCategory(INCOME_CATEGORIES[0]);
                  }
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  editType === "income"
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
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-400">Kategori</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {categories.map((c) => {
                  const cStyle = getCategoryStyle(c);
                  const CIcon = cStyle.icon;
                  const selected = editCategory === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditCategory(c)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border transition active:scale-95 ${
                        selected
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-neutral-800 bg-neutral-800/40"
                      }`}
                    >
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: cStyle.bg }}
                      >
                        <CIcon size={16} style={{ color: cStyle.color }} />
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
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-400">Catatan (opsional)</label>
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="misal: makan siang"
                className="w-full mt-1 bg-neutral-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 rounded-lg font-medium bg-neutral-800 text-neutral-300 active:scale-[0.99] transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-to-br from-emerald-400 to-teal-600 text-emerald-950 py-3 rounded-lg font-semibold disabled:opacity-50 active:scale-[0.99] transition"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}