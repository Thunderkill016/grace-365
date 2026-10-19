import { NextResponse } from "next/server";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { challenge, checkIn, profile } from "@/lib/schema";
import { seasonRange } from "@/lib/season";

// GET /api/heatmap?season=1..4 — các ngày trong mùa kèm kind (done|grace|empty)
export async function GET(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const prof = await ctx.db
    .select()
    .from(profile)
    .where(eq(profile.id, ctx.user.id))
    .get();
  if (!prof) return NextResponse.json({ error: "chưa onboarding" }, { status: 400 });

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
  if (!ch) return NextResponse.json({ error: "không có challenge active" }, { status: 400 });

  const url = new URL(req.url);
  const season = Math.min(Math.max(Number(url.searchParams.get("season") ?? "1") || 1, 1), 4);
  const range = seasonRange(ch.startsOn, season);

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

  return NextResponse.json({
    season,
    start: range.start,
    end: range.end,
    days: rows,
  });
}
