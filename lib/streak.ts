import { sql } from "drizzle-orm";
import type { Db } from "./db";

// Query streak ĐÚNG mẫu SPEC — gaps-and-islands trên check_in, KHÔNG lưu bộ đếm.
// :cid = challengeId, :today = 'YYYY-MM-DD' theo tz user.
// Không có hàng nào => streak = 0 (SPEC #4: streak sống nếu ngày active gần nhất >= hôm nay - 1).
export async function getStreak(
  db: Db,
  challengeId: string,
  today: string,
): Promise<{ streak: number; done: number }> {
  const rows = await db.all<{ streak: number; doneN: number }>(sql`
    WITH days AS (
      SELECT localDate,
             date(localDate, '-' || ROW_NUMBER() OVER (ORDER BY localDate) || ' days') AS grp,
             kind
      FROM check_in
      WHERE challengeId = ${challengeId} AND kind IN ('done','grace') AND localDate <= ${today}
    ),
    islands AS (
      SELECT grp, MAX(localDate) AS maxD, COUNT(*) AS len,
             SUM(kind = 'done') AS doneN
      FROM days GROUP BY grp
    )
    SELECT len AS streak, doneN FROM islands
    WHERE maxD = (SELECT MAX(localDate) FROM days)
      AND maxD >= date(${today}, '-1 day')
  `);
  const r = rows[0];
  if (!r) return { streak: 0, done: 0 };
  return { streak: Number(r.streak) || 0, done: Number(r.doneN) || 0 };
}
