"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { isSignedIn } = useAuth();

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b-2 border-[#63e4e0] bg-[#293a4e]/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <Image
            src="/ccube.png"
            alt="C Cube"
            width={28}
            height={28}
            className="rounded-none"
          />
          <span className="font-mono font-black text-lg tracking-widest uppercase text-white group-hover:text-[#63e4e0] transition-colors">
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
        <div className="flex items-center gap-3">
          {!isSignedIn ? (
            <SignInButton forceRedirectUrl="/dashboard">
              <button className="brutal-border brutal-shadow-sm brutal-hover bg-[#63e4e0] text-[#293a4e] font-mono font-bold text-xs uppercase tracking-wider px-4 py-2 cursor-pointer">
                Enter Arena
              </button>
            </SignInButton>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <button className="brutal-border brutal-hover bg-transparent text-[#63e4e0] font-mono font-bold text-xs uppercase tracking-wider px-4 py-2 cursor-pointer">
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
