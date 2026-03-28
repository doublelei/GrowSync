import { supabase } from './supabase';

const PLAYER_ID = '雷雨声';

export async function fetchAcademicRecords(monthStart: string, monthEnd: string) {
  return supabase
    .from('academic_records')
    .select('*')
    .eq('player_id', PLAYER_ID)
    .gte('event_date', monthStart)
    .lte('event_date', monthEnd)
    .order('event_date', { ascending: true });
}

export async function fetchHabitLogs(monthStart: string, monthEnd: string) {
  return supabase
    .from('habit_logs')
    .select('*')
    .eq('player_id', PLAYER_ID)
    .gte('log_date', monthStart)
    .lte('log_date', monthEnd)
    .order('log_date', { ascending: false });
}

export async function fetchMonthlyPoints(monthId: string) {
  return supabase
    .from('monthly_school_points')
    .select('*')
    .eq('player_id', PLAYER_ID)
    .eq('month_id', monthId)
    .order('created_at', { ascending: false });
}

export async function fetchTransactions() {
  return supabase
    .from('transactions')
    .select('*')
    .eq('player_id', PLAYER_ID)
    .order('created_at', { ascending: false });
}

export async function fetchQuestProofs() {
  return supabase
    .from('quest_proofs')
    .select('*')
    .eq('player_id', PLAYER_ID)
    .order('created_at', { ascending: false });
}

export { PLAYER_ID };
