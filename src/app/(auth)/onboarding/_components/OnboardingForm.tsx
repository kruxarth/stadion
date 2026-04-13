"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "../actions";
import { Button } from "@/components/ui/button";
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
      setError("Please select your department.");
      return;
    }
    if (!collegeYear) {
      setError("Please select your current year.");
      return;
    }
    if (!graduationYear || isNaN(Number(graduationYear))) {
      setError("Please enter a valid graduation year.");
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
        <Label htmlFor="department">Department</Label>
        <Select value={department} onValueChange={(v) => setDepartment(v ?? "")}>
          <SelectTrigger id="department" className="w-full">
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
        <Label htmlFor="college_year">Current Year</Label>
        <Select value={collegeYear} onValueChange={(v) => setCollegeYear(v ?? "")}>
          <SelectTrigger id="college_year" className="w-full">
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
        <Label htmlFor="graduation_year">Expected Graduation Year</Label>
        <Input
          id="graduation_year"
          type="number"
          placeholder={String(CURRENT_YEAR + 1)}
          min={CURRENT_YEAR}
          max={CURRENT_YEAR + 6}
          value={graduationYear}
          onChange={(e) => setGraduationYear(e.target.value)}
        />
      </div>

      {/* LeetCode */}
      <div className="space-y-2">
        <Label htmlFor="leetcode_username">
          LeetCode Username{" "}
          <span className="text-muted-foreground text-sm">(optional)</span>
        </Label>
        <Input
          id="leetcode_username"
          type="text"
          placeholder="your-leetcode-username"
          value={leetcodeUsername}
          onChange={(e) => setLeetcodeUsername(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Codeforces */}
      <div className="space-y-2">
        <Label htmlFor="codeforces_handle">
          Codeforces Handle{" "}
          <span className="text-muted-foreground text-sm">(optional)</span>
        </Label>
        <Input
          id="codeforces_handle"
          type="text"
          placeholder="your-cf-handle"
          value={codeforcesHandle}
          onChange={(e) => setCodeforcesHandle(e.target.value)}
          autoComplete="off"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Setting up your profile…" : "Complete Setup"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Signed in as <span className="font-medium">@{githubUsername}</span>
      </p>
    </form>
  );
}
