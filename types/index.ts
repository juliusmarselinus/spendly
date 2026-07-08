export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string | null;
  date: string;
  created_at: string;
}

export interface Budget {
  id: string;
  category: string;
  monthly_limit: number;
  created_at: string;
}

export const EXPENSE_CATEGORIES = [
  "Makanan",
  "Transport/Bensin",
  "Belanja",
  "Tagihan",
  "Hiburan",
  "Lainnya",
];

export const INCOME_CATEGORIES = ["Pendapatan", "Tips", "Lainnya"];