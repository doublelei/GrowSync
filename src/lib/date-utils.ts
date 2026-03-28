import { WeekPeriod } from './types';
import { nowBeijing } from './constants';

function formatDateLabel(d: Date): string {
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * Dynamic season mode: weeks are anchored to Mondays.
 * A week belongs to whichever month its Monday falls in.
 * Each week is always a full Mon-Sun (7 days), even if
 * Sunday overflows into the next month.
 *
 * Example — March 2026 has 5 Mondays (3/2, 3/9, 3/16, 3/23, 3/30):
 *   Week 1: 3/2 (Mon) – 3/8 (Sun)
 *   Week 2: 3/9 (Mon) – 3/15 (Sun)
 *   Week 3: 3/16 (Mon) – 3/22 (Sun)
 *   Week 4: 3/23 (Mon) – 3/29 (Sun)
 *   Week 5: 3/30 (Mon) – 4/5 (Sun)  ← Sunday in April, but Monday is March
 *
 * March 1 (Sun) belongs to February's last week (Feb 23 Mon), not March.
 */
export function getCurrentMonthInfo(targetDate: Date = nowBeijing()) {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();

  const weeks: WeekPeriod[] = [];

  // Find the first Monday of the month
  let firstMonday = new Date(year, month, 1);
  while (firstMonday.getDay() !== 1) {
    firstMonday.setDate(firstMonday.getDate() + 1);
  }

  // Generate weeks: each Monday that falls in this month starts a full Mon-Sun week
  let currentMonday = new Date(firstMonday);
  while (currentMonday.getMonth() === month) {
    const mondayClone = new Date(currentMonday);
    const sunday = new Date(currentMonday);
    sunday.setDate(sunday.getDate() + 6);

    weeks.push({
      startDate: mondayClone,
      endDate: sunday,  // May overflow into next month — that's by design
      start: formatDateLabel(mondayClone),
      end: formatDateLabel(sunday),
    });

    currentMonday.setDate(currentMonday.getDate() + 7);
  }

  const monthId = `${year}-${String(month + 1).padStart(2, '0')}`;

  return {
    monthStr: `${year}年${month + 1}月`,
    monthId,
    weeks,
  };
}

/**
 * Returns the index of the week that contains `now`.
 * Falls back to the last week if `now` is past all weeks.
 */
export function getCurrentWeekIndex(weeks: WeekPeriod[], now: Date = nowBeijing()): number {
  for (let i = 0; i < weeks.length; i++) {
    const endOfDay = new Date(weeks[i].endDate);
    endOfDay.setHours(23, 59, 59, 999);
    if (now <= endOfDay) return i;
  }
  return Math.max(0, weeks.length - 1);
}

/**
 * Given a date, find which week index it belongs to (or -1 if outside all weeks).
 */
export function getWeekIndexForDate(weeks: WeekPeriod[], date: Date): number {
  for (let i = 0; i < weeks.length; i++) {
    const endOfDay = new Date(weeks[i].endDate);
    endOfDay.setHours(23, 59, 59, 999);
    if (date >= weeks[i].startDate && date <= endOfDay) return i;
  }
  return -1;
}
