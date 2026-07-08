import {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Film,
  HeartPulse,
  Receipt,
  Wallet,
  Gift,
  TrendingUp,
  PiggyBank,
  Tag,
  LucideIcon,
} from "lucide-react";

type CategoryStyle = {
  icon: LucideIcon;
  color: string;
  bg: string;
};

const KEYWORD_MAP: { keywords: string[]; style: CategoryStyle }[] = [
  { keywords: ["makan", "kopi", "jajan", "resto", "warteg"], style: { icon: UtensilsCrossed, color: "#EF9F27", bg: "#3A2A0F" } },
  { keywords: ["transport", "bensin", "ojek", "parkir", "tol", "grab", "gojek"], style: { icon: Car, color: "#4C9AEB", bg: "#12283F" } },
  { keywords: ["belanja", "shopping", "baju"], style: { icon: ShoppingBag, color: "#E063A0", bg: "#3A1B2C" } },
  { keywords: ["hiburan", "nonton", "game", "film", "movie"], style: { icon: Film, color: "#9B8FF2", bg: "#251F44" } },
  { keywords: ["kesehatan", "obat", "dokter", "sakit"], style: { icon: HeartPulse, color: "#F0696A", bg: "#3D1A1A" } },
  { keywords: ["tagihan", "listrik", "wifi", "internet", "pulsa", "langganan"], style: { icon: Receipt, color: "#E0A63F", bg: "#3A2C10" } },
  { keywords: ["gaji", "salary", "thr"], style: { icon: Wallet, color: "#3ECB93", bg: "#0F3327" } },
  { keywords: ["hadiah", "gift", "bonus"], style: { icon: Gift, color: "#F08A5D", bg: "#3E2213" } },
  { keywords: ["investasi", "saham", "untung", "profit"], style: { icon: TrendingUp, color: "#8BC34A", bg: "#22300F" } },
  { keywords: ["tabungan", "nabung", "saving"], style: { icon: PiggyBank, color: "#3ECB93", bg: "#0F3327" } },
];

const FALLBACK_COLORS = ["#9B8FF2", "#3ECB93", "#F08A5D", "#E063A0", "#4C9AEB", "#8BC34A", "#E0A63F"];

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function getCategoryStyle(category: string): CategoryStyle {
  const lower = category.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.style;
  }
  const color = FALLBACK_COLORS[hashString(lower) % FALLBACK_COLORS.length];
  return { icon: Tag, color, bg: "#1C1F26" };
}