"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUBJECTS, HABIT_TYPES, todayBeijing, currentMonthBeijing } from "@/lib/constants";
import {
  useInsertMicroTest,
  useInsertMajorExam,
  useUpsertMonthlyPoints,
  useUpsertHabit,
  useDeleteRecord,
  useApproveHabitProof,
  useRejectHabitProof,
  checkDuplicateAcademic,
} from "@/hooks/useMutations";
import type { PlayerData, PendingProofDisplay, AcademicRecord, HabitLog, HabitProof } from "@/lib/types";

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

  const insertMicroTest = useInsertMicroTest(monthId);
  const insertMajorExam = useInsertMajorExam(monthId);
  const upsertMonthlyPoints = useUpsertMonthlyPoints(monthId);
  const upsertHabit = useUpsertHabit(monthId);
  const deleteRecord = useDeleteRecord(monthId);
  const approveHabitProof = useApproveHabitProof(monthId);
  const rejectHabitProof = useRejectHabitProof(monthId);

  const handleMicroTestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (insertMicroTest.isPending) return;
    const fd = new FormData(e.currentTarget);
    const date = fd.get('date') as string;
    const subject = fd.get('subject') as string;
    const score = fd.get('score') as string;
    const max_score = fd.get('max_score') as string;
    const is_retest = fd.get('is_retest') === 'on';

    if (!date || !subject || !score || !max_score) { alert("必填项为空"); return; }

    const isDuplicate = await checkDuplicateAcademic({ date, subject, score: Number(score) });
    if (isDuplicate) {
      if (!confirm(`已存在 ${date} ${subject} ${score} 分的记录，确认重复录入？`)) return;
    }

    insertMicroTest.mutate(
      { date, subject, score: Number(score), max_score: Number(max_score), is_retest },
      {
        onSuccess: () => microTestForm.current?.reset(),
        onError: (err) => alert("录入失败: " + err.message),
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

    if (!date || !subject || !exam_name || !score || !max_score) { alert("必填项为空"); return; }

    const isDuplicate = await checkDuplicateAcademic({ date, subject, exam_name });
    if (isDuplicate) {
      if (!confirm(`已存在 ${date} ${subject} "${exam_name}" 的记录，确认重复录入？`)) return;
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
      onSuccess: () => majorExamForm.current?.reset(),
      onError: (err) => alert("录入失败: " + err.message),
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

    if (!month || !points) { alert("必填项为空"); return; }

    upsertMonthlyPoints.mutate(
      { month_id: month, total_score: Number(points), rank: rank ? Number(rank) : null, notes },
      {
        onSuccess: () => monthlyPointForm.current?.reset(),
        onError: (err) => alert("录入失败: " + err.message),
      },
    );
  };

  const handleHabitSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (upsertHabit.isPending) return;
    const fd = new FormData(e.currentTarget);
    const date = fd.get('date') as string;
    const type = fd.get('type') as string;

    if (!date || !type) { alert("必填项为空"); return; }

    upsertHabit.mutate(
      { date, type },
      {
        onSuccess: () => habitForm.current?.reset(),
        onError: (err) => alert("录入失败: " + err.message),
      },
    );
  };

  const pendingHabitProofs = habitProofs.filter(p => p.status === 'pending');

  const handleDeleteRecord = (table: string, id: number) => {
    if (!confirm("确认删除这条记录？")) return;
    deleteRecord.mutate(
      { table, id },
      { onError: (err) => alert("删除失败: " + err.message) },
    );
  };

  return (
    <div className="space-y-6">

      <Card className="shadow-none border-border/50">
        <CardHeader className="p-4 bg-muted/10 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">1. 录入小测</CardTitle>
          <CardDescription className="text-xs">记录日常小测成绩</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <form ref={microTestForm} onSubmit={handleMicroTestSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input name="date" type="date" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-xs text-foreground focus:outline-none" required defaultValue={todayBeijing()} />
              <select name="subject" className="w-full bg-background border border-border/50 rounded px-1 py-1.5 text-xs text-foreground focus:outline-none">
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input name="score" type="number" step="0.5" placeholder="得分" className="w-1/3 bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" required />
              <span className="text-muted-foreground text-xs">/</span>
              <input name="max_score" type="number" defaultValue={100} className="w-1/3 bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" required />
              <div className="flex items-center gap-1.5 w-1/3 justify-end pr-2">
                <input type="checkbox" name="is_retest" id="is_retest" className="w-3 h-3 accent-primary" />
                <label htmlFor="is_retest" className="text-xs text-muted-foreground cursor-pointer">重考成绩</label>
              </div>
            </div>
            <button type="submit" disabled={insertMicroTest.isPending} className="w-full mt-2 bg-primary/90 text-primary-foreground py-2 rounded-md text-xs font-semibold disabled:opacity-50">{insertMicroTest.isPending ? '提交中...' : '录入'}</button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-none border-border/50">
        <CardHeader className="p-4 bg-muted/10 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">2. 录入大考</CardTitle>
          <CardDescription className="text-xs">记录大考及排名数据</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <form ref={majorExamForm} onSubmit={handleMajorExamSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
               <input name="date" type="date" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" required defaultValue={todayBeijing()} />
               <select name="subject" className="w-full bg-background border border-border/50 rounded px-1 py-1.5 text-xs focus:outline-none">
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <input name="exam_name" type="text" placeholder="考试名称 (例: U9单元测/期中评估)" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" required />
            <div className="flex items-center gap-2">
              <input name="score" type="number" step="0.5" placeholder="得 分" className="w-1/2 bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" required />
              <input name="max_score" type="number" placeholder="满分(缺省100)" defaultValue={100} className="w-1/2 bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" required />
            </div>
            <div className="flex gap-2">
              <input name="class_avg" type="number" step="0.1" placeholder="班级均分(选填)" className="w-1/3 bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" />
              <input name="highest_score" type="number" step="0.5" placeholder="最高分(选填)" className="w-1/3 bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" />
              <input name="class_rank" type="number" placeholder="排名(选填)" className="w-1/3 bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" />
            </div>
            <button type="submit" disabled={insertMajorExam.isPending} className="w-full mt-2 bg-primary/90 text-primary-foreground py-2 rounded-md text-xs font-semibold disabled:opacity-50">{insertMajorExam.isPending ? '提交中...' : '录入'}</button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-none border-border/50">
          <CardHeader className="p-3 bg-muted/10 border-b border-border/50">
             <CardTitle className="text-xs font-semibold">月度排名</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
             <form ref={monthlyPointForm} onSubmit={handleMonthlyPointSubmit} className="space-y-2">
               <input name="month" type="month" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" required defaultValue={currentMonthBeijing()} />
               <div className="flex gap-2">
                 <input name="points" type="number" placeholder="总分" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" required />
                 <input name="rank" type="number" placeholder="班排名" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" />
               </div>
               <input name="notes" type="text" placeholder="评语(选填)" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-[10px] focus:outline-none" />
               <button type="submit" disabled={upsertMonthlyPoints.isPending} className="w-full bg-muted/80 text-foreground py-1.5 rounded-sm text-[10px]">{upsertMonthlyPoints.isPending ? '提交中...' : '提交'}</button>
             </form>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border/50">
          <CardHeader className="p-3 bg-muted/10 border-b border-border/50">
             <CardTitle className="text-xs font-semibold">补录打卡</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
             <form ref={habitForm} onSubmit={handleHabitSubmit} className="space-y-2">
               <input name="date" type="date" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" required defaultValue={todayBeijing()} />
               <select name="type" className="w-full bg-background border border-border/50 rounded px-1 py-1.5 text-xs focus:outline-none" required>
                 {HABIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
               <button type="submit" disabled={upsertHabit.isPending} className="w-full bg-muted/80 text-foreground py-1.5 rounded-sm text-[10px] mt-2 block">{upsertHabit.isPending ? '提交中...' : '补录'}</button>
             </form>
          </CardContent>
        </Card>
      </div>

      {/* Record Management */}
      <Card className="shadow-none border-border/50">
        <CardHeader className="p-4 bg-muted/10 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">本月成绩</CardTitle>
          <CardDescription className="text-xs">点击删除按钮移除错误记录</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50 max-h-64 overflow-y-auto">
            {[...academicRecords].sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()).map((r) => (
              <div key={r.id} className="p-3 flex items-center justify-between text-xs">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-muted-foreground">{r.event_date}</span>
                    <span className="font-medium">{r.subject}</span>
                    {r.is_retest && <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">重测</Badge>}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {r.exam_name || r.event_type} · {r.score}/{r.max_score}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRecord('academic_records', r.id)}
                  disabled={deleteRecord.isPending}
                  className="ml-2 text-[10px] text-destructive/60 hover:text-destructive px-1.5 py-1 rounded transition-colors disabled:opacity-50"
                >
                  删除
                </button>
              </div>
            ))}
            {academicRecords.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground">暂无成绩记录</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border-border/50">
        <CardHeader className="p-4 bg-muted/10 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">本月打卡</CardTitle>
          <CardDescription className="text-xs">点击删除按钮移除错误记录</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50 max-h-48 overflow-y-auto">
            {habitLogs.map((h) => (
              <div key={h.id} className="p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">{h.log_date}</span>
                  <Badge variant="outline" className="text-[10px] py-0 h-4 font-normal">{h.habit_type}</Badge>
                </div>
                <button
                  onClick={() => handleDeleteRecord('habit_logs', h.id)}
                  disabled={deleteRecord.isPending}
                  className="text-[10px] text-destructive/60 hover:text-destructive px-1.5 py-1 rounded transition-colors disabled:opacity-50"
                >
                  删除
                </button>
              </div>
            ))}
            {habitLogs.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground">暂无打卡记录</div>
            )}
          </div>
        </CardContent>
      </Card>

       <Card className="shadow-none border-border/50">
        <CardHeader className="p-4 bg-muted/10 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">待审打卡凭证</CardTitle>
          <CardDescription className="text-xs">审核运动照片和阅读归纳</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {pendingHabitProofs.map((proof) => (
              <HabitProofReviewItem
                key={proof.id}
                proof={proof}
                onApprove={() => approveHabitProof.mutate(
                  { id: proof.id, habitType: proof.habit_type, logDate: proof.log_date },
                  { onError: (err) => alert("审批失败: " + err.message) },
                )}
                onReject={() => rejectHabitProof.mutate(proof.id, {
                  onError: (err) => alert("操作失败: " + err.message),
                })}
                approving={approveHabitProof.isPending}
                rejecting={rejectHabitProof.isPending}
              />
            ))}
            {pendingHabitProofs.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">暂无待审内容</div>
            )}
          </div>
        </CardContent>
      </Card>
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
          className="flex-1 py-2 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-medium hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
        >
          {approving ? '处理中...' : '通过'}
        </button>
        <button
          onClick={onReject}
          disabled={rejecting}
          className="flex-1 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-xs font-medium hover:bg-destructive/20 transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/40 disabled:opacity-50"
        >
          {rejecting ? '处理中...' : '驳回'}
        </button>
      </div>
    </div>
  );
}
