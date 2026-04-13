import type { Challenge } from "@/lib/db/schema";

interface Props {
  challenges: Challenge[];
  currentUserId: string;
}

function timeUntil(date: Date | string): string {
  const ms = new Date(date).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
}

export function ActiveChallenges({ challenges, currentUserId }: Props) {
  if (challenges.length === 0) {
    return <p className="text-sm text-muted-foreground">No active challenges.</p>;
  }

  return (
    <ul className="space-y-3">
      {challenges.map((c) => {
        const role = c.challenger_id === currentUserId ? "Challenger" : "Opponent";
        return (
          <li key={c.id} className="rounded-lg border border-border p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{c.contest_name}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {c.platform} · {role} · {c.points_wagered} SP
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                {timeUntil(c.contest_end)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
