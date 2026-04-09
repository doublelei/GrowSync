// src/components/quests/book-quest-card.tsx
"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BOOK_REVIEW_MIN_WORDS,
  BOOK_REVIEW_MAX_WORDS,
} from "@/lib/constants";
import {
  useSaveDraft,
  useSubmitForReview,
  useResubmitMilestoneTask,
} from "@/hooks/useMilestoneTasks";
import type { MilestoneTask, MilestoneSubmission } from "@/lib/types";

interface BookQuestCardProps {
  task: MilestoneTask;
  monthId: string;
}

export function BookQuestCard({ task, monthId }: BookQuestCardProps) {
  // 解析已保存的内容
  const parseSavedContent = (): string[] => {
    if (task.content_draft || task.content_submitted) {
      try {
        const content: MilestoneSubmission = JSON.parse(
          task.content_draft || task.content_submitted || "{}"
        );
        return content.answers || [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const savedAnswers = parseSavedContent();
  const questions = task.deep_questions || [];

  // 确保 answers 数组长度与 questions 一致
  const [answers, setAnswers] = useState<string[]>(() => {
    const initial = [...savedAnswers];
    while (initial.length < questions.length) {
      initial.push("");
    }
    return initial;
  });

  const [totalWords, setTotalWords] = useState(task.word_count || 0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 计算总字数
  useEffect(() => {
    const count = answers.reduce((sum, ans) => sum + (ans?.length || 0), 0);
    setTotalWords(count);
  }, [answers]);

  // Mutations
  const saveDraft = useSaveDraft(monthId);
  const submitForReview = useSubmitForReview(monthId);
  const resubmit = useResubmitMilestoneTask(monthId);

  const isDraft = task.status === "draft";
  const isRejected = task.status === "rejected";
  const isUnderReview = task.status === "under_review" || task.status === "submitted";
  const canEdit = isDraft || isRejected;
  const canSubmit =
    canEdit &&
    totalWords >= BOOK_REVIEW_MIN_WORDS &&
    totalWords <= BOOK_REVIEW_MAX_WORDS;

  const handleSaveDraft = () => {
    saveDraft.mutate(
      { taskId: task.id, answers, totalWords },
      {
        onSuccess: () => setLastSaved(new Date()),
      }
    );
  };

  const handleSubmit = () => {
    if (isRejected) {
      resubmit.mutate({ taskId: task.id, answers, totalWords });
    } else {
      submitForReview.mutate({ taskId: task.id, answers, totalWords });
    }
  };

  // 字数状态颜色
  const wordCountColor = () => {
    if (totalWords >= BOOK_REVIEW_MIN_WORDS && totalWords <= BOOK_REVIEW_MAX_WORDS)
      return "text-primary";
    if (totalWords > BOOK_REVIEW_MAX_WORDS) return "text-destructive";
    return "text-muted-foreground/40";
  };

  return (
    <div className="space-y-4">
      {/* 驳回原因提示 */}
      {isRejected && task.reviewer_notes && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg
              className="size-4 text-destructive shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-xs font-medium text-destructive">需要修改</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{task.reviewer_notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* 审核中提示 */}
      {isUnderReview && (
        <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-3">
          <p className="text-xs text-yellow-400">已提交审核，请耐心等待</p>
        </div>
      )}

      {/* 深度思考题 */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-foreground/70">深度思考题：</p>
        {questions.map((question, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-muted-foreground/50 shrink-0 mt-1">
                Q{idx + 1}.
              </span>
              <p className="text-xs text-foreground/80">{question}</p>
            </div>
            <textarea
              value={answers[idx] || ""}
              onChange={(e) => {
                const newAnswers = [...answers];
                newAnswers[idx] = e.target.value;
                setAnswers(newAnswers);
              }}
              disabled={!canEdit}
              placeholder={canEdit ? "写下你的思考..." : "已提交，不可修改"}
              className="w-full h-20 bg-background/50 border border-border/30 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none focus:border-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        ))}
      </div>

      {/* 字数统计 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono ${wordCountColor()}`}>
            {totalWords} / {BOOK_REVIEW_MIN_WORDS}-{BOOK_REVIEW_MAX_WORDS} 字
          </span>
          {lastSaved && (
            <span className="text-[9px] text-muted-foreground/30">
              上次保存: {lastSaved.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        {totalWords > BOOK_REVIEW_MAX_WORDS && (
          <Badge variant="outline" className="text-[9px] px-2 py-0 text-destructive border-destructive/30">
            超出限制
          </Badge>
        )}
      </div>

      {/* 操作按钮 */}
      {canEdit && (
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={saveDraft.isPending}
            className="flex-1 text-xs"
          >
            {saveDraft.isPending ? "保存中..." : "保存草稿"}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit || submitForReview.isPending || resubmit.isPending}
            className="flex-1 text-xs"
          >
            {isRejected
              ? resubmit.isPending
                ? "提交中..."
                : "重新提交"
              : submitForReview.isPending
              ? "提交中..."
              : "提交审核"}
          </Button>
        </div>
      )}
    </div>
  );
}
