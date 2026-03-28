import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentMonthInfo } from '@/lib/date-utils';
import {
  fetchAcademicRecords,
  fetchHabitLogs,
  fetchMonthlyPoints,
  fetchTransactions,
  fetchQuestProofs,
  PLAYER_ID,
} from '@/lib/queries';
import {
  calculateWeeklyQuests,
  calculateMonthlyPool,
  aggregatePlayerData,
  formatRecentLogs,
  formatQuestDisplay,
  formatPendingProofs,
} from '@/lib/calculations';
import type {
  GrowSyncData,
  Transaction,
  QuestProof,
  AcademicRecord,
  MonthlySchoolPoint,
  HabitLog,
} from '@/lib/types';

export function useGrowSyncData() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GrowSyncData | null>(null);

  const loadData = async () => {
    setLoading(true);
    const { monthId, weeks } = getCurrentMonthInfo();

    // Query range covers the full season: first Monday to last Sunday
    // The last week's Sunday may overflow into the next month
    const seasonStart = weeks.length > 0
      ? weeks[0].startDate.toISOString().split('T')[0]
      : `${monthId}-01`;
    const seasonEnd = weeks.length > 0
      ? weeks[weeks.length - 1].endDate.toISOString().split('T')[0]
      : `${monthId}-28`;

    const [txRes, proofsRes, academicRes, pointsRes, habitsRes] = await Promise.all([
      fetchTransactions(),
      fetchQuestProofs(),
      fetchAcademicRecords(seasonStart, seasonEnd),
      fetchMonthlyPoints(monthId),
      fetchHabitLogs(seasonStart, seasonEnd),
    ]);

    const transactions = (txRes.data ?? []) as Transaction[];
    const proofs = (proofsRes.data ?? []) as QuestProof[];
    const academics = (academicRes.data ?? []) as AcademicRecord[];
    const monthlyPointsList = (pointsRes.data ?? []) as MonthlySchoolPoint[];
    const habits = (habitsRes.data ?? []) as HabitLog[];

    const weeklyQuests = calculateWeeklyQuests(weeks, habits, academics);
    const monthlyPoolEarned = calculateMonthlyPool(monthlyPointsList, monthId);
    const recentLogs = formatRecentLogs(transactions);
    const playerData = aggregatePlayerData(
      PLAYER_ID,
      weeklyQuests,
      monthlyPoolEarned,
      weeks.length,
      recentLogs,
    );

    setData({
      playerData,
      academicRecords: academics,
      habitLogs: habits,
      monthlyPoints: monthlyPointsList,
      quests: formatQuestDisplay(proofs),
      pendingProofs: formatPendingProofs(proofs),
    });
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { data, loading, reloadData: loadData };
}
