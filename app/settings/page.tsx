import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { challenge, profile } from "@/lib/schema";
import { Nav } from "@/components/Nav";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login");

  const prof = await ctx.db
    .select()
    .from(profile)
    .where(eq(profile.id, ctx.user.id))
    .get();
  if (!prof) redirect("/onboarding");

  const ch = await ctx.db
    .select()
    .from(challenge)
    .where(
      and(
        eq(challenge.userId, ctx.user.id),
        eq(challenge.status, "active"),
      ),
    )
    .get();

  return (
    <>
      <Nav active="/settings" />
      <main className="mx-auto max-w-md px-5 py-6">
        <h1 className="text-xl font-extrabold">Cài đặt</h1>
        <div className="mt-4">
          <SettingsForm
            initial={{
              handle: prof.handle,
              timezone: prof.timezone,
              remindAt: ch?.remindAt ?? null,
              showNotes: prof.showNotes,
              status: ch?.status ?? "none",
              email: ctx.user.email,
            }}
          />
        </div>
      </main>
    </>
  );
}
