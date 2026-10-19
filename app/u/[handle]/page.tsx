import { notFound } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/lib/db";
import { challenge, checkIn, profile } from "@/lib/schema";
import type { Env } from "@/lib/env";
import { todayInTz } from "@/lib/dates";
import { getStreak } from "@/lib/streak";
import { dayIndexOf } from "@/lib/season";
import { Heatmap, type DayKind } from "@/components/Heatmap";

// Trang công khai: heatmap + streak. KHÔNG lộ email; ghi chú chỉ hiện nếu user bật.
export default async function PublicPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  await connection(); // trang public nhưng đọc D1 theo request — không prerender
  const { env } = await getCloudflareContext({ async: true });
  const db = createDb(env as unknown as Env);

  const prof = await db
    .select()
    .from(profile)
    .where(eq(profile.handle, handle.toLowerCase()))
    .get();
  if (!prof) notFound();

  const ch = await db
    .select()
    .from(challenge)
    .where(
      and(
        eq(challenge.userId, prof.id),
        eq(challenge.status, "active"),
      ),
    )
    .get();
  if (!ch) notFound();

  const rows = await db
    .select({
      localDate: checkIn.localDate,
      kind: checkIn.kind,
      note: checkIn.note,
      microTask: checkIn.microTask,
    })
    .from(checkIn)
    .where(eq(checkIn.challengeId, ch.id))
    .orderBy(asc(checkIn.localDate));

  const byDate: Record<string, DayKind> = {};
  for (const r of rows) byDate[r.localDate] = r.kind as DayKind;

  const today = todayInTz(prof.timezone);
  const streak = await getStreak(db, ch.id, today);
  const dayIdx = Math.min(Math.max(dayIndexOf(ch.startsOn, today), 1), 365);

  const recentNotes = prof.showNotes
    ? rows.filter((r) => r.kind === "done" && r.note).slice(-5).reverse()
    : [];

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <Link href="/" className="text-lg font-extrabold text-emerald-600">
        🌱 Grace 365
      </Link>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-xs text-slate-500">@{prof.handle} đang rèn</p>
        <h1 className="mt-1 text-2xl font-extrabold">{ch.skill}</h1>
        <div className="mt-3 flex gap-3">
          <div className="flex-1 rounded-2xl bg-emerald-50 p-3 text-center">
            <p className="text-2xl font-extrabold text-emerald-600">
              🔥 {streak.streak}
            </p>
            <p className="text-[11px] text-slate-500">ngày liên tiếp</p>
          </div>
          <div className="flex-1 rounded-2xl bg-slate-50 p-3 text-center">
            <p className="text-2xl font-extrabold text-slate-700">{dayIdx}</p>
            <p className="text-[11px] text-slate-500">/ 365 ngày</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-slate-700">
          365 ngày — biết tha, không biết bỏ
        </p>
        <Heatmap
          startsOn={ch.startsOn}
          byDate={byDate}
          totalDays={365}
          today={today}
        />
      </div>

      {recentNotes.length > 0 && (
        <div className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Nhật ký gần đây
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            {recentNotes.map((r) => (
              <li key={r.localDate} className="rounded-xl bg-slate-50 p-3">
                <span className="text-xs text-slate-400">{r.localDate}</span>
                <p className="mt-0.5">{r.note}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-block rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white"
        >
          Tôi cũng muốn thử →
        </Link>
      </div>
    </main>
  );
}
