import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import {
  fetchAllAcademicRecords,
  fetchAllHabitLogs,
  fetchAllMonthlyPoints,
} from '@/lib/queries';
import type { AcademicRecord, HabitLog, MonthlySchoolPoint } from '@/lib/types';

export function useRecordsData() {
  const academics = useQuery({
    queryKey: queryKeys.allAcademics(),
    queryFn: async () => {
      const { data } = await fetchAllAcademicRecords();
      return (data ?? []) as AcademicRecord[];
    },
  });

  const habits = useQuery({
    queryKey: queryKeys.allHabitLogs(),
    queryFn: async () => {
      const { data } = await fetchAllHabitLogs();
      return (data ?? []) as HabitLog[];
    },
  });

  const monthly = useQuery({
    queryKey: queryKeys.allMonthlyPoints(),
    queryFn: async () => {
      const { data } = await fetchAllMonthlyPoints();
      return (data ?? []) as MonthlySchoolPoint[];
    },
  });

  return {
    academicRecords: academics.data ?? [],
    habitLogs: habits.data ?? [],
    monthlyPoints: monthly.data ?? [],
    isLoading: academics.isLoading || habits.isLoading || monthly.isLoading,
  };
}
