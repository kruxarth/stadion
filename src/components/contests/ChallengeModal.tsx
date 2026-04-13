"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WAGER_OPTIONS = [25, 50, 100, 150];

interface UserOption {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  contestName: string;
  contestSlug: string;
  platform: "leetcode" | "codeforces";
  contestStart: Date;
  contestEnd: Date;
  currentUserId: string;
  currentUserPoints: number;
  currentUserAvailablePoints: number;
}

export function ChallengeModal({
  open, onClose, contestName, contestSlug, platform,
  contestStart, contestEnd, currentUserId, currentUserPoints, currentUserAvailablePoints,
}: Props) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [wager, setWager] = useState(50);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    fetch("/api/users")
      .then((r) => r.json())
      .then((data: UserOption[]) => setUsers(data.filter((u) => u.id !== currentUserId)))
      .catch(() => {});
  }, [open, currentUserId]);

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()),
  );

  const canSend = selectedUser && currentUserAvailablePoints >= wager;

  function handleSend() {
    if (!selectedUser) return;
    startTransition(async () => {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponent_id: selectedUser.id,
          platform,
          contest_id: contestSlug,
          contest_name: contestName,
          contest_start: contestStart.toISOString(),
          contest_end: contestEnd.toISOString(),
          points_wagered: wager,
        }),
      });
      if (res.ok) {
        toast.success(`Challenge sent to @${selectedUser.username}!`);
        onClose();
      } else {
        const data = await res.json() as { error?: string };
        toast.error(data.error ?? "Failed to send challenge.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Challenge a Friend</DialogTitle>
          <DialogDescription>{contestName} · {platform}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* User search */}
          <div className="space-y-2">
            <Label>Select Opponent</Label>
            <Input placeholder="Search by name or username…" value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedUser(null); }} />
            {search && (
              <div className="rounded-lg border border-border bg-popover max-h-44 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3">No users found.</p>
                ) : (
                  filtered.slice(0, 8).map((u) => (
                    <button key={u.id} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 text-left transition-colors"
                      onClick={() => { setSelectedUser(u); setSearch(u.full_name); }}>
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={u.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">{u.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
            {selectedUser && !search.includes(selectedUser.full_name) && null}
          </div>

          {/* Wager selector */}
          <div className="space-y-2">
            <Label>Wager (Stadion Points)</Label>
            <div className="flex gap-2">
              {WAGER_OPTIONS.map((w) => (
                <button key={w} onClick={() => setWager(w)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    wager === w ? "border-[#63e4e0] bg-[#63e4e0]/10 text-[#63e4e0]" : "border-border hover:bg-muted/60"
                  }`}>
                  {w}
                </button>
              ))}
            </div>
            {currentUserAvailablePoints < wager && (
              <p className="text-xs text-destructive">
                Insufficient available points ({currentUserAvailablePoints} SP available).
              </p>
            )}
          </div>

          <Button className="w-full" disabled={!canSend || isPending} onClick={handleSend}
            style={canSend ? { backgroundColor: "#63e4e0", color: "#293a4e" } : {}}>
            {isPending ? "Sending…" : "Send Challenge"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
