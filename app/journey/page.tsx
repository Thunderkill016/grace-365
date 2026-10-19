import { redirect } from "next/navigation";
import Link from "next/link";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { challenge, checkIn, profile } from "@/lib/schema";
import { todayInTz } from "@/lib/dates";
import { getStreak } from "@/lib/streak";
import { SEASON1_MILESTONES, dayIndexOf, seasonRange } from "@/lib/season";
import { Nav } from "@/components/Nav";
import { Heatmap, type DayKind } from "@/components/Heatmap";

export default async function JourneyPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
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

  const sp = await searchParams;
  const season = Math.min(Math.max(Number(sp.season ?? "1") || 1, 1), 4);
  const range = seasonRange(ch.startsOn, season);
  const today = todayInTz(prof.timezone);

  const rows = await ctx.db
    .select({ localDate: checkIn.localDate, kind: checkIn.kind })
    .from(checkIn)
    .where(
      and(
        eq(checkIn.challengeId, ch.id),
        gte(checkIn.localDate, range.start),
        lte(checkIn.localDate, range.end),
      ),
    )
    .orderBy(asc(checkIn.localDate));

  const byDate: Record<string, DayKind> = {};
  for (const r of rows) byDate[r.localDate] = r.kind as DayKind;

  const streak = await getStreak(ctx.db, ch.id, today);
  const dayIdx = Math.max(dayIndexOf(ch.startsOn, today), 1);

  return (
    <>
      <Nav active="/journey" />
      <main className="mx-auto max-w-md px-5 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold">Hành trình</h1>
          <div className="rounded-2xl bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-emerald-600">
              🔥 {streak.streak}
            </p>
            <p className="text-[11px] text-slate-500">ngày liên tiếp</p>
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {ch.skill} · Ngày {Math.min(dayIdx, 365)} / 365 ·{" "}
          <Link
            href={`/u/${prof.handle}`}
            className="text-emerald-700 underline"
          >
            trang công khai
          </Link>
        </p>

        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <Link
              key={s}
              href={`/journey?season=${s}`}
              className={`flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold ${
                s === season
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 shadow-sm"
              }`}
            >
              Mùa {s}
            </Link>
          ))}
        </div>

        <div className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-slate-700">
            Mùa {season} · {range.start} → {range.end}
          </p>
          <Heatmap
            startsOn={range.start}
            byDate={byDate}
            milestones={season === 1 ? SEASON1_MILESTONES : []}
            totalDays={91}
            today={today}
          />
          {season === 1 && (
            <p className="mt-3 text-xs text-slate-500">
              ◉ Viền đậm = mốc mùa 1: ngày 7 / 21 / 40 / 66. Vượt qua ngày 66
              là thói quen bắt đầu tự chạy.
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xl font-extrabold text-emerald-600">
              {streak.done}
            </p>
            <p className="text-[11px] text-slate-500">ngày đã làm (chuỗi hiện tại)</p>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xl font-extrabold text-amber-500">
              {rows.filter((r) => r.kind === "grace").length}
            </p>
            <p className="text-[11px] text-slate-500">ngày được tha (mùa này)</p>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xl font-extrabold text-slate-700">{dayIdx > 365 ? 365 : dayIdx}</p>
            <p className="text-[11px] text-slate-500">ngày đã đi qua</p>
          </div>
        </div>
      </main>
    </>
  );
}
