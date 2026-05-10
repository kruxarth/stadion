export const PROGRAMS = [
  { value: "btech", label: "B.Tech", durationYears: 4 },
  { value: "mtech", label: "M.Tech", durationYears: 2 },
  { value: "mca", label: "MCA", durationYears: 2 },
] as const;

export type Program = (typeof PROGRAMS)[number]["value"];

export function getProgramDuration(program: string | null | undefined): number {
  return PROGRAMS.find((p) => p.value === program)?.durationYears ?? 4;
}

export function getAcademicStartYear(date = new Date()): number {
  const utcYear = date.getUTCFullYear();
  const utcMonth = date.getUTCMonth();
  return utcMonth >= 6 ? utcYear : utcYear - 1;
}

export function deriveCollegeYear({
  graduationYear,
  program,
  date = new Date(),
}: {
  graduationYear: number;
  program: string;
  date?: Date;
}): number | null {
  const durationYears = getProgramDuration(program);
  const academicStartYear = getAcademicStartYear(date);
  const year = durationYears - (graduationYear - academicStartYear) + 1;

  if (year < 1 || year > durationYears) return null;
  return year;
}

export function deriveAcademicStatus({
  graduationYear,
  program,
  date = new Date(),
}: {
  graduationYear: number | null;
  program: string | null;
  date?: Date;
}): { collegeYear: number | null; isAlumni: boolean } {
  if (!graduationYear || !program) {
    return { collegeYear: null, isAlumni: false };
  }

  const academicStartYear = getAcademicStartYear(date);
  const isAlumni = graduationYear <= academicStartYear;

  if (isAlumni) {
    return { collegeYear: null, isAlumni: true };
  }

  return {
    collegeYear: deriveCollegeYear({ graduationYear, program, date }),
    isAlumni: false,
  };
}
