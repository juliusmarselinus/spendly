import { Transaction } from "@/types";

export function getDateGroupLabel(dateStr: string): string {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(yesterday.getDate()).padStart(2, "0")}`;

  if (dateStr === todayStr) return "Hari ini";
  if (dateStr === yesterdayStr) return "Kemarin";

  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface DateGroup {
  label: string;
  date: string;
  transactions: Transaction[];
}

export function groupTransactionsByDate(transactions: Transaction[]): DateGroup[] {
  const groups: Record<string, Transaction[]> = {};

  transactions.forEach((t) => {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  });

  return Object.entries(groups)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1)) // tanggal terbaru dulu
    .map(([date, txs]) => ({
      label: getDateGroupLabel(date),
      date,
      transactions: txs,
    }));
}