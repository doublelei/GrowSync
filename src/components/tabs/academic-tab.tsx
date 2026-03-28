"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AcademicRecord, HabitLog, MonthlySchoolPoint, WeeklyQuestState, WeekPeriod } from "@/lib/types";
import { getWeekIndexForDate } from "@/lib/date-utils";
import { SUBJECTS, STRIKE_THRESHOLD_ENGLISH, STRIKE_THRESHOLD_DEFAULT } from "@/lib/constants";

export function AcademicTab({
  records = [],
  habitLogs = [],
  monthlyPoints = [],
  weeklyQuests = [],
  currentWeekIndex = 0,
  weeks = []
}: {
  records?: AcademicRecord[];
  habitLogs?: HabitLog[];
  monthlyPoints?: MonthlySchoolPoint[];
  weeklyQuests?: WeeklyQuestState[];
  currentWeekIndex?: number;
  weeks?: WeekPeriod[];
}) {
  const [subject, setSubject] = useState("英语");

  const currentWeek = weeklyQuests[currentWeekIndex];

  const subjects = SUBJECTS;
  const filteredRecords = records
    .filter(r => r.subject === subject)
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  return (
    <div className="space-y-6">
      {/* Weekly HUD */}
      {currentWeek && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-none border-border/50 bg-primary/5">
            <CardContent className="p-3 text-center">
              <div className="text-[10px] text-muted-foreground uppercase mb-1">考试奖励</div>
              <div className={`text-xl font-mono font-bold ${currentWeek.academic.earned < 50 ? 'text-destructive' : 'text-primary'}`}>
                &yen;{currentWeek.academic.earned}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">Strike: {currentWeek.academic.strikes}</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border-border/50 bg-primary/5">
            <CardContent className="p-3 text-center">
              <div className="text-[10px] text-muted-foreground uppercase mb-1">周末运动</div>
              <div className={`text-xl font-mono font-bold ${currentWeek.exercise.status === 'completed' ? 'text-primary' : 'text-muted-foreground'}`}>
                {currentWeek.exercise.status === 'completed' ? '✓' : '—'}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                {currentWeek.exercise.earned > 0 ? '¥50 已锁定' : '待完成'}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none border-border/50 bg-primary/5">
            <CardContent className="p-3 text-center">
              <div className="text-[10px] text-muted-foreground uppercase mb-1">周末阅读</div>
              <div className={`text-xl font-mono font-bold ${currentWeek.reading.status === 'completed' ? 'text-primary' : 'text-muted-foreground'}`}>
                {currentWeek.reading.status === 'completed' ? '✓' : '—'}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                {currentWeek.reading.earned > 0 ? '¥50 已锁定' : '待完成'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2 p-1 bg-muted/30 rounded-md overflow-x-auto">
        {subjects.map(s => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className={`px-4 py-1.5 text-xs font-medium rounded-sm whitespace-nowrap transition-colors ${subject === s ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <Card className="shadow-none border-border/50">
        <CardHeader className="p-4 bg-muted/10 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">{subject} 成绩记录</CardTitle>
          <CardDescription className="text-xs">所有小测和大考成绩</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {filteredRecords.map((record) => {
               const score = Number(record.score);
               const threshold = record.subject === '英语' ? STRIKE_THRESHOLD_ENGLISH : STRIKE_THRESHOLD_DEFAULT;
               const isBelowThreshold = score < threshold;
               const isStrike = record.event_type === 'micro_test' && (record.is_retest || isBelowThreshold);
               const weekIdx = getWeekIndexForDate(weeks, new Date(record.event_date));
               const weekLabel = weekIdx >= 0 ? `第${weekIdx + 1}周` : null;

               return (
                <div key={record.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{record.exam_name || '日常小测'}</span>
                      {record.event_type === 'major_exam' && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-primary/20 text-primary hover:bg-primary/30">大考</Badge>}
                      {isStrike && <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">Strike</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2">
                      <span>{record.event_date}</span>
                      {weekLabel && <span className="text-[9px] bg-muted/40 border border-border/40 px-1 py-0 rounded-sm">{weekLabel}</span>}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className={`text-lg font-mono font-semibold ${isStrike ? 'text-destructive' : 'text-foreground'}`}>
                      {record.score} <span className="text-[10px] text-muted-foreground font-sans font-normal">/ {record.max_score}</span>
                    </div>
                    {record.class_avg && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">班均: {record.class_avg} (最高: {record.highest_score || '-'})</div>
                    )}
                  </div>
                </div>
               );
            })}
            {filteredRecords.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">暂无该科目的录入数据</div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {/* Habit Logs */}
        <Card className="shadow-none border-border/50">
          <CardHeader className="p-3 bg-muted/10 border-b border-border/50">
            <CardTitle className="text-xs font-semibold">近期打卡</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-border/50 max-h-48 overflow-y-auto">
               {habitLogs.slice(0, 10).map((h) => (
                 <div key={h.id} className="p-3 flex justify-between items-center text-xs">
                   <span className="font-mono text-muted-foreground">{h.log_date}</span>
                   <Badge variant="outline" className="text-[10px] py-0 h-4 font-normal">{h.habit_type}</Badge>
                 </div>
               ))}
               {habitLogs.length === 0 && <div className="p-4 text-center text-xs text-muted-foreground">暂无打卡记录</div>}
             </div>
          </CardContent>
        </Card>

        {/* Monthly Points */}
        <Card className="shadow-none border-border/50">
          <CardHeader className="p-3 bg-muted/10 border-b border-border/50">
            <CardTitle className="text-xs font-semibold">月度排名</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-border/50 max-h-48 overflow-y-auto">
               {monthlyPoints.map((p) => (
                 <div key={p.id} className="p-3 flex flex-col gap-1 text-xs">
                   <div className="flex justify-between items-center">
                     <span className="font-medium font-mono border border-border/50 bg-muted/20 px-1 py-0.5 rounded-sm">{p.month_id}</span>
                     <div className="flex gap-2 items-center">
                       {p.rank && <Badge className="bg-primary/20 text-primary text-[9px] h-4">Rank {p.rank}</Badge>}
                       <span className={p.total_score >= 0 ? "text-primary font-bold" : "text-destructive font-bold"}>
                         {p.total_score > 0 ? "+" : ""}{p.total_score} 分
                       </span>
                     </div>
                   </div>
                   {p.notes && <span className="text-[10px] text-muted-foreground mt-0.5">{p.notes}</span>}
                 </div>
               ))}
               {monthlyPoints.length === 0 && <div className="p-4 text-center text-xs text-muted-foreground">暂无月度数据</div>}
             </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
