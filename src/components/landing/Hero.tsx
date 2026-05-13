"use client";

import { motion } from "framer-motion";
import { useAuth, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export function Hero() {
  const { isSignedIn } = useAuth();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-x-clip overflow-y-hidden bg-black px-4 pt-14 text-center">
      <div className="relative z-10 mx-auto w-full max-w-5xl overflow-x-clip">
        {/* Marquee ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full overflow-hidden border-y-2 border-[#63e4e0]/30 py-2 mb-10 sm:mb-12 sm:-mx-20 sm:w-auto"
        >
          <div className="flex whitespace-nowrap" style={{ animation: "marquee 20s linear infinite" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#63e4e0]/50 mx-4 sm:mx-8">
                GITHUB TRACKING // LEETCODE RATINGS // CODEFORCES RANKINGS // 1v1 CHALLENGES // BADGE ENGINE // LIVE LEADERBOARD //
              </span>
            ))}
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="mb-4 text-[2.95rem] min-[390px]:text-[3.6rem] sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase leading-[0.88] sm:leading-[0.85]">
            <span className="glitch-text block" data-text="OUTRANK">OUTRANK</span>
            <span className="block text-[#63e4e0] glitch-text" data-text="EVERY">EVERY</span>
            <span className="glitch-text block" data-text="ONE">ONE</span>
          </h1>
        </motion.div>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="font-mono text-xs min-[390px]:text-sm sm:text-base text-white/50 max-w-[20rem] sm:max-w-xl mx-auto mb-10 uppercase tracking-[0.12em] sm:tracking-wider leading-relaxed"
        >
          The competitive coding arena
          <br className="sm:hidden" />
          {" "}for college devs.
          <br />
          Ship code. Climb ranks. Dominate the leaderboard.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 w-full max-w-[18rem] sm:max-w-none mx-auto"
        >
          {!isSignedIn ? (
            <SignInButton forceRedirectUrl="/dashboard">
              <button className="brutal-border brutal-shadow brutal-hover bg-[#63e4e0] text-[#293a4e] font-mono font-black text-sm uppercase tracking-widest px-6 sm:px-8 py-4 flex items-center justify-center gap-3 cursor-pointer w-full sm:w-auto">
                <Zap className="h-5 w-5" />
                ENTER THE ARENA
              </button>
            </SignInButton>
          ) : (
            <Link href="/dashboard" className="w-full sm:w-auto">
              <button className="brutal-border brutal-shadow brutal-hover bg-[#63e4e0] text-[#293a4e] font-mono font-black text-sm uppercase tracking-widest px-6 sm:px-8 py-4 flex items-center justify-center gap-3 cursor-pointer w-full sm:w-auto">
                <Zap className="h-5 w-5" />
                GO TO DASHBOARD
              </button>
            </Link>
          )}

          <Link href="/leaderboard" className="w-full sm:w-auto">
            <button className="brutal-border brutal-hover bg-transparent text-[#63e4e0] font-mono font-bold text-sm uppercase tracking-widest px-6 sm:px-8 py-4 flex items-center justify-center gap-3 cursor-pointer w-full sm:w-auto">
              VIEW RANKINGS
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
        </motion.div>

        {/* Bottom accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-16 h-[2px] w-48 mx-auto"
          style={{ background: "linear-gradient(90deg, transparent, #63e4e0, transparent)" }}
        />
      </div>
    </section>
  );
}
