"use client";

import { useState } from "react";
import { CircularProgress } from "@/components/circular-progress";
import { Badge } from "@/components/ui/badge";
import type { PlayerData, WeeklyQuestState, AcademicBonusState } from "@/lib/types";
import { WEEKLY_ACADEMIC_BASE } from "@/lib/constants";

function PoolCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-card border border-border rounded-xl p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function DashboardTab({ playerData }: { playerData: PlayerData }) {
  const [showWeekly, setShowWeekly] = useState(false);
  const [showAcademic, setShowAcademic] = useState(false);

  return (
    <div className="space-y-6 stagger-children">
      <div className="flex justify-center py-6">
        <CircularProgress value={playerData.totalUnlocked} max={playerData.totalCap} size={240} />
      </div>

      <div className="space-y-3">
        {/* Base Pool */}
        <PoolCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-2 rounded-full bg-primary/40" />
              <span className="text-sm font-medium text-foreground/80">固定零花钱</span>
            </div>
            <div className="text-xl font-bold font-mono text-foreground">&yen;{playerData.basePool}</div>
          </div>
        </PoolCard>

        {/* Weekly Habit Pool */}
        <PoolCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-2 rounded-full bg-primary" />
              <span className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                打卡奖励
                <button onClick={() => setShowWeekly(!showWeekly)} className="text-[10px] bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full text-primary/70 hover:text-primary hover:bg-primary/15 transition-all outline-none">
                  {showWeekly ? "收起" : "展开"}
                </button>
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-primary">
              &yen;{playerData.weeklyPoolEarned}
              <span className="text-xs text-muted-foreground font-normal ml-1.5">/ &yen;{playerData.weeklyPoolTotal}</span>
            </div>
          </div>
          {showWeekly && (
            <div className="space-y-2 mt-4 pt-3 border-t border-border/20">
              {playerData.weeklyQuests.map((w: WeeklyQuestState, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-muted/40 p-3 rounded-lg border border-border/40">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-foreground/80">W{w.week}</span>
                    <span className="text-[9px] text-muted-foreground/50 font-mono">{w.period.start} - {w.period.end}</span>
                  </div>
                  <div className="flex gap-4 text-xs font-mono">
                    <span className={w.exercise.earned > 0 ? "text-primary font-bold" : "text-muted-foreground/50"}>
                      <span className="text-[9px] font-sans mr-0.5">运动</span> &yen;{w.exercise.earned}
                    </span>
                    <span className={w.reading.earned > 0 ? "text-primary font-bold" : "text-muted-foreground/50"}>
                      <span className="text-[9px] font-sans mr-0.5">阅读</span> &yen;{w.reading.earned}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PoolCard>

        {/* Academic Pool */}
        <PoolCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-2 rounded-full bg-(--chart-1)" />
              <span className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                考试奖励
                <button onClick={() => setShowAcademic(!showAcademic)} className="text-[10px] bg-(--chart-1)/10 border border-(--chart-1)/20 px-2 py-0.5 rounded-full text-(--chart-1) hover:bg-(--chart-1)/15 transition-all outline-none">
                  {showAcademic ? "收起" : "展开"}
                </button>
              </span>
            </div>
            <div className={`text-xl font-bold font-mono ${playerData.studyPoolTotal > 0 && (playerData.studyPoolRemaining / playerData.studyPoolTotal) < 0.5 ? "text-destructive" : "text-foreground"}`}>
              &yen;{playerData.studyPoolRemaining}
              <span className="text-xs text-muted-foreground font-normal ml-1.5">/ &yen;{playerData.studyPoolTotal}</span>
            </div>
          </div>
          {showAcademic && (
            <div className="space-y-2 mt-4 pt-3 border-t border-border/20">
              {playerData.academicBonus.map((w: AcademicBonusState, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-muted/40 p-3 rounded-lg border border-border/40">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-foreground/80">W{w.week}</span>
                    <span className="text-[9px] text-muted-foreground/50 font-mono">{w.period.start} - {w.period.end}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <div className="flex flex-col items-end gap-0.5">
                      {w.deductions.map((d, i) => (
                        <span key={i} className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-sans text-[10px]">{d.reason}</span>
                      ))}
                      {w.examAdjustments.map((ea, i) => (
                        <span
                          key={`ea-${i}`}
                          className={`px-1.5 py-0.5 rounded-full font-sans text-[10px] ${
                            ea.rating === 'bonus'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : ea.rating === 'penalty'
                                ? 'bg-destructive/10 text-destructive'
                                : 'hidden'
                          }`}
                        >
                          {ea.subject}{ea.examName ? `(${ea.examName})` : ''}: {ea.amount > 0 ? '+' : ''}{ea.amount}
                        </span>
                      ))}
                    </div>
                    <span className={`font-bold ${w.remaining === WEEKLY_ACADEMIC_BASE ? "text-foreground/70" : w.remaining > WEEKLY_ACADEMIC_BASE ? "text-emerald-500" : w.remaining > 0 ? "text-orange-400" : "text-destructive"}`}>
                      &yen;{w.remaining}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PoolCard>

        {/* Monthly Ranking Pool */}
        <PoolCard className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-2 rounded-full bg-muted-foreground/30" />
              <span className="text-sm font-medium text-muted-foreground">月度排名奖</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-xl font-bold font-mono flex items-center ${
                playerData.monthlyPoolEarned > 0 ? 'text-emerald-500' : playerData.monthlyPoolEarned < 0 ? 'text-destructive' : 'text-muted-foreground/50'
              }`}>
                {playerData.monthlyPoolEarned > 0 ? '+' : ''}&yen;{playerData.monthlyPoolEarned}
                <span className="text-xs text-muted-foreground/30 font-normal ml-1.5">&plusmn;&yen;{playerData.monthlyPoolTotal}</span>
              </div>
              {playerData.monthlyPoolEarned === 0 && !playerData.monthlyPoolRank && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground/50 border-border/30 font-mono">TBD</Badge>
              )}
            </div>
          </div>
        </PoolCard>
      </div>
    </div>
  );
}
