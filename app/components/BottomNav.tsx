"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PieChart, Wallet } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/stats", label: "Grafik", icon: PieChart },
  { href: "/budget", label: "Budget", icon: Wallet },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur border-t border-neutral-800 flex z-40 pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link key={tab.href} href={tab.href} className="flex-1 py-3 flex flex-col items-center gap-1">
            <Icon size={20} className={active ? "text-emerald-400" : "text-neutral-500"} />
            <span className={`text-[11px] font-medium ${active ? "text-emerald-400" : "text-neutral-500"}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}