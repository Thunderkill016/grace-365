// Loader thư viện kỹ năng 365 ngày.
// Import tĩnh từng JSON để bundler (Next + opennext/Workers) đóng gói được —
// KHÔNG dùng fs (không có trên Workers edge runtime).

import english from "@/content/skills/english.json";
import writing from "@/content/skills/writing.json";
import python from "@/content/skills/python.json";
import drawing from "@/content/skills/drawing.json";
import guitar from "@/content/skills/guitar.json";
import fitness from "@/content/skills/fitness.json";
import skillIndex from "@/content/skills/index.json";

export interface MicroTask {
  day: number;
  title: string;
  action: string;
  check: string;
  minutes: number;
  type: "learn" | "practice" | "review" | "project" | "capstone";
  // Field V3 (optional để tương thích ngược): archetype bài tập, chủ đề tuần, tham chiếu giáo trình
  archetype?: string;
  theme?: string;
  ref?: string | null;
}

export interface SkillSeason {
  season: number;
  range: string;
  name: string;
  focus: string;
}

export interface SkillSource {
  name: string;
  url: string;
}

export interface Skill {
  id: string;
  name: string;
  tagline: string;
  // V3: seasons là 4 chuỗi mô tả (spec CONTENT_SPEC_V3.md); giữ union để tương thích JSON cũ
  seasons: (SkillSeason | string)[];
  source?: SkillSource;
  tasks: MicroTask[];
}

export interface SkillMeta {
  id: string;
  name: string;
  tagline: string;
  source?: string;
}

const SKILLS: Record<string, Skill> = {
  english: english as Skill,
  writing: writing as Skill,
  python: python as Skill,
  drawing: drawing as Skill,
  guitar: guitar as Skill,
  fitness: fitness as Skill,
};

export const SKILL_IDS = Object.keys(SKILLS);

/** Danh sách 6 skill cho onboarding picker. */
export function listSkills(): SkillMeta[] {
  return skillIndex as SkillMeta[];
}

/** Lấy skill theo id; trả null nếu id lạ. */
export function getSkill(skillId: string | null | undefined): Skill | null {
  if (!skillId) return null;
  return SKILLS[skillId] ?? null;
}

/**
 * Micro-task của ngày thứ dayNumber (1-based) trong challenge.
 * Clamp ngoài khoảng 1–365 về biên gần nhất; skill lạ → null.
 */
export function getMicroTask(
  skillId: string | null | undefined,
  dayNumber: number,
): MicroTask | null {
  const skill = getSkill(skillId);
  if (!skill || skill.tasks.length === 0) return null;
  const n = Math.min(Math.max(Math.floor(dayNumber) || 1, 1), skill.tasks.length);
  // tasks đã sắp theo day 1..N — lấy theo index cho chắc, không phụ thuộc field day
  return skill.tasks[n - 1] ?? null;
}
