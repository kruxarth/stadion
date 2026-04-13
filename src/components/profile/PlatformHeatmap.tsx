"use client";

import { useEffect, useState } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import { useTheme } from "next-themes";
import type { ActivityDay } from "@/lib/leetcode";

// Platform color scales: [empty, l1, l2, l3, l4]
const THEMES = {
  leetcode: {
    light: ["#f0f0f0", "#ffd58e", "#ffb733", "#ff9a00", "#c77200"],
    dark:  ["#1e1e1e", "#432b00", "#7a4f00", "#b87300", "#ffa116"],
  },
  codeforces: {
    light: ["#f0f0f0", "#a8c8f0", "#5a9fd4", "#1f72b8", "#0a4a8a"],
    dark:  ["#0d1117", "#0d2a45", "#0e4882", "#1167b8", "#318ce7"],
  },
};

export type Platform = keyof typeof THEMES;

interface Props {
  url: string;
  platform: Platform;
  label: string;
}

export function PlatformHeatmap({ url, platform, label }: Props) {
  const { resolvedTheme } = useTheme();
  const [data, setData] = useState<ActivityDay[] | null>(null);

  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then((d: ActivityDay[]) => setData(d))
      .catch(() => setData([]));
  }, [url]);

  if (data === null) {
    return <div className="h-28 animate-pulse rounded-lg bg-muted/40" />;
  }

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No {label} activity found.
      </p>
    );
  }

  return (
    <ActivityCalendar
      data={data}
      colorScheme={resolvedTheme === "light" ? "light" : "dark"}
      theme={THEMES[platform]}
      showColorLegend={false}
      showMonthLabels
      showTotalCount
      labels={{ totalCount: `{{count}} ${label} submissions in the last year` }}
      style={{ fontSize: 11 }}
    />
  );
}
