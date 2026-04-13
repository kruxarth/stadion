"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Challenge } from "@/lib/db/schema";

interface Props {
  challenges: Challenge[];
  currentUserId: string;
}

export function PendingChallenges({ challenges, currentUserId }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  async function respond(id: string, action: "accept" | "decline") {
    const res = await fetch(`/api/challenges/${id}/${action}`, { method: "POST" });
    if (res.ok) {
      setDismissed((prev) => new Set(prev).add(id));
      toast.success(action === "accept" ? "Challenge accepted!" : "Challenge declined.");
    } else {
      const data = await res.json() as { error?: string };
      toast.error(data.error ?? "Something went wrong.");
    }
  }

  const visible = challenges.filter((c) => !dismissed.has(c.id));

  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending challenges.</p>;
  }

  return (
    <ul className="space-y-3">
      {visible.map((c) => (
        <li key={c.id} className="rounded-lg border border-border p-3 text-sm">
          <p className="font-medium">{c.contest_name}</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {c.platform} · {c.points_wagered} SP wager
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="h-7 text-xs px-3" onClick={() => respond(c.id, "accept")}
              style={{ backgroundColor: "#63e4e0", color: "#293a4e" }}>
              Accept
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-3"
              onClick={() => respond(c.id, "decline")}>
              Decline
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
