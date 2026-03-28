import {
  WeekPeriod,
  WeeklyQuestState,
  AcademicBonusState,
  AcademicRecord,
  HabitLog,
  MonthlySchoolPoint,
  Transaction,
  QuestProof,
  RecentLog,
  QuestDisplay,
  PendingProofDisplay,
  PlayerData,
} from './types';

// ── Weekly Quest Calculation ──

export function calculateWeeklyQuests(
  weeks: WeekPeriod[],
  habits: HabitLog[],
  academics: AcademicRecord[],
): WeeklyQuestState[] {
  const habitsWithDate = habits.map(h => ({ ...h, dateObj: new Date(h.log_date) }));
  const academicsWithDate = academics.map(a => ({ ...a, dateObj: new Date(a.event_date) }));

  return weeks.map((w, idx) => {
    const endOfDay = new Date(w.endDate);
    endOfDay.setHours(23, 59, 59, 999);

    const habitsThisWeek = habitsWithDate.filter(
      h => h.dateObj >= w.startDate && h.dateObj <= endOfDay,
    );

    // Weekend check-in logic (Sat=6, Sun=0)
    const weekendExercise = habitsThisWeek.some(
      h => (h.dateObj.getDay() === 0 || h.dateObj.getDay() === 6) && h.habit_type === '运动',
    );
    const weekendReading = habitsThisWeek.some(
      h => (h.dateObj.getDay() === 0 || h.dateObj.getDay() === 6) && h.habit_type === '阅读',
    );

    const exerciseEarned = weekendExercise ? 50 : 0;
    const readingEarned = weekendReading ? 50 : 0;

    // Academic strike system (only micro_tests count — major exams excluded)
    const academicsThisWeek = academicsWithDate.filter(
      a => a.dateObj >= w.startDate && a.dateObj <= endOfDay && a.event_type === 'micro_test',
    );

    let strikes = 0;
    const deductions: { reason: string; amount: number }[] = [];

    academicsThisWeek.forEach(a => {
      const score = Number(a.score);
      const isBelowThreshold = a.subject === '英语' ? score < 90 : score < 95;
      if (a.is_retest || isBelowThreshold) {
        strikes++;
        const reason = a.is_retest ? '重考惩扣' : '分值不达标';
        deductions.push({ reason: `${a.subject}: ${reason}`, amount: 15 });
      }
    });

    const academicPoolRemaining = Math.max(0, 50 - strikes * 15);

    return {
      week: idx + 1,
      period: {
        start: w.startDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        end: w.endDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        startDate: w.startDate,
        endDate: w.endDate,
      },
      exercise: { earned: exerciseEarned, status: exerciseEarned >= 50 ? 'completed' : 'pending' },
      reading: { earned: readingEarned, status: readingEarned >= 50 ? 'completed' : 'pending' },
      academic: { earned: academicPoolRemaining, strikes, deductions },
    };
  });
}

// ── Monthly Pool Calculation (fixes Bug #2 & #3) ──

export function calculateMonthlyPool(
  monthlyPoints: MonthlySchoolPoint[],
  currentMonthId: string,
): number {
  const entry = monthlyPoints.find(p => p.month_id === currentMonthId);
  if (!entry?.rank) return 0;

  if (entry.rank <= 10) return 200;
  if (entry.rank <= 20) return 100;
  if (entry.rank <= 30) return 50;
  return 0;
}

// ── Aggregate Player Data ──

export function aggregatePlayerData(
  playerId: string,
  weeklyQuests: WeeklyQuestState[],
  monthlyPoolEarned: number,
  weeksCount: number,
  recentLogs: RecentLog[],
): PlayerData {
  const basePool = 400;
  const weeklyPoolEarned = weeklyQuests.reduce(
    (acc, w) => acc + w.exercise.earned + w.reading.earned,
    0,
  );
  const studyPoolRemaining = weeklyQuests.reduce((acc, w) => acc + w.academic.earned, 0);

  const weeklyPoolTotal = weeksCount * 100;
  const studyPoolTotal = weeksCount * 50;
  const totalUnlocked = basePool + weeklyPoolEarned + studyPoolRemaining + monthlyPoolEarned;
  const totalCap = basePool + weeklyPoolTotal + studyPoolTotal + 200;

  const academicBonus: AcademicBonusState[] = weeklyQuests.map(w => ({
    week: w.week,
    period: w.period,
    remaining: w.academic.earned,
    deductions: w.academic.deductions,
  }));

  return {
    name: playerId,
    basePool,
    weeklyPoolEarned,
    weeklyPoolTotal,
    studyPoolRemaining,
    studyPoolTotal,
    monthlyPoolEarned,
    monthlyPoolTotal: 200,
    totalUnlocked,
    totalCap,
    recentLogs,
    weeklyQuests,
    academicBonus,
  };
}

// ── Formatting Helpers ──

export function formatRecentLogs(transactions: Transaction[]): RecentLog[] {
  return transactions.slice(0, 5).map(t => ({
    id: t.id,
    type: t.transaction_type,
    amount: t.amount,
    description: t.description,
    date: new Date(t.created_at).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));
}

export function formatQuestDisplay(proofs: QuestProof[]): QuestDisplay[] {
  return proofs.map(p => ({
    id: p.id,
    title: p.quest_title,
    reward: p.reward_amount,
    type: p.quest_type,
    status: p.status,
    description:
      p.status === 'pending'
        ? '点击上传证明以获取本周奖励'
        : '凭证已提交，请等待管理员复核',
  }));
}

export function formatPendingProofs(proofs: QuestProof[]): PendingProofDisplay[] {
  return proofs
    .filter(p => p.status === 'under_review')
    .map(p => ({
      id: p.id,
      player: p.player_id,
      questTitle: p.quest_title,
      type: p.quest_type,
      date: new Date(p.created_at).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
      }),
      reward: p.reward_amount,
    }));
}
