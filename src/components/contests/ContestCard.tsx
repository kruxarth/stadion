"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Swords, Clock } from "lucide-react";
import { ChallengeModal } from "./ChallengeModal";

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Starting now";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface Props {
  platform: "leetcode" | "codeforces";
  name: string;
  slug: string;
  startTime: Date;
  endTime: Date;
  currentUserId?: string;
  currentUserPoints?: number;
  currentUserAvailablePoints?: number;
}

export function ContestCard({
  platform, name, slug, startTime, endTime,
  currentUserId, currentUserPoints = 0, currentUserAvailablePoints = 0,
}: Props) {
  const [countdown, setCountdown] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    function tick() {
      setCountdown(formatCountdown(startTime.getTime() - Date.now()));
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [startTime]);

  const isStarted = startTime.getTime() <= Date.now();

  return (
    <>
      <Card className="hover:border-[#63e4e0]/30 transition-colors">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs capitalize">{platform}</Badge>
              </div>
              <p className="font-semibold text-sm leading-snug">{name}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{startTime.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <span>·</span>
                <span>{Math.round((endTime.getTime() - startTime.getTime()) / 3_600_000)}h duration</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground mb-2">Starts in</p>
              <p className="text-sm font-bold" style={{ color: "#63e4e0" }}>{countdown}</p>
            </div>
          </div>

          {currentUserId && !isStarted && (
            <Button size="sm" variant="outline" className="mt-4 gap-1.5 h-8 text-xs"
              onClick={() => setModalOpen(true)}>
              <Swords className="h-3.5 w-3.5" /> Challenge a Friend
            </Button>
          )}
        </CardContent>
      </Card>

      {currentUserId && (
        <ChallengeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          contestName={name}
          contestSlug={slug}
          platform={platform}
          contestStart={startTime}
          contestEnd={endTime}
          currentUserId={currentUserId}
          currentUserPoints={currentUserPoints}
          currentUserAvailablePoints={currentUserAvailablePoints}
        />
      )}
    </>
  );
}
