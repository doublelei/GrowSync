import { WeekPeriod } from './types';

export function getCurrentMonthInfo(targetDate: Date = new Date()) {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth(); // 0-11
  
  const weeks: WeekPeriod[] = [];
  
  // Find the first Monday of the month
  let firstMonday = new Date(year, month, 1);
  while (firstMonday.getDay() !== 1) { // 1 is Monday
    firstMonday.setDate(firstMonday.getDate() + 1);
  }
  
  let currentMonday = new Date(firstMonday);
  
  // Generate weeks as long as the Monday falls within the same month
  while (currentMonday.getMonth() === month) {
    const mondayClone = new Date(currentMonday);
    
    // Sunday is 6 days after Monday
    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentSunday.getDate() + 6);
    
    weeks.push({
      startDate: mondayClone,
      endDate: currentSunday,
      start: `${mondayClone.getMonth() + 1}月${mondayClone.getDate()}日`,
      end: `${currentSunday.getMonth() + 1}月${currentSunday.getDate()}日`
    });
    
    // Move to next Monday
    currentMonday.setDate(currentMonday.getDate() + 7);
  }
  
  return {
    monthStr: `${year}年${month + 1}月赛季通行证`,
    weeks
  };
}
