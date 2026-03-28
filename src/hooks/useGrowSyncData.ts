import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentMonthInfo } from '@/lib/date-utils';
import { PlayerData, Transaction, QuestProof, AcademicRecord, WeekPeriod } from '@/lib/types';

export function useGrowSyncData() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ playerData: PlayerData, academicRecords: AcademicRecord[], habitLogs: any[], monthlyPoints: any[], quests: any[], pendingProofs: any[] } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const { monthStr, weeks } = getCurrentMonthInfo();
    const playerId = '雷雨声';
    
    const [txRes, proofsRes, academicRes, pointsRes, habitsRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('player_id', playerId).order('created_at', { ascending: false }),
      supabase.from('quest_proofs').select('*').eq('player_id', playerId).order('created_at', { ascending: false }),
      supabase.from('academic_records').select('*').eq('player_id', playerId).order('event_date', { ascending: true }),
      supabase.from('monthly_school_points').select('*').eq('player_id', playerId).order('month_id', { ascending: false }),
      supabase.from('habit_logs').select('*').eq('player_id', playerId).order('log_date', { ascending: false })
    ]);

    const txs: Transaction[] = txRes.data || [];
    const proofs: QuestProof[] = proofsRes.data || [];
    const academics: AcademicRecord[] = academicRes.data || [];
    const points = pointsRes.data || [];
    const habits = habitsRes.data || [];

    const basePool = 400; // Module 1: Fixed Base
    
    // Map dates for period comparison
    const txsWithDate = txs.map((t: any) => ({ ...t, dateObj: new Date(t.created_at) }));
    const habitsWithDate = habits.map(h => ({ ...h, dateObj: new Date(h.log_date) }));

    const weeklyQuests = weeks.map((w: WeekPeriod, idx: number) => {
      const endOfDay = new Date(w.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const habitsThisWeek = habitsWithDate.filter(h => h.dateObj >= w.startDate && h.dateObj <= endOfDay);
      
      // Module 2-B & 2-C: Weekend Once Logic (check for Sat or Sun)
      // Sat is 6, Sun is 0. 
      const weekendExercise = habitsThisWeek.some(h => (h.dateObj.getDay() === 0 || h.dateObj.getDay() === 6) && h.habit_type === '运动');
      const weekendReading = habitsThisWeek.some(h => (h.dateObj.getDay() === 0 || h.dateObj.getDay() === 6) && h.habit_type === '阅读');
      
      const exerciseEarned = weekendExercise ? 50 : 0;
      const readingEarned = weekendReading ? 50 : 0;

      // Module 2-A: Academic Strike System
      const academicsThisWeek = academics.filter(a => {
        const d = new Date(a.event_date);
        return d >= w.startDate && d <= endOfDay;
      });

      let strikes = 0;
      const currentWeekDeductions: any[] = [];

      academicsThisWeek.forEach(a => {
        const score = Number(a.score);
        const isBelowThreshold = (a.subject === '英语' ? score < 90 : score < 95);
        if (a.is_retest || score < 60 || isBelowThreshold) {
           strikes++;
           let reason = a.is_retest ? "重考惩扣" : (score < 60 ? "不及格惩扣" : "分值不达标");
           currentWeekDeductions.push({ reason: `${a.subject}: ${reason}`, amount: 15 });
        }
      });
      const academicPoolRemaining = Math.max(0, 50 - (strikes * 15));
      
      return {
        week: idx + 1,
        period: { 
          start: w.startDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }), 
          end: w.endDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
          startDate: w.startDate,
          endDate: w.endDate
        },
        exercise: { earned: exerciseEarned, status: exerciseEarned >= 50 ? 'completed' : 'pending' as any },
        reading: { earned: readingEarned, status: readingEarned >= 50 ? 'completed' : 'pending' as any },
        academic: { earned: academicPoolRemaining, strikes, deductions: currentWeekDeductions }
      };
    });
    
    // Habit pool only includes Exercise & Reading (100 per week)
    const weeklyPoolEarned = weeklyQuests.reduce((acc, curr) => acc + curr.exercise.earned + curr.reading.earned, 0);

    const academicBonus = weeklyQuests.map(w => ({
      week: w.week,
      period: w.period,
      remaining: w.academic.earned,
      deductions: w.academic.deductions
    }));
    
    const studyPoolRemaining = academicBonus.reduce((sum, b) => sum + b.remaining, 0);

    // Module 3: Monthly Rank Tiers
    const latestMonthPoint = points.length > 0 ? points[0] : null;
    let monthlyPoolEarned = 0;
    if (latestMonthPoint) {
      const rankValue = Number(latestMonthPoint.rank || latestMonthPoint.total_score || 40); 
      if (rankValue <= 10) monthlyPoolEarned = 200;
      else if (rankValue <= 20) monthlyPoolEarned = 100;
      else if (rankValue <= 30) monthlyPoolEarned = 50;
      else monthlyPoolEarned = 0;
    }

    const dynamicWeeklyHabitMax = weeks.length * 100; // 50 Move + 50 Read
    const dynamicWeeklyStudyMax = weeks.length * 50;  // 50 Academic
    const totalUnlocked = basePool + weeklyPoolEarned + studyPoolRemaining + monthlyPoolEarned;

    setData({
      playerData: {
        name: playerId,
        basePool,
        weeklyPoolEarned,
        weeklyPoolTotal: dynamicWeeklyHabitMax,
        studyPoolRemaining,
        studyPoolTotal: dynamicWeeklyStudyMax,
        monthlyPoolEarned,
        monthlyPoolTotal: 200,
        totalUnlocked,
        totalCap: basePool + dynamicWeeklyHabitMax + dynamicWeeklyStudyMax + 200,
        recentLogs: txs.slice(0, 5).map((t: any) => ({
          id: t.id,
          type: t.transaction_type,
          amount: t.amount,
          description: t.description,
          date: new Date(t.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        })),
        weeklyQuests,
        academicBonus
      },
      academicRecords: academics,
      habitLogs: habits,
      monthlyPoints: points,
      quests: proofs.map(p => ({
        id: p.id,
        title: p.quest_title,
        reward: p.reward_amount,
        type: p.quest_type,
        status: p.status,
        description: p.status === 'pending' ? '点击上传证明以获取本周奖励' : '凭证已提交，请等待管理员复核'
      })),
      pendingProofs: proofs.filter(p => p.status === 'under_review').map(p => ({
        id: p.id,
        player: p.player_id,
        questTitle: p.quest_title,
        type: p.quest_type,
        date: new Date(p.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        reward: p.reward_amount
      }))
    });
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { data, loading, reloadData: loadData };
}
