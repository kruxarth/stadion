"use client";

import { motion } from "framer-motion";
import { Users, GitCommitHorizontal, Trophy } from "lucide-react";

interface StatCardsProps {
  totalMembers: number;
  weeklyCommits: number;
  topUser: { username: string; full_name: string; stadion_points: number } | null;
}

export function StatCards({ totalMembers, weeklyCommits, topUser }: StatCardsProps) {
  const stats = [
    {
      icon: Users,
      label: "REGISTERED",
      value: totalMembers.toLocaleString(),
      suffix: "DEVS",
    },
    {
      icon: GitCommitHorizontal,
      label: "THIS WEEK",
      value: weeklyCommits.toLocaleString(),
      suffix: "COMMITS",
    },
    {
      icon: Trophy,
      label: "CURRENT #1",
      value: topUser ? `@${topUser.username}` : "---",
      suffix: topUser ? `${topUser.stadion_points.toLocaleString()} SP` : null,
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="brutal-border brutal-shadow brutal-hover bg-[#293a4e] p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <s.icon className="h-4 w-4 text-[#63e4e0]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                {s.label}
              </span>
            </div>
            <p className="font-mono font-black text-3xl text-white tracking-tight">
              {s.value}
            </p>
            {s.suffix && (
              <p className="font-mono text-xs uppercase tracking-wider text-[#63e4e0] mt-1">
                {s.suffix}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
