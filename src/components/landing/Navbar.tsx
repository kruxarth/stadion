"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { isSignedIn } = useAuth();

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b-2 border-[#63e4e0] bg-[#293a4e]/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 overflow-x-clip px-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-2 min-w-0">
          <Image
            src="/ccube.png"
            alt="C Cube"
            width={24}
            height={24}
            className="rounded-none"
          />
          <span className="font-mono text-base font-black uppercase tracking-[0.2em] text-white transition-colors group-hover:text-[#63e4e0] sm:text-lg sm:tracking-widest">
            STADION
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 font-mono text-xs uppercase tracking-widest text-white/60">
          <Link href="#features" className="hover:text-[#63e4e0] transition-colors">
            Features
          </Link>
          <Link href="/leaderboard" className="hover:text-[#63e4e0] transition-colors">
            Rankings
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {!isSignedIn ? (
            <SignInButton forceRedirectUrl="/dashboard">
              <button className="brutal-border brutal-shadow-sm brutal-hover cursor-pointer bg-[#63e4e0] px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#293a4e] sm:px-4 sm:text-xs sm:tracking-wider">
                Enter Arena
              </button>
            </SignInButton>
          ) : (
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Link href="/dashboard">
                <button className="brutal-border brutal-hover cursor-pointer bg-transparent px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#63e4e0] sm:px-4 sm:text-xs sm:tracking-wider">
                  Dashboard
                </button>
              </Link>
              <UserButton />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
