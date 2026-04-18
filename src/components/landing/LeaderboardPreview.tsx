"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import type { LeaderboardUser } from "@/lib/queries/leaderboard";

interface LeaderboardPreviewProps {
  users: LeaderboardUser[];
}

function RankBadge({ rank }: { rank: number }) {
  const labels: Record<number, string> = {
    1: "#01",
    2: "#02",
    3: "#03",
    4: "#04",
    5: "#05",
  };
  const isTop3 = rank <= 3;
  return (
    <span
      className={`font-mono font-black text-sm shrink-0 ${isTop3 ? "text-[#63e4e0]" : "text-white/40"}`}
    >
      {labels[rank] ?? `#${String(rank).padStart(2, "0")}`}
    </span>
  );
}

export function LeaderboardPreview({ users }: LeaderboardPreviewProps) {
  const isEmpty = users.length === 0;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-mono font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
              TOP KILLERS
            </h2>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40 mt-1">
              ALL-TIME STADION POINTS
            </p>
          </div>
          <Link href="/leaderboard">
            <button className="brutal-border brutal-hover bg-transparent text-[#63e4e0] font-mono font-bold text-xs uppercase tracking-wider px-4 py-2 flex items-center gap-2 cursor-pointer">
              ALL RANKS <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </div>

        {/* Table */}
        <div className="brutal-border bg-[#293a4e] overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-4 px-5 py-2.5 border-b-2 border-[#63e4e0]/30 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
            <span className="w-10">RANK</span>
            <span className="flex-1">PLAYER</span>
            <span className="text-right w-20">POINTS</span>
          </div>

          {isEmpty ? (
            <div className="divide-y divide-white/5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="h-4 w-8 rounded-none bg-white/10" />
                  <Skeleton className="h-8 w-8 rounded-none bg-white/10" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded-none bg-white/10" />
                    <Skeleton className="h-3 w-20 rounded-none bg-white/10" />
                  </div>
                  <Skeleton className="h-4 w-16 rounded-none bg-white/10" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {users.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    href={`/u/${user.username}`}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-[#63e4e0]/5 transition-colors ${i === 0 ? "bg-[#63e4e0]/5" : ""}`}
                  >
                    <RankBadge rank={user.rank} />
                    <Avatar className="h-8 w-8 rounded-none border border-white/10">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback className="rounded-none bg-white/10 font-mono text-xs">
                        {user.full_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-bold text-sm text-white truncate uppercase">
                        {user.full_name}
                      </p>
                      <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider">
                        {user.department ?? "---"} / {user.college_year ? `Y${user.college_year}` : "ALUM"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-black text-lg text-[#63e4e0]">
                        {user.stadion_points.toLocaleString()}
                      </p>
                      <p className="font-mono text-[10px] text-white/30 uppercase">SP</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
