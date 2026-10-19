import { and, eq } from "drizzle-orm";
import { createDb } from "./db";
import { challenge, checkIn, profile, user } from "./schema";
import type { Env } from "./env";
import { isWithinReminderWindow, todayInTz } from "./dates";
import { sendEmail } from "./email";

// Cron chạy mỗi giờ: với mỗi challenge active, tính giờ địa phương của user;
// nếu trong ±30 phút của remindAt và chưa check-in hôm nay => gửi mail nhắc.
// File này KHÔNG import next/* hay @opennextjs/cloudflare để cron-worker bundle được.
export async function runHourlyReminders(env: Env): Promise<void> {
  const db = createDb(env);
  const now = new Date();

  const rows = await db
    .select({
      id: challenge.id,
      userId: challenge.userId,
      skill: challenge.skill,
      remindAt: challenge.remindAt,
      timezone: profile.timezone,
      email: user.email,
    })
    .from(challenge)
    .innerJoin(profile, eq(challenge.userId, profile.id))
    .innerJoin(user, eq(challenge.userId, user.id))
    .where(eq(challenge.status, "active"));

  let sent = 0;
  for (const c of rows) {
    try {
      if (!c.remindAt) continue;
      const tz = c.timezone || "Asia/Ho_Chi_Minh";
      const today = todayInTz(tz, now);

      const existing = await db
        .select({ id: checkIn.id })
        .from(checkIn)
        .where(
          and(
            eq(checkIn.challengeId, c.id),
            eq(checkIn.localDate, today),
          ),
        )
        .get();
      if (existing) continue; // đã check-in / đã xin tha hôm nay

      if (!isWithinReminderWindow(c.remindAt, tz, now)) continue;

      await sendEmail(
        env,
        c.email,
        `Nhắc nhẹ: micro-task hôm nay của bạn 🌱`,
        `Chào bạn,\n\nĐến giờ thực hành "${c.skill}" rồi — chỉ cần vài phút thôi.\nMở Grace 365 để check-in hôm nay nhé.\n\n(Nhắc tự động từ Grace 365)`,
      );
      sent++;
    } catch (e) {
      console.error(`[cron] lỗi với challenge ${c.id}:`, e);
    }
  }
  console.log(`[cron] quét xong ${rows.length} challenge, đã gửi ${sent} mail nhắc.`);
}
