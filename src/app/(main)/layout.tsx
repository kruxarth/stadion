import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/ensureUser";
import { AppHeader } from "@/components/AppHeader";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await ensureUser();

  // proxy.ts already enforces Clerk auth, but guard here too
  if (!user) {
    redirect("/");
  }

  // If onboarding is incomplete, redirect to onboarding
  if (
    user.department === null ||
    user.college_year === null ||
    user.graduation_year === null
  ) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
