"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, HelpCircle } from "lucide-react";
import { useSeasonNavigation } from "@/hooks/useSeasonNavigation";
import { useSeasonData } from "@/hooks/useSeasonData";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { DashboardTab } from "@/components/tabs/dashboard-tab";
import { QuestsTab } from "@/components/tabs/quests-tab";
import { AdminTab } from "@/components/tabs/admin-tab";
import { AuthLock } from "@/components/auth-lock";

export function HomeClient({ isParent }: { isParent: boolean }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const {
    seasonInfo,
    seasonRange,
    currentWeekIndex,
    goToPrevMonth,
    goToNextMonth,
    goToCurrentMonth,
  } = useSeasonNavigation();

  const { monthStr, monthId, weeks } = seasonInfo;

  const { data, isLoading } = useSeasonData({
    monthId,
    seasonStart: seasonRange.start,
    seasonEnd: seasonRange.end,
    weeks,
  });

  useRealtimeSync(monthId);

  if (isLoading || !data) {
    return (
      <div className="max-w-md mx-auto w-full h-[100dvh] bg-background flex flex-col items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse shadow-2xl shadow-primary/20">
        Initializing Terminal...
      </div>
    );
  }

  const { playerData, pendingProofs, academicRecords, habitLogs, habitProofs, monthlyPoints } = data;

  const cw = weeks[currentWeekIndex];
  const currentWeekInfo = cw
    ? { start: cw.start, end: cw.end, week: currentWeekIndex + 1 }
    : { start: '', end: '', week: 1 };

  return (
    <div className="max-w-md mx-auto w-full flex flex-col h-full bg-background border-r border-l border-border/50 shadow-2xl shadow-primary/20">
      <header className="px-5 py-4 flex items-center justify-between z-10 sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            GrowSync
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={goToPrevMonth}
              className="text-xs text-muted-foreground hover:text-foreground w-7 h-7 flex items-center justify-center rounded-md active:bg-muted/50 transition-colors focus:outline-none"
              aria-label="上个月"
            >
              ‹
            </button>
            <Badge
              variant="outline"
              className="font-normal text-[10px] text-muted-foreground px-1.5 py-0 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={goToCurrentMonth}
            >
              {monthStr}
            </Badge>
            <button
              onClick={goToNextMonth}
              className="text-xs text-muted-foreground hover:text-foreground w-7 h-7 flex items-center justify-center rounded-md active:bg-muted/50 transition-colors focus:outline-none"
              aria-label="下个月"
            >
              ›
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AuthLock isParent={isParent} />
          <Link href="/rules" className="text-muted-foreground hover:text-primary transition-colors" aria-label="游戏规则">
            <HelpCircle className="size-[18px]" />
          </Link>
          <Link href="/records" className="text-muted-foreground hover:text-primary transition-colors" aria-label="学业档案">
            <BookOpen className="size-[18px]" />
          </Link>
          <p className="text-xs text-muted-foreground">
            {playerData.name}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full p-4 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full mb-6 h-10 p-1 bg-muted/50 rounded-md ${isParent ? "grid-cols-3" : "grid-cols-2"}`}>
            <TabsTrigger value="dashboard" className="text-xs font-medium rounded-sm">总览</TabsTrigger>
            <TabsTrigger value="quests" className="text-xs font-medium rounded-sm">打卡</TabsTrigger>
            {isParent && (
              <TabsTrigger value="admin" className="text-xs font-medium rounded-sm">管理</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab playerData={playerData} />
          </TabsContent>

          <TabsContent value="quests">
            <QuestsTab weeklyQuests={playerData.weeklyQuests} currentWeekIndex={currentWeekIndex} monthId={monthId} habitProofs={habitProofs} />
          </TabsContent>

          {isParent && (
            <TabsContent value="admin">
              <AdminTab pendingProofs={pendingProofs} playerData={playerData} currentWeekNum={currentWeekInfo.week} academicRecords={academicRecords} habitLogs={habitLogs} habitProofs={habitProofs} monthId={monthId} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
