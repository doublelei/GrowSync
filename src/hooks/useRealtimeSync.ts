// src/hooks/useRealtimeSync.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-client';

const tableToKeys: Record<string, (monthId: string) => readonly unknown[]> = {
  academic_records: queryKeys.academics,
  habit_logs: queryKeys.habits,
  habit_proofs: queryKeys.habitProofs,
  monthly_school_points: queryKeys.monthlyPoints,
  transactions: () => queryKeys.transactions(),
  quest_proofs: () => queryKeys.questProofs(),
};

export function useRealtimeSync(monthId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const table = payload.table;
          const keyFn = tableToKeys[table];
          if (keyFn) {
            queryClient.invalidateQueries({ queryKey: keyFn(monthId) });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [monthId, queryClient]);
}
