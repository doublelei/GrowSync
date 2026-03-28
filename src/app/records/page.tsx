"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { useRecordsData } from "@/hooks/useRecordsData";
import { useRecordsRealtimeSync } from "@/hooks/useRecordsRealtimeSync";
import {
  SUBJECTS,
  STRIKE_THRESHOLD_ENGLISH,
  STRIKE_THRESHOLD_DEFAULT,
} from "@/lib/constants";
import type {
  TimeRange,
  ExamTypeFilter,
  AcademicRecord,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

// ── Chart color mapping ──
const CHART_COLORS: Record<string, string> = {
  "英语": "var(--chart-1)",
  "数学": "var(--chart-2)",
  "语文": "var(--chart-3)",
  "理综": "var(--chart-4)",
};

// ── Helpers ──
function isStrike(r: AcademicRecord): boolean {
  if (r.event_type !== "micro_test") return false;
  if (r.is_retest) return true;
  const threshold =
    r.subject === "英语" ? STRIKE_THRESHOLD_ENGLISH : STRIKE_THRESHOLD_DEFAULT;
  return Number(r.score) < threshold;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function monthLabel(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function threeMonthsAgo(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Filter pill component ──
function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
        active
          ? "bg-background shadow-sm text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

// ── Segmented control wrapper ──
function SegmentedControl({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 bg-muted/30 rounded-md p-1">
      {children}
    </div>
  );
}

// ── Main page ──
export default function RecordsPage() {
  useRecordsRealtimeSync();
  const { academicRecords, habitLogs, monthlyPoints, isLoading } =
    useRecordsData();

  // ── Filter state ──
  const [selectedSubject, setSelectedSubject] = useState<string>("全部");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [examType, setExamType] = useState<ExamTypeFilter>("all");

  // ── Filtered academic records ──
  const filteredRecords = useMemo(() => {
    let records = [...academicRecords];

    // Subject filter
    if (selectedSubject !== "全部") {
      records = records.filter((r) => r.subject === selectedSubject);
    }

    // Time range filter
    if (timeRange === "recent3m") {
      const cutoff = threeMonthsAgo();
      records = records.filter((r) => r.event_date >= cutoff);
    } else if (timeRange === "custom" && (customStart || customEnd)) {
      if (customStart) {
        records = records.filter((r) => r.event_date >= customStart);
      }
      if (customEnd) {
        records = records.filter((r) => r.event_date <= customEnd);
      }
    }

    // Exam type filter
    if (examType === "micro_test") {
      records = records.filter((r) => r.event_type === "micro_test");
    } else if (examType === "major_exam") {
      records = records.filter(
        (r) => r.event_type === "major_exam" || r.event_type === "unit_exam"
      );
    }

    // Sort descending by date for the list
    records.sort(
      (a, b) =>
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
    );

    return records;
  }, [academicRecords, selectedSubject, timeRange, customStart, customEnd, examType]);

  // ── Chart data (sorted ascending) ──
  const chartData = useMemo(() => {
    const sorted = [...filteredRecords].sort(
      (a, b) =>
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );

    if (selectedSubject !== "全部") {
      // Single subject: simple array
      return sorted.map((r) => ({
        date: formatDate(r.event_date),
        score: Math.round((r.score / r.max_score) * 100),
      }));
    }

    // All subjects: group by date, one key per subject
    const byDate = new Map<string, Record<string, number | string>>();
    for (const r of sorted) {
      const key = r.event_date;
      if (!byDate.has(key)) {
        byDate.set(key, { date: formatDate(key) });
      }
      const entry = byDate.get(key)!;
      entry[r.subject] = Math.round((r.score / r.max_score) * 100);
    }
    return Array.from(byDate.values());
  }, [filteredRecords, selectedSubject]);

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto w-full h-[100dvh] bg-background flex flex-col items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
        Loading Records...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col min-h-[100dvh] bg-background border-r border-l border-border/50">
      {/* ── Header ── */}
      <header className="px-5 py-4 flex items-center justify-between z-10 sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            学业档案
          </h1>
        </div>
        <Badge variant="secondary" className="font-mono text-[10px]">
          {filteredRecords.length} 条记录
        </Badge>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {/* ── Filter Bar ── */}
        <div className="flex flex-col gap-3">
          {/* Subject pills */}
          <div className="flex items-center gap-1 flex-wrap">
            <Pill
              label="全部"
              active={selectedSubject === "全部"}
              onClick={() => setSelectedSubject("全部")}
            />
            {SUBJECTS.map((s) => (
              <Pill
                key={s}
                label={s}
                active={selectedSubject === s}
                onClick={() => setSelectedSubject(s)}
              />
            ))}
          </div>

          {/* Time range */}
          <div className="flex items-center gap-2 flex-wrap">
            <SegmentedControl>
              <Pill
                label="全部"
                active={timeRange === "all"}
                onClick={() => setTimeRange("all")}
              />
              <Pill
                label="近三月"
                active={timeRange === "recent3m"}
                onClick={() => setTimeRange("recent3m")}
              />
              <Pill
                label="自定义"
                active={timeRange === "custom"}
                onClick={() => setTimeRange("custom")}
              />
            </SegmentedControl>

            {timeRange === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-muted/30 border border-border rounded-md px-2 py-1 text-xs text-foreground"
                />
                <span className="text-muted-foreground text-xs">-</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-muted/30 border border-border rounded-md px-2 py-1 text-xs text-foreground"
                />
              </div>
            )}
          </div>

          {/* Exam type */}
          <SegmentedControl>
            <Pill
              label="全部"
              active={examType === "all"}
              onClick={() => setExamType("all")}
            />
            <Pill
              label="小测"
              active={examType === "micro_test"}
              onClick={() => setExamType("micro_test")}
            />
            <Pill
              label="大考"
              active={examType === "major_exam"}
              onClick={() => setExamType("major_exam")}
            />
          </SegmentedControl>
        </div>

        {/* ── Trend Chart ── */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">成绩趋势</CardTitle>
              <CardDescription className="text-[10px]">
                分数百分比 (%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    stroke="var(--border)"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    stroke="var(--border)"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "var(--muted-foreground)" }}
                  />
                  {selectedSubject !== "全部" ? (
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name={selectedSubject}
                    />
                  ) : (
                    <>
                      {SUBJECTS.map((subject, i) => (
                        <Line
                          key={subject}
                          type="monotone"
                          dataKey={subject}
                          stroke={CHART_COLORS[subject] || `var(--chart-${i + 1})`}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                          connectNulls
                          name={subject}
                        />
                      ))}
                      <Legend
                        wrapperStyle={{ fontSize: "10px" }}
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ── Records List ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">考试记录</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredRecords.length === 0 ? (
              <div className="px-4 pb-4 text-center text-muted-foreground text-xs py-8">
                暂无匹配记录
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredRecords.map((r) => (
                  <div
                    key={r.id}
                    className="px-4 py-3 flex items-start justify-between gap-2"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">
                          {r.exam_name || "日常练测小卷"}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {r.subject}
                        </Badge>
                        {(r.event_type === "major_exam" ||
                          r.event_type === "unit_exam") && (
                          <Badge variant="outline" className="text-[10px]">
                            大考
                          </Badge>
                        )}
                        {isStrike(r) && (
                          <Badge variant="destructive" className="text-[10px]">
                            Strike
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{r.event_date}</span>
                        <span className="opacity-50">|</span>
                        <span>{monthLabel(r.event_date)}</span>
                        {r.class_avg != null && (
                          <>
                            <span className="opacity-50">|</span>
                            <span>
                              班均{" "}
                              <span className="font-mono">{r.class_avg}</span>
                            </span>
                          </>
                        )}
                        {r.highest_score != null && (
                          <>
                            <span className="opacity-50">|</span>
                            <span>
                              最高{" "}
                              <span className="font-mono">
                                {r.highest_score}
                              </span>
                            </span>
                          </>
                        )}
                        {r.class_rank != null && (
                          <>
                            <span className="opacity-50">|</span>
                            <span>
                              排名{" "}
                              <span className="font-mono">{r.class_rank}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-semibold">
                        {r.score}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        /{r.max_score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Bottom Section: Habit Logs + Monthly Points ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6">
          {/* Habit Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">习惯打卡</CardTitle>
              <CardDescription className="text-[10px]">
                {habitLogs.length} 条记录
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-64 overflow-y-auto divide-y divide-border">
                {habitLogs.length === 0 ? (
                  <div className="px-4 py-6 text-center text-muted-foreground text-xs">
                    暂无记录
                  </div>
                ) : (
                  habitLogs.map((log) => (
                    <div
                      key={log.id}
                      className="px-4 py-2.5 flex items-center justify-between"
                    >
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.log_date}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {log.habit_type}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Points */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">月度积分</CardTitle>
              <CardDescription className="text-[10px]">
                {monthlyPoints.length} 个月
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-64 overflow-y-auto divide-y divide-border">
                {monthlyPoints.length === 0 ? (
                  <div className="px-4 py-6 text-center text-muted-foreground text-xs">
                    暂无记录
                  </div>
                ) : (
                  monthlyPoints.map((mp) => (
                    <div
                      key={mp.id}
                      className="px-4 py-2.5 flex items-center justify-between"
                    >
                      <span className="text-xs text-muted-foreground font-mono">
                        {mp.month_id}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">
                          {mp.total_score}
                        </span>
                        {mp.rank != null && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            #{mp.rank}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
