"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import skillIndex from "@/content/skills/index.json";

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

const SKILL_EMOJI: Record<string, string> = {
  english: "🗣️",
  writing: "✍️",
  python: "🐍",
  drawing: "🎨",
  guitar: "🎸",
  fitness: "💪",
};

export function OnboardingForm() {
  const router = useRouter();
  const [skillId, setSkillId] = useState<string | null>(null);
  const [customSkill, setCustomSkill] = useState("");
  const [minutesPerDay, setMinutesPerDay] = useState("15");
  const [remindAt, setRemindAt] = useState("21:00");
  const [ifThen, setIfThen] = useState("");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ifThenOk = ifThen.trim().length >= 10;
  const picked = skillIndex.find((s) => s.id === skillId) ?? null;
  const skillName =
    skillId === "custom" ? customSkill.trim() : (picked?.name ?? "");
  const skillOk = skillName.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!skillOk) {
      setError("Hãy chọn 1 kỹ năng trong thư viện, hoặc tự đặt kỹ năng nhé.");
      return;
    }
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
          skill: skillName.slice(0, 80),
          skillId: skillId === "custom" ? null : skillId,
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
      <div>
        <span className="text-sm font-medium text-slate-700">
          Kỹ năng bạn muốn rèn trong 365 ngày
        </span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {skillIndex.map((s) => {
            const active = skillId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSkillId(active ? null : s.id)}
                className={`rounded-2xl border p-3 text-left transition ${
                  active
                    ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className="text-xl">{SKILL_EMOJI[s.id] ?? "⭐"}</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-500">{s.tagline}</p>
                {"source" in s && typeof (s as { source?: string }).source === "string" && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    📚 {(s as { source?: string }).source}
                  </p>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSkillId(skillId === "custom" ? null : "custom")}
            className={`col-span-2 rounded-2xl border p-3 text-left transition ${
              skillId === "custom"
                ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                : "border-dashed border-slate-300 bg-white hover:border-slate-400"
            }`}
          >
            <p className="text-sm font-bold text-slate-800">
              ✏️ Tự đặt kỹ năng
            </p>
            <p className="text-xs text-slate-500">
              Kỹ năng khác — bạn tự viết micro-task mỗi ngày
            </p>
          </button>
        </div>
        {skillId === "custom" && (
          <input
            required
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            placeholder="VD: học đàn piano, chạy bộ, nấu ăn…"
            maxLength={80}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        )}
      </div>

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
