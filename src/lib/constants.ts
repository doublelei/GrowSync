// ── Player ──
export const PLAYER_ID = '雷雨声';

// ── Subjects ──
export const SUBJECTS = ['英语', '数学', '语文', '历史', '生物'] as const;
export type Subject = (typeof SUBJECTS)[number];

/**
 * Subjects that use Pass/Fail (P/F) grading instead of numeric scores.
 * To add a new P/F subject: add it to SUBJECTS above, then add its name here.
 */
export const PASS_FAIL_SUBJECTS = new Set<string>(['历史', '生物']);

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

const beijingDateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const beijingTimeFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

/** Current moment as a Date whose local methods reflect Beijing time. */
export function nowBeijing(): Date {
  // Use Intl to reliably extract Beijing time components
  const parts = beijingTimeFmt.formatToParts(new Date());
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);
  return new Date(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
}

/** Today's date string in Beijing time: "YYYY-MM-DD" */
export function todayBeijing(): string {
  return beijingDateFmt.format(new Date());
}

/** Current month string in Beijing time: "YYYY-MM" */
export function currentMonthBeijing(): string {
  return todayBeijing().slice(0, 7);
}

// ── Milestone Task Constants ──

// 字数要求
export const BOOK_REVIEW_MIN_WORDS = 300;
export const BOOK_REVIEW_MAX_WORDS = 500;
export const MOVIE_REVIEW_MIN_WORDS = 150;
export const MOVIE_REVIEW_MAX_WORDS = 200;

// 默认奖励金额（仅供参考，可覆盖）
export const DEFAULT_BOOK_REWARD = { high: 150, medium: 80, low: 50 } as const;
export const DEFAULT_MOVIE_REWARD = 40;

// 任务类型标签
export const MILESTONE_TASK_LABELS = {
  book: { name: '完本大赏', subtitle: 'The Finisher', icon: '📚' },
  movie: { name: '光影计划', subtitle: 'Cinema Master', icon: '🎬' },
} as const;
