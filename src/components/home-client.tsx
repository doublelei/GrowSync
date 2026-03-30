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
      <div className="max-w-md mx-auto w-full h-[100dvh] bg-background flex flex-col items-center justify-center border-r border-l border-border/30 hud-loading">
        <div className="relative">
          <div className="size-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-2 rounded-full bg-primary animate-glow-pulse" />
          </div>
        </div>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-primary/50 animate-pulse">
          Syncing
        </p>
      </div>
    );
  }

  const { playerData, pendingProofs, academicRecords, habitLogs, habitProofs, monthlyPoints } = data;

  const cw = weeks[currentWeekIndex];
  const currentWeekInfo = cw
    ? { start: cw.start, end: cw.end, week: currentWeekIndex + 1 }
    : { start: '', end: '', week: 1 };

  return (
    <div className="max-w-md mx-auto w-full flex flex-col h-full bg-background border-r border-l border-border/30 relative noise scanlines">
      {/* Top gradient accent */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <header className="px-5 py-4 flex items-center justify-between z-10 sticky top-0 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="text-primary text-glow">G</span>
            <span className="text-foreground/90">rowSync</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={goToPrevMonth}
              className="text-xs text-muted-foreground hover:text-primary w-7 h-7 flex items-center justify-center rounded-md active:bg-muted/50 transition-all hover:bg-primary/5 focus:outline-none"
              aria-label="上个月"
            >
              ‹
            </button>
            <Badge
              variant="outline"
              className="font-mono text-[10px] text-primary/70 px-2 py-0 bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-all"
              onClick={goToCurrentMonth}
            >
              {monthStr}
            </Badge>
            <button
              onClick={goToNextMonth}
              className="text-xs text-muted-foreground hover:text-primary w-7 h-7 flex items-center justify-center rounded-md active:bg-muted/50 transition-all hover:bg-primary/5 focus:outline-none"
              aria-label="下个月"
            >
              ›
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AuthLock isParent={isParent} />
          <Link href="/rules" className="text-muted-foreground hover:text-primary transition-all hover:drop-shadow-[0_0_6px_oklch(0.82_0.22_155/0.4)]" aria-label="游戏规则">
            <HelpCircle className="size-[18px]" />
          </Link>
          <Link href="/records" className="text-muted-foreground hover:text-primary transition-all hover:drop-shadow-[0_0_6px_oklch(0.82_0.22_155/0.4)]" aria-label="学业档案">
            <BookOpen className="size-[18px]" />
          </Link>
          <p className="text-[10px] text-muted-foreground font-mono tracking-wide">
            {playerData.name}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full p-4 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full mb-6 h-10 p-1 bg-muted/30 rounded-lg border border-border/30 ${isParent ? "grid-cols-3" : "grid-cols-2"}`}>
            <TabsTrigger value="dashboard" className="text-xs font-semibold rounded-md data-active:bg-primary/10 data-active:text-primary data-active:shadow-none transition-all">
              总览
            </TabsTrigger>
            <TabsTrigger value="quests" className="text-xs font-semibold rounded-md data-active:bg-primary/10 data-active:text-primary data-active:shadow-none transition-all">
              打卡
            </TabsTrigger>
            {isParent && (
              <TabsTrigger value="admin" className="text-xs font-semibold rounded-md data-active:bg-primary/10 data-active:text-primary data-active:shadow-none transition-all">
                管理
              </TabsTrigger>
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
