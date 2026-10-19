import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { challenge, profile } from "@/lib/schema";

// PATCH /api/settings { timezone?, remindAt?, handle?, showNotes?, status? }
export async function PATCH(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    timezone?: string;
    remindAt?: string | null;
    handle?: string;
    showNotes?: boolean;
    status?: string;
  };

  const prof = await ctx.db
    .select()
    .from(profile)
    .where(eq(profile.id, ctx.user.id))
    .get();
  if (!prof)
    return NextResponse.json({ error: "chưa onboarding" }, { status: 400 });

  // --- profile ---
  const profilePatch: Partial<typeof profile.$inferInsert> = {};
  if (typeof body.timezone === "string" && body.timezone !== prof.timezone) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: body.timezone });
    } catch {
      return NextResponse.json({ error: "timezone không hợp lệ" }, { status: 400 });
    }
    profilePatch.timezone = body.timezone.slice(0, 64);
  }
  if (typeof body.handle === "string") {
    const h = body.handle.trim().toLowerCase().slice(0, 32);
    if (!/^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])?$/.test(h)) {
      return NextResponse.json(
        { error: "handle chỉ gồm chữ thường, số, gạch ngang" },
        { status: 400 },
      );
    }
    const clash = await ctx.db
      .select({ id: profile.id })
      .from(profile)
      .where(and(eq(profile.handle, h), ne(profile.id, ctx.user.id)))
      .get();
    if (clash)
      return NextResponse.json({ error: "handle đã có người dùng" }, { status: 400 });
    profilePatch.handle = h;
  }
  if (typeof body.showNotes === "boolean") {
    profilePatch.showNotes = body.showNotes;
  }
  if (Object.keys(profilePatch).length > 0) {
    await ctx.db
      .update(profile)
      .set(profilePatch)
      .where(eq(profile.id, ctx.user.id));
  }

  // --- challenge ---
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
  if (ch) {
    const challengePatch: Partial<typeof challenge.$inferInsert> = {};
    if (body.remindAt !== undefined) {
      challengePatch.remindAt =
        body.remindAt && /^(\d{2}):(\d{2})$/.test(body.remindAt)
          ? body.remindAt
          : null;
    }
    if (body.status === "paused" || body.status === "done") {
      challengePatch.status = body.status;
    }
    if (Object.keys(challengePatch).length > 0) {
      await ctx.db
        .update(challenge)
        .set(challengePatch)
        .where(eq(challenge.id, ch.id));
    }
  }

  return NextResponse.json({ ok: true });
}
