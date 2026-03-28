"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Find the latest proof for this type within the week
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
    if (earned > 0) return <Badge variant="default" className="text-xs px-2 py-0.5 bg-primary/20 text-primary">已通过</Badge>;
    if (ps === 'pending') return <Badge variant="outline" className="text-xs px-2 py-0.5 text-yellow-500 border-yellow-500/30">审核中</Badge>;
    if (ps === 'rejected') return <Badge variant="outline" className="text-xs px-2 py-0.5 text-destructive border-destructive/30">已驳回</Badge>;
    return <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">待打卡</Badge>;
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
    <div className="space-y-4">
      <div className="p-3 bg-muted/10 border border-border/50 rounded-md flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium">本周任务</span>
          <span className="text-[9px] text-muted-foreground">周末完成运动和阅读各一次即可</span>
        </div>
        <span className="text-xs font-mono text-primary font-bold">第 {week.week} 周 ({week.period.start} - {week.period.end})</span>
      </div>

      {/* Exercise Card */}
      <Card className={`shadow-none border-border/50 ${week.exercise.earned > 0 ? 'bg-primary/5' : ''}`}>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base font-semibold">周末运动</CardTitle>
            {statusBadge(exerciseProof.status, week.exercise.earned)}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            {statusText(exerciseProof.status, week.exercise.earned, '运动')}
          </p>
          <div className="flex items-center justify-between">
            <div className="text-lg font-mono font-semibold text-foreground">
              &yen;{week.exercise.earned} <span className="text-[10px] text-muted-foreground font-sans font-normal">/ &yen;{HABIT_REWARD_PER_TYPE}</span>
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
                  className="text-xs font-medium px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitExercise.isPending ? '上传中...' : '上传运动照片'}
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reading Card */}
      <Card className={`shadow-none border-border/50 ${week.reading.earned > 0 ? 'bg-primary/5' : ''}`}>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base font-semibold">周末阅读</CardTitle>
            {statusBadge(readingProof.status, week.reading.earned)}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            {statusText(readingProof.status, week.reading.earned, '阅读')}
          </p>

          {showReadingForm && canSubmitReading ? (
            <div className="space-y-3">
              <textarea
                value={readingText}
                onChange={e => setReadingText(e.target.value)}
                placeholder="写下你的阅读归纳（至少100字）..."
                className="w-full h-32 bg-background border border-border/50 rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <div className="flex items-center justify-between">
                <span className={`text-[10px] ${readingText.length >= 100 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {readingText.length} / 100 字
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowReadingForm(false); setReadingText(''); }}
                    className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleReadingSubmit}
                    disabled={submitReading.isPending || readingText.length < 100}
                    className="text-xs font-medium px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {submitReading.isPending ? '提交中...' : '提交归纳'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-lg font-mono font-semibold text-foreground">
                &yen;{week.reading.earned} <span className="text-[10px] text-muted-foreground font-sans font-normal">/ &yen;{HABIT_REWARD_PER_TYPE}</span>
              </div>
              {canSubmitReading && (
                <button
                  onClick={() => setShowReadingForm(true)}
                  className="text-xs font-medium px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  写阅读归纳
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
