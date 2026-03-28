"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { PLAYER_ID } from "@/lib/queries";
import type { WeeklyQuestState } from "@/lib/types";

export function QuestsTab({ weeklyQuests, currentWeekIndex, onDataChange }: {
  weeklyQuests: WeeklyQuestState[];
  currentWeekIndex: number;
  onDataChange: () => void;
}) {
  const week = weeklyQuests[currentWeekIndex];
  if (!week) {
    return <div className="p-8 text-center text-xs text-muted-foreground">本赛季暂无周数据</div>;
  }

  const handleCheckIn = async (habitType: '运动' | '阅读') => {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('habit_logs').upsert([{
      player_id: PLAYER_ID,
      log_date: today,
      habit_type: habitType,
    }], { onConflict: 'player_id,log_date,habit_type' });

    if (error) {
      alert("打卡失败: " + error.message);
    } else {
      onDataChange();
    }
  };

  const quests = [
    { key: 'exercise', label: '周末运动', type: '运动' as const, earned: week.exercise.earned, status: week.exercise.status },
    { key: 'reading', label: '周末阅读', type: '阅读' as const, earned: week.reading.earned, status: week.reading.status },
  ];

  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;

  return (
    <div className="space-y-4">
      <div className="p-3 bg-muted/10 border border-border/50 rounded-md flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium">当前考评周期</span>
          <span className="text-[9px] text-muted-foreground">请在周末完成运动与阅读打卡</span>
        </div>
        <span className="text-xs font-mono text-primary font-bold">第 {week.week} 周 ({week.period.start} - {week.period.end})</span>
      </div>

      {quests.map(q => {
        const canCheckIn = q.status !== 'completed';

        return (
          <Card key={q.key} className={`shadow-none border-border/50 ${q.status === 'completed' ? 'bg-primary/5' : ''}`}>
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-semibold">{q.label}</CardTitle>
                <Badge
                  variant={q.status === 'completed' ? 'default' : 'outline'}
                  className={`text-xs px-2 py-0.5 ${q.status === 'completed' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
                >
                  {q.status === 'completed' ? '已完成' : '待打卡'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                {q.status === 'completed'
                  ? `${q.type}打卡已确认，¥${q.earned} 已锁定至本周奖金池`
                  : isWeekend
                    ? `今天是周末，点击下方按钮完成${q.type}打卡即可获得 ¥50 奖励`
                    : `周末完成一次${q.type}打卡即可获得 ¥50 奖励`
                }
              </p>
              <div className="flex items-center justify-between">
                <div className="text-lg font-mono font-semibold text-foreground">
                  &yen;{q.earned} <span className="text-[10px] text-muted-foreground font-sans font-normal">/ &yen;50</span>
                </div>
                {canCheckIn && (
                  <button
                    onClick={() => handleCheckIn(q.type)}
                    className={`text-xs font-medium px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      isWeekend
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted/50 text-muted-foreground border border-border/50 hover:bg-muted/80'
                    }`}
                  >
                    {isWeekend ? '立即打卡' : '提前打卡'}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
