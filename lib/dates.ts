// Luật "hôm nay" (SPEC #1): tính ở server theo timezone của user,
// cắt ngày lúc 03:00 — dân học khuya không bị tính nhầm ngày.
// Chỉ dùng Intl (có sẵn trong Workers), không dùng Node API.

const DAY_MS = 24 * 3600 * 1000;
const CUT_HOUR = 3;

function ymdInTz(d: Date, tz: string): string {
  // en-CA cho ra YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** 'YYYY-MM-DD' của "hôm nay" theo tz user (đã trừ 3h cắt ngày). */
export function todayInTz(tz: string, now: Date = new Date()): string {
  const shifted = new Date(now.getTime() - CUT_HOUR * 3600 * 1000);
  return ymdInTz(shifted, tz);
}

/** Số phút từ 00:00 theo giờ địa phương của user. */
export function localMinutesInTz(tz: string, now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + m;
}

/** 'YYYY-MM' của hôm nay theo tz user — dùng đếm quota grace/tháng. */
export function monthKeyInTz(tz: string, now: Date = new Date()): string {
  return todayInTz(tz, now).slice(0, 7);
}

/** Cộng n ngày vào chuỗi 'YYYY-MM-DD', trả 'YYYY-MM-DD'. */
export function addDays(ymd: string, n: number): string {
  const d = new Date(ymd + "T00:00:00Z");
  return new Date(d.getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

/** true nếu remindAt ('HH:MM') nằm trong ±30 phút của giờ địa phương user. */
export function isWithinReminderWindow(
  remindAt: string,
  tz: string,
  now: Date = new Date(),
): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(remindAt);
  if (!m) return false;
  const target = Number(m[1]) * 60 + Number(m[2]);
  const local = localMinutesInTz(tz, now);
  return Math.abs(local - target) <= 30;
}
