"use client";

import { useMemo } from "react";
import { addDays } from "@/lib/dates";

export type DayKind = "done" | "grace" | "empty" | "future";

// Heatmap 365 ô: done = xanh lá, grace = hổ phách, empty = xám, future = nhạt.
// Props: startsOn, map ngày->kind, ngày mốc cần viền đậm.
export function Heatmap({
  startsOn,
  byDate,
  milestones = [],
  totalDays = 365,
  today,
}: {
  startsOn: string;
  byDate: Record<string, DayKind>;
  milestones?: number[];
  totalDays?: number;
  today: string;
}) {
  const cells = useMemo(() => {
    const out: { date: string; kind: DayKind; idx: number }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = addDays(startsOn, i);
      const idx = i + 1;
      const kind =
        byDate[date] ?? (date > today ? "future" : "empty");
      out.push({ date, kind, idx });
    }
    return out;
  }, [startsOn, byDate, totalDays, today]);

  const color = (kind: DayKind) =>
    kind === "done"
      ? "bg-emerald-500"
      : kind === "grace"
        ? "bg-amber-400"
        : kind === "future"
          ? "bg-slate-100"
          : "bg-slate-200";

  return (
    <div>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: "repeat(26, minmax(0, 1fr))" }}
        role="img"
        aria-label={`Heatmap ${totalDays} ngày`}
      >
        {cells.map((c) => (
          <div
            key={c.date}
            title={`Ngày ${c.idx} (${c.date}): ${c.kind}`}
            className={`aspect-square rounded-[3px] ${color(c.kind)} ${
              milestones.includes(c.idx)
                ? "ring-2 ring-emerald-700 ring-offset-1"
                : ""
            }`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-[3px] bg-emerald-500" /> Đã làm
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-[3px] bg-amber-400" /> Được tha
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-[3px] bg-slate-200" /> Trống
        </span>
      </div>
    </div>
  );
}
