"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import type { PlayerData, PendingProofDisplay, AcademicRecord, HabitLog } from "@/lib/types";

export function AdminTab({ pendingProofs, playerData, currentWeekNum, academicRecords = [], habitLogs = [], onDataChange }: {
  pendingProofs: PendingProofDisplay[];
  playerData: PlayerData;
  currentWeekNum: number;
  academicRecords?: AcademicRecord[];
  habitLogs?: HabitLog[];
  onDataChange: () => void;
}) {

  const handleMicroTestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const date = fd.get('date');
    const subject = fd.get('subject');
    const score = fd.get('score');
    const max_score = fd.get('max_score');
    const is_retest = fd.get('is_retest') === 'on';

    if (!date || !subject || !score || !max_score) return alert("必填项为空");

    // Dedup check: warn if same date+subject+score already exists
    const { data: existing } = await supabase
      .from('academic_records')
      .select('id')
      .eq('player_id', playerData.name)
      .eq('event_date', date)
      .eq('subject', subject)
      .eq('score', Number(score))
      .limit(1);

    if (existing && existing.length > 0) {
      if (!confirm(`已存在 ${date} ${subject} ${score} 分的记录，确认重复录入？`)) return;
    }

    const { error } = await supabase.from('academic_records').insert([{
      player_id: playerData.name,
      event_date: date,
      event_type: 'micro_test',
      subject,
      score: Number(score),
      max_score: Number(max_score),
      is_retest
    }]);
    if (error) alert("录入失败: " + error.message);
    else { (e.currentTarget as HTMLFormElement).reset(); onDataChange(); }
  };

  const handleMajorExamSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const date = fd.get('date');
    const subject = fd.get('subject');
    const exam_name = fd.get('exam_name');
    const score = fd.get('score');
    const max_score = fd.get('max_score');
    const class_avg = fd.get('class_avg');
    const highest_score = fd.get('highest_score');
    const class_rank = fd.get('class_rank');

    if (!date || !subject || !exam_name || !score || !max_score) return alert("必填项为空");

    // Dedup check
    const { data: existing } = await supabase
      .from('academic_records')
      .select('id')
      .eq('player_id', playerData.name)
      .eq('event_date', date)
      .eq('subject', subject)
      .eq('exam_name', exam_name)
      .limit(1);

    if (existing && existing.length > 0) {
      if (!confirm(`已存在 ${date} ${subject} "${exam_name}" 的记录，确认重复录入？`)) return;
    }

    const record: Record<string, unknown> = {
      player_id: playerData.name,
      event_date: date,
      event_type: 'major_exam',
      subject,
      exam_name,
      score: Number(score),
      max_score: Number(max_score)
    };
    if (class_avg) record.class_avg = Number(class_avg);
    if (highest_score) record.highest_score = Number(highest_score);
    if (class_rank) record.class_rank = Number(class_rank);

    const { error } = await supabase.from('academic_records').insert([record]);
    if (error) alert("录入失败: " + error.message);
    else { (e.currentTarget as HTMLFormElement).reset(); onDataChange(); }
  };

  const handleMonthlyPointSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const month = fd.get('month');
    const points = fd.get('points');
    const rank = fd.get('rank');
    const notes = fd.get('notes');

    if (!month || !points) return alert("必填项为空");

    const { error } = await supabase.from('monthly_school_points').upsert([{
      player_id: playerData.name,
      month_id: month,
      total_score: Number(points),
      rank: rank ? Number(rank) : null,
      notes
    }], { onConflict: 'player_id,month_id' });
    if (error) alert("录入失败: " + error.message);
    else { (e.currentTarget as HTMLFormElement).reset(); onDataChange(); }
  };

  const handleHabitSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const date = fd.get('date');
    const type = fd.get('type');

    if (!date || !type) return alert("必填项为空");

    const { error } = await supabase.from('habit_logs').upsert([{
      player_id: playerData.name,
      log_date: date,
      habit_type: type
    }], { onConflict: 'player_id,log_date,habit_type' });
    if (error) alert("录入失败: " + error.message);
    else { (e.currentTarget as HTMLFormElement).reset(); onDataChange(); }
  };

  const handleApprove = async (proofId: number, reward: number) => {
    const { error: updateError } = await supabase
      .from('quest_proofs')
      .update({ status: 'approved' })
      .eq('id', proofId);

    if (updateError) return alert("审批失败: " + updateError.message);

    await supabase.from('transactions').insert([{
      player_id: playerData.name,
      amount: reward,
      transaction_type: 'earned',
      description: '任务审核通过奖励'
    }]);

    onDataChange();
  };

  const handleReject = async (proofId: number) => {
    const { error } = await supabase
      .from('quest_proofs')
      .update({ status: 'rejected' })
      .eq('id', proofId);

    if (error) alert("操作失败: " + error.message);
    else onDataChange();
  };

  const handleDeleteRecord = async (table: string, id: number) => {
    if (!confirm("确认删除这条记录？")) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) alert("删除失败: " + error.message);
    else onDataChange();
  };

  return (
    <div className="space-y-6">

      <Card className="shadow-none border-border/50">
        <CardHeader className="p-4 bg-muted/10 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">1. 纸条小测快录</CardTitle>
          <CardDescription className="text-xs">高频录入每日听写散卷分数</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleMicroTestSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input name="date" type="date" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-xs text-foreground focus:outline-none" required defaultValue={new Date().toISOString().split('T')[0]} />
              <select name="subject" className="w-full bg-background border border-border/50 rounded px-1 py-1.5 text-xs text-foreground focus:outline-none">
                <option value="英语">英语小测</option>
                <option value="数学">数学测试</option>
                <option value="语文">语文听写</option>
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
            <button type="submit" className="w-full mt-2 bg-primary/90 text-primary-foreground py-2 rounded-md text-xs font-semibold">录入小测基础分</button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-none border-border/50">
        <CardHeader className="p-4 bg-muted/10 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">2. 单元测 / 大考报告</CardTitle>
          <CardDescription className="text-xs">完整记录各指标以追踪相对排名进步</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleMajorExamSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
               <input name="date" type="date" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" required defaultValue={new Date().toISOString().split('T')[0]} />
               <select name="subject" className="w-full bg-background border border-border/50 rounded px-1 py-1.5 text-xs focus:outline-none">
                <option value="英语">英语</option>
                <option value="数学">数学</option>
                <option value="语文">语文</option>
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
            <button type="submit" className="w-full mt-2 bg-primary/90 text-primary-foreground py-2 rounded-md text-xs font-semibold">录入大考成绩</button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-none border-border/50">
          <CardHeader className="p-3 bg-muted/10 border-b border-border/50">
             <CardTitle className="text-xs font-semibold">月底校内积分总结</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
             <form onSubmit={handleMonthlyPointSubmit} className="space-y-2">
               <input name="month" type="month" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" required defaultValue={new Date().toISOString().slice(0, 7)} />
               <div className="flex gap-2">
                 <input name="points" type="number" placeholder="总分" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" required />
                 <input name="rank" type="number" placeholder="班排名" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" />
               </div>
               <input name="notes" type="text" placeholder="评语(选填)" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-[10px] focus:outline-none" />
               <button type="submit" className="w-full bg-muted/80 text-foreground py-1.5 rounded-sm text-[10px]">提交月底总结</button>
             </form>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border/50">
          <CardHeader className="p-3 bg-muted/10 border-b border-border/50">
             <CardTitle className="text-xs font-semibold">记录丢失补登</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
             <form onSubmit={handleHabitSubmit} className="space-y-2">
               <input name="date" type="date" className="w-full bg-background border border-border/50 rounded px-2 py-1.5 text-xs focus:outline-none" required defaultValue={new Date().toISOString().split('T')[0]} />
               <select name="type" className="w-full bg-background border border-border/50 rounded px-1 py-1.5 text-xs focus:outline-none" required>
                 <option value="阅读">阅读打卡</option>
                 <option value="运动">有氧运动</option>
               </select>
               <button type="submit" className="w-full bg-muted/80 text-foreground py-1.5 rounded-sm text-[10px] mt-2 block">追加补票</button>
             </form>
          </CardContent>
        </Card>
      </div>

      {/* Record Management */}
      <Card className="shadow-none border-border/50">
        <CardHeader className="p-4 bg-muted/10 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">已录入成绩 (本赛季)</CardTitle>
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
                  className="ml-2 text-[10px] text-destructive/60 hover:text-destructive px-1.5 py-1 rounded transition-colors"
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
          <CardTitle className="text-sm font-semibold">已录入打卡 (本赛季)</CardTitle>
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
                  className="text-[10px] text-destructive/60 hover:text-destructive px-1.5 py-1 rounded transition-colors"
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
          <CardTitle className="text-sm font-semibold">待审凭证</CardTitle>
          <CardDescription className="text-xs">审批任务截图与录音</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {pendingProofs.map((proof) => (
              <div key={proof.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium">{proof.questTitle}</div>
                    <div className="text-xs text-muted-foreground mt-1">{proof.player} &middot; {proof.type} &middot; {proof.date}</div>
                  </div>
                  <div className="text-lg font-mono font-semibold text-primary">&yen;{proof.reward}</div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleApprove(proof.id, proof.reward)}
                    className="flex-1 py-2 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-medium hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    予以通过
                  </button>
                  <button
                    onClick={() => handleReject(proof.id)}
                    className="flex-1 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-xs font-medium hover:bg-destructive/20 transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/40"
                  >
                    驳回重做
                  </button>
                </div>
              </div>
            ))}
            {pendingProofs.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">干干净净，暂时没有需要审核的内容</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
