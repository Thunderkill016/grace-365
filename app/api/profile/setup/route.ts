import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { challenge, profile } from "@/lib/schema";
import { todayInTz } from "@/lib/dates";
import { SKILL_IDS } from "@/lib/skill-content";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "user"
  );
}

function randomSuffix(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  for (const b of buf) out += chars[b % chars.length];
  return out;
}

// POST /api/profile/setup { skill, minutesPerDay, remindAt, ifThen, timezone? }
// Onboarding bắt buộc sau login lần đầu. if-then tối thiểu 10 ký tự (SPEC #5).
export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await ctx.db
    .select()
    .from(profile)
    .where(eq(profile.id, ctx.user.id))
    .get();
  if (existing)
    return NextResponse.json({ error: "đã onboarding rồi" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as {
    skill?: string;
    skillId?: string | null;
    minutesPerDay?: number;
    remindAt?: string;
    ifThen?: string;
    timezone?: string;
  };

  const skill = (body.skill ?? "").toString().trim().slice(0, 80);
  // skillId chỉ nhận 1 trong 6 id thư viện; còn lại → null (kỹ năng tự đặt)
  const skillId =
    typeof body.skillId === "string" && SKILL_IDS.includes(body.skillId)
      ? body.skillId
      : null;
  const ifThen = (body.ifThen ?? "").toString().trim().slice(0, 280);
  const timezone = (body.timezone ?? "Asia/Ho_Chi_Minh").toString().slice(0, 64);
  const minutesPerDay = Math.min(
    Math.max(Math.round(Number(body.minutesPerDay) || 2), 1),
    1440,
  );
  const remindAt = /^(\d{2}):(\d{2})$/.test(body.remindAt ?? "")
    ? (body.remindAt as string)
    : null;

  if (!skill)
    return NextResponse.json({ error: "thiếu kỹ năng" }, { status: 400 });
  if (ifThen.length < 10)
    return NextResponse.json(
      { error: "câu if-then phải tối thiểu 10 ký tự" },
      { status: 400 },
    );

  // Validate timezone hợp lệ (Intl sẽ throw nếu sai)
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    return NextResponse.json({ error: "timezone không hợp lệ" }, { status: 400 });
  }

  // Sinh handle unique từ email
  const base = slugify(ctx.user.email.split("@")[0] ?? "user");
  let handle = `${base}-${randomSuffix()}`;
  for (let i = 0; i < 5; i++) {
    const clash = await ctx.db
      .select({ id: profile.id })
      .from(profile)
      .where(eq(profile.handle, handle))
      .get();
    if (!clash) break;
    handle = `${base}-${randomSuffix()}`;
  }

  await ctx.db.insert(profile).values({
    id: ctx.user.id,
    handle,
    timezone,
    showNotes: false,
  });

  const startsOn = todayInTz(timezone);
  const [ch] = await ctx.db
    .insert(challenge)
    .values({
      userId: ctx.user.id,
      skill,
      skillId,
      minutesPerDay,
      remindAt,
      ifThen,
      startsOn,
      status: "active",
    })
    .returning({ id: challenge.id });

  return NextResponse.json({ ok: true, handle, challengeId: ch.id, startsOn });
}
