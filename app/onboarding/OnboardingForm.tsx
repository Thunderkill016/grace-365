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

export function OnboardingForm() {
  const router = useRouter();
  const [skill, setSkill] = useState("");
  const [minutesPerDay, setMinutesPerDay] = useState("15");
  const [remindAt, setRemindAt] = useState("21:00");
  const [ifThen, setIfThen] = useState("");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ifThenOk = ifThen.trim().length >= 10;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!ifThenOk) {
      setError("Câu if-then phải tối thiểu 10 ký tự nhé.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: skill.trim(),
          minutesPerDay: Number(minutesPerDay),
          remindAt,
          ifThen: ifThen.trim(),
          timezone,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra. Thử lại nhé.");
      } else {
        router.push("/today");
      }
    } catch {
      setError("Có lỗi xảy ra. Thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          Kỹ năng bạn muốn rèn trong 365 ngày
        </span>
        <input
          required
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="VD: tiếng Anh, code, vẽ, gym…"
          maxLength={80}
          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Phút / ngày
          </span>
          <input
            type="number"
            min={1}
            max={480}
            value={minutesPerDay}
            onChange={(e) => setMinutesPerDay(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Giờ nhắc</span>
          <input
            type="time"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Múi giờ</span>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          Cam kết if-then <span className="text-slate-400">(bắt buộc)</span>
        </span>
        <textarea
          required
          value={ifThen}
          onChange={(e) => setIfThen(e.target.value)}
          placeholder="Nếu 21h tối thì tôi sẽ mở app học 15 phút, dù mệt"
          rows={3}
          maxLength={280}
          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
        />
        <span
          className={`text-xs ${ifThenOk ? "text-emerald-600" : "text-slate-400"}`}
        >
          {ifThen.trim().length}/10 ký tự tối thiểu
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-200 disabled:opacity-50"
      >
        {loading ? "Đang tạo…" : "Bắt đầu hành trình 365 ngày →"}
      </button>
    </form>
  );
}
