"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PieChart, Plus } from "lucide-react";

function NavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link href={href} className="flex-1 py-3.5 flex flex-col items-center gap-1">
      <Icon
        size={20}
        strokeWidth={active ? 2.4 : 1.8}
        className={active ? "text-emerald-400" : "text-neutral-500"}
      />
      <span
        className={`text-[10px] ${
          active ? "text-emerald-400 font-medium" : "text-neutral-500"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4">
      <div className="relative bg-neutral-900/90 backdrop-blur-lg border border-neutral-800 rounded-3xl flex items-center shadow-2xl shadow-black/50">
        <NavItem href="/" label="Home" Icon={Home} active={pathname === "/"} />

        <div className="w-16 shrink-0" />

        <NavItem href="/stats" label="Grafik" Icon={PieChart} active={pathname === "/stats"} />

        <Link
          href="/?add=1"
          className="absolute left-1/2 -translate-x-1/2 -top-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center ring-[6px] ring-[#0E1013] shadow-lg shadow-emerald-500/30 active:scale-95 transition"
          style={{ width: 52, height: 52 }}
        >
          <Plus size={24} className="text-emerald-950" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}