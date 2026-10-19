import { NextResponse } from "next/server";
import { and, count, eq, like } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { challenge, checkIn, profile } from "@/lib/schema";
import { monthKeyInTz, todayInTz } from "@/lib/dates";

export const GRACE_QUOTA_PER_MONTH = 2; // SPEC #3: tối đa 2 ngày grace / tháng

// POST /api/grace — xin tha hôm nay. Kiểm tra quota tháng trước khi insert kind='grace'.
export async function POST() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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
  const month = monthKeyInTz(prof.timezone);

  const used = await ctx.db
    .select({ n: count() })
    .from(checkIn)
    .where(
      and(
        eq(checkIn.challengeId, ch.id),
        eq(checkIn.kind, "grace"),
        like(checkIn.localDate, `${month}-%`),
      ),
    )
    .get();
  const usedN = used?.n ?? 0;

  if (usedN >= GRACE_QUOTA_PER_MONTH) {
    return NextResponse.json(
      { error: "hết quota", used: usedN, quota: GRACE_QUOTA_PER_MONTH },
      { status: 400 },
    );
  }

  // Nếu đã check-in done hôm nay thì không cần tha
  const existing = await ctx.db
    .select()
    .from(checkIn)
    .where(
      and(
        eq(checkIn.challengeId, ch.id),
        eq(checkIn.localDate, today),
      ),
    )
    .get();
  if (existing?.kind === "done") {
    return NextResponse.json(
      { error: "hôm nay đã check-in rồi" },
      { status: 400 },
    );
  }

  await ctx.db
    .insert(checkIn)
    .values({ challengeId: ch.id, localDate: today, kind: "grace" })
    .onConflictDoNothing();

  return NextResponse.json({
    ok: true,
    date: today,
    used: usedN + 1,
    quota: GRACE_QUOTA_PER_MONTH,
  });
}

// GET /api/grace — quota còn lại của tháng này
export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const prof = await ctx.db
    .select()
    .from(profile)
    .where(eq(profile.id, ctx.user.id))
    .get();
  if (!prof) return NextResponse.json({ used: 0, quota: GRACE_QUOTA_PER_MONTH });

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
  if (!ch) return NextResponse.json({ used: 0, quota: GRACE_QUOTA_PER_MONTH });

  const month = monthKeyInTz(prof.timezone);
  const used = await ctx.db
    .select({ n: count() })
    .from(checkIn)
    .where(
      and(
        eq(checkIn.challengeId, ch.id),
        eq(checkIn.kind, "grace"),
        like(checkIn.localDate, `${month}-%`),
      ),
    )
    .get();

  return NextResponse.json({
    used: used?.n ?? 0,
    quota: GRACE_QUOTA_PER_MONTH,
    month,
  });
}
