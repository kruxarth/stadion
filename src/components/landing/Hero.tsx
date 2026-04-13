"use client";

import { motion } from "framer-motion";
import { useAuth, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, GitBranch } from "lucide-react";

export function Hero() {
  const { isSignedIn } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 px-4 text-center overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-[#63e4e0]/30 bg-[#63e4e0]/10 px-4 py-1.5 text-sm text-[#63e4e0] mb-8"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#63e4e0] animate-pulse" />
          Powered by C Cube
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]"
        >
          Compete.{" "}
          <span style={{ color: "#63e4e0" }}>Code.</span>{" "}
          Climb.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          The competitive coding leaderboard for college developers. Track
          GitHub activity, LeetCode ratings, and Codeforces rankings — all in
          one place.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {!isSignedIn ? (
            <SignInButton forceRedirectUrl="/dashboard">
              <Button
                size="lg"
                className="gap-2 font-semibold px-8"
                style={{ backgroundColor: "#63e4e0", color: "#293a4e" }}
              >
                <GitBranch className="h-4 w-4" />
                Login with GitHub
              </Button>
            </SignInButton>
          ) : (
            <Link href="/dashboard">
              <Button
                size="lg"
                className="gap-2 font-semibold px-8"
                style={{ backgroundColor: "#63e4e0", color: "#293a4e" }}
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}

          <Link href="/leaderboard">
            <Button size="lg" variant="outline" className="gap-2 px-8">
              View Leaderboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-muted-foreground/50 text-xs"
        >
          <span>Scroll</span>
          <span className="h-8 w-px bg-gradient-to-b from-muted-foreground/30 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
