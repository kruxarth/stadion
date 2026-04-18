import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/ensureUser";
import { OnboardingForm } from "./_components/OnboardingForm";

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1a1a2e]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-mono font-black text-3xl uppercase tracking-tight text-white">
            WELCOME TO <span className="text-[#63e4e0]">STADION</span>
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/40 mt-3">
            Complete your profile to enter the arena
          </p>
        </div>

        <div className="brutal-border brutal-shadow bg-[#293a4e] p-6">
          <div className="mb-5">
            <h2 className="font-mono font-bold text-sm uppercase tracking-wider text-white">
              YOUR DETAILS
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/40 mt-1">
              Shown on your public profile // used to calculate rank
            </p>
          </div>
          <OnboardingForm githubUsername={user.github_username} />
        </div>
      </div>
    </div>
  );
}
