"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TIMEZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

export function SettingsForm({
  initial,
}: {
  initial: {
    handle: string;
    timezone: string;
    remindAt: string | null;
    showNotes: boolean;
    status: string;
    email: string;
  };
}) {
  const router = useRouter();
  const [handle, setHandle] = useState(initial.handle);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [remindAt, setRemindAt] = useState(initial.remindAt ?? "");
  const [showNotes, setShowNotes] = useState(initial.showNotes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setError("");
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) setError(data.error ?? "Có lỗi xảy ra.");
      else {
        setSaved(true);
        router.refresh();
      }
    } catch {
      setError("Có lỗi xảy ra. Thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    patch({
      handle: handle.trim().toLowerCase(),
      timezone,
      remindAt: remindAt || null,
      showNotes,
    });
  }

  function setStatus(status: string) {
    const msg =
      status === "paused"
        ? "Tạm dừng challenge? Streak sẽ đứng yên, bạn có thể tiếp tục sau."
        : "Kết thúc challenge? Hành động này không hoàn tác được.";
    if (!confirm(msg)) return;
    patch({ status });
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={save}
        className="rounded-3xl bg-white p-6 shadow-sm space-y-4"
      >
        <p className="text-sm text-slate-500">
          Đăng nhập bằng <strong>{initial.email}</strong>
        </p>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Tên công khai (cho trang /u/…)
          </span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            maxLength={32}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Múi giờ</span>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            {!TIMEZONES.includes(timezone) && (
              <option value={timezone}>{timezone}</option>
            )}
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Giờ nhắc (để trống = không nhắc)
          </span>
          <input
            type="time"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={showNotes}
            onChange={(e) => setShowNotes(e.target.checked)}
            className="h-5 w-5 accent-emerald-600"
          />
          Hiện ghi chú của tôi trên trang công khai
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-600">Đã lưu ✓</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white disabled:opacity-50"
        >
          {loading ? "Đang lưu…" : "Lưu cài đặt"}
        </button>
      </form>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">Challenge</p>
        <p className="mt-1 text-xs text-slate-500">
          Trạng thái hiện tại: <strong>{initial.status}</strong>
        </p>
        <div className="mt-3 flex gap-2">
          {initial.status === "paused" ? (
            <button
              onClick={() => patch({ status: "active" })}
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-800"
            >
              ▶ Tiếp tục
            </button>
          ) : (
            <button
              onClick={() => setStatus("paused")}
              disabled={loading}
              className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              ⏸ Tạm dừng
            </button>
          )}
          <button
            onClick={() => setStatus("done")}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700"
          >
            ■ Kết thúc
          </button>
        </div>
      </div>
    </div>
  );
}
