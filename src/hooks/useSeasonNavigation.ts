// src/hooks/useSeasonNavigation.ts
import { useState, useCallback, useMemo } from 'react';
import { getCurrentMonthInfo, getCurrentWeekIndex } from '@/lib/date-utils';

export function useSeasonNavigation() {
  const [targetDate, setTargetDate] = useState(new Date());

  const seasonInfo = useMemo(() => getCurrentMonthInfo(targetDate), [targetDate]);

  const currentWeekIndex = useMemo(
    () => getCurrentWeekIndex(seasonInfo.weeks, new Date()),
    [seasonInfo.weeks],
  );

  const goToPrevMonth = useCallback(() => {
    setTargetDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setTargetDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setTargetDate(new Date());
  }, []);

  const seasonRange = useMemo(() => {
    const { monthId, weeks } = seasonInfo;
    const start = weeks.length > 0
      ? weeks[0].startDate.toISOString().split('T')[0]
      : `${monthId}-01`;
    const end = weeks.length > 0
      ? weeks[weeks.length - 1].endDate.toISOString().split('T')[0]
      : `${monthId}-28`;
    return { start, end };
  }, [seasonInfo]);

  return {
    seasonInfo,
    seasonRange,
    currentWeekIndex,
    goToPrevMonth,
    goToNextMonth,
    goToCurrentMonth,
  };
}
