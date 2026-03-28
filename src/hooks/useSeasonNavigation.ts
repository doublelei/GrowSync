// src/hooks/useSeasonNavigation.ts
import { useState, useCallback, useMemo } from 'react';
import { getCurrentMonthInfo, getCurrentWeekIndex } from '@/lib/date-utils';
import { nowBeijing } from '@/lib/constants';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useSeasonNavigation() {
  const [targetDate, setTargetDate] = useState(nowBeijing);

  const seasonInfo = useMemo(() => getCurrentMonthInfo(targetDate), [targetDate]);

  const currentWeekIndex = useMemo(
    () => getCurrentWeekIndex(seasonInfo.weeks, nowBeijing()),
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
    setTargetDate(nowBeijing());
  }, []);

  const seasonRange = useMemo(() => {
    const { monthId, weeks } = seasonInfo;
    const start = weeks.length > 0
      ? formatDate(weeks[0].startDate)
      : `${monthId}-01`;
    const end = weeks.length > 0
      ? formatDate(weeks[weeks.length - 1].endDate)
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
