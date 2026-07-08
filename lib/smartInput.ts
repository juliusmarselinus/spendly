import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, TransactionType } from "@/types";

const INCOME_HINTS = ["gaji", "salary", "bonus", "thr", "untung", "profit", "jual", "hasil", "uang saku", "hadiah", "cashback", "transfer masuk"];

export function parseAmountToken(raw: string): number | null {
  const match = raw.match(/^(\d+(?:[.,]\d+)?)(k|rb|jt|juta)?$/i);
  if (!match) return null;
  const numPart = match[1].replace(",", ".");
  const unit = (match[2] || "").toLowerCase();
  let value = parseFloat(numPart);
  if (unit === "k" || unit === "rb") value *= 1_000;
  if (unit === "jt" || unit === "juta") value *= 1_000_000;
  return Math.round(value);
}

export function formatShorthandPreview(raw: string): string | null {
  const cleaned = raw.trim().split(/\s+/).pop() || "";
  const value = parseAmountToken(cleaned);
  if (value === null) return null;
  return "Rp" + value.toLocaleString("id-ID");
}

function matchCategory(text: string, categories: readonly string[]): string {
  const lower = text.toLowerCase();
  const found = categories.find((c) => lower.includes(c.toLowerCase()));
  if (found) return found;
  const other = categories.find((c) => c.toLowerCase().includes("lain"));
  return other || categories[0];
}

export type ParsedSmartInput = {
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
};

export function parseSmartInput(text: string): ParsedSmartInput | null {
  const tokens = text.trim().split(/\s+/);
  if (tokens.length === 0 || !text.trim()) return null;

  let amountIndex = -1;
  let amount: number | null = null;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const parsed = parseAmountToken(tokens[i]);
    if (parsed !== null) {
      amount = parsed;
      amountIndex = i;
      break;
    }
  }
  if (amount === null || amountIndex === -1) return null;

  const remainderTokens = tokens.filter((_, i) => i !== amountIndex);
  const remainder = remainderTokens.join(" ").trim();
  const lower = remainder.toLowerCase();

  const isIncome = INCOME_HINTS.some((hint) => lower.includes(hint));
  const type: TransactionType = isIncome ? "income" : "expense";
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const category = matchCategory(remainder, categories);
  const note = remainder ? remainder.charAt(0).toUpperCase() + remainder.slice(1) : "";

  return { type, amount, category, note };
}