"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import type { LeaderboardUser } from "@/lib/queries/leaderboard";

interface LeaderboardPreviewProps {
  users: LeaderboardUser[];
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "#FFD700",
    2: "#C0C0C0",
    3: "#CD7F32",
  };
  return (
    <span
      className="text-sm font-bold w-6 text-center shrink-0"
      style={{ color: colors[rank] ?? "currentColor" }}
    >
      {rank}
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Top Performers</h2>
            <p className="text-muted-foreground text-sm mt-1">All-time Stadion Points ranking</p>
          </div>
          <Link href="/leaderboard">
            <Button variant="outline" size="sm" className="gap-1.5">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isEmpty ? (
            // Skeleton placeholders when DB is empty
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={`/u/${user.username}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <RankBadge rank={user.rank} />
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {user.full_name}
                        {user.is_alumni && " 🎓"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.department ?? "—"} · {user.college_year ? `Year ${user.college_year}` : "Alumni"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold" style={{ color: "#63e4e0" }}>
                        {user.stadion_points.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">SP</p>
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
