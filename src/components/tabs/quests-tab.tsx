"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WeeklyQuestState } from "@/lib/types";

export function QuestsTab({ weeklyQuests, currentWeekIndex }: {
  weeklyQuests: WeeklyQuestState[];
  currentWeekIndex: number;
}) {
  const currentWeek = weeklyQuests[currentWeekIndex];

  return (
    <div className="space-y-6">
      {/* Current week highlight */}
      {currentWeek && (
        <div className="mb-2 p-3 bg-muted/10 border border-border/50 rounded-md flex justify-between items-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium">当前考评周期</span>
            <span className="text-[9px] text-muted-foreground">请在周末完成运动与阅读打卡</span>
          </div>
          <span className="text-xs font-mono text-primary font-bold">第 {currentWeek.week} 周 ({currentWeek.period.start} - {currentWeek.period.end})</span>
        </div>
      )}

      {/* All weeks' quests */}
      {weeklyQuests.map((week, weekIdx) => {
        const isCurrent = weekIdx === currentWeekIndex;
        const isPast = weekIdx < currentWeekIndex;
        const quests = [
          { key: 'exercise', label: '周末运动', type: '运动', earned: week.exercise.earned, status: week.exercise.status },
          { key: 'reading', label: '周末阅读', type: '阅读', earned: week.reading.earned, status: week.reading.status },
        ];

        return (
          <div key={weekIdx}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                第 {week.week} 周
              </span>
              <span className="text-[9px] text-muted-foreground">{week.period.start} - {week.period.end}</span>
              {isCurrent && <Badge className="bg-primary/20 text-primary text-[9px] h-4 px-1.5">本周</Badge>}
              {isPast && quests.every(q => q.status === 'completed') && <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-muted-foreground">已完成</Badge>}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {quests.map(q => (
                <Card key={q.key} className={`shadow-none border-border/50 ${q.status === 'completed' ? 'bg-primary/5' : ''}`}>
                  <CardHeader className="p-3 pb-1">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm font-medium">{q.label}</CardTitle>
                      <Badge
                        variant={q.status === 'completed' ? 'default' : 'outline'}
                        className={`text-[9px] px-1.5 py-0 h-4 ${q.status === 'completed' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
                      >
                        {q.status === 'completed' ? '已完成' : isPast ? '未完成' : '待打卡'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <p className="text-[10px] text-muted-foreground mb-2">
                      {q.status === 'completed'
                        ? `${q.type}打卡已确认`
                        : isCurrent
                          ? `周末完成${q.type}打卡即可获得奖励`
                          : isPast
                            ? `本周未完成${q.type}打卡`
                            : `等待本周到来`
                      }
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-mono font-semibold ${q.status === 'completed' ? 'text-primary' : 'text-muted-foreground/40'}`}>
                        &yen;{q.earned}
                      </span>
                      <span className="text-[10px] text-muted-foreground">/ &yen;50</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {weeklyQuests.length === 0 && (
        <div className="p-8 text-center text-xs text-muted-foreground">本赛季暂无周数据</div>
      )}
    </div>
  );
}
