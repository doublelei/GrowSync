"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RulesPage() {
  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col min-h-[100dvh] bg-background border-r border-l border-border/50">
      <header className="px-5 py-4 flex items-center gap-3 z-10 sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          规则说明
        </h1>
      </header>

      <div className="flex flex-col gap-4 p-4 pb-8">

        {/* 总览 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">每月总览</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-foreground/80 leading-relaxed">
            <p>每个月的零花钱由四个部分组成：</p>
            <div className="grid grid-cols-2 gap-2">
              <Pool label="固定零花钱" amount="¥300" desc="每月固定发放" />
              <Pool label="打卡奖励" amount="¥50/周" desc="运动 ¥25 + 阅读 ¥25" />
              <Pool label="考试奖励" amount="¥100/周" desc="满分起步，扣分递减" />
              <Pool label="月度排名奖" amount="最高 ¥200" desc="依据班级排名" />
            </div>
            <p className="text-muted-foreground text-[10px]">
              假设一个月有 4 周，理论月度上限 = 300 + 4×50 + 4×100 + 200 = <span className="font-mono font-semibold text-primary">¥1100</span>
            </p>
          </CardContent>
        </Card>

        {/* 打卡规则 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">打卡奖励</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-foreground/80 leading-relaxed">
            <Rule text="每周有两项打卡：运动和阅读" />
            <Rule text="只需在周末（周六或周日）完成一次即可" />
            <Rule text="运动打卡：完成即得 ¥25" />
            <Rule text="阅读打卡：完成即得 ¥25" />
            <Rule text="每周最多 ¥50（两项都完成）" />
            <p className="text-muted-foreground text-[10px] pt-1">
              打卡需要提交凭证（运动照片 / 阅读归纳），审核通过后生效。
            </p>
          </CardContent>
        </Card>

        {/* 学习表现 — 小测 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">考试奖励 — 小测</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-foreground/80 leading-relaxed">
            <p>每周基础 <span className="font-mono font-semibold">¥100</span>，根据日常小测成绩扣分：</p>
            <div className="bg-muted/10 rounded-md p-3 space-y-1.5">
              <Rule text="英语小测低于 90 分 → 扣 ¥20" warn />
              <Rule text="其它科目小测低于 95 分 → 扣 ¥20" warn />
            </div>
            <p className="text-muted-foreground text-[10px] pt-1">
              每次扣 ¥20，扣完为止（最低 ¥0）。重考成绩不额外扣分。
            </p>
          </CardContent>
        </Card>

        {/* 学习表现 — 大考 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">考试奖励 — 大考评级</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-foreground/80 leading-relaxed">
            <p>大考成绩按三档评级，计入所在周的考试奖励：</p>
            <div className="space-y-1.5">
              <Tier rank="加分（满足任一：得分率≥90% / 最高分 / 排名前3）" reward="+¥25" highlight />
              <Tier rank="不变（默认档位）" reward="¥0" />
              <Tier rank="扣分（满足任一：得分率<75% / 排名第9名及以后）" reward="-¥25" />
            </div>
            <div className="bg-muted/10 rounded-md p-3 space-y-1.5 mt-2">
              <Rule text="系统根据成绩自动建议档位，需人工确认" />
              <Rule text="确认前大考不影响考试奖励计算" />
              <Rule text="大考加分可使当周考试奖励超过 ¥100" />
            </div>
            <p className="text-muted-foreground text-[10px] pt-1">
              期中/期末考试使用独立规则，此处暂不涉及。
            </p>
          </CardContent>
        </Card>

        {/* 月末排名 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">月度排名奖</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-foreground/80 leading-relaxed">
            <p>月底按班级排名线性计算，范围 <span className="font-mono font-semibold">-¥200 ~ +¥200</span>：</p>
            <div className="space-y-1.5">
              <Tier rank="第 1 名" reward="+¥200" highlight />
              <Tier rank="第 10 名" reward="+¥10" />
              <Tier rank="第 11 名" reward="-¥10" />
              <Tier rank="第 20 名" reward="-¥200" />
            </div>
            <p className="text-muted-foreground text-[10px] pt-1">
              排名越靠前奖励越高，中间名次接近 ¥0，靠后则扣钱。按全班 20 人线性计算，四舍五入到 ¥5。
            </p>
          </CardContent>
        </Card>

        {/* 周期说明 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">时间规则</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-foreground/80 leading-relaxed">
            <Rule text="每周从周一开始，到周日结束" />
            <Rule text="周属于哪个月，看周一在哪个月" />
            <Rule text="例：3月30日（周一）开始的一周属于三月，即使周日是4月5日" />
            <Rule text="所有时间以北京时间为准" />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function Pool({ label, amount, desc }: { label: string; amount: string; desc: string }) {
  return (
    <div className="bg-muted/10 border border-border/30 rounded-md p-2.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-mono font-semibold text-sm text-foreground mt-0.5">{amount}</div>
      <div className="text-[10px] text-muted-foreground/70 mt-0.5">{desc}</div>
    </div>
  );
}

function Rule({ text, warn }: { text: string; warn?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`mt-1 size-1.5 rounded-full shrink-0 ${warn ? "bg-destructive" : "bg-primary/60"}`} />
      <span>{text}</span>
    </div>
  );
}

function Tier({ rank, reward, highlight }: { rank: string; reward: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-2 rounded-md ${highlight ? "bg-primary/10 border border-primary/20" : "bg-muted/10 border border-border/30"}`}>
      <span className="text-xs">{rank}</span>
      <span className={`font-mono font-semibold text-sm ${highlight ? "text-primary" : "text-foreground"}`}>{reward}</span>
    </div>
  );
}
