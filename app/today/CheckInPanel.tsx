"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function CheckInPanel({
  microTask,
  minutesDefault,
  alreadyDone,
  alreadyGrace,
  graceUsed,
  graceQuota,
}: {
  microTask: string;
  minutesDefault: number;
  alreadyDone: boolean;
  alreadyGrace: boolean;
  graceUsed: number;
  graceQuota: number;
}) {
  const router = useRouter();
  const [minutes, setMinutes] = useState(String(minutesDefault));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [graceLeft, setGraceLeft] = useState(graceQuota - graceUsed);

  // Giữ quota mới nhất (sau khi bấm tha)
  useEffect(() => {
    setGraceLeft(graceQuota - graceUsed);
  }, [graceUsed, graceQuota]);

  async function checkIn() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minutes: Number(minutes),
          note: note.trim(),
          microTask,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) setError(data.error ?? "Có lỗi xảy ra.");
      else router.refresh();
    } catch {
      setError("Có lỗi xảy ra. Thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  async function askGrace() {
    if (!confirm("Xin tha hôm nay? Streak vẫn giữ, nhưng tốn 1 lượt tha của tháng.")) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/grace", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        quota: number;
        used: number;
      };
      if (!res.ok) {
        setError(data.error === "hết quota" ? "Hết lượt tha tháng này rồi 💔" : (data.error ?? "Có lỗi xảy ra."));
      } else {
        setGraceLeft(data.quota - data.used);
        router.refresh();
      }
    } catch {
      setError("Có lỗi xảy ra. Thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  if (alreadyDone) {
    return (
      <div className="rounded-3xl bg-emerald-50 p-6 text-center">
        <p className="text-4xl">✅</p>
        <p className="mt-2 text-lg font-bold text-emerald-800">
          Xong hôm nay rồi. Giỏi lắm!
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          Mai quay lại nhé — luật duy nhất là không lỡ 2 ngày liền.
        </p>
      </div>
    );
  }

  if (alreadyGrace) {
    return (
      <div className="rounded-3xl bg-amber-50 p-6 text-center">
        <p className="text-4xl">💛</p>
        <p className="mt-2 text-lg font-bold text-amber-800">
          Hôm nay được tha. Streak vẫn sống.
        </p>
        <p className="mt-1 text-sm text-amber-700">
          Mai làm bù nhé — còn {graceLeft} lượt tha tháng này.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Micro-task hôm nay
        </p>
        <p className="mt-2 text-lg font-bold leading-snug">{microTask}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-slate-500">Số phút thực tế</span>
            <input
              type="number"
              min={1}
              max={1440}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"
            />
          </label>
          <label className="block col-span-2">
            <span className="text-xs text-slate-500">
              1 dòng ghi chú (tùy chọn)
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Hôm nay học được gì?"
              maxLength={280}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={checkIn}
          disabled={loading}
          className="mt-4 w-full rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-200 disabled:opacity-50"
        >
          {loading ? "Đang lưu…" : "✓ Xong hôm nay"}
        </button>
      </div>

      <button
        onClick={askGrace}
        disabled={loading || graceLeft <= 0}
        className="w-full rounded-2xl border border-amber-300 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-800 disabled:opacity-50"
      >
        💛 Xin tha hôm nay (còn {graceLeft} lượt tháng này)
      </button>
    </div>
  );
}
