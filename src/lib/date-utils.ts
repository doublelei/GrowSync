import { WeekPeriod } from './types';

function formatDateLabel(d: Date): string {
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function getCurrentMonthInfo(targetDate: Date = new Date()) {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth(); // 0-11

  const weeks: WeekPeriod[] = [];
  const firstOfMonth = new Date(year, month, 1);

  // Find the first Monday of the month
  let firstMonday = new Date(year, month, 1);
  while (firstMonday.getDay() !== 1) {
    firstMonday.setDate(firstMonday.getDate() + 1);
  }

  // If month doesn't start on Monday, create a partial week (1st ~ Sunday before first Monday)
  if (firstOfMonth.getDay() !== 1) {
    const partialEnd = new Date(firstMonday);
    partialEnd.setDate(partialEnd.getDate() - 1);
    weeks.push({
      startDate: new Date(firstOfMonth),
      endDate: partialEnd,
      start: formatDateLabel(firstOfMonth),
      end: formatDateLabel(partialEnd),
    });
  }

  // Generate full weeks starting from firstMonday
  let currentMonday = new Date(firstMonday);
  while (currentMonday.getMonth() === month) {
    const mondayClone = new Date(currentMonday);
    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentSunday.getDate() + 6);

    // Cap endDate to last day of month if Sunday overflows
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const endDate = currentSunday > lastDayOfMonth ? lastDayOfMonth : currentSunday;

    weeks.push({
      startDate: mondayClone,
      endDate: endDate,
      start: formatDateLabel(mondayClone),
      end: formatDateLabel(endDate),
    });

    currentMonday.setDate(currentMonday.getDate() + 7);
  }

  const monthId = `${year}-${String(month + 1).padStart(2, '0')}`;

  return {
    monthStr: `${year}年${month + 1}月赛季通行证`,
    monthId,
    weeks,
  };
}

/**
 * Returns the index of the week that contains `now`.
 * Falls back to the last week if `now` is past all weeks.
 */
export function getCurrentWeekIndex(weeks: WeekPeriod[], now: Date = new Date()): number {
  for (let i = 0; i < weeks.length; i++) {
    const endOfDay = new Date(weeks[i].endDate);
    endOfDay.setHours(23, 59, 59, 999);
    if (now <= endOfDay) return i;
  }
  return Math.max(0, weeks.length - 1);
}
