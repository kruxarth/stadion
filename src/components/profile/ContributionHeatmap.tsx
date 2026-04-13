"use client";

import { ActivityCalendar } from "react-activity-calendar";
import { useTheme } from "next-themes";
import type { ContributionDay } from "@/lib/github";

type ActivityLevel = 0 | 1 | 2 | 3 | 4;

function toLevel(count: number): ActivityLevel {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

interface Props {
  data: ContributionDay[];
}

export function ContributionHeatmap({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const activities = data.map((d) => ({
    date: d.date,
    count: d.count,
    level: toLevel(d.count),
  }));

  return (
    <ActivityCalendar
      data={activities}
      colorScheme={resolvedTheme === "light" ? "light" : "dark"}
      theme={{
        light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
        dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
      }}
      fontSize={12}
      blockSize={12}
      blockMargin={3}
      labels={{ totalCount: "{{count}} contributions in the last year" }}
    />
  );
}
