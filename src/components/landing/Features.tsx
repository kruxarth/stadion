"use client";

import { motion } from "framer-motion";
import { GitBranch, Code2, Award, Swords } from "lucide-react";

const FEATURES = [
  {
    icon: GitBranch,
    title: "GITHUB TRACKING",
    description:
      "Weekly + monthly commits, top languages, contribution heatmap. Auto-synced every 6 hours. No excuses.",
    tag: "// COMMITS",
  },
  {
    icon: Code2,
    title: "LC + CF RATINGS",
    description:
      "Link your LeetCode and Codeforces. Ratings and problem counts feed directly into your Stadion score.",
    tag: "// COMPETITIVE",
  },
  {
    icon: Award,
    title: "BADGE ENGINE",
    description:
      "Earn Commit King, LC King, CF King, Arena King. Monthly resets. Only the best wear the crown.",
    tag: "// FLEX",
  },
  {
    icon: Swords,
    title: "1v1 CHALLENGES",
    description:
      "Challenge anyone. Pick a contest. Wager Stadion Points. Winner takes all. Loser gets nothing.",
    tag: "// PVP",
  },
];

export function Features() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-14"
      >
        <div className="flex items-center gap-4 mb-3">
          <div className="h-[2px] w-12 bg-[#63e4e0]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#63e4e0]">
            CAPABILITIES
          </span>
        </div>
        <h2 className="font-mono font-black text-3xl sm:text-4xl uppercase tracking-tight text-white">
          EVERYTHING YOU NEED
          <br />
          <span className="text-[#63e4e0]">TO DOMINATE</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="brutal-border brutal-shadow brutal-hover bg-[#293a4e] p-6 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="brutal-border p-2.5">
                <f.icon className="h-5 w-5 text-[#63e4e0]" />
              </div>
              <span className="font-mono text-[10px] text-white/20 uppercase">
                {f.tag}
              </span>
            </div>
            <h3 className="font-mono font-black text-base uppercase tracking-wide text-white mb-2">
              {f.title}
            </h3>
            <p className="font-mono text-xs text-white/50 leading-relaxed">
              {f.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
