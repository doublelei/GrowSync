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
  MajorExamRating,
} from './types';
import {
  STRIKE_THRESHOLD_ENGLISH,
  STRIKE_THRESHOLD_DEFAULT,
  STRIKE_PENALTY,
  MAJOR_EXAM_BONUS,
  MAJOR_EXAM_PENALTY,
  MAJOR_EXAM_BONUS_SCORE_RATE,
  MAJOR_EXAM_PENALTY_SCORE_RATE,
  MAJOR_EXAM_BONUS_RANK,
  MAJOR_EXAM_PENALTY_RANK,
  BASE_POOL,
  HABIT_REWARD_PER_TYPE,
  WEEKLY_HABIT_CAP,
  WEEKLY_ACADEMIC_BASE,
  MONTHLY_RANK_CAP,
  CLASS_SIZE,
} from './constants';

// ── Major Exam Rating ──

export function suggestRating(record: AcademicRecord): MajorExamRating {
  const scoreRate = record.max_score > 0 ? record.score / record.max_score : 0;

  if (scoreRate >= MAJOR_EXAM_BONUS_SCORE_RATE) return 'bonus';
  if (record.highest_score != null && record.score >= record.highest_score) return 'bonus';
  if (record.class_rank != null && record.class_rank <= MAJOR_EXAM_BONUS_RANK) return 'bonus';

  if (scoreRate < MAJOR_EXAM_PENALTY_SCORE_RATE) return 'penalty';
  if (record.class_rank != null && record.class_rank >= MAJOR_EXAM_PENALTY_RANK) return 'penalty';

  return 'neutral';
}

function ratingToAmount(rating: MajorExamRating): number {
  if (rating === 'bonus') return MAJOR_EXAM_BONUS;
  if (rating === 'penalty') return MAJOR_EXAM_PENALTY;
  return 0;
}

// ── Weekly Quest Calculation ──

export function calculateWeeklyQuests(
  weeks: WeekPeriod[],
  habits: HabitLog[],
  academics: AcademicRecord[],
): WeeklyQuestState[] {
  // Parse "YYYY-MM-DD" as local midnight (not UTC) to avoid timezone shifts
  const parseLocal = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const habitsWithDate = habits.map(h => ({ ...h, dateObj: parseLocal(h.log_date) }));
  const academicsWithDate = academics.map(a => ({ ...a, dateObj: parseLocal(a.event_date) }));

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

    const exerciseEarned = weekendExercise ? HABIT_REWARD_PER_TYPE : 0;
    const readingEarned = weekendReading ? HABIT_REWARD_PER_TYPE : 0;

    // Academic strike system (only micro_tests count — major exams excluded)
    const academicsThisWeek = academicsWithDate.filter(
      a => a.dateObj >= w.startDate && a.dateObj <= endOfDay && a.event_type === 'micro_test',
    );

    let strikes = 0;
    const deductions: { reason: string; amount: number }[] = [];

    academicsThisWeek.forEach(a => {
      const score = Number(a.score);
      const threshold = a.subject === '英语' ? STRIKE_THRESHOLD_ENGLISH : STRIKE_THRESHOLD_DEFAULT;
      if (score < threshold) {
        strikes++;
        deductions.push({ reason: `${a.subject}: 未达标`, amount: STRIKE_PENALTY });
      }
    });

    // Major exam rating adjustments (only confirmed ratings)
    const majorExamsThisWeek = academicsWithDate.filter(
      a => a.dateObj >= w.startDate && a.dateObj <= endOfDay
        && a.event_type === 'major_exam'
        && a.major_exam_rating != null,
    );

    const examAdjustments = majorExamsThisWeek.map(a => ({
      subject: a.subject,
      examName: a.exam_name,
      rating: a.major_exam_rating as MajorExamRating,
      amount: ratingToAmount(a.major_exam_rating as MajorExamRating),
    }));

    const examAdjustmentTotal = examAdjustments.reduce((sum, ea) => sum + ea.amount, 0);

    const academicPoolRemaining = Math.max(0, WEEKLY_ACADEMIC_BASE - strikes * STRIKE_PENALTY + examAdjustmentTotal);

    return {
      week: idx + 1,
      period: {
        start: w.startDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        end: w.endDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        startDate: w.startDate,
        endDate: w.endDate,
      },
      exercise: { earned: exerciseEarned, status: exerciseEarned >= HABIT_REWARD_PER_TYPE ? 'completed' : 'pending' },
      reading: { earned: readingEarned, status: readingEarned >= HABIT_REWARD_PER_TYPE ? 'completed' : 'pending' },
      academic: { earned: academicPoolRemaining, strikes, deductions, examAdjustments },
    };
  });
}

// ── Monthly Pool Calculation ──
// Linear interpolation: rank 1 → +CAP, last → -CAP, rounded to nearest ¥5

export function calculateRankReward(rank: number, classSize: number = CLASS_SIZE): number {
  if (classSize <= 1) return 0;
  const raw = MONTHLY_RANK_CAP * (1 - 2 * (rank - 1) / (classSize - 1));
  return Math.round(raw / 5) * 5;
}

export function calculateMonthlyPool(
  monthlyPoints: MonthlySchoolPoint[],
  currentMonthId: string,
): number {
  const entry = monthlyPoints.find(p => p.month_id === currentMonthId);
  if (!entry?.rank) return 0;
  return calculateRankReward(entry.rank);
}

// ── Aggregate Player Data ──

export function aggregatePlayerData(
  playerId: string,
  weeklyQuests: WeeklyQuestState[],
  monthlyPoolEarned: number,
  monthlyPoolRank: number | null | undefined,
  weeksCount: number,
  recentLogs: RecentLog[],
): PlayerData {
  const weeklyPoolEarned = weeklyQuests.reduce(
    (acc, w) => acc + w.exercise.earned + w.reading.earned,
    0,
  );
  const studyPoolRemaining = weeklyQuests.reduce((acc, w) => acc + w.academic.earned, 0);

  const weeklyPoolTotal = weeksCount * WEEKLY_HABIT_CAP;
  const studyPoolTotal = weeksCount * WEEKLY_ACADEMIC_BASE;
  const totalUnlocked = BASE_POOL + weeklyPoolEarned + studyPoolRemaining + monthlyPoolEarned;
  const totalCap = BASE_POOL + weeklyPoolTotal + studyPoolTotal + MONTHLY_RANK_CAP;

  const academicBonus: AcademicBonusState[] = weeklyQuests.map(w => ({
    week: w.week,
    period: w.period,
    remaining: w.academic.earned,
    deductions: w.academic.deductions,
    examAdjustments: w.academic.examAdjustments,
  }));

  return {
    name: playerId,
    basePool: BASE_POOL,
    weeklyPoolEarned,
    weeklyPoolTotal,
    studyPoolRemaining,
    studyPoolTotal,
    monthlyPoolEarned,
    monthlyPoolTotal: MONTHLY_RANK_CAP,
    monthlyPoolRank,
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
        ? '上传证明即可领取奖励'
        : '已提交，等待审核',
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
