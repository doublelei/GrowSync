// ── Player ──
export const PLAYER_ID = '雷雨声';

// ── Subjects ──
export const SUBJECTS = ['英语', '数学', '语文', '理综'] as const;
export type Subject = (typeof SUBJECTS)[number];

// ── Strike Thresholds ──
// English has a lower bar (90); all other subjects use 95
export const STRIKE_THRESHOLD_ENGLISH = 90;
export const STRIKE_THRESHOLD_DEFAULT = 95;
export const STRIKE_PENALTY = 15; // ¥ deducted per strike

// ── Pool Amounts ──
export const BASE_POOL = 400;
export const HABIT_REWARD_PER_TYPE = 50;   // ¥50 for exercise, ¥50 for reading
export const WEEKLY_HABIT_CAP = 100;       // HABIT_REWARD_PER_TYPE × 2
export const WEEKLY_ACADEMIC_BASE = 50;    // ¥50 per week before strikes
export const MONTHLY_RANK_CAP = 200;

export const MONTHLY_RANK_TIERS = [
  { maxRank: 10, reward: 200 },
  { maxRank: 20, reward: 100 },
  { maxRank: 30, reward: 50 },
] as const;

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
