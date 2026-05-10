"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

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

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tab switcher */}
      <div className="flex w-fit max-w-full overflow-x-auto rounded-lg border border-border text-sm">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => update("tab", t.value)}
            className={`px-4 py-2 transition-colors ${
              currentTab === t.value
                ? "bg-[#63e4e0] text-[#293a4e] font-semibold"
                : "hover:bg-muted/60 text-muted-foreground"
            }`}
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
              onClick={() => update("program", program.value)}
              className={`whitespace-nowrap px-3 py-2 transition-colors ${
                currentProgram === program.value
                  ? "bg-muted font-medium"
                  : "hover:bg-muted/60 text-muted-foreground"
              }`}
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
              onClick={() => update("year", y.value)}
              className={`whitespace-nowrap px-3 py-2 transition-colors ${
                currentYear === y.value
                  ? "bg-muted font-medium"
                  : "hover:bg-muted/60 text-muted-foreground"
              }`}
            >
              {y.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
