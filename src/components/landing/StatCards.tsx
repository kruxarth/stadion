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
      label: "Registered Members",
      value: totalMembers.toLocaleString(),
    },
    {
      icon: GitCommitHorizontal,
      label: "Commits This Week",
      value: weeklyCommits.toLocaleString(),
    },
    {
      icon: Trophy,
      label: "Current Leader",
      value: topUser ? `@${topUser.username}` : "—",
      sub: topUser ? `${topUser.stadion_points.toLocaleString()} SP` : null,
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
            className="rounded-xl border border-border bg-card p-6 flex items-start gap-4"
          >
            <div
              className="rounded-lg p-2.5 shrink-0"
              style={{ backgroundColor: "rgba(99,228,224,0.12)" }}
            >
              <s.icon className="h-5 w-5" style={{ color: "#63e4e0" }} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-0.5">{s.value}</p>
              {s.sub && <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
