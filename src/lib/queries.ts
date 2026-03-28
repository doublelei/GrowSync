import { supabase } from './supabase';
import { PLAYER_ID } from './constants';

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

export async function fetchHabitProofs(seasonStart: string, seasonEnd: string) {
  return supabase
    .from('habit_proofs')
    .select('*')
    .eq('player_id', PLAYER_ID)
    .gte('log_date', seasonStart)
    .lte('log_date', seasonEnd)
    .order('created_at', { ascending: false });
}

export async function fetchQuestProofs() {
  return supabase
    .from('quest_proofs')
    .select('*')
    .eq('player_id', PLAYER_ID)
    .order('created_at', { ascending: false });
}

// ── Full-history queries (for /records page) ──

export async function fetchAllAcademicRecords() {
  return supabase
    .from('academic_records')
    .select('*')
    .eq('player_id', PLAYER_ID)
    .order('event_date', { ascending: false });
}

export async function fetchAllHabitLogs() {
  return supabase
    .from('habit_logs')
    .select('*')
    .eq('player_id', PLAYER_ID)
    .order('log_date', { ascending: false });
}

export async function fetchAllMonthlyPoints() {
  return supabase
    .from('monthly_school_points')
    .select('*')
    .eq('player_id', PLAYER_ID)
    .order('month_id', { ascending: false });
}

