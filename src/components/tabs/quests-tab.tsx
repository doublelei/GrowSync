"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { HABIT_REWARD_PER_TYPE, nowBeijing } from "@/lib/constants";
import { useSubmitExerciseProof, useSubmitReadingProof } from "@/hooks/useMutations";
import type { WeeklyQuestState, HabitProof } from "@/lib/types";

type ProofStatus = 'none' | 'pending' | 'rejected' | 'approved';

function getProofStatus(
  proofs: HabitProof[],
  habitType: '运动' | '阅读',
  weekStart: Date,
  weekEnd: Date,
): { status: ProofStatus; proof?: HabitProof } {
  const endOfDay = new Date(weekEnd);
  endOfDay.setHours(23, 59, 59, 999);

  const matching = proofs
    .filter(p => {
      const [y, m, d] = p.log_date.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return p.habit_type === habitType && date >= weekStart && date <= endOfDay;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (matching.length === 0) return { status: 'none' };
  const latest = matching[0];
  return { status: latest.status as ProofStatus, proof: latest };
}

export function QuestsTab({ weeklyQuests, currentWeekIndex, monthId, habitProofs }: {
  weeklyQuests: WeeklyQuestState[];
  currentWeekIndex: number;
  monthId: string;
  habitProofs: HabitProof[];
}) {
  const submitExercise = useSubmitExerciseProof(monthId);
  const submitReading = useSubmitReadingProof(monthId);

  const [readingText, setReadingText] = useState('');
  const [showReadingForm, setShowReadingForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const week = weeklyQuests[currentWeekIndex];
  if (!week) {
    return <div className="p-8 text-center text-xs text-muted-foreground">本月暂无数据</div>;
  }

  const today = nowBeijing();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;

  const exerciseProof = getProofStatus(habitProofs, '运动', week.period.startDate, week.period.endDate);
  const readingProof = getProofStatus(habitProofs, '阅读', week.period.startDate, week.period.endDate);

  const handleExerciseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    submitExercise.mutate({ file }, {
      onError: (err) => alert('上传失败: ' + err.message),
    });
    e.target.value = '';
  };

  const handleReadingSubmit = () => {
    if (readingText.length < 100) {
      alert(`阅读归纳至少需要100字，当前 ${readingText.length} 字`);
      return;
    }
    submitReading.mutate({ text: readingText }, {
      onSuccess: () => { setReadingText(''); setShowReadingForm(false); },
      onError: (err) => alert('提交失败: ' + err.message),
    });
  };

  const statusBadge = (ps: ProofStatus, earned: number) => {
    if (earned > 0) return <Badge variant="default" className="text-[10px] px-2.5 py-0.5 bg-primary/15 text-primary border border-primary/20 font-mono">DONE</Badge>;
    if (ps === 'pending') return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 text-yellow-400 border-yellow-400/30 bg-yellow-400/5 font-mono">PENDING</Badge>;
    if (ps === 'rejected') return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 text-destructive border-destructive/30 bg-destructive/5 font-mono">REJECTED</Badge>;
    return <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 text-muted-foreground/50 border-border/30 font-mono">OPEN</Badge>;
  };

  const statusText = (ps: ProofStatus, earned: number, type: string) => {
    if (earned > 0) return `${type}打卡完成，¥${earned} 已到账`;
    if (ps === 'pending') return `${type}凭证已提交，等待审核`;
    if (ps === 'rejected') return `${type}凭证被驳回，请重新提交`;
    if (isWeekend) return `今天是周末，上传${type}凭证即可获得 ¥${HABIT_REWARD_PER_TYPE}`;
    return `周末上传${type}凭证即可获得 ¥${HABIT_REWARD_PER_TYPE}`;
  };

  const canSubmitExercise = isWeekend && week.exercise.earned === 0 && exerciseProof.status !== 'pending';
  const canSubmitReading = isWeekend && week.reading.earned === 0 && readingProof.status !== 'pending';

  return (
    <div className="space-y-4 stagger-children">
      {/* Week info bar */}
      <div className="glass-card rounded-xl p-3 flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-foreground/80">本周任务</span>
          <span className="text-[9px] text-muted-foreground/50">周末完成运动和阅读各一次即可</span>
        </div>
        <span className="text-[10px] font-mono text-primary font-bold tracking-wider">
          W{week.week} <span className="text-muted-foreground/40 font-normal">{week.period.start} - {week.period.end}</span>
        </span>
      </div>

      {/* Exercise Quest Card */}
      <div className={`glass-card rounded-xl overflow-hidden transition-all duration-300 ${week.exercise.earned > 0 ? 'border-primary/20 glow-primary' : ''}`}>
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className={`size-8 rounded-lg flex items-center justify-center text-sm ${week.exercise.earned > 0 ? 'bg-primary/15 text-primary' : 'bg-muted/30 text-muted-foreground/50'}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M5.5 5l-3 3 3 3M10.5 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-sm font-semibold">周末运动</span>
            </div>
            {statusBadge(exerciseProof.status, week.exercise.earned)}
          </div>
          <p className="text-xs text-muted-foreground/60 mb-4 leading-relaxed">
            {statusText(exerciseProof.status, week.exercise.earned, '运动')}
          </p>
          <div className="flex items-center justify-between">
            <div className="font-mono font-bold text-lg text-foreground">
              &yen;{week.exercise.earned}
              <span className="text-[10px] text-muted-foreground/40 font-normal ml-1">/ &yen;{HABIT_REWARD_PER_TYPE}</span>
            </div>
            {canSubmitExercise && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleExerciseUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitExercise.isPending}
                  className="text-xs font-semibold px-4 py-2 rounded-lg transition-all bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_15px_oklch(0.82_0.22_155/0.3)] disabled:opacity-50 focus:outline-none"
                >
                  {submitExercise.isPending ? '上传中...' : '上传运动照片'}
                </button>
              </>
            )}
          </div>
        </div>
        {/* Progress bar at bottom */}
        <div className="h-0.5 bg-muted/20">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
            style={{ width: `${(week.exercise.earned / HABIT_REWARD_PER_TYPE) * 100}%` }}
          />
        </div>
      </div>

      {/* Reading Quest Card */}
      <div className={`glass-card rounded-xl overflow-hidden transition-all duration-300 ${week.reading.earned > 0 ? 'border-secondary/20 glow-secondary' : ''}`}>
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className={`size-8 rounded-lg flex items-center justify-center text-sm ${week.reading.earned > 0 ? 'bg-secondary/15 text-secondary' : 'bg-muted/30 text-muted-foreground/50'}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 3v10l5.5-2 5.5 2V3L8 5 2.5 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 5v8" stroke="currentColor" strokeWidth="1.5"/></svg>
              </div>
              <span className="text-sm font-semibold">周末阅读</span>
            </div>
            {statusBadge(readingProof.status, week.reading.earned)}
          </div>
          <p className="text-xs text-muted-foreground/60 mb-4 leading-relaxed">
            {statusText(readingProof.status, week.reading.earned, '阅读')}
          </p>

          {showReadingForm && canSubmitReading ? (
            <div className="space-y-3">
              <textarea
                value={readingText}
                onChange={e => setReadingText(e.target.value)}
                placeholder="写下你的阅读归纳（至少100字）..."
                className="w-full h-32 bg-background/50 border border-border/30 rounded-lg px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none focus:border-primary/30 transition-all"
              />
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono ${readingText.length >= 100 ? 'text-primary' : 'text-muted-foreground/40'}`}>
                  {readingText.length} / 100
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowReadingForm(false); setReadingText(''); }}
                    className="text-xs px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleReadingSubmit}
                    disabled={submitReading.isPending || readingText.length < 100}
                    className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50 transition-all"
                  >
                    {submitReading.isPending ? '提交中...' : '提交归纳'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="font-mono font-bold text-lg text-foreground">
                &yen;{week.reading.earned}
                <span className="text-[10px] text-muted-foreground/40 font-normal ml-1">/ &yen;{HABIT_REWARD_PER_TYPE}</span>
              </div>
              {canSubmitReading && (
                <button
                  onClick={() => setShowReadingForm(true)}
                  className="text-xs font-semibold px-4 py-2 rounded-lg transition-all bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:shadow-[0_0_15px_oklch(0.55_0.28_290/0.3)] focus:outline-none"
                >
                  写阅读归纳
                </button>
              )}
            </div>
          )}
        </div>
        {/* Progress bar at bottom */}
        <div className="h-0.5 bg-muted/20">
          <div
            className="h-full bg-gradient-to-r from-secondary to-secondary/60 transition-all duration-700"
            style={{ width: `${(week.reading.earned / HABIT_REWARD_PER_TYPE) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
