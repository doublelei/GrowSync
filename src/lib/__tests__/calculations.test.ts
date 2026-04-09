import { describe, it, expect } from 'vitest';
import {
  suggestRating,
  calculateWeeklyQuests,
  calculateRankReward,
  calculateMonthlyPool,
  aggregatePlayerData,
  formatRecentLogs,
} from '../calculations';
import type { AcademicRecord, HabitLog, WeekPeriod, MonthlySchoolPoint, Transaction } from '../types';

// ── suggestRating ──

describe('suggestRating', () => {
  const base: AcademicRecord = {
    id: 1, player_id: 'test', event_date: '2026-03-01', event_type: 'major_exam',
    subject: '数学', score: 85, max_score: 100, created_at: '',
  };

  it('returns bonus when score rate >= 90%', () => {
    expect(suggestRating({ ...base, score: 92, max_score: 100 })).toBe('bonus');
  });

  it('returns bonus when score equals highest in class', () => {
    expect(suggestRating({ ...base, score: 80, highest_score: 80 })).toBe('bonus');
  });

  it('returns bonus when class_rank <= 3', () => {
    expect(suggestRating({ ...base, score: 80, class_rank: 2 })).toBe('bonus');
  });

  it('returns penalty when score rate < 75%', () => {
    expect(suggestRating({ ...base, score: 70, max_score: 100 })).toBe('penalty');
  });

  it('returns penalty when class_rank >= 9', () => {
    expect(suggestRating({ ...base, score: 80, class_rank: 10 })).toBe('penalty');
  });

  it('returns neutral for middling scores', () => {
    expect(suggestRating({ ...base, score: 80, max_score: 100 })).toBe('neutral');
  });

  it('handles zero max_score gracefully', () => {
    expect(suggestRating({ ...base, score: 0, max_score: 0 })).toBe('penalty');
  });
});

// ── calculateRankReward ──

describe('calculateRankReward', () => {
  it('rank 1 gives max reward (+200)', () => {
    expect(calculateRankReward(1, 20)).toBe(200);
  });

  it('last rank gives min reward (-200)', () => {
    expect(calculateRankReward(20, 20)).toBe(-200);
  });

  it('middle rank gives ~0', () => {
    const r = calculateRankReward(10, 20);
    // (1 - 2*9/19) * 200 ≈ 10.53 → round to nearest 5 = 10
    expect(r).toBe(10);
  });

  it('class size 1 returns 0', () => {
    expect(calculateRankReward(1, 1)).toBe(0);
  });

  it('rounds to nearest 5', () => {
    // rank 3 of 20: raw = 200 * (1 - 4/19) ≈ 157.89 → rounds to 160
    expect(calculateRankReward(3, 20) % 5).toBe(0);
  });
});

// ── calculateMonthlyPool ──

describe('calculateMonthlyPool', () => {
  it('returns reward for matching month entry with rank', () => {
    const points: MonthlySchoolPoint[] = [
      { id: '1', player_id: 'test', month_id: '2026-03', total_score: 100, rank: 1, created_at: '' },
    ];
    expect(calculateMonthlyPool(points, '2026-03')).toBe(200);
  });

  it('returns 0 when no matching month', () => {
    expect(calculateMonthlyPool([], '2026-03')).toBe(0);
  });

  it('returns 0 when rank is undefined', () => {
    const points: MonthlySchoolPoint[] = [
      { id: '1', player_id: 'test', month_id: '2026-03', total_score: 100, created_at: '' },
    ];
    expect(calculateMonthlyPool(points, '2026-03')).toBe(0);
  });
});

// ── calculateWeeklyQuests ──

describe('calculateWeeklyQuests', () => {
  const week: WeekPeriod = {
    startDate: new Date(2026, 2, 2), // Mon Mar 2
    endDate: new Date(2026, 2, 8),   // Sun Mar 8
    start: '3月2日', end: '3月8日',
  };

  it('awards exercise when logged on weekend', () => {
    const habits: HabitLog[] = [
      { id: 1, player_id: 'test', log_date: '2026-03-07', habit_type: '运动', created_at: '' }, // Sat
    ];
    const result = calculateWeeklyQuests([week], habits, []);
    expect(result[0].exercise.earned).toBe(25);
    expect(result[0].exercise.status).toBe('completed');
  });

  it('does not award exercise on weekday', () => {
    const habits: HabitLog[] = [
      { id: 1, player_id: 'test', log_date: '2026-03-03', habit_type: '运动', created_at: '' }, // Tue
    ];
    const result = calculateWeeklyQuests([week], habits, []);
    expect(result[0].exercise.earned).toBe(0);
  });

  it('counts strike for English score below 90', () => {
    const academics: AcademicRecord[] = [{
      id: 1, player_id: 'test', event_date: '2026-03-03', event_type: 'micro_test',
      subject: '英语', score: 85, max_score: 100, created_at: '',
    }];
    const result = calculateWeeklyQuests([week], [], academics);
    expect(result[0].academic.strikes).toBe(1);
    expect(result[0].academic.earned).toBe(80); // 100 - 20
  });

  it('counts strike for other subjects below 95', () => {
    const academics: AcademicRecord[] = [{
      id: 1, player_id: 'test', event_date: '2026-03-03', event_type: 'micro_test',
      subject: '数学', score: 92, max_score: 100, created_at: '',
    }];
    const result = calculateWeeklyQuests([week], [], academics);
    expect(result[0].academic.strikes).toBe(1);
  });

  it('counts strike for pass/fail subject with score 0 (fail)', () => {
    const academics: AcademicRecord[] = [{
      id: 1, player_id: 'test', event_date: '2026-03-03', event_type: 'micro_test',
      subject: '历史', score: 0, max_score: 100, is_pass_fail: true, created_at: '',
    }];
    const result = calculateWeeklyQuests([week], [], academics);
    expect(result[0].academic.strikes).toBe(1);
  });

  it('no strike for pass/fail subject with passing score', () => {
    const academics: AcademicRecord[] = [{
      id: 1, player_id: 'test', event_date: '2026-03-03', event_type: 'micro_test',
      subject: '历史', score: 1, max_score: 1, is_pass_fail: true, created_at: '',
    }];
    const result = calculateWeeklyQuests([week], [], academics);
    expect(result[0].academic.strikes).toBe(0);
  });

  it('applies major exam rating adjustments', () => {
    const academics: AcademicRecord[] = [{
      id: 1, player_id: 'test', event_date: '2026-03-03', event_type: 'major_exam',
      subject: '数学', score: 95, max_score: 100, major_exam_rating: 'bonus', created_at: '',
    }];
    const result = calculateWeeklyQuests([week], [], academics);
    expect(result[0].academic.examAdjustments).toHaveLength(1);
    expect(result[0].academic.examAdjustments[0].amount).toBe(25);
    expect(result[0].academic.earned).toBe(125); // 100 + 25
  });

  it('floors academic earned at 0', () => {
    const academics: AcademicRecord[] = Array.from({ length: 6 }, (_, i) => ({
      id: i, player_id: 'test', event_date: '2026-03-03', event_type: 'micro_test' as const,
      subject: '数学', score: 50, max_score: 100, created_at: '',
    }));
    const result = calculateWeeklyQuests([week], [], academics);
    expect(result[0].academic.earned).toBe(0); // max(0, 100 - 120)
  });
});

// ── formatRecentLogs ──

describe('formatRecentLogs', () => {
  it('returns at most 5 entries', () => {
    const txns: Transaction[] = Array.from({ length: 10 }, (_, i) => ({
      id: i, player_id: 'test', amount: 10, transaction_type: 'earned' as const,
      description: 'test', created_at: '2026-03-01T10:00:00Z',
    }));
    expect(formatRecentLogs(txns)).toHaveLength(5);
  });
});

// ── aggregatePlayerData ──

describe('aggregatePlayerData', () => {
  it('calculates totals correctly', () => {
    const quests = calculateWeeklyQuests(
      [{
        startDate: new Date(2026, 2, 2), endDate: new Date(2026, 2, 8),
        start: '3月2日', end: '3月8日',
      }],
      [{ id: 1, player_id: 'test', log_date: '2026-03-07', habit_type: '运动', created_at: '' }],
      [],
    );
    const data = aggregatePlayerData('test', quests, 100, 5, 4, []);
    expect(data.basePool).toBe(300);
    expect(data.weeklyPoolEarned).toBe(25); // exercise only
    expect(data.studyPoolRemaining).toBe(100); // no strikes
    expect(data.monthlyPoolEarned).toBe(100);
    expect(data.totalUnlocked).toBe(525); // 300 + 25 + 100 + 100
  });
});
