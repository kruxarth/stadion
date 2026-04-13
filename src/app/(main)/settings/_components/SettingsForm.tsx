"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSettings, syncMyData } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import type { User } from "@/lib/db/schema";

const DEPARTMENTS = [
  "Computer Science", "Information Technology", "Electronics & Communication",
  "Electrical Engineering", "Mechanical Engineering", "Civil Engineering",
  "Chemical Engineering", "Other",
];

export function SettingsForm({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const [isSyncing, startSync] = useTransition();

  function handleSync() {
    startSync(async () => {
      const result = await syncMyData();
      if (result.success) {
        toast.success("Data synced! Refresh the page to see updated stats.");
      } else {
        toast.error(result.error ?? "Sync failed.");
      }
    });
  }
  const [lcUsername, setLcUsername] = useState(user.leetcode_username ?? "");
  const [cfHandle, setCfHandle] = useState(user.codeforces_handle ?? "");
  const [department, setDepartment] = useState(user.department ?? "");
  const [collegeYear, setCollegeYear] = useState(user.college_year ? String(user.college_year) : "");
  const [graduationYear, setGraduationYear] = useState(user.graduation_year ? String(user.graduation_year) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateSettings({
        leetcode_username: lcUsername,
        codeforces_handle: cfHandle,
        department,
        college_year: collegeYear,
        graduation_year: graduationYear,
      });
      if (result.success) {
        toast.success("Settings saved.");
      } else {
        toast.error(result.error ?? "Failed to save settings.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="lc">LeetCode Username</Label>
        <Input id="lc" value={lcUsername} onChange={(e) => setLcUsername(e.target.value)}
          placeholder="your-leetcode-username" autoComplete="off" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cf">Codeforces Handle</Label>
        <Input id="cf" value={cfHandle} onChange={(e) => setCfHandle(e.target.value)}
          placeholder="your-cf-handle" autoComplete="off" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dept">Department</Label>
        <Select value={department} onValueChange={(v) => setDepartment(v ?? "")}>
          <SelectTrigger id="dept" className="w-full">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Current Year</Label>
          <Select value={collegeYear} onValueChange={(v) => setCollegeYear(v ?? "")}>
            <SelectTrigger id="year" className="w-full">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y === 1 ? "1st" : y === 2 ? "2nd" : y === 3 ? "3rd" : "4th"} Year
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="grad">Graduation Year</Label>
          <Input id="grad" type="number" value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
            min={new Date().getFullYear()} max={new Date().getFullYear() + 6} />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="flex-1"
          style={{ backgroundColor: "#63e4e0", color: "#293a4e" }}>
          {isPending ? "Saving…" : "Save Settings"}
        </Button>
        <Button type="button" variant="outline" disabled={isSyncing} onClick={handleSync}
          className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing…" : "Sync Now"}
        </Button>
      </div>
    </form>
  );
}
