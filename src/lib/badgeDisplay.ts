export interface BadgeAwardInput {
  slug: string;
  name: string;
  description: string;
  icon_url: string | null;
  award_key: string;
  awarded_at?: Date | string | null;
}

export interface BadgeSummary {
  slug: string;
  name: string;
  description: string;
  icon_url: string | null;
  count: number;
  awardKeys: string[];
  awardLabels: string[];
  isCurrent: boolean;
  latestAwardedAt: Date | string | null;
}

export function currentAwardKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function isMonthlyAwardKey(awardKey: string): boolean {
  return /^\d{4}-\d{2}$/.test(awardKey);
}

export function formatAwardKey(awardKey: string): string {
  if (!isMonthlyAwardKey(awardKey)) return "Lifetime";

  const [year, month] = awardKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function summarizeBadgeAwards(awards: BadgeAwardInput[]): BadgeSummary[] {
  const current = currentAwardKey();
  const bySlug = new Map<string, BadgeSummary>();

  for (const award of awards) {
    const existing = bySlug.get(award.slug);
    if (existing) {
      existing.count++;
      existing.awardKeys.push(award.award_key);
      existing.awardLabels.push(formatAwardKey(award.award_key));
      existing.isCurrent = existing.isCurrent || award.award_key === current;
      if (award.awarded_at && (!existing.latestAwardedAt || new Date(award.awarded_at) > new Date(existing.latestAwardedAt))) {
        existing.latestAwardedAt = award.awarded_at;
      }
    } else {
      bySlug.set(award.slug, {
        slug: award.slug,
        name: award.name,
        description: award.description,
        icon_url: award.icon_url,
        count: 1,
        awardKeys: [award.award_key],
        awardLabels: [formatAwardKey(award.award_key)],
        isCurrent: award.award_key === current,
        latestAwardedAt: award.awarded_at ?? null,
      });
    }
  }

  return Array.from(bySlug.values()).sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    const bTime = b.latestAwardedAt ? new Date(b.latestAwardedAt).getTime() : 0;
    const aTime = a.latestAwardedAt ? new Date(a.latestAwardedAt).getTime() : 0;
    return bTime - aTime;
  });
}
