// src/components/quests/milestone-section.tsx
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { MilestoneTask } from "@/lib/types";
import { MILESTONE_TASK_LABELS } from "@/lib/constants";
import { BookQuestCard } from "./book-quest-card";
import { MovieQuestCard } from "./movie-quest-card";
import { Trophy } from "lucide-react";

interface MilestoneSectionProps {
  tasks: MilestoneTask[];
  monthId: string;
}

export function MilestoneSection({ tasks, monthId }: MilestoneSectionProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  // 过滤出需要显示的任务（未完成的和进行中的）
  const activeTasks = tasks.filter(
    (t) => t.status === "draft" || t.status === "under_review" || t.status === "rejected"
  );

  // 已完成的任务（用于成就墙计数）
  const completedCount = tasks.filter((t) => t.status === "approved").length;

  if (activeTasks.length === 0 && completedCount === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 标题区域 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-primary" />
          <span className="text-sm font-semibold text-foreground/80">阶段性任务</span>
        </div>
        {completedCount > 0 && (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-primary/5 border-primary/20 text-primary/70">
            已完成 {completedCount} 项
          </Badge>
        )}
      </div>

      {/* 任务列表 */}
      <div className="space-y-3">
        {activeTasks.map((task) => (
          <MilestoneTaskItem
            key={task.id}
            task={task}
            monthId={monthId}
            isExpanded={expandedTaskId === task.id}
            onToggle={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
          />
        ))}
      </div>

      {/* 空状态 */}
      {activeTasks.length === 0 && completedCount > 0 && (
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground/60">暂无进行中的任务</p>
          <p className="text-[10px] text-muted-foreground/40 mt-1">等待家长发布新任务...</p>
        </div>
      )}
    </div>
  );
}

interface MilestoneTaskItemProps {
  task: MilestoneTask;
  monthId: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function MilestoneTaskItem({ task, monthId, isExpanded, onToggle }: MilestoneTaskItemProps) {
  const label = MILESTONE_TASK_LABELS[task.task_type];

  // 状态标签
  const statusBadge = () => {
    switch (task.status) {
      case "draft":
        return <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground/50 border-border/30">草稿</Badge>;
      case "under_review":
        return <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-yellow-400 border-yellow-400/30 bg-yellow-400/5">审核中</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-destructive border-destructive/30 bg-destructive/5">需修改</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className={`glass-card rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-primary/20' : ''}`}>
      {/* 任务头部 - 始终显示 */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left transition-colors hover:bg-primary/3"
      >
        <div className="flex items-center gap-3">
          <div className="text-lg">{label.icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{task.item_name}</span>
              {statusBadge()}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground/50">{label.name}</span>
              <span className="text-[10px] text-muted-foreground/30">·</span>
              <span className="text-[10px] font-mono text-primary">¥{task.reward_amount}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {task.word_count && task.word_count > 0 && (
            <span className="text-[10px] text-muted-foreground/40 font-mono">{task.word_count} 字</span>
          )}
          <svg
            className={`size-4 text-muted-foreground/50 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border/20 pt-4">
          {task.task_type === "book" ? (
            <BookQuestCard task={task} monthId={monthId} />
          ) : (
            <MovieQuestCard task={task} monthId={monthId} />
          )}
        </div>
      )}
    </div>
  );
}
