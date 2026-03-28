"use client";

import { useState } from "react";
import { CircularProgress } from "@/components/circular-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PlayerData, WeeklyQuestState, AcademicBonusState } from "@/lib/types";
import { WEEKLY_ACADEMIC_BASE } from "@/lib/constants";

export function DashboardTab({ playerData }: { playerData: PlayerData }) {
  const [showWeekly, setShowWeekly] = useState(false);
  const [showAcademic, setShowAcademic] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-center py-4">
        <CircularProgress value={playerData.totalUnlocked} max={playerData.totalCap} size={240} />
      </div>

      <div className="space-y-4">
        <Card className="bg-muted/10 border-border/50 shadow-none">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium">基础社交资金</CardTitle>
            <div className="text-xl font-semibold font-mono text-foreground">&yen;{playerData.basePool}</div>
          </CardHeader>
        </Card>

        <Card className="bg-muted/10 border-border/50 shadow-none">
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                每周打卡奖金
                <button onClick={() => setShowWeekly(!showWeekly)} className="text-[10px] bg-muted/50 border border-border px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground transition-colors outline-none focus:ring-1 focus:ring-primary/50">
                  {showWeekly ? "收起" : "展开"}
                </button>
              </CardTitle>
              <div className="text-xl font-semibold font-mono text-primary">
                &yen;{playerData.weeklyPoolEarned} <span className="text-xs text-muted-foreground font-sans font-normal ml-1">/ &yen;{playerData.weeklyPoolTotal}</span>
              </div>
            </div>
          </CardHeader>
          {showWeekly && (
            <CardContent className="p-4 pt-0">
              <div className="space-y-2 mt-2">
                {playerData.weeklyQuests.map((w: WeeklyQuestState, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-background/40 p-2.5 rounded-md border border-border/30">
                    <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-foreground/80">第 {w.week} 周</span>
                    <span className="text-[9px] text-muted-foreground/60">{w.period.start} - {w.period.end}</span>
                  </div>
                    <div className="flex gap-4 text-xs font-mono">
                      <span className={w.exercise.earned > 0 ? "text-primary font-bold" : "text-muted-foreground"}>运动: &yen;{w.exercise.earned}/50</span>
                      <span className={w.reading.earned > 0 ? "text-primary font-bold" : "text-muted-foreground"}>阅读: &yen;{w.reading.earned}/50</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="bg-muted/10 border-border/50 shadow-none">
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                学习表现奖金
                <button onClick={() => setShowAcademic(!showAcademic)} className="text-[10px] bg-muted/50 border border-border px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground transition-colors outline-none focus:ring-1 focus:ring-primary/50">
                  {showAcademic ? "收起" : "展开"}
                </button>
              </CardTitle>
              <div className={`text-xl font-semibold font-mono ${playerData.studyPoolTotal > 0 && (playerData.studyPoolRemaining / playerData.studyPoolTotal) < 0.5 ? "text-destructive" : "text-foreground"}`}>
                &yen;{playerData.studyPoolRemaining} <span className="text-xs text-muted-foreground font-sans font-normal ml-1">/ &yen;{playerData.studyPoolTotal}</span>
              </div>
            </div>
          </CardHeader>
          {showAcademic && (
            <CardContent className="p-4 pt-0">
              <div className="space-y-2 mt-2">
                {playerData.academicBonus.map((w: AcademicBonusState, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-background/40 p-2.5 rounded-md border border-border/30">
                    <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-foreground/80">第 {w.week} 周</span>
                    <span className="text-[9px] text-muted-foreground/60">{w.period.start} - {w.period.end}</span>
                  </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <div className="flex flex-col items-end gap-0.5">
                        {w.deductions.map((d, i) => (
                          <span key={i} className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-sm font-sans text-[10px]">{d.reason}</span>
                        ))}
                      </div>
                      <span className={w.remaining === WEEKLY_ACADEMIC_BASE ? "text-foreground" : w.remaining > 0 ? "text-orange-500 font-bold" : "text-destructive font-bold"}>
                        剩余: &yen;{w.remaining}/{WEEKLY_ACADEMIC_BASE}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="bg-muted/5 border-border/30 shadow-none">
          <CardHeader className="p-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">月末排名挑战</CardTitle>
            <div className="flex items-center gap-2">
              <div className="text-xl font-semibold font-mono text-muted-foreground flex items-center">&yen;{playerData.monthlyPoolEarned} <span className="text-xs text-muted-foreground/50 font-sans font-normal ml-1">/ &yen;{playerData.monthlyPoolTotal}</span></div>
              {playerData.monthlyPoolEarned === 0 && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/50 font-normal">未结算</Badge>
              )}
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
