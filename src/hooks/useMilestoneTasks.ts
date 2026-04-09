// src/hooks/useMilestoneTasks.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PLAYER_ID } from '@/lib/constants';
import { queryKeys } from '@/lib/query-client';
import type { MilestoneTaskType, MilestoneTaskStatus, MilestoneSubmission } from '@/lib/types';

function useInvalidate(monthId: string) {
  const qc = useQueryClient();
  return {
    milestoneTasks: () => qc.invalidateQueries({ queryKey: queryKeys.milestoneTasks(monthId) }),
    transactions: () => qc.invalidateQueries({ queryKey: queryKeys.transactions() }),
  };
}

// ── Types ──

interface CreateTaskInput {
  task_type: MilestoneTaskType;
  item_name: string;
  item_difficulty?: string;
  reward_amount: number;
  deep_questions: string[];
}

interface SaveDraftInput {
  taskId: number;
  answers: string[];
  totalWords: number;
}

interface SubmitForReviewInput {
  taskId: number;
  answers: string[];
  totalWords: number;
}

interface ReviewTaskInput {
  taskId: number;
  approved: boolean;
  notes?: string;
}

interface ResubmitInput {
  taskId: number;
  answers: string[];
  totalWords: number;
}

// ── Mutations ──

/**
 * 家长：创建新任务
 */
export function useCreateMilestoneTask(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { error } = await supabase.from('milestone_tasks').insert([{
        player_id: PLAYER_ID,
        task_type: input.task_type,
        item_name: input.item_name,
        item_difficulty: input.item_difficulty || null,
        reward_amount: input.reward_amount,
        deep_questions: input.deep_questions,
        status: 'draft',
      }]);
      if (error) throw error;
    },
    onSuccess: () => inv.milestoneTasks(),
  });
}

/**
 * 学生：保存草稿
 */
export function useSaveDraft(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (input: SaveDraftInput) => {
      const submission: MilestoneSubmission = {
        answers: input.answers,
        totalWords: input.totalWords,
      };
      const { error } = await supabase
        .from('milestone_tasks')
        .update({
          content_draft: JSON.stringify(submission),
          word_count: input.totalWords,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.taskId)
        .eq('player_id', PLAYER_ID);
      if (error) throw error;
    },
    onSuccess: () => inv.milestoneTasks(),
  });
}

/**
 * 学生：提交审核
 */
export function useSubmitForReview(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (input: SubmitForReviewInput) => {
      const submission: MilestoneSubmission = {
        answers: input.answers,
        totalWords: input.totalWords,
      };
      const { error } = await supabase
        .from('milestone_tasks')
        .update({
          content_submitted: JSON.stringify(submission),
          content_draft: JSON.stringify(submission), // 同步更新草稿
          word_count: input.totalWords,
          status: 'under_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.taskId)
        .eq('player_id', PLAYER_ID);
      if (error) throw error;
    },
    onSuccess: () => inv.milestoneTasks(),
  });
}

/**
 * 家长：审核通过
 */
export function useApproveMilestoneTask(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (input: ReviewTaskInput) => {
      // 1. 获取任务信息
      const { data: task, error: fetchError } = await supabase
        .from('milestone_tasks')
        .select('reward_amount, item_name, task_type')
        .eq('id', input.taskId)
        .single();
      if (fetchError) throw fetchError;
      if (!task) throw new Error('Task not found');

      // 2. 更新任务状态
      const { error: updateError } = await supabase
        .from('milestone_tasks')
        .update({
          status: 'approved',
          reviewer_notes: input.notes || null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.taskId);
      if (updateError) throw updateError;

      // 3. 创建交易记录
      const typeLabel = task.task_type === 'book' ? '完本大赏' : '光影计划';
      const { error: transError } = await supabase.from('transactions').insert([{
        player_id: PLAYER_ID,
        amount: task.reward_amount,
        transaction_type: 'earned',
        description: `${typeLabel}: ${task.item_name}`,
      }]);
      if (transError) throw transError;
    },
    onSuccess: () => {
      inv.milestoneTasks();
      inv.transactions();
    },
  });
}

/**
 * 家长：审核驳回
 */
export function useRejectMilestoneTask(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (input: ReviewTaskInput) => {
      const { error } = await supabase
        .from('milestone_tasks')
        .update({
          status: 'rejected',
          reviewer_notes: input.notes || null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.taskId);
      if (error) throw error;
    },
    onSuccess: () => inv.milestoneTasks(),
  });
}

/**
 * 学生：重新提交（被驳回后）
 */
export function useResubmitMilestoneTask(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (input: ResubmitInput) => {
      const submission: MilestoneSubmission = {
        answers: input.answers,
        totalWords: input.totalWords,
      };
      const { error } = await supabase
        .from('milestone_tasks')
        .update({
          content_submitted: JSON.stringify(submission),
          content_draft: JSON.stringify(submission),
          word_count: input.totalWords,
          status: 'under_review',
          reviewer_notes: null, // 清除之前的驳回原因
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.taskId)
        .eq('player_id', PLAYER_ID);
      if (error) throw error;
    },
    onSuccess: () => inv.milestoneTasks(),
  });
}

/**
 * 删除任务（仅草稿状态或未开始的任务）
 */
export function useDeleteMilestoneTask(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (taskId: number) => {
      const { error } = await supabase
        .from('milestone_tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => inv.milestoneTasks(),
  });
}

// ── Query Functions ──

import type { MilestoneTask } from '@/lib/types';

export async function fetchMilestoneTasks(playerId: string): Promise<MilestoneTask[]> {
  const { data, error } = await supabase
    .from('milestone_tasks')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchPendingMilestoneTasks(): Promise<MilestoneTask[]> {
  const { data, error } = await supabase
    .from('milestone_tasks')
    .select('*')
    .eq('status', 'under_review')
    .order('updated_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchCompletedMilestoneTasks(playerId: string): Promise<MilestoneTask[]> {
  const { data, error } = await supabase
    .from('milestone_tasks')
    .select('*')
    .eq('player_id', playerId)
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
