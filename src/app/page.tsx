import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { AnimatedBackground } from "@/components/landing/AnimatedBackground";
import { StatCards } from "@/components/landing/StatCards";
import { LeaderboardPreview } from "@/components/landing/LeaderboardPreview";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { getTopLeaderboard, getLandingStats } from "@/lib/queries/leaderboard";

export default async function LandingPage() {
  const [topUsers, stats] = await Promise.all([
    getTopLeaderboard(5).catch(() => []),
    getLandingStats().catch(() => ({ totalMembers: 0, weeklyCommits: 0, topUser: null })),
  ]);

  return (
    <>
      <Navbar />
      <div className="relative">
        <AnimatedBackground />
        <Hero />
      </div>
      <StatCards
        totalMembers={stats.totalMembers}
        weeklyCommits={stats.weeklyCommits}
        topUser={stats.topUser}
      />
      <LeaderboardPreview users={topUsers} />
      <Features />
      <Footer />
    </>
  );
}
