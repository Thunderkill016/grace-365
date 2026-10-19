import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { challenge, checkIn, profile } from "@/lib/schema";
import { todayInTz } from "@/lib/dates";

// POST /api/checkin { minutes?, note?, microTask? }
// Upsert theo unique(challengeId, localDate) — bấm đúp không nhân đôi.
// Nếu hôm nay đã có hàng grace thì nâng lên done.
export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    minutes?: number;
    note?: string;
    microTask?: string;
  };

  const prof = await ctx.db
    .select()
    .from(profile)
    .where(eq(profile.id, ctx.user.id))
    .get();
  if (!prof)
    return NextResponse.json({ error: "chưa onboarding" }, { status: 400 });

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
  if (!ch)
    return NextResponse.json({ error: "không có challenge active" }, { status: 400 });

  const today = todayInTz(prof.timezone);
  const note = (body.note ?? "").toString().slice(0, 280);
  const minutes =
    typeof body.minutes === "number" && body.minutes > 0
      ? Math.min(Math.round(body.minutes), 1440)
      : null;

  await ctx.db
    .insert(checkIn)
    .values({
      challengeId: ch.id,
      localDate: today,
      kind: "done",
      note: note || null,
      minutes,
      microTask: (body.microTask ?? "").toString().slice(0, 280) || null,
    })
    .onConflictDoUpdate({
      target: [checkIn.challengeId, checkIn.localDate],
      set: {
        kind: "done",
        note: note || null,
        minutes,
        microTask: (body.microTask ?? "").toString().slice(0, 280) || null,
      },
    });

  return NextResponse.json({ ok: true, date: today });
}
