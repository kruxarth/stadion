"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Other",
];

const CURRENT_YEAR = new Date().getFullYear();

export function OnboardingForm({ githubUsername }: { githubUsername: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [department, setDepartment] = useState("");
  const [collegeYear, setCollegeYear] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [codeforcesHandle, setCodeforcesHandle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!department) {
      setError("Select your department.");
      return;
    }
    if (!collegeYear) {
      setError("Select your current year.");
      return;
    }
    if (!graduationYear || isNaN(Number(graduationYear))) {
      setError("Enter a valid graduation year.");
      return;
    }

    startTransition(async () => {
      try {
        await completeOnboarding({
          department,
          college_year: Number(collegeYear),
          graduation_year: Number(graduationYear),
          leetcode_username: leetcodeUsername,
          codeforces_handle: codeforcesHandle,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Department */}
      <div className="space-y-2">
        <Label htmlFor="department" className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
          Department
        </Label>
        <Select value={department} onValueChange={(v) => setDepartment(v ?? "")}>
          <SelectTrigger id="department" className="w-full font-mono text-sm">
            <SelectValue placeholder="Select your department" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* College Year */}
      <div className="space-y-2">
        <Label htmlFor="college_year" className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
          Current Year
        </Label>
        <Select value={collegeYear} onValueChange={(v) => setCollegeYear(v ?? "")}>
          <SelectTrigger id="college_year" className="w-full font-mono text-sm">
            <SelectValue placeholder="Select your year" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4].map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y === 1
                  ? "1st Year"
                  : y === 2
                    ? "2nd Year"
                    : y === 3
                      ? "3rd Year"
                      : "4th Year"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Graduation Year */}
      <div className="space-y-2">
        <Label htmlFor="graduation_year" className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
          Expected Graduation Year
        </Label>
        <Input
          id="graduation_year"
          type="number"
          placeholder={String(CURRENT_YEAR + 1)}
          min={CURRENT_YEAR}
          max={CURRENT_YEAR + 6}
          value={graduationYear}
          onChange={(e) => setGraduationYear(e.target.value)}
          className="font-mono text-sm"
        />
      </div>

      {/* LeetCode */}
      <div className="space-y-2">
        <Label htmlFor="leetcode_username" className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
          LeetCode Username{" "}
          <span className="text-white/30">(optional)</span>
        </Label>
        <Input
          id="leetcode_username"
          type="text"
          placeholder="your-leetcode-username"
          value={leetcodeUsername}
          onChange={(e) => setLeetcodeUsername(e.target.value)}
          autoComplete="off"
          className="font-mono text-sm"
        />
      </div>

      {/* Codeforces */}
      <div className="space-y-2">
        <Label htmlFor="codeforces_handle" className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
          Codeforces Handle{" "}
          <span className="text-white/30">(optional)</span>
        </Label>
        <Input
          id="codeforces_handle"
          type="text"
          placeholder="your-cf-handle"
          value={codeforcesHandle}
          onChange={(e) => setCodeforcesHandle(e.target.value)}
          autoComplete="off"
          className="font-mono text-sm"
        />
      </div>

      {error && (
        <p className="font-mono text-xs text-[#ff3e3e] uppercase">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full brutal-border brutal-shadow brutal-hover bg-[#63e4e0] text-[#293a4e] font-mono font-black text-sm uppercase tracking-widest px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending ? "SETTING UP..." : "ENTER THE ARENA"}
      </button>

      <p className="font-mono text-[10px] text-center uppercase tracking-wider text-white/30">
        Signed in as <span className="text-[#63e4e0]">@{githubUsername}</span>
      </p>
    </form>
  );
}
