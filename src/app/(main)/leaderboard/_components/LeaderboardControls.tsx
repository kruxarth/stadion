"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";

const TABS = [
  { value: "builders", label: "Builders" },
  { value: "leetcode", label: "LeetCode" },
  { value: "codeforces", label: "Codeforces" },
  { value: "arena", label: "Arena" },
] as const;

const YEARS = [
  { value: "all", label: "All Years" },
  { value: "1", label: "Y1" },
  { value: "2", label: "Y2" },
  { value: "3", label: "Y3" },
  { value: "4", label: "Y4" },
  { value: "alumni", label: "Alumni" },
] as const;

const PROGRAMS = [
  { value: "all", label: "All Programs" },
  { value: "btech", label: "B.Tech" },
  { value: "mtech", label: "M.Tech" },
  { value: "mca", label: "MCA" },
] as const;

interface Props {
  currentTab: string;
  currentYear: string;
  currentProgram: string;
}

export function LeaderboardControls({ currentTab, currentYear, currentProgram }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  function update(key: string, value: string, label: string) {
    const currentValue =
      key === "tab" ? currentTab : key === "program" ? currentProgram : currentYear;
    if (currentValue === value) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.set("page", "1");
    setPendingLabel(label);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tab switcher */}
      <div className="flex w-fit max-w-full overflow-x-auto rounded-lg border border-border text-sm">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => update("tab", t.value, t.label)}
            disabled={isPending}
            className={`px-4 py-2 transition-colors ${
              currentTab === t.value
                ? "bg-[#63e4e0] text-[#293a4e] font-semibold"
                : "hover:bg-muted/60 text-muted-foreground"
            } disabled:cursor-wait disabled:opacity-70`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Program filter */}
        <div className="flex w-fit max-w-full overflow-x-auto rounded-lg border border-border text-sm">
          {PROGRAMS.map((program) => (
            <button
              key={program.value}
              onClick={() => update("program", program.value, program.label)}
              disabled={isPending}
              className={`whitespace-nowrap px-3 py-2 transition-colors ${
                currentProgram === program.value
                  ? "bg-muted font-medium"
                  : "hover:bg-muted/60 text-muted-foreground"
              } disabled:cursor-wait disabled:opacity-70`}
            >
              {program.label}
            </button>
          ))}
        </div>

        {/* Year filter */}
        <div className="flex w-fit max-w-full overflow-x-auto rounded-lg border border-border text-sm">
          {YEARS.map((y) => (
            <button
              key={y.value}
              onClick={() => update("year", y.value, y.label)}
              disabled={isPending}
              className={`whitespace-nowrap px-3 py-2 transition-colors ${
                currentYear === y.value
                  ? "bg-muted font-medium"
                  : "hover:bg-muted/60 text-muted-foreground"
              } disabled:cursor-wait disabled:opacity-70`}
            >
              {y.label}
            </button>
          ))}
        </div>
      </div>

      {isPending && (
        <div
          className="flex items-center gap-2 rounded-lg border border-[#63e4e0]/30 bg-[#63e4e0]/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#63e4e0]"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          Loading {pendingLabel ?? "leaderboard"} rankings
        </div>
      )}
    </div>
  );
}
