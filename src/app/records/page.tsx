"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
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

// ── Subject color mapping (shared between chart and badges) ──
const SUBJECT_COLORS: Record<string, { chart: string; bg: string; text: string }> = {
  "英语": { chart: "var(--chart-1)", bg: "bg-[oklch(0.85_0.25_145/0.15)]", text: "text-[oklch(0.85_0.25_145)]" },
  "数学": { chart: "var(--chart-2)", bg: "bg-[oklch(0.6_0.28_290/0.15)]", text: "text-[oklch(0.75_0.2_290)]" },
  "语文": { chart: "var(--chart-3)", bg: "bg-[oklch(0.65_0.25_25/0.15)]", text: "text-[oklch(0.75_0.2_25)]" },
  "理综": { chart: "var(--chart-4)", bg: "bg-[oklch(0.8_0.2_190/0.15)]", text: "text-[oklch(0.8_0.2_190)]" },
};
const CHART_COLORS = Object.fromEntries(
  Object.entries(SUBJECT_COLORS).map(([k, v]) => [k, v.chart]),
);

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

// ── Semester utilities ──
// 上学期: Sep 1 ~ Jan 31 (next year)
// 下学期: Feb 1 ~ Jun 30
interface Semester {
  id: string;       // e.g. "2025-2026-1" or "2025-2026-2"
  label: string;    // e.g. "2025-2026 上学期"
  start: string;    // "YYYY-MM-DD"
  end: string;      // "YYYY-MM-DD"
}

function getSemesterForDate(dateStr: string): Semester {
  const [y, m] = dateStr.split("-").map(Number);
  if (m >= 9) {
    // Fall semester: this year Sep ~ next year Jan
    return {
      id: `${y}-${y + 1}-1`,
      label: `${y}-${y + 1} 上学期`,
      start: `${y}-09-01`,
      end: `${y + 1}-01-31`,
    };
  } else if (m <= 1) {
    // Still fall semester of previous year
    return {
      id: `${y - 1}-${y}-1`,
      label: `${y - 1}-${y} 上学期`,
      start: `${y - 1}-09-01`,
      end: `${y}-01-31`,
    };
  } else {
    // Spring semester: Feb ~ Jun
    return {
      id: `${y - 1}-${y}-2`,
      label: `${y - 1}-${y} 下学期`,
      start: `${y}-02-01`,
      end: `${y}-06-30`,
    };
  }
}

function getAvailableSemesters(records: AcademicRecord[]): Semester[] {
  const seen = new Map<string, Semester>();
  for (const r of records) {
    const sem = getSemesterForDate(r.event_date);
    if (!seen.has(sem.id)) seen.set(sem.id, sem);
  }
  // Sort newest first
  return Array.from(seen.values()).sort((a, b) => b.id.localeCompare(a.id));
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
  const [selectedSemester, setSelectedSemester] = useState<string>("current");
  const [examType, setExamType] = useState<ExamTypeFilter>("all");

  // ── Available semesters from data ──
  const semesters = useMemo(
    () => getAvailableSemesters(academicRecords),
    [academicRecords],
  );

  // Default "current" resolves to the newest semester (or today's)
  const currentSemester = useMemo(() => {
    if (semesters.length > 0) return semesters[0];
    const today = new Date().toISOString().slice(0, 10);
    return getSemesterForDate(today);
  }, [semesters]);

  const activeSemester =
    selectedSemester === "all"
      ? null
      : selectedSemester === "current"
        ? currentSemester
        : semesters.find((s) => s.id === selectedSemester) ?? currentSemester;

  // ── Filtered academic records ──
  const filteredRecords = useMemo(() => {
    let records = [...academicRecords];

    // Subject filter
    if (selectedSubject !== "全部") {
      records = records.filter((r) => r.subject === selectedSubject);
    }

    // Semester filter
    if (activeSemester) {
      records = records.filter(
        (r) => r.event_date >= activeSemester.start && r.event_date <= activeSemester.end,
      );
    }

    // Exam type filter
    if (examType === "micro_test") {
      records = records.filter((r) => r.event_type === "micro_test");
    } else if (examType === "major_exam") {
      records = records.filter(
        (r) => r.event_type === "major_exam" || r.event_type === "unit_exam",
      );
    }

    // Sort descending by date for the list
    records.sort(
      (a, b) =>
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
    );

    return records;
  }, [academicRecords, selectedSubject, activeSemester, examType]);

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

  // ── Records grouped by month (for collapsible view) ──
  const recordsByMonth = useMemo(() => {
    const groups: { month: string; records: AcademicRecord[] }[] = [];
    const map = new Map<string, AcademicRecord[]>();
    for (const r of filteredRecords) {
      const m = r.event_date.slice(0, 7);
      if (!map.has(m)) map.set(m, []);
      map.get(m)!.push(r);
    }
    for (const [month, records] of map) {
      groups.push({ month, records });
    }
    return groups;
  }, [filteredRecords]);

  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => new Set());
  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

  // Auto-expand the first (newest) month
  const firstMonth = recordsByMonth[0]?.month;

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
        <div className="flex items-center gap-2">
          {activeSemester && (
            <span className="text-[10px] text-muted-foreground">{activeSemester.label}</span>
          )}
          <Badge variant="secondary" className="font-mono text-[10px]">
            {filteredRecords.length} 条
          </Badge>
        </div>
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

          {/* Semester selector */}
          <div className="flex items-center gap-1 flex-wrap">
            <Pill
              label="全部学期"
              active={selectedSemester === "all"}
              onClick={() => setSelectedSemester("all")}
            />
            {semesters.map((sem) => (
              <Pill
                key={sem.id}
                label={sem.label}
                active={
                  selectedSemester === sem.id ||
                  (selectedSemester === "current" && sem.id === currentSemester.id)
                }
                onClick={() => setSelectedSemester(sem.id)}
              />
            ))}
            {semesters.length === 0 && (
              <Pill
                label={currentSemester.label}
                active={true}
                onClick={() => {}}
              />
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

        {/* ── Records List (grouped by month, collapsible) ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">考试记录</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recordsByMonth.length === 0 ? (
              <div className="px-4 pb-4 text-center text-muted-foreground text-xs py-8">
                暂无匹配记录
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recordsByMonth.map(({ month, records: monthRecords }) => {
                  const isExpanded = expandedMonths.has(month) || month === firstMonth;
                  const avgScore = Math.round(
                    monthRecords.reduce((s, r) => s + (r.score / r.max_score) * 100, 0) / monthRecords.length,
                  );
                  const strikes = monthRecords.filter(isStrike).length;

                  return (
                    <div key={month}>
                      <button
                        onClick={() => toggleMonth(month)}
                        className="w-full px-4 py-2.5 flex items-center justify-between bg-muted/5 hover:bg-muted/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold font-mono">{month}</span>
                          <span className="text-[10px] text-muted-foreground">{monthRecords.length} 条</span>
                          <span className="text-[10px] text-muted-foreground">均分 {avgScore}%</span>
                          {strikes > 0 && (
                            <span className="text-[10px] text-destructive">{strikes} strike</span>
                          )}
                        </div>
                        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                      {isExpanded && (
                        <div className="divide-y divide-border/50">
                          {monthRecords.map((r) => {
                            const colors = SUBJECT_COLORS[r.subject];
                            return (
                              <div
                                key={r.id}
                                className="px-4 py-2.5 flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${colors ? `${colors.bg} ${colors.text}` : "bg-muted text-muted-foreground"}`}>
                                    {r.subject}
                                  </span>
                                  <span className="text-xs truncate">
                                    {r.exam_name || "小测"}
                                  </span>
                                  {(r.event_type === "major_exam" || r.event_type === "unit_exam") && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">大考</Badge>
                                  )}
                                  {isStrike(r) && (
                                    <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">Strike</Badge>
                                  )}
                                  <span className="text-[10px] text-muted-foreground/60">{r.event_date.slice(5)}</span>
                                </div>
                                <div className="shrink-0 flex items-baseline gap-0.5">
                                  <span className={`font-mono text-sm font-semibold ${isStrike(r) ? "text-destructive" : "text-foreground"}`}>
                                    {r.score}
                                  </span>
                                  <span className="text-muted-foreground text-[10px]">/{r.max_score}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Habit Weekly Rings ── */}
        <HabitWeeklyRings habitLogs={habitLogs} />

        {/* ── Monthly Points ── */}
        <Card className="mb-6">
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
  );
}

// ── Weekly Habit Rings ──
// Each week = one circle. Left half = 运动, right half = 阅读.
import type { HabitLog } from "@/lib/types";

const RING_SIZE = 32;
const RING_STROKE = 4;
const EXERCISE_COLOR = "oklch(0.85 0.25 145)"; // cyber green
const READING_COLOR = "oklch(0.8 0.2 190)";    // teal
const EMPTY_COLOR = "oklch(0.25 0.05 280)";    // dark muted

function HabitRing({ exercise, reading, label, isFuture }: {
  exercise: boolean;
  reading: boolean;
  label: string;
  isFuture: boolean;
}) {
  const r = (RING_SIZE - RING_STROKE) / 2;
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;

  // Left semicircle (运动): arc from bottom to top on the left side
  // Right semicircle (阅读): arc from top to bottom on the right side
  const leftArc = `M ${cx},${cy + r} A ${r},${r} 0 0,1 ${cx},${cy - r}`;
  const rightArc = `M ${cx},${cy - r} A ${r},${r} 0 0,1 ${cx},${cy + r}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={RING_SIZE} height={RING_SIZE} className={isFuture ? "opacity-20" : ""}>
        <path
          d={leftArc}
          fill="none"
          stroke={exercise ? EXERCISE_COLOR : EMPTY_COLOR}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
        />
        <path
          d={rightArc}
          fill="none"
          stroke={reading ? READING_COLOR : EMPTY_COLOR}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[8px] text-muted-foreground/50 leading-none">{label}</span>
    </div>
  );
}

function HabitWeeklyRings({ habitLogs }: { habitLogs: HabitLog[] }) {
  // Build set of dates per habit type
  const exerciseDates = useMemo(() => {
    const s = new Set<string>();
    for (const l of habitLogs) if (l.habit_type === "运动") s.add(l.log_date);
    return s;
  }, [habitLogs]);

  const readingDates = useMemo(() => {
    const s = new Set<string>();
    for (const l of habitLogs) if (l.habit_type === "阅读") s.add(l.log_date);
    return s;
  }, [habitLogs]);

  // Generate last 16 weeks (Mon-Sun each)
  const weeks = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const totalWeeks = 16;

    // Find current week's Monday
    const dayOfWeek = today.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const thisMon = new Date(today);
    thisMon.setDate(today.getDate() + mondayOffset);

    const result: { monDate: Date; monStr: string; sunStr: string; label: string; isFuture: boolean; dates: string[] }[] = [];

    for (let w = totalWeeks - 1; w >= 0; w--) {
      const mon = new Date(thisMon);
      mon.setDate(thisMon.getDate() - w * 7);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);

      const monStr = mon.toISOString().slice(0, 10);
      const sunStr = sun.toISOString().slice(0, 10);

      // Collect all dates in this week
      const dates: string[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(mon);
        date.setDate(mon.getDate() + d);
        dates.push(date.toISOString().slice(0, 10));
      }

      const label = `${mon.getMonth() + 1}/${mon.getDate()}`;
      const isFuture = monStr > todayStr;

      result.push({ monDate: mon, monStr, sunStr, label, isFuture, dates });
    }

    return result;
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">习惯打卡</CardTitle>
            <CardDescription className="text-[10px]">近 16 周</CardDescription>
          </div>
          <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full" style={{ background: EXERCISE_COLOR }} />
              <span>运动</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full" style={{ background: READING_COLOR }} />
              <span>阅读</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-1">
          <div className="inline-flex gap-2">
            {weeks.map((week) => {
              const hasExercise = week.dates.some((d) => exerciseDates.has(d));
              const hasReading = week.dates.some((d) => readingDates.has(d));

              return (
                <HabitRing
                  key={week.monStr}
                  exercise={hasExercise}
                  reading={hasReading}
                  label={week.label}
                  isFuture={week.isFuture}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
