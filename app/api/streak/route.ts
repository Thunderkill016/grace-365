import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { challenge, profile } from "@/lib/schema";
import { todayInTz } from "@/lib/dates";
import { getStreak } from "@/lib/streak";

// GET /api/streak — streak hiện tại, tính live bằng gaps-and-islands (không lưu bộ đếm)
export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const prof = await ctx.db
    .select()
    .from(profile)
    .where(eq(profile.id, ctx.user.id))
    .get();
  if (!prof) return NextResponse.json({ streak: 0, done: 0 });

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
  if (!ch) return NextResponse.json({ streak: 0, done: 0 });

  const today = todayInTz(prof.timezone);
  const s = await getStreak(ctx.db, ch.id, today);
  return NextResponse.json({ ...s, today });
}
