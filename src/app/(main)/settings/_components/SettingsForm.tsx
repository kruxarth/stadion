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
import { PROGRAMS, deriveAcademicStatus, getAcademicStartYear } from "@/lib/academicYear";

const DEPARTMENTS = [
  "Computer Science", "Information Technology", "Electronics & Communication",
  "Electrical Engineering", "Mechanical Engineering", "Civil Engineering",
  "Chemical Engineering", "Other",
];

const ACADEMIC_START_YEAR = getAcademicStartYear();

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
  const [program, setProgram] = useState(user.program ?? "btech");
  const [graduationYear, setGraduationYear] = useState(user.graduation_year ? String(user.graduation_year) : "");
  const graduationYearNumber = Number(graduationYear);
  const calculatedStatus = graduationYear && !Number.isNaN(graduationYearNumber)
    ? deriveAcademicStatus({ graduationYear: graduationYearNumber, program })
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateSettings({
        leetcode_username: lcUsername,
        codeforces_handle: cfHandle,
        department,
        program,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="program">Program</Label>
          <Select value={program} onValueChange={(v) => setProgram(v ?? "btech")}>
            <SelectTrigger id="program" className="w-full">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              {PROGRAMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="grad">Graduation Year</Label>
          <Input id="grad" type="number" value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
            min={ACADEMIC_START_YEAR + 1} max={ACADEMIC_START_YEAR + 6} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Current year is calculated automatically from your program and graduation year. It rolls over on July 1.
        {calculatedStatus && (
          <span className="ml-1 text-[#63e4e0]">
            Current value:{" "}
            {calculatedStatus.isAlumni
              ? "Alumni"
              : calculatedStatus.collegeYear
                ? `Year ${calculatedStatus.collegeYear}`
                : "outside program range"}
          </span>
        )}
      </p>
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
