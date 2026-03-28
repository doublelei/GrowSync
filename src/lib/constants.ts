// ── Player ──
export const PLAYER_ID = '雷雨声';

// ── Subjects ──
export const SUBJECTS = ['英语', '数学', '语文', '理综'] as const;
export type Subject = (typeof SUBJECTS)[number];

// ── Strike Thresholds ──
// English has a lower bar (90); all other subjects use 95
export const STRIKE_THRESHOLD_ENGLISH = 90;
export const STRIKE_THRESHOLD_DEFAULT = 95;
export const STRIKE_PENALTY = 20; // ¥ deducted per strike

// ── Major Exam Rating ──
export const MAJOR_EXAM_BONUS = 25;
export const MAJOR_EXAM_PENALTY = -25;
export const MAJOR_EXAM_BONUS_SCORE_RATE = 0.9;
export const MAJOR_EXAM_PENALTY_SCORE_RATE = 0.75;
export const MAJOR_EXAM_BONUS_RANK = 3;
export const MAJOR_EXAM_PENALTY_RANK = 9;
export const RATING_REASON_PRESETS = ['试卷偏难', '进步明显', '退步明显', '特殊情况'] as const;

// ── Pool Amounts ──
export const BASE_POOL = 300;
export const HABIT_REWARD_PER_TYPE = 25;   // ¥25 for exercise, ¥25 for reading
export const WEEKLY_HABIT_CAP = 50;        // HABIT_REWARD_PER_TYPE × 2
export const WEEKLY_ACADEMIC_BASE = 100;   // ¥100 per week before strikes
export const MONTHLY_RANK_CAP = 200;       // ±¥200 range
export const CLASS_SIZE = 20;

// ── Habit Types ──
export const HABIT_TYPES = ['运动', '阅读'] as const;
export type HabitType = (typeof HABIT_TYPES)[number];

// ── Timezone ──
export const TIMEZONE = 'Asia/Shanghai';

/** Current moment as a Date whose local methods reflect Beijing time. */
export function nowBeijing(): Date {
  const utc = new Date();
  const beijing = new Date(utc.toLocaleString('en-US', { timeZone: TIMEZONE }));
  return beijing;
}

/** Today's date string in Beijing time: "YYYY-MM-DD" */
export function todayBeijing(): string {
  const d = nowBeijing();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Current month string in Beijing time: "YYYY-MM" */
export function currentMonthBeijing(): string {
  return todayBeijing().slice(0, 7);
}
