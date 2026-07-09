"use client";

import { Transaction } from "@/types";
import { getCategoryStyle } from "@/lib/categoryMeta";
import { X, Trash2 } from "lucide-react";

export default function TransactionDetailSheet({
  transaction,
  onClose,
  onDelete,
}: {
  transaction: Transaction;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const style = getCategoryStyle(transaction.category);
  const Icon = style.icon;
  const formatRupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50">
      <div className="bg-neutral-900 w-full max-w-md rounded-t-3xl p-6 pb-8">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-semibold">Detail Transaksi</h3>
          <button onClick={onClose} className="text-neutral-400">
            <X size={20} />
          </button>
        </div>

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
              <span className="text-sm font-medium text-right max-w-[60%]">
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
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-rose-600/10 text-rose-400 font-medium"
        >
          <Trash2 size={16} />
          Hapus Transaksi
        </button>
      </div>
    </div>
  );
}