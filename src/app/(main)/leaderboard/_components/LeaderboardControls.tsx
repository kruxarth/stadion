"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { value: "all-time", label: "All-time" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
] as const;

const YEARS = [
  { value: "all", label: "All Years" },
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
  { value: "alumni", label: "Alumni" },
] as const;

interface Props {
  currentTab: string;
  currentYear: string;
}

export function LeaderboardControls({ currentTab, currentYear }: Props) {
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
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Tab switcher */}
      <div className="flex rounded-lg border border-border overflow-hidden text-sm">
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

      {/* Year filter */}
      <div className="flex rounded-lg border border-border overflow-hidden text-sm">
        {YEARS.map((y) => (
          <button
            key={y.value}
            onClick={() => update("year", y.value)}
            className={`px-3 py-2 transition-colors ${
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
  );
}
