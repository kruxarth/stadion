"use client";

import { motion } from "framer-motion";
import { GitBranch, Code2, Award, Swords } from "lucide-react";

const FEATURES = [
  {
    icon: GitBranch,
    title: "GitHub Activity Tracking",
    description:
      "Weekly and monthly commit counts, top languages, and a full contribution heatmap — automatically synced every 6 hours.",
  },
  {
    icon: Code2,
    title: "LeetCode & Codeforces",
    description:
      "Link your competitive programming accounts to include ratings and problem counts in your Stadion score.",
  },
  {
    icon: Award,
    title: "Badge System",
    description:
      "Earn monthly badges like Commit King, LC King, CF King, and Arena King. One-time alumni badges too.",
  },
  {
    icon: Swords,
    title: "1v1 Contest Challenges",
    description:
      "Challenge classmates on upcoming LeetCode or Codeforces contests. Wager Stadion Points — winner takes all.",
  },
];

export function Features() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <h2 className="text-3xl font-bold mb-3">Everything in one place</h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Stadion turns your coding activity into a real-time competitive ranking.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="group rounded-xl border border-border bg-card p-6 hover:border-[#63e4e0]/40 transition-colors"
          >
            <div
              className="rounded-lg p-3 w-fit mb-4"
              style={{ backgroundColor: "rgba(99,228,224,0.1)" }}
            >
              <f.icon className="h-5 w-5" style={{ color: "#63e4e0" }} />
            </div>
            <h3 className="font-semibold text-base mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
