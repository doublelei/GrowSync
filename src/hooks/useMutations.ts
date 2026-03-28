// src/hooks/useMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PLAYER_ID, todayBeijing } from '@/lib/constants';
import { queryKeys } from '@/lib/query-client';

function useInvalidate(monthId: string) {
  const qc = useQueryClient();
  return {
    academics: () => qc.invalidateQueries({ queryKey: queryKeys.academics(monthId) }),
    habits: () => qc.invalidateQueries({ queryKey: queryKeys.habits(monthId) }),
    habitProofs: () => qc.invalidateQueries({ queryKey: queryKeys.habitProofs(monthId) }),
    monthlyPoints: () => qc.invalidateQueries({ queryKey: queryKeys.monthlyPoints(monthId) }),
    transactions: () => qc.invalidateQueries({ queryKey: queryKeys.transactions() }),
    questProofs: () => qc.invalidateQueries({ queryKey: queryKeys.questProofs() }),
  };
}

interface ExerciseProofInput {
  file: File;
}

interface ReadingProofInput {
  text: string;
}

export function useSubmitExerciseProof(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (input: ExerciseProofInput) => {
      const today = todayBeijing();
      const ext = input.file.name.split('.').pop() || 'jpg';
      const filePath = `proofs/${today}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('habit-proofs')
        .upload(filePath, input.file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('habit-proofs')
        .getPublicUrl(filePath);

      const { error } = await supabase.from('habit_proofs').insert([{
        player_id: PLAYER_ID,
        habit_type: '运动',
        log_date: today,
        proof_type: 'image',
        proof_url: urlData.publicUrl,
        status: 'pending',
      }]);
      if (error) throw error;
    },
    onSuccess: () => inv.habitProofs(),
  });
}

export function useSubmitReadingProof(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (input: ReadingProofInput) => {
      if (input.text.length < 100) throw new Error('阅读归纳至少需要100字');

      const today = todayBeijing();
      const { error } = await supabase.from('habit_proofs').insert([{
        player_id: PLAYER_ID,
        habit_type: '阅读',
        log_date: today,
        proof_type: 'text',
        proof_text: input.text,
        status: 'pending',
      }]);
      if (error) throw error;
    },
    onSuccess: () => inv.habitProofs(),
  });
}

export function useApproveHabitProof(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (proof: { id: number; habitType: string; logDate: string }) => {
      const { error: updateError } = await supabase
        .from('habit_proofs')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', proof.id);
      if (updateError) throw updateError;

      // Write the actual habit_log so reward calculation picks it up
      const { error: habitError } = await supabase.from('habit_logs').upsert([{
        player_id: PLAYER_ID,
        log_date: proof.logDate,
        habit_type: proof.habitType,
      }], { onConflict: 'player_id,log_date,habit_type' });
      if (habitError) throw habitError;
    },
    onSuccess: () => { inv.habitProofs(); inv.habits(); },
  });
}

export function useRejectHabitProof(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (proofId: number) => {
      const { error } = await supabase
        .from('habit_proofs')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', proofId);
      if (error) throw error;
    },
    onSuccess: () => inv.habitProofs(),
  });
}

interface MicroTestInput {
  date: string;
  subject: string;
  score: number;
  max_score: number;
  is_retest: boolean;
}

export function useInsertMicroTest(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (input: MicroTestInput) => {
      const { error } = await supabase.from('academic_records').insert([{
        player_id: PLAYER_ID,
        event_date: input.date,
        event_type: 'micro_test',
        subject: input.subject,
        score: input.score,
        max_score: input.max_score,
        is_retest: input.is_retest,
      }]);
      if (error) throw error;
    },
    onSuccess: () => inv.academics(),
  });
}

interface MajorExamInput {
  date: string;
  subject: string;
  exam_name: string;
  score: number;
  max_score: number;
  class_avg?: number;
  highest_score?: number;
  class_rank?: number;
}

export function useInsertMajorExam(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (input: MajorExamInput) => {
      const record: Record<string, unknown> = {
        player_id: PLAYER_ID,
        event_date: input.date,
        event_type: 'major_exam',
        subject: input.subject,
        exam_name: input.exam_name,
        score: input.score,
        max_score: input.max_score,
      };
      if (input.class_avg != null) record.class_avg = input.class_avg;
      if (input.highest_score != null) record.highest_score = input.highest_score;
      if (input.class_rank != null) record.class_rank = input.class_rank;

      const { error } = await supabase.from('academic_records').insert([record]);
      if (error) throw error;
    },
    onSuccess: () => inv.academics(),
  });
}

interface RatingInput {
  recordId: number;
  rating: 'bonus' | 'neutral' | 'penalty';
  reason?: string;
}

export function useUpdateMajorExamRating(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (input: RatingInput) => {
      const { error } = await supabase
        .from('academic_records')
        .update({
          major_exam_rating: input.rating,
          rating_reason: input.reason ?? null,
        })
        .eq('id', input.recordId);
      if (error) throw error;
    },
    onSuccess: () => inv.academics(),
  });
}

interface MonthlyPointInput {
  month_id: string;
  total_score: number;
  rank?: number | null;
  notes?: string;
}

export function useUpsertMonthlyPoints(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (input: MonthlyPointInput) => {
      const { error } = await supabase.from('monthly_school_points').upsert([{
        player_id: PLAYER_ID,
        month_id: input.month_id,
        total_score: input.total_score,
        rank: input.rank ?? null,
        notes: input.notes,
      }], { onConflict: 'player_id,month_id' });
      if (error) throw error;
    },
    onSuccess: () => inv.monthlyPoints(),
  });
}

export function useUpsertHabit(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (input: { date: string; type: string }) => {
      const { error } = await supabase.from('habit_logs').upsert([{
        player_id: PLAYER_ID,
        log_date: input.date,
        habit_type: input.type,
      }], { onConflict: 'player_id,log_date,habit_type' });
      if (error) throw error;
    },
    onSuccess: () => inv.habits(),
  });
}

export function useDeleteRecord(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async ({ table, id }: { table: string; id: number }) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { table }) => {
      if (table === 'academic_records') inv.academics();
      else if (table === 'habit_logs') inv.habits();
      else if (table === 'monthly_school_points') inv.monthlyPoints();
    },
  });
}

export function useApproveProof(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async ({ proofId, reward }: { proofId: number; reward: number }) => {
      const { error: updateError } = await supabase
        .from('quest_proofs')
        .update({ status: 'approved' })
        .eq('id', proofId);
      if (updateError) throw updateError;

      await supabase.from('transactions').insert([{
        player_id: PLAYER_ID,
        amount: reward,
        transaction_type: 'earned',
        description: '任务审核通过奖励',
      }]);
    },
    onSuccess: () => {
      inv.questProofs();
      inv.transactions();
    },
  });
}

export function useRejectProof(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (proofId: number) => {
      const { error } = await supabase
        .from('quest_proofs')
        .update({ status: 'rejected' })
        .eq('id', proofId);
      if (error) throw error;
    },
    onSuccess: () => inv.questProofs(),
  });
}

export async function checkDuplicateAcademic(filters: {
  date: string; subject: string; score?: number; exam_name?: string;
}): Promise<boolean> {
  let query = supabase
    .from('academic_records')
    .select('id')
    .eq('player_id', PLAYER_ID)
    .eq('event_date', filters.date)
    .eq('subject', filters.subject);

  if (filters.score != null) query = query.eq('score', filters.score);
  if (filters.exam_name) query = query.eq('exam_name', filters.exam_name);

  const { data } = await query.limit(1);
  return (data?.length ?? 0) > 0;
}
