"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/leaderboard", label: "RANKINGS" },
  { href: "/contests", label: "CONTESTS" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-[#63e4e0] bg-[#293a4e]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0 group">
            <Image src="/ccube.png" alt="C Cube" width={24} height={24} className="rounded-none" />
            <span className="font-mono font-black text-sm tracking-widest uppercase text-white group-hover:text-[#63e4e0] transition-colors">
              STADION
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                  pathname === n.href
                    ? "text-[#63e4e0] border-b-2 border-[#63e4e0]"
                    : "text-white/50 hover:text-[#63e4e0]"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/settings">
            <button className="brutal-border brutal-hover bg-transparent text-[#63e4e0] font-mono font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 cursor-pointer hidden sm:block">
              SETTINGS
            </button>
          </Link>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
