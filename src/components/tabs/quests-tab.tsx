"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function QuestsTab({ quests, currentWeek }: { quests: any[], currentWeek: { start: string, end: string, week: number } }) {
  return (
    <div className="space-y-4">
      <div className="mb-4 p-3 bg-muted/10 border border-border/50 rounded-md flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium">当前考评周期</span>
          <span className="text-[9px] text-muted-foreground">请在期限内完成打卡</span>
        </div>
        <span className="text-xs font-mono text-primary font-bold">第 {currentWeek.week} 周 ({currentWeek.start} - {currentWeek.end})</span>
      </div>

      {quests.map((quest: any) => (
        <Card key={quest.id} className="shadow-none border-border/50 relative overflow-hidden">
          {quest.status === 'under_review' && (
            <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-500/50"></div>
          )}
          <CardHeader className="p-4 pb-2 relative">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-semibold">{quest.title}</CardTitle>
                <CardDescription className="text-xs mt-1">{quest.type}任务指标</CardDescription>
              </div>
              <Badge variant={quest.status === 'pending' ? 'outline' : 'secondary'} className="text-xs font-normal">
                {quest.status === 'pending' ? '待执行' : '审核中'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 relative">
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{quest.description}</p>
            <div className="flex items-center justify-between">
              <div className="text-lg font-mono font-medium text-foreground">
                 &yen;{quest.reward}
              </div>
              <button disabled={quest.status !== 'pending'} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50">
                {quest.status === 'pending' ? '立即上传凭证' : '已提交，等待批复'}
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
