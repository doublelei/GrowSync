// src/hooks/useSeasonData.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import {
  fetchAcademicRecords,
  fetchHabitLogs,
  fetchMonthlyPoints,
  fetchTransactions,
  fetchQuestProofs,
} from '@/lib/queries';
import { PLAYER_ID } from '@/lib/constants';
import {
  calculateWeeklyQuests,
  calculateMonthlyPool,
  aggregatePlayerData,
  formatRecentLogs,
  formatQuestDisplay,
  formatPendingProofs,
} from '@/lib/calculations';
import type {
  Transaction,
  QuestProof,
  AcademicRecord,
  MonthlySchoolPoint,
  HabitLog,
  WeekPeriod,
  GrowSyncData,
} from '@/lib/types';

interface SeasonParams {
  monthId: string;
  seasonStart: string;
  seasonEnd: string;
  weeks: WeekPeriod[];
}

function useAcademics({ monthId, seasonStart, seasonEnd }: SeasonParams) {
  return useQuery({
    queryKey: queryKeys.academics(monthId),
    queryFn: async () => {
      const { data } = await fetchAcademicRecords(seasonStart, seasonEnd);
      return (data ?? []) as AcademicRecord[];
    },
  });
}

function useHabits({ monthId, seasonStart, seasonEnd }: SeasonParams) {
  return useQuery({
    queryKey: queryKeys.habits(monthId),
    queryFn: async () => {
      const { data } = await fetchHabitLogs(seasonStart, seasonEnd);
      return (data ?? []) as HabitLog[];
    },
  });
}

function useMonthlyPoints({ monthId }: SeasonParams) {
  return useQuery({
    queryKey: queryKeys.monthlyPoints(monthId),
    queryFn: async () => {
      const { data } = await fetchMonthlyPoints(monthId);
      return (data ?? []) as MonthlySchoolPoint[];
    },
  });
}

function useTransactions() {
  return useQuery({
    queryKey: queryKeys.transactions(),
    queryFn: async () => {
      const { data } = await fetchTransactions();
      return (data ?? []) as Transaction[];
    },
  });
}

function useQuestProofs() {
  return useQuery({
    queryKey: queryKeys.questProofs(),
    queryFn: async () => {
      const { data } = await fetchQuestProofs();
      return (data ?? []) as QuestProof[];
    },
  });
}

export function useSeasonData(params: SeasonParams) {
  const academics = useAcademics(params);
  const habits = useHabits(params);
  const monthly = useMonthlyPoints(params);
  const transactions = useTransactions();
  const proofs = useQuestProofs();

  const isLoading = academics.isLoading || habits.isLoading ||
    monthly.isLoading || transactions.isLoading || proofs.isLoading;

  const academicRecords = academics.data ?? [];
  const habitLogs = habits.data ?? [];
  const monthlyPoints = monthly.data ?? [];
  const transactionList = transactions.data ?? [];
  const proofList = proofs.data ?? [];

  const weeklyQuests = calculateWeeklyQuests(params.weeks, habitLogs, academicRecords);
  const monthlyPoolEarned = calculateMonthlyPool(monthlyPoints, params.monthId);
  const recentLogs = formatRecentLogs(transactionList);
  const playerData = aggregatePlayerData(
    PLAYER_ID, weeklyQuests, monthlyPoolEarned, params.weeks.length, recentLogs,
  );

  const data: GrowSyncData | null = isLoading ? null : {
    playerData,
    academicRecords,
    habitLogs,
    monthlyPoints,
    quests: formatQuestDisplay(proofList),
    pendingProofs: formatPendingProofs(proofList),
  };

  return { data, isLoading };
}
