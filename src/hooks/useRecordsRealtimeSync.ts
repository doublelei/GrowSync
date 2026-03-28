import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-client';

const tableToKeys: Record<string, () => readonly unknown[]> = {
  academic_records: queryKeys.allAcademics,
  habit_logs: queryKeys.allHabitLogs,
  monthly_school_points: queryKeys.allMonthlyPoints,
};

export function useRecordsRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('records-page-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const keyFn = tableToKeys[payload.table];
          if (keyFn) {
            queryClient.invalidateQueries({ queryKey: keyFn() });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
