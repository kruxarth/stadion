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
import { PROGRAMS, deriveAcademicStatus, getAcademicStartYear } from "@/lib/academicYear";

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

const ACADEMIC_START_YEAR = getAcademicStartYear();

export function OnboardingForm({ githubUsername }: { githubUsername: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [department, setDepartment] = useState("");
  const [program, setProgram] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [codeforcesHandle, setCodeforcesHandle] = useState("");
  const graduationYearNumber = Number(graduationYear);
  const calculatedStatus = program && graduationYear && !Number.isNaN(graduationYearNumber)
    ? deriveAcademicStatus({ graduationYear: graduationYearNumber, program })
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!department) {
      setError("Select your department.");
      return;
    }
    if (!program) {
      setError("Select your program.");
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
          program,
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

      {/* Program */}
      <div className="space-y-2">
        <Label htmlFor="program" className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
          Program
        </Label>
        <Select value={program} onValueChange={(v) => setProgram(v ?? "")}>
          <SelectTrigger id="program" className="w-full font-mono text-sm">
            <SelectValue placeholder="Select your program" />
          </SelectTrigger>
          <SelectContent>
            {PROGRAMS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
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
          placeholder={String(ACADEMIC_START_YEAR + 1)}
          min={ACADEMIC_START_YEAR + 1}
          max={ACADEMIC_START_YEAR + 6}
          value={graduationYear}
          onChange={(e) => setGraduationYear(e.target.value)}
          className="font-mono text-sm"
        />
      </div>

      {calculatedStatus && (
        <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">
          Calculated year:{" "}
          <span className="text-[#63e4e0]">
            {calculatedStatus.isAlumni
              ? "Alumni"
              : calculatedStatus.collegeYear
                ? `Year ${calculatedStatus.collegeYear}`
                : "Outside program range"}
          </span>{" "}
          // updates every July 1
        </p>
      )}

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
