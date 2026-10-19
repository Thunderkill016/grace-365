import { addDays } from "./dates";

// Luật SPEC #6: 4 mùa x 91 ngày = 364, ngày 365 là tổng kết năm.
export const SEASON_LENGTH = 91;
export const SEASON_COUNT = 4;
export const TOTAL_DAYS = 365;
// Mốc mùa 1
export const SEASON1_MILESTONES = [7, 21, 40, 66];

export interface SeasonRange {
  season: number; // 1..4
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

/** Khoảng ngày của 1 mùa tính từ startsOn của challenge. */
export function seasonRange(startsOn: string, season: number): SeasonRange {
  const s = Math.min(Math.max(season, 1), SEASON_COUNT);
  const start = addDays(startsOn, (s - 1) * SEASON_LENGTH);
  const end = addDays(start, SEASON_LENGTH - 1);
  return { season: s, start, end };
}

/** Ngày tổng kết năm = ngày thứ 365. */
export function recapDay(startsOn: string): string {
  return addDays(startsOn, TOTAL_DAYS - 1);
}

/** Thứ tự ngày (1-based) của dateStr so với startsOn. */
export function dayIndexOf(startsOn: string, dateStr: string): number {
  const a = new Date(startsOn + "T00:00:00Z").getTime();
  const b = new Date(dateStr + "T00:00:00Z").getTime();
  return Math.round((b - a) / (24 * 3600 * 1000)) + 1;
}

/** Mùa chứa dateStr (1..4), hoặc 0 nếu ngoài 364 ngày đầu. */
export function seasonOf(startsOn: string, dateStr: string): number {
  const idx = dayIndexOf(startsOn, dateStr);
  if (idx < 1 || idx > SEASON_LENGTH * SEASON_COUNT) return 0;
  return Math.ceil(idx / SEASON_LENGTH);
}
