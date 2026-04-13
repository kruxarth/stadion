const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const GITHUB_REST = "https://api.github.com";

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/vnd.github+json",
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContributionDay {
  date: string;  // "YYYY-MM-DD"
  count: number;
}

export interface TopLanguage {
  name: string;
  percentage: number;
}

export interface TopRepo {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  language: string | null;
}

export interface GitHubUserStats {
  weekly_commits: number;
  monthly_commits: number;
  top_languages: TopLanguage[];
  contribution_data: ContributionDay[];
}

export interface GitHubRateLimit {
  remaining: number;
  limit: number;
  resetAt: string;
}

// ─── Rate limit ───────────────────────────────────────────────────────────────

export async function getGitHubRateLimit(): Promise<GitHubRateLimit> {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ query: "{ rateLimit { limit remaining resetAt } }" }),
    cache: "no-store",
  });
  const json = await res.json();
  return json.data.rateLimit as GitHubRateLimit;
}

// ─── Contribution data (GraphQL) ──────────────────────────────────────────────

async function fetchContributions(
  username: string,
  from: string,
  to: string,
): Promise<ContributionDay[]> {
  const query = `
    query GetContributions($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ query, variables: { login: username, from, to } }),
    cache: "no-store",
  });

  if (!res.ok) return [];
  const json = await res.json();

  if (json.errors || !json.data?.user) return [];

  const weeks: Array<{
    contributionDays: Array<{ date: string; contributionCount: number }>;
  }> = json.data.user.contributionsCollection.contributionCalendar.weeks;

  return weeks.flatMap((week) =>
    week.contributionDays.map((d) => ({
      date: d.date,
      count: d.contributionCount,
    })),
  );
}

// ─── Top languages (REST) ─────────────────────────────────────────────────────

async function fetchTopLanguages(username: string): Promise<TopLanguage[]> {
  const reposRes = await fetch(
    `${GITHUB_REST}/users/${username}/repos?sort=updated&per_page=10`,
    { headers: authHeaders(), cache: "no-store" },
  );
  if (!reposRes.ok) return [];

  const repos: Array<{ name: string }> = await reposRes.json();
  if (!Array.isArray(repos) || repos.length === 0) return [];

  // Fetch language bytes for each repo in parallel
  const languageBytes: Record<string, number> = {};
  await Promise.all(
    repos.map(async (repo) => {
      try {
        const langRes = await fetch(
          `${GITHUB_REST}/repos/${username}/${repo.name}/languages`,
          { headers: authHeaders(), cache: "no-store" },
        );
        if (!langRes.ok) return;
        const langs: Record<string, number> = await langRes.json();
        for (const [lang, bytes] of Object.entries(langs)) {
          languageBytes[lang] = (languageBytes[lang] ?? 0) + bytes;
        }
      } catch {
        // Ignore individual repo failures — partial data is fine
      }
    }),
  );

  const total = Object.values(languageBytes).reduce((s, b) => s + b, 0);
  if (total === 0) return [];

  return Object.entries(languageBytes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, bytes]) => ({
      name,
      percentage: Math.round((bytes / total) * 100),
    }));
}

// ─── Top repos by stars (REST) — used by profile page, fetched live ───────────

export async function fetchTopRepos(username: string): Promise<TopRepo[]> {
  const res = await fetch(
    `${GITHUB_REST}/users/${username}/repos?sort=stars&per_page=3`,
    {
      headers: authHeaders(),
      next: { revalidate: 3600 }, // 1-hour Next.js cache
    },
  );
  if (!res.ok) return [];

  const repos: Array<{
    name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    language: string | null;
  }> = await res.json();

  if (!Array.isArray(repos)) return [];

  return repos.map((r) => ({
    name: r.name,
    description: r.description,
    url: r.html_url,
    stars: r.stargazers_count,
    language: r.language,
  }));
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function fetchGitHubStats(
  username: string,
): Promise<GitHubUserStats | null> {
  try {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const [contributionData, topLanguages] = await Promise.all([
      fetchContributions(
        username,
        oneYearAgo.toISOString(),
        now.toISOString(),
      ),
      fetchTopLanguages(username),
    ]);

    if (contributionData.length === 0) return null;

    // weekly_commits: last 7 days in contribution_data
    const last7 = contributionData.slice(-7);
    const weekly_commits = last7.reduce((s, d) => s + d.count, 0);

    // monthly_commits: entries whose date starts with current UTC YYYY-MM
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const monthly_commits = contributionData
      .filter((d) => d.date.startsWith(currentMonth))
      .reduce((s, d) => s + d.count, 0);

    return { weekly_commits, monthly_commits, top_languages: topLanguages, contribution_data: contributionData };
  } catch (err) {
    console.error(`[github] fetchGitHubStats failed for ${username}:`, err);
    return null;
  }
}
