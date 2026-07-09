"use client";

import { Transaction } from "@/types";
import { getCategoryStyle } from "@/lib/categoryMeta";

export default function TransactionRow({
  transaction,
  onClick,
}: {
  transaction: Transaction;
  onClick: () => void;
}) {
  const style = getCategoryStyle(transaction.category);
  const Icon = style.icon;
  const formatRupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");

  return (
    <button
      onClick={onClick}
      className="w-full bg-neutral-900 rounded-xl p-4 flex items-center gap-3 text-left active:scale-[0.99] transition"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: style.bg }}
      >
        <Icon size={18} style={{ color: style.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{transaction.category}</p>
        {transaction.note && (
          <p className="text-neutral-500 text-sm truncate">{transaction.note}</p>
        )}
      </div>
      <p
        className={`font-semibold text-sm shrink-0 ${
          transaction.type === "income" ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {transaction.type === "income" ? "+" : "-"}
        {formatRupiah(Number(transaction.amount))}
      </p>
    </button>
  );
}