import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/ensureUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./_components/SettingsForm";

export const metadata = { title: "Settings — Stadion" };

export default async function SettingsPage() {
  const user = await ensureUser();
  if (!user) redirect("/");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and linked accounts</p>
      </div>

      <div className="space-y-6">
        {/* Read-only GitHub info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">GitHub Account</CardTitle>
            <CardDescription>Linked via OAuth — cannot be changed here</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono bg-muted/50 rounded-md px-3 py-2">
              @{user.github_username}
            </p>
          </CardContent>
        </Card>

        {/* Editable settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Settings</CardTitle>
            <CardDescription>
              Updating LeetCode or Codeforces handles will trigger an immediate stats sync.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm user={user} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
