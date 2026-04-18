import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/ensureUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./_components/SettingsForm";

export const metadata = { title: "Settings — Stadion" };

export default async function SettingsPage() {
  const user = await ensureUser();
  if (!user) redirect("/");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-[2px] w-8 bg-[#63e4e0]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#63e4e0]">
            CONFIG
          </span>
        </div>
        <h1 className="font-mono font-black text-2xl uppercase tracking-tight text-white">
          SETTINGS
        </h1>
        <p className="font-mono text-xs uppercase tracking-wider text-white/40 mt-1">
          Manage your profile // linked accounts
        </p>
      </div>

      <div className="space-y-6">
        {/* Read-only GitHub info */}
        <Card className="border-2 border-[rgba(99,228,224,0.2)]">
          <CardHeader>
            <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">
              GITHUB ACCOUNT
            </CardTitle>
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
              Linked via OAuth // cannot be changed here
            </p>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm bg-[#1e3040] border-2 border-[rgba(99,228,224,0.2)] px-3 py-2 text-[#63e4e0]">
              @{user.github_username}
            </p>
          </CardContent>
        </Card>

        {/* Editable settings */}
        <Card className="border-2 border-[rgba(99,228,224,0.2)]">
          <CardHeader>
            <CardTitle className="font-mono font-bold text-sm uppercase tracking-wider">
              PROFILE SETTINGS
            </CardTitle>
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
              Updating handles triggers immediate stats sync
            </p>
          </CardHeader>
          <CardContent>
            <SettingsForm user={user} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
