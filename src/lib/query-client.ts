import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  season: (monthId: string) => ['season', monthId] as const,
  academics: (monthId: string) => ['season', monthId, 'academics'] as const,
  habits: (monthId: string) => ['season', monthId, 'habits'] as const,
  monthlyPoints: (monthId: string) => ['season', monthId, 'monthlyPoints'] as const,
  habitProofs: (monthId: string) => ['season', monthId, 'habitProofs'] as const,
  transactions: () => ['transactions'] as const,
  questProofs: () => ['questProofs'] as const,

  // Full-history keys for /records page
  allAcademics: () => ['records', 'academics'] as const,
  allHabitLogs: () => ['records', 'habitLogs'] as const,
  allMonthlyPoints: () => ['records', 'monthlyPoints'] as const,
};
