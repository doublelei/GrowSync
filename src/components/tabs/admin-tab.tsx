"use client";

import { useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { SUBJECTS, HABIT_TYPES, todayBeijing, currentMonthBeijing, RATING_REASON_PRESETS } from "@/lib/constants";
import {
  useInsertMicroTest,
  useInsertMajorExam,
  useUpdateMajorExamRating,
  useUpsertMonthlyPoints,
  useUpsertHabit,
  useDeleteRecord,
  useApproveHabitProof,
  useRejectHabitProof,
  checkDuplicateAcademic,
} from "@/hooks/useMutations";
import { suggestRating } from "@/lib/calculations";
import type { PlayerData, PendingProofDisplay, AcademicRecord, HabitLog, HabitProof, MajorExamRating } from "@/lib/types";

const inputClass = "w-full bg-background/50 border border-border/30 rounded-lg px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-all";
const selectClass = "w-full bg-background/50 border border-border/30 rounded-lg px-2 py-2 text-xs text-foreground focus:outline-none focus:border-primary/30 transition-all";

function Section({ id, title, description, activeSection, onToggle, children }: {
  id: string;
  title: string;
  description?: string;
  activeSection: string | null;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  const isOpen = activeSection === id;
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="w-full p-4 flex items-center justify-between text-left transition-colors hover:bg-primary/3"
      >
        <div>
          <div className="text-sm font-semibold text-foreground">{title}</div>
          {description && <div className="text-[10px] text-muted-foreground/50 mt-0.5">{description}</div>}
        </div>
        <ChevronDown className={`size-4 text-muted-foreground/50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="p-4 pt-0 border-t border-border/20">{children}</div>}
    </div>
  );
}

export function AdminTab({ pendingProofs, playerData, currentWeekNum, academicRecords = [], habitLogs = [], habitProofs = [], monthId }: {
  pendingProofs: PendingProofDisplay[];
  playerData: PlayerData;
  currentWeekNum: number;
  academicRecords?: AcademicRecord[];
  habitLogs?: HabitLog[];
  habitProofs?: HabitProof[];
  monthId: string;
}) {
  const microTestForm = useRef<HTMLFormElement>(null);
  const majorExamForm = useRef<HTMLFormElement>(null);
  const monthlyPointForm = useRef<HTMLFormElement>(null);
  const habitForm = useRef<HTMLFormElement>(null);

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [ratingRecordId, setRatingRecordId] = useState<number | null>(null);

  const toggleSection = useCallback((id: string) => {
    setActiveSection(prev => prev === id ? null : id);
  }, []);

  const insertMicroTest = useInsertMicroTest(monthId);
  const insertMajorExam = useInsertMajorExam(monthId);
  const upsertMonthlyPoints = useUpsertMonthlyPoints(monthId);
  const upsertHabit = useUpsertHabit(monthId);
  const deleteRecord = useDeleteRecord(monthId);
  const approveHabitProof = useApproveHabitProof(monthId);
  const rejectHabitProof = useRejectHabitProof(monthId);
  const updateRating = useUpdateMajorExamRating(monthId);

  const handleMicroTestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (insertMicroTest.isPending) return;
    const fd = new FormData(e.currentTarget);
    const date = fd.get('date') as string;
    const subject = fd.get('subject') as string;
    const score = fd.get('score') as string;
    const max_score = fd.get('max_score') as string;
    const is_retest = fd.get('is_retest') === 'on';

    if (!date || !subject || !score || !max_score) { toast.error("必填项为空"); return; }

    const isDuplicate = await checkDuplicateAcademic({ date, subject, score: Number(score) });
    if (isDuplicate) {
      if (!window.confirm(`已存在 ${date} ${subject} ${score} 分的记录，确认重复录入？`)) return;
    }

    insertMicroTest.mutate(
      { date, subject, score: Number(score), max_score: Number(max_score), is_retest },
      {
        onSuccess: () => {
          microTestForm.current?.reset();
          toast.success(`${subject} ${score} 分已录入`);
        },
        onError: (err) => toast.error("录入失败: " + err.message),
      },
    );
  };

  const handleMajorExamSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (insertMajorExam.isPending) return;
    const fd = new FormData(e.currentTarget);
    const date = fd.get('date') as string;
    const subject = fd.get('subject') as string;
    const exam_name = fd.get('exam_name') as string;
    const score = fd.get('score') as string;
    const max_score = fd.get('max_score') as string;
    const class_avg = fd.get('class_avg') as string;
    const highest_score = fd.get('highest_score') as string;
    const class_rank = fd.get('class_rank') as string;

    if (!date || !subject || !exam_name || !score || !max_score) { toast.error("必填项为空"); return; }

    const isDuplicate = await checkDuplicateAcademic({ date, subject, exam_name });
    if (isDuplicate) {
      if (!window.confirm(`已存在 ${date} ${subject} "${exam_name}" 的记录，确认重复录入？`)) return;
    }

    const input: {
      date: string; subject: string; exam_name: string;
      score: number; max_score: number;
      class_avg?: number; highest_score?: number; class_rank?: number;
    } = {
      date, subject, exam_name,
      score: Number(score), max_score: Number(max_score),
    };
    if (class_avg) input.class_avg = Number(class_avg);
    if (highest_score) input.highest_score = Number(highest_score);
    if (class_rank) input.class_rank = Number(class_rank);

    insertMajorExam.mutate(input, {
      onSuccess: () => {
        majorExamForm.current?.reset();
        toast.success(`${subject}「${exam_name}」${score} 分已录入`);
      },
      onError: (err) => toast.error("录入失败: " + err.message),
    });
  };

  const handleMonthlyPointSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (upsertMonthlyPoints.isPending) return;
    const fd = new FormData(e.currentTarget);
    const month = fd.get('month') as string;
    const points = fd.get('points') as string;
    const rank = fd.get('rank') as string;
    const notes = fd.get('notes') as string;

    if (!month || !points) { toast.error("必填项为空"); return; }

    upsertMonthlyPoints.mutate(
      { month_id: month, total_score: Number(points), rank: rank ? Number(rank) : null, notes },
      {
        onSuccess: () => {
          monthlyPointForm.current?.reset();
          toast.success(`${month} 月度排名已录入`);
        },
        onError: (err) => toast.error("录入失败: " + err.message),
      },
    );
  };

  const handleHabitSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (upsertHabit.isPending) return;
    const fd = new FormData(e.currentTarget);
    const date = fd.get('date') as string;
    const type = fd.get('type') as string;

    if (!date || !type) { toast.error("必填项为空"); return; }

    upsertHabit.mutate(
      { date, type },
      {
        onSuccess: () => {
          habitForm.current?.reset();
          toast.success(`${date} ${type} 打卡已补录`);
        },
        onError: (err) => toast.error("录入失败: " + err.message),
      },
    );
  };

  const pendingHabitProofs = habitProofs.filter(p => p.status === 'pending');

  const unratedMajorExams = academicRecords.filter(
    r => r.event_type === 'major_exam' && r.major_exam_rating == null,
  );

  const handleDeleteRecord = (table: string, id: number) => {
    const key = `${table}-${id}`;
    if (confirmingDelete !== key) {
      setConfirmingDelete(key);
      setTimeout(() => setConfirmingDelete(prev => prev === key ? null : prev), 3000);
      return;
    }
    setConfirmingDelete(null);
    deleteRecord.mutate(
      { table, id },
      {
        onSuccess: () => toast.success("记录已删除"),
        onError: (err) => toast.error("删除失败: " + err.message),
      },
    );
  };

  return (
    <div className="space-y-4 stagger-children">

      {/* 1. Micro test — always visible */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border/20">
          <div className="text-sm font-semibold text-foreground">录入小测</div>
          <div className="text-[10px] text-muted-foreground/50 mt-0.5">记录日常小测成绩</div>
        </div>
        <div className="p-4">
          <form ref={microTestForm} onSubmit={handleMicroTestSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input name="date" type="date" className={inputClass} required defaultValue={todayBeijing()} />
              <select name="subject" className={selectClass}>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input name="score" type="number" step="0.5" placeholder="得分" className={`flex-1 ${inputClass}`} required />
              <span className="text-muted-foreground text-xs">/</span>
              <input name="max_score" type="number" defaultValue={100} className={`flex-1 ${inputClass}`} required />
            </div>
            <div className="flex items-center gap-1.5">
              <input type="checkbox" name="is_retest" id="is_retest" className="w-3.5 h-3.5 accent-primary" />
              <label htmlFor="is_retest" className="text-xs text-muted-foreground cursor-pointer">重考成绩</label>
            </div>
            <Button type="submit" className="w-full" disabled={insertMicroTest.isPending}>
              {insertMicroTest.isPending ? '提交中...' : '录入'}
            </Button>
          </form>
        </div>
      </div>

      {/* 2. Major exam — collapsible */}
      <Section id="major" title="录入大考" description="记录大考及排名数据" activeSection={activeSection} onToggle={toggleSection}>
        <form ref={majorExamForm} onSubmit={handleMajorExamSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="date" type="date" className={inputClass} required defaultValue={todayBeijing()} />
            <select name="subject" className={selectClass}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <input name="exam_name" type="text" placeholder="考试名称 (例: U9单元测/期中评估)" className={inputClass} required />
          <div className="flex items-center gap-2">
            <input name="score" type="number" step="0.5" placeholder="得 分" className={`w-1/2 ${inputClass}`} required />
            <input name="max_score" type="number" step="0.5" placeholder="满分(缺省100)" defaultValue={100} className={`w-1/2 ${inputClass}`} required />
          </div>
          <div className="flex gap-2">
            <input name="class_avg" type="number" step="0.1" placeholder="班级均分(选填)" className={`w-1/3 ${inputClass}`} />
            <input name="highest_score" type="number" step="0.5" placeholder="最高分(选填)" className={`w-1/3 ${inputClass}`} />
            <input name="class_rank" type="number" placeholder="排名(选填)" className={`w-1/3 ${inputClass}`} />
          </div>
          <Button type="submit" className="w-full" disabled={insertMajorExam.isPending}>
            {insertMajorExam.isPending ? '提交中...' : '录入'}
          </Button>
        </form>
      </Section>

      {/* 2b. Unrated major exams — rating confirmation */}
      {unratedMajorExams.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden border-primary/20 glow-primary">
          <div className="p-4 border-b border-primary/15">
            <div className="text-sm font-semibold text-primary">待评级大考</div>
            <div className="text-[10px] text-muted-foreground/50 mt-0.5">{unratedMajorExams.length} 条大考成绩等待评级</div>
          </div>
          <div className="p-4 space-y-3">
            {unratedMajorExams.map(record => (
              <ExamRatingCard
                key={record.id}
                record={record}
                isPending={updateRating.isPending && ratingRecordId === record.id}
                onConfirm={(rating, reason) => {
                  setRatingRecordId(record.id);
                  updateRating.mutate(
                    { recordId: record.id, rating, reason },
                    {
                      onSuccess: () => { setRatingRecordId(null); toast.success(`${record.subject}「${record.exam_name}」评级已确认`); },
                      onError: (err) => { setRatingRecordId(null); toast.error("评级失败: " + err.message); },
                    },
                  );
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. Monthly points + Habit backfill — collapsible, side by side */}
      <Section id="extra" title="月度排名 + 补录打卡" description="月度积分排名与手动补录打卡" activeSection={activeSection} onToggle={toggleSection}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">月度排名</div>
            <form ref={monthlyPointForm} onSubmit={handleMonthlyPointSubmit} className="space-y-2">
              <input name="month" type="month" className={inputClass} required defaultValue={currentMonthBeijing()} />
              <div className="flex gap-2">
                <input name="points" type="number" placeholder="总分" className={inputClass} required />
                <input name="rank" type="number" placeholder="班排名" className={inputClass} />
              </div>
              <input name="notes" type="text" placeholder="评语(选填)" className={inputClass} />
              <Button variant="outline" type="submit" className="w-full" size="sm" disabled={upsertMonthlyPoints.isPending}>
                {upsertMonthlyPoints.isPending ? '提交中...' : '提交'}
              </Button>
            </form>
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">补录打卡</div>
            <form ref={habitForm} onSubmit={handleHabitSubmit} className="space-y-2">
              <input name="date" type="date" className={inputClass} required defaultValue={todayBeijing()} />
              <select name="type" className={selectClass} required>
                {HABIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <Button variant="outline" type="submit" className="w-full" size="sm" disabled={upsertHabit.isPending}>
                {upsertHabit.isPending ? '提交中...' : '补录'}
              </Button>
            </form>
          </div>
        </div>
      </Section>

      {/* 4. Record management — collapsible */}
      <Section id="records" title="本月成绩 + 本月打卡" description="点击删除按钮移除错误记录" activeSection={activeSection} onToggle={toggleSection}>
        <div className="space-y-4">
          {/* Academic records */}
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">本月成绩</div>
            <div className="divide-y divide-border/50 max-h-64 overflow-y-auto border border-border/50 rounded-md">
              {[...academicRecords].sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()).map((r) => (
                <div key={r.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-muted-foreground">{r.event_date}</span>
                      <span className="font-medium">{r.subject}</span>
                      {r.is_retest && <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">重测</Badge>}
                      {r.event_type === 'major_exam' && r.major_exam_rating === 'bonus' && (
                        <Badge className="text-[9px] px-1 py-0 h-3.5 bg-emerald-500/20 text-emerald-600 border-emerald-500/30">加分</Badge>
                      )}
                      {r.event_type === 'major_exam' && r.major_exam_rating === 'penalty' && (
                        <Badge className="text-[9px] px-1 py-0 h-3.5 bg-destructive/20 text-destructive border-destructive/30">扣分</Badge>
                      )}
                      {r.event_type === 'major_exam' && r.major_exam_rating === 'neutral' && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">不变</Badge>
                      )}
                      {r.event_type === 'major_exam' && r.major_exam_rating == null && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-orange-400/50 text-orange-500">待评级</Badge>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {r.exam_name || (r.event_type === 'micro_test' ? '小测' : r.event_type === 'major_exam' ? '大考' : r.event_type)} · {r.score}/{r.max_score}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRecord('academic_records', r.id)}
                    disabled={deleteRecord.isPending}
                    className={`ml-2 text-[10px] px-1.5 py-1 rounded transition-colors disabled:opacity-50 ${
                      confirmingDelete === `academic_records-${r.id}`
                        ? 'text-destructive font-semibold'
                        : 'text-destructive/60 hover:text-destructive'
                    }`}
                  >
                    {confirmingDelete === `academic_records-${r.id}` ? '确认?' : '删除'}
                  </button>
                </div>
              ))}
              {academicRecords.length === 0 && (
                <div className="p-4 text-center text-xs text-muted-foreground">暂无成绩记录</div>
              )}
            </div>
          </div>

          {/* Habit logs */}
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">本月打卡</div>
            <div className="divide-y divide-border/50 max-h-48 overflow-y-auto border border-border/50 rounded-md">
              {habitLogs.map((h) => (
                <div key={h.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-muted-foreground">{h.log_date}</span>
                    <Badge variant="outline" className="text-[10px] py-0 h-4 font-normal">{h.habit_type}</Badge>
                  </div>
                  <button
                    onClick={() => handleDeleteRecord('habit_logs', h.id)}
                    disabled={deleteRecord.isPending}
                    className={`text-[10px] px-1.5 py-1 rounded transition-colors disabled:opacity-50 ${
                      confirmingDelete === `habit_logs-${h.id}`
                        ? 'text-destructive font-semibold'
                        : 'text-destructive/60 hover:text-destructive'
                    }`}
                  >
                    {confirmingDelete === `habit_logs-${h.id}` ? '确认?' : '删除'}
                  </button>
                </div>
              ))}
              {habitLogs.length === 0 && (
                <div className="p-4 text-center text-xs text-muted-foreground">暂无打卡记录</div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* 5. Pending habit proofs — collapsible */}
      <Section id="proofs" title="待审打卡凭证" description="审核运动照片和阅读归纳" activeSection={activeSection} onToggle={toggleSection}>
        <div className="divide-y divide-border/20 -mx-4 -mb-4 mt-4">
          {pendingHabitProofs.map((proof) => (
            <HabitProofReviewItem
              key={proof.id}
              proof={proof}
              onApprove={() => approveHabitProof.mutate(
                { id: proof.id, habitType: proof.habit_type, logDate: proof.log_date },
                { onError: (err) => toast.error("审批失败: " + err.message) },
              )}
              onReject={() => rejectHabitProof.mutate(proof.id, {
                onError: (err) => toast.error("操作失败: " + err.message),
              })}
              approving={approveHabitProof.isPending}
              rejecting={rejectHabitProof.isPending}
            />
          ))}
          {pendingHabitProofs.length === 0 && (
            <div className="p-6 text-center text-xs text-muted-foreground">暂无待审内容</div>
          )}
        </div>
      </Section>
    </div>
  );
}

function HabitProofReviewItem({ proof, onApprove, onReject, approving, rejecting }: {
  proof: HabitProof;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const [showFull, setShowFull] = useState(false);

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] py-0 h-4 font-normal">{proof.habit_type}</Badge>
            <span className="text-xs text-muted-foreground">{proof.log_date}</span>
          </div>
        </div>
      </div>

      {proof.proof_type === 'image' && proof.proof_url && (
        <a href={proof.proof_url} target="_blank" rel="noopener noreferrer">
          <img
            src={proof.proof_url}
            alt="运动凭证"
            className="w-full max-h-48 object-cover rounded-md border border-border/50 cursor-pointer hover:opacity-90 transition-opacity"
          />
        </a>
      )}

      {proof.proof_type === 'text' && proof.proof_text && (
        <div className="bg-muted/10 border border-border/50 rounded-md p-3">
          <p className="text-xs text-foreground/80 leading-relaxed">
            {showFull ? proof.proof_text : proof.proof_text.slice(0, 60) + (proof.proof_text.length > 60 ? '...' : '')}
          </p>
          {proof.proof_text.length > 60 && (
            <button
              onClick={() => setShowFull(!showFull)}
              className="text-[10px] text-primary mt-1 hover:underline"
            >
              {showFull ? '收起' : '查看全文'}
            </button>
          )}
          <div className="text-[10px] text-muted-foreground mt-1">{proof.proof_text.length} 字</div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onApprove}
          disabled={approving}
          className="flex-1 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-semibold hover:bg-primary/15 hover:shadow-[0_0_10px_oklch(0.82_0.22_155/0.15)] transition-all focus:outline-none disabled:opacity-50"
        >
          {approving ? '处理中...' : '通过'}
        </button>
        <button
          onClick={onReject}
          disabled={rejecting}
          className="flex-1 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-semibold hover:bg-destructive/15 transition-all focus:outline-none disabled:opacity-50"
        >
          {rejecting ? '处理中...' : '驳回'}
        </button>
      </div>
    </div>
  );
}

function ExamRatingCard({ record, onConfirm, isPending }: {
  record: AcademicRecord;
  onConfirm: (rating: MajorExamRating, reason?: string) => void;
  isPending: boolean;
}) {
  const [selectedRating, setSelectedRating] = useState<MajorExamRating | null>(null);
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);

  const suggested = suggestRating(record);
  const scoreRate = record.max_score > 0 ? record.score / record.max_score : 0;

  const conditions: string[] = [];
  if (suggested === 'bonus') {
    if (scoreRate >= 0.9) conditions.push(`得分率 ${(scoreRate * 100).toFixed(0)}% ≥ 90%`);
    if (record.highest_score != null && record.score >= record.highest_score) conditions.push('最高分');
    if (record.class_rank != null && record.class_rank <= 3) conditions.push(`排名第 ${record.class_rank}`);
  } else if (suggested === 'penalty') {
    if (scoreRate < 0.75) conditions.push(`得分率 ${(scoreRate * 100).toFixed(0)}% < 75%`);
    if (record.class_rank != null && record.class_rank >= 9) conditions.push(`排名第 ${record.class_rank}`);
  }

  const current = selectedRating ?? suggested;
  const isOverride = selectedRating != null && selectedRating !== suggested;

  const ratingConfig = {
    bonus: { label: '加分 +¥25', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
    neutral: { label: '不变 ¥0', className: 'bg-muted/20 text-foreground border-border/50' },
    penalty: { label: '扣分 -¥25', className: 'bg-destructive/10 text-destructive border-destructive/30' },
  } as const;

  return (
    <div className="p-3 border border-border/50 rounded-md space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono text-muted-foreground">{record.event_date}</span>
            <span className="font-medium">{record.subject}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {record.exam_name} · {record.score}/{record.max_score}
            {record.class_rank != null && ` · 排名第${record.class_rank}`}
            {record.highest_score != null && ` · 最高${record.highest_score}`}
          </div>
        </div>
        <div className={`text-[10px] px-1.5 py-0.5 rounded border ${ratingConfig[suggested].className}`}>
          建议: {ratingConfig[suggested].label}
        </div>
      </div>

      {conditions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {conditions.map((c, i) => (
            <span key={i} className="text-[9px] bg-muted/30 text-muted-foreground px-1.5 py-0.5 rounded">{c}</span>
          ))}
        </div>
      )}

      <div className="flex gap-1.5">
        {(['bonus', 'neutral', 'penalty'] as const).map(r => (
          <button
            key={r}
            onClick={() => {
              setSelectedRating(r);
              setShowReason(r !== suggested);
            }}
            className={`flex-1 text-[10px] py-1.5 rounded border transition-all ${
              current === r
                ? ratingConfig[r].className + ' font-semibold ring-1 ring-offset-1 ring-primary/30'
                : 'bg-muted/10 text-muted-foreground border-border/30 hover:border-border'
            }`}
          >
            {ratingConfig[r].label}
          </button>
        ))}
      </div>

      {showReason && isOverride && (
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1">
            {RATING_REASON_PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => setReason(preset)}
                className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                  reason === preset
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-muted/10 text-muted-foreground border-border/30 hover:border-border'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="自定义原因(选填)"
            className="w-full bg-muted/20 border border-border/50 rounded-md px-2 py-1 text-[10px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      )}

      <Button
        size="sm"
        className="w-full"
        disabled={isPending}
        onClick={() => onConfirm(current, isOverride ? reason || undefined : undefined)}
      >
        {isPending ? '提交中...' : '确认评级'}
      </Button>
    </div>
  );
}
