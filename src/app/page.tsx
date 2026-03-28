"use client";

import { useGrowSyncData } from "@/hooks/useGrowSyncData";
import { getCurrentMonthInfo, getCurrentWeekIndex } from "@/lib/date-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { DashboardTab } from "@/components/tabs/dashboard-tab";
import { QuestsTab } from "@/components/tabs/quests-tab";
import { AcademicTab } from "@/components/tabs/academic-tab";
import { AdminTab } from "@/components/tabs/admin-tab";

export default function Home() {
  const { data, loading } = useGrowSyncData();
  const { monthStr, weeks } = getCurrentMonthInfo();
  
  const currentWeekIdx = getCurrentWeekIndex(weeks, new Date());
  const cw = weeks[currentWeekIdx];
  const currentWeekInfo = cw
    ? { start: cw.start, end: cw.end, week: currentWeekIdx + 1 }
    : { start: '', end: '', week: 1 };

  if (loading || !data) {
    return <div className="h-[100dvh] bg-background flex flex-col items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Initializing Terminal...</div>;
  }

  const { playerData, quests, pendingProofs, academicRecords, habitLogs, monthlyPoints } = data;

  return (
    <div className="flex flex-col h-full bg-background border-r border-l border-border/50">
      <header className="px-5 py-4 flex items-center justify-between z-10 sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            GrowSync
            <Badge variant="outline" className="font-normal text-[10px] text-muted-foreground px-1.5 py-0 bg-muted/20">
              {monthStr}
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            当前玩家: {playerData.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[10px] text-muted-foreground border border-border/50 bg-muted/10 px-2 py-1 flex items-center gap-1 rounded hover:bg-muted/30 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50">
            <span>战利记录</span>
            <span className="text-[8px] opacity-60">▼</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full p-4 pb-20">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 h-10 p-1 bg-muted/50 rounded-md">
            <TabsTrigger value="dashboard" className="text-xs font-medium rounded-sm">数据大屏</TabsTrigger>
            <TabsTrigger value="quests" className="text-xs font-medium rounded-sm">任务大厅</TabsTrigger>
            <TabsTrigger value="academic" className="text-xs font-medium rounded-sm">学业档案</TabsTrigger>
            <TabsTrigger value="admin" className="text-xs font-medium rounded-sm">管理工具</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab playerData={playerData} />
          </TabsContent>

          <TabsContent value="quests">
            <QuestsTab quests={quests} currentWeek={currentWeekInfo} />
          </TabsContent>

          <TabsContent value="academic">
            <AcademicTab records={academicRecords} habitLogs={habitLogs} monthlyPoints={monthlyPoints} weeklyQuests={playerData.weeklyQuests} currentWeekIndex={currentWeekIdx} weeks={weeks} />
          </TabsContent>

          <TabsContent value="admin">
            <AdminTab pendingProofs={pendingProofs} playerData={playerData} currentWeekNum={currentWeekInfo.week} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

