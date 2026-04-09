// src/components/tabs/admin-milestone-section.tsx
"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronDown, Plus, Trash2, Check, X, Trophy, BookOpen, Film } from "lucide-react";
import {
  useCreateMilestoneTask,
  useApproveMilestoneTask,
  useRejectMilestoneTask,
  useDeleteMilestoneTask,
} from "@/hooks/useMilestoneTasks";
import {
  MILESTONE_TASK_LABELS,
  DEFAULT_BOOK_REWARD,
  DEFAULT_MOVIE_REWARD,
} from "@/lib/constants";
import type { MilestoneTask, MilestoneTaskType, MilestoneSubmission } from "@/lib/types";

interface AdminMilestoneSectionProps {
  tasks: MilestoneTask[];
  monthId: string;
}

export function AdminMilestoneSection({ tasks, monthId }: AdminMilestoneSectionProps) {
  const [activePanel, setActivePanel] = useState<string | null>("create");

  // 分类任务
  const draftTasks = tasks.filter((t) => t.status === "draft");
  const pendingTasks = tasks.filter((t) => t.status === "under_review");
  const completedTasks = tasks.filter((t) => t.status === "approved");

  return (
    <div className="space-y-4 stagger-children">
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon={<BookOpen className="size-3.5" />}
          label="完本大赏"
          value={tasks.filter((t) => t.task_type === "book").length}
          color="primary"
        />
        <StatCard
          icon={<Film className="size-3.5" />}
          label="光影计划"
          value={tasks.filter((t) => t.task_type === "movie").length}
          color="secondary"
        />
        <StatCard
          icon={<Trophy className="size-3.5" />}
          label="已完成"
          value={completedTasks.length}
          color="emerald"
        />
      </div>

      {/* 创建新任务面板 */}
      <CollapsiblePanel
        id="create"
        title="创建新任务"
        badge={null}
        activePanel={activePanel}
        onToggle={setActivePanel}
      >
        <CreateTaskForm monthId={monthId} />
      </CollapsiblePanel>

      {/* 待审核任务 */}
      <CollapsiblePanel
        id="pending"
        title="待审核"
        badge={pendingTasks.length > 0 ? pendingTasks.length : null}
        activePanel={activePanel}
        onToggle={setActivePanel}
      >
        <PendingTasksList tasks={pendingTasks} monthId={monthId} />
      </CollapsiblePanel>

      {/* 已创建任务（草稿状态） */}
      {draftTasks.length > 0 && (
        <CollapsiblePanel
          id="drafts"
          title="未开始任务"
          badge={draftTasks.length}
          activePanel={activePanel}
          onToggle={setActivePanel}
        >
          <DraftTasksList tasks={draftTasks} monthId={monthId} />
        </CollapsiblePanel>
      )}

      {/* 已完成成就墙 */}
      <CollapsiblePanel
        id="completed"
        title="成就墙"
        badge={completedTasks.length > 0 ? completedTasks.length : null}
        activePanel={activePanel}
        onToggle={setActivePanel}
      >
        <CompletedTasksList tasks={completedTasks} />
      </CollapsiblePanel>
    </div>
  );
}

// ── 子组件 ──

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "primary" | "secondary" | "emerald";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  };

  return (
    <div className={`rounded-lg p-2.5 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] opacity-70">{label}</span>
      </div>
      <div className="text-lg font-bold font-mono">{value}</div>
    </div>
  );
}

function CollapsiblePanel({
  id,
  title,
  badge,
  activePanel,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  badge: number | null;
  activePanel: string | null;
  onToggle: (id: string | null) => void;
  children: React.ReactNode;
}) {
  const isOpen = activePanel === id;
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={() => onToggle(isOpen ? null : id)}
        className="w-full p-3 flex items-center justify-between text-left transition-colors hover:bg-primary/3"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badge !== null && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 border-primary/20 text-primary"
            >
              {badge}
            </Badge>
          )}
        </div>
        <ChevronDown className={`size-4 text-muted-foreground/50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="p-3 pt-0 border-t border-border/20">{children}</div>}
    </div>
  );
}

// ── 创建任务表单 ──

function CreateTaskForm({ monthId }: { monthId: string }) {
  const [taskType, setTaskType] = useState<MilestoneTaskType>("book");
  const [itemName, setItemName] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);
  const formRef = useRef<HTMLFormElement>(null);

  const createTask = useCreateMilestoneTask(monthId);

  const handleAddQuestion = () => {
    setQuestions([...questions, ""]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[idx] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const reward = parseInt(rewardAmount, 10);
    if (!itemName || !Number.isFinite(reward) || reward <= 0) {
      toast.error("请填写完整信息");
      return;
    }

    const validQuestions = questions.filter((q) => q.trim() !== "");
    if (validQuestions.length === 0) {
      toast.error("至少添加一个深度思考题");
      return;
    }

    createTask.mutate(
      {
        task_type: taskType,
        item_name: itemName.trim(),
        reward_amount: reward,
        deep_questions: validQuestions,
      },
      {
        onSuccess: () => {
          toast.success(`已创建${MILESTONE_TASK_LABELS[taskType].name}: ${itemName}`);
          setItemName("");
          setRewardAmount("");
          setQuestions([""]);
        },
        onError: (err) => toast.error("创建失败: " + err.message),
      }
    );
  };

  const inputClass =
    "w-full bg-background/50 border border-border/30 rounded-lg px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-all";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 pt-3">
      {/* 任务类型选择 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTaskType("book")}
          className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${
            taskType === "book"
              ? "bg-primary/15 text-primary border-primary/40"
              : "bg-muted/10 text-muted-foreground border-border/30 hover:border-border"
          }`}
        >
          📚 完本大赏
        </button>
        <button
          type="button"
          onClick={() => setTaskType("movie")}
          className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${
            taskType === "movie"
              ? "bg-secondary/15 text-secondary border-secondary/40"
              : "bg-muted/10 text-muted-foreground border-border/30 hover:border-border"
          }`}
        >
          🎬 光影计划
        </button>
      </div>

      {/* 书名/影片名 */}
      <input
        type="text"
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
        placeholder={taskType === "book" ? "书名（如：三体）" : "影片名（如：肖申克的救赎）"}
        className={inputClass}
        required
      />

      {/* 奖励金额 */}
      <div className="flex gap-2">
        <input
          type="number"
          value={rewardAmount}
          onChange={(e) => setRewardAmount(e.target.value)}
          placeholder="奖励金额（¥）"
          className={`flex-1 ${inputClass}`}
          min="1"
          required
        />
        <div className="flex gap-1">
          {taskType === "book" ? (
            <>
              <PresetButton
                value={DEFAULT_BOOK_REWARD.high}
                onClick={() => setRewardAmount(String(DEFAULT_BOOK_REWARD.high))}
              />
              <PresetButton
                value={DEFAULT_BOOK_REWARD.medium}
                onClick={() => setRewardAmount(String(DEFAULT_BOOK_REWARD.medium))}
              />
              <PresetButton
                value={DEFAULT_BOOK_REWARD.low}
                onClick={() => setRewardAmount(String(DEFAULT_BOOK_REWARD.low))}
              />
            </>
          ) : (
            <PresetButton
              value={DEFAULT_MOVIE_REWARD}
              onClick={() => setRewardAmount(String(DEFAULT_MOVIE_REWARD))}
            />
          )}
        </div>
      </div>

      {/* 深度思考题 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/70">深度思考题</span>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="text-[10px] text-primary flex items-center gap-1 hover:underline"
          >
            <Plus className="size-3" />
            添加问题
          </button>
        </div>
        {questions.map((q, idx) => (
          <div key={idx} className="flex gap-2">
            <span className="text-[10px] text-muted-foreground/50 shrink-0 pt-2.5">Q{idx + 1}.</span>
            <input
              type="text"
              value={q}
              onChange={(e) => handleQuestionChange(idx, e.target.value)}
              placeholder={`思考题 ${idx + 1}`}
              className={`flex-1 ${inputClass}`}
            />
            {questions.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveQuestion(idx)}
                className="text-muted-foreground/50 hover:text-destructive transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full" size="sm" disabled={createTask.isPending}>
        {createTask.isPending ? "创建中..." : "创建任务"}
      </Button>
    </form>
  );
}

function PresetButton({ value, onClick }: { value: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2 py-2 rounded-lg border border-border/30 bg-muted/10 text-[10px] text-muted-foreground hover:border-primary/30 hover:text-primary transition-all"
    >
      ¥{value}
    </button>
  );
}

// ── 待审核任务列表 ──

function PendingTasksList({ tasks, monthId }: { tasks: MilestoneTask[]; monthId: string }) {
  if (tasks.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground/50">
        暂无待审核任务
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-3">
      {tasks.map((task) => (
        <PendingTaskCard key={task.id} task={task} monthId={monthId} />
      ))}
    </div>
  );
}

function PendingTaskCard({ task, monthId }: { task: MilestoneTask; monthId: string }) {
  const [showFull, setShowFull] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const approve = useApproveMilestoneTask(monthId);
  const reject = useRejectMilestoneTask(monthId);

  const label = MILESTONE_TASK_LABELS[task.task_type];

  // 解析提交内容
  let submission: MilestoneSubmission | null = null;
  try {
    if (task.content_submitted) {
      submission = JSON.parse(task.content_submitted);
    }
  } catch {
    submission = null;
  }

  const handleApprove = () => {
    approve.mutate({ taskId: task.id, approved: true });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("请填写驳回原因");
      return;
    }
    reject.mutate(
      { taskId: task.id, approved: false, notes: rejectReason },
      {
        onSuccess: () => {
          setRejectReason("");
          setShowRejectInput(false);
        },
      }
    );
  };

  return (
    <div className="border border-border/50 rounded-lg p-3 space-y-3">
      {/* 头部信息 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">{label.icon}</span>
            <span className="text-sm font-medium">{task.item_name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground/50">{label.name}</span>
            <span className="text-[10px] text-muted-foreground/30">·</span>
            <span className="text-[10px] font-mono text-primary">¥{task.reward_amount}</span>
            {task.word_count && (
              <>
                <span className="text-[10px] text-muted-foreground/30">·</span>
                <span className="text-[10px] text-muted-foreground/50">{task.word_count} 字</span>
              </>
            )}
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-2 py-0 border-yellow-400/30 text-yellow-400 bg-yellow-400/5">
          审核中
        </Badge>
      </div>

      {/* 提交内容预览 */}
      {submission && (
        <div className="bg-muted/10 rounded-lg p-3 space-y-2">
          {submission.answers.map((answer, idx) => (
            <div key={idx}>
              <p className="text-[10px] text-muted-foreground/50 mb-1">
                Q{idx + 1}. {task.deep_questions?.[idx] || ""}
              </p>
              <p className={`text-xs text-foreground/80 leading-relaxed ${showFull ? "" : "line-clamp-2"}`}>
                {answer}
              </p>
            </div>
          ))}
          {submission.answers.some((a) => a.length > 100) && (
            <button
              onClick={() => setShowFull(!showFull)}
              className="text-[10px] text-primary hover:underline"
            >
              {showFull ? "收起" : "查看全文"}
            </button>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="space-y-2">
        {!showRejectInput ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRejectInput(true)}
              className="flex-1 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
              disabled={approve.isPending}
            >
              <X className="size-3 mr-1" />
              驳回
            </Button>
            <Button size="sm" onClick={handleApprove} className="flex-1 text-xs" disabled={approve.isPending}>
              <Check className="size-3 mr-1" />
              {approve.isPending ? "处理中..." : "通过并发奖"}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="填写驳回原因（如：字数不足、回答不完整等）"
              className="w-full bg-background/50 border border-destructive/30 rounded-lg px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-destructive/50"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowRejectInput(false);
                  setRejectReason("");
                }}
                className="flex-1 text-xs"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleReject}
                className="flex-1 text-xs bg-destructive hover:bg-destructive/90"
                disabled={reject.isPending}
              >
                {reject.isPending ? "提交中..." : "确认驳回"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 草稿任务列表 ──

function DraftTasksList({ tasks, monthId }: { tasks: MilestoneTask[]; monthId: string }) {
  const deleteTask = useDeleteMilestoneTask(monthId);

  return (
    <div className="space-y-2 pt-3">
      {tasks.map((task) => {
        const label = MILESTONE_TASK_LABELS[task.task_type];
        return (
          <div key={task.id} className="flex items-center justify-between p-2.5 bg-muted/10 rounded-lg border border-border/30">
            <div className="flex items-center gap-2">
              <span>{label.icon}</span>
              <span className="text-xs font-medium">{task.item_name}</span>
              <span className="text-[10px] text-muted-foreground/50">¥{task.reward_amount}</span>
            </div>
            <button
              onClick={() => {
                if (confirm(`确定删除「${task.item_name}」吗？`)) {
                  deleteTask.mutate(task.id);
                }
              }}
              disabled={deleteTask.isPending}
              className="text-muted-foreground/50 hover:text-destructive transition-colors"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── 已完成任务列表 ──

function CompletedTasksList({ tasks }: { tasks: MilestoneTask[] }) {
  if (tasks.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground/50">
        还没有完成的任务
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-3 max-h-64 overflow-y-auto">
      {tasks.map((task) => {
        const label = MILESTONE_TASK_LABELS[task.task_type];
        return (
          <div
            key={task.id}
            className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{label.icon}</span>
              <div>
                <p className="text-xs font-medium text-foreground">{task.item_name}</p>
                <p className="text-[10px] text-muted-foreground/50">
                  {label.name} · {task.word_count} 字
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge className="text-[10px] px-2 py-0 bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                +¥{task.reward_amount}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
