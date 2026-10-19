import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { profile } from "@/lib/schema";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/login");

  const existing = await ctx.db
    .select()
    .from(profile)
    .where(eq(profile.id, ctx.user.id))
    .get();
  if (existing) redirect("/today");

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <p className="text-4xl">🧭</p>
      <h1 className="mt-4 text-2xl font-extrabold">
        Thiết lập thử thách của bạn
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Một lần duy nhất. Sau này đổi được trong Cài đặt.
      </p>
      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <OnboardingForm />
      </div>
    </main>
  );
}
