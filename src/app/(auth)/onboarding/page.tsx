import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/ensureUser";
import { OnboardingForm } from "./_components/OnboardingForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Set Up Your Profile — Stadion",
};

export default async function OnboardingPage() {
  const user = await ensureUser();

  if (!user) {
    redirect("/");
  }

  // Already onboarded — go straight to dashboard
  if (
    user.department !== null &&
    user.college_year !== null &&
    user.graduation_year !== null
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to Stadion
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete your profile to join the leaderboard.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
            <CardDescription>
              This information is shown on your public profile and used to
              calculate your rank.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm githubUsername={user.github_username} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
