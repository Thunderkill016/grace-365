import { redirect } from "next/navigation";
import { and, count, eq, like } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { challenge, checkIn, profile } from "@/lib/schema";
import { monthKeyInTz, todayInTz } from "@/lib/dates";
import { getStreak } from "@/lib/streak";
import { dayIndexOf } from "@/lib/season";
import { microTaskFor } from "@/lib/microtask";
import { getMicroTask } from "@/lib/skill-content";
import { GRACE_QUOTA_PER_MONTH } from "@/app/api/grace/route";
import { Nav } from "@/components/Nav";
import { CheckInPanel } from "./CheckInPanel";

export default async function TodayPage() {
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
  if (!ch) redirect("/onboarding");

  const today = todayInTz(prof.timezone);
  const dayIdx = Math.max(dayIndexOf(ch.startsOn, today), 1);

  // Micro-task thư viện theo dayNumber = today - startsOn + 1;
  // kỹ năng tự đặt (skillId null) thì dùng gợi ý xoay vòng cũ.
  const libTask = getMicroTask(ch.skillId, dayIdx);
  const customTaskText = microTaskFor(ch.skill, dayIdx);

  const existing = await ctx.db
    .select()
    .from(checkIn)
    .where(
      and(eq(checkIn.challengeId, ch.id), eq(checkIn.localDate, today)),
    )
    .get();

  const streak = await getStreak(ctx.db, ch.id, today);

  const month = monthKeyInTz(prof.timezone);
  const graceUsed =
    (
      await ctx.db
        .select({ n: count() })
        .from(checkIn)
        .where(
          and(
            eq(checkIn.challengeId, ch.id),
            eq(checkIn.kind, "grace"),
            like(checkIn.localDate, `${month}-%`),
          ),
        )
        .get()
    )?.n ?? 0;

  return (
    <>
      <Nav active="/today" />
      <main className="mx-auto max-w-md px-5 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Ngày {dayIdx} / 365</p>
            <h1 className="text-xl font-extrabold">{ch.skill}</h1>
          </div>
          <div className="rounded-2xl bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-emerald-600">
              🔥 {streak.streak}
            </p>
            <p className="text-[11px] text-slate-500">ngày liên tiếp</p>
          </div>
        </div>

        <div className="mt-5">
          <CheckInPanel
            task={libTask}
            customTaskText={customTaskText}
            dayNumber={dayIdx}
            minutesDefault={ch.minutesPerDay}
            alreadyDone={existing?.kind === "done"}
            alreadyGrace={existing?.kind === "grace"}
            graceUsed={graceUsed}
            graceQuota={GRACE_QUOTA_PER_MONTH}
          />
        </div>

        <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
          <p className="font-semibold text-slate-800">Cam kết if-then của bạn:</p>
          <p className="mt-1 italic">“{ch.ifThen}”</p>
        </div>
      </main>
    </>
  );
}
