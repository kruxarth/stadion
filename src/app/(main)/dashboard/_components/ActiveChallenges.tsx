import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ChallengeWithUsers } from "./PendingChallenges";

interface Props {
  challenges: ChallengeWithUsers[];
  currentUserId: string;
}

function timeUntil(date: Date | string): string {
  const ms = new Date(date).getTime() - Date.now();
  if (ms <= 0) return "Waiting for official results";
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
        const otherUser = c.challenger_id === currentUserId ? c.opponent : c.challenger;
        return (
          <li key={c.id} className="rounded-lg border border-border p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={otherUser?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {otherUser?.full_name[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    {otherUser ? (
                      <Link
                        href={`/u/${otherUser.username}`}
                        className="font-medium hover:text-[#63e4e0] transition-colors"
                      >
                        vs @{otherUser.username}
                      </Link>
                    ) : (
                      <p className="font-medium">Opponent unavailable</p>
                    )}
                    <p className="text-muted-foreground text-xs truncate">{role}</p>
                  </div>
                </div>
                <p className="font-medium">{c.contest_name}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {c.platform} · {role} · ranked
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
