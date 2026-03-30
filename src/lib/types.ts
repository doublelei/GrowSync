// ── Database Row Types ──

export type MajorExamRating = 'bonus' | 'neutral' | 'penalty';

export interface Transaction {
  id: number;
  player_id: string;
  amount: number;
  transaction_type: 'earned' | 'deducted';
  description: string;
  created_at: string;
}

export interface QuestProof {
  id: number;
  player_id: string;
  quest_title: string;
  quest_type: string;
  reward_amount: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  created_at: string;
}

export interface AcademicRecord {
  id: number;
  player_id: string;
  event_date: string;
  event_type: 'micro_test' | 'unit_exam' | 'major_exam' | string;
  subject: string;
  score: number;
  max_score: number;
  notes?: string;
  exam_name?: string;
  class_avg?: number;
  highest_score?: number;
  class_rank?: number;
  is_retest?: boolean;
  is_pass_fail?: boolean;
  major_exam_rating?: 'bonus' | 'neutral' | 'penalty' | null;
  rating_reason?: string | null;
  created_at: string;
}

export interface MonthlySchoolPoint {
  id: string;
  player_id: string;
  month_id: string;      // e.g. '2026-03'
  total_score: number;
  rank?: number;
  notes?: string;
  created_at: string;
}

export interface HabitLog {
  id: number;
  player_id: string;
  log_date: string;
  habit_type: '阅读' | '运动';
  notes?: string;
  created_at: string;
}

export interface HabitProof {
  id: number;
  player_id: string;
  habit_type: '运动' | '阅读';
  log_date: string;
  proof_type: 'image' | 'text';
  proof_url?: string;
  proof_text?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at?: string;
  created_at: string;
}

// ── Filter Types (for /records page) ──

export type ExamTypeFilter = 'all' | 'micro_test' | 'major_exam';

// ── Computed / Display Types ──

export interface WeekPeriod {
  start: string;
  end: string;
  startDate: Date;
  endDate: Date;
}

export interface WeeklyQuestState {
  week: number;
  period: { start: string; end: string; startDate: Date; endDate: Date };
  exercise: { earned: number; status: 'pending' | 'completed' };
  reading: { earned: number; status: 'pending' | 'completed' };
  academic: {
    earned: number;
    strikes: number;
    deductions: { reason: string; amount: number }[];
    examAdjustments: { subject: string; examName?: string; rating: MajorExamRating; amount: number }[];
  };
}

export interface AcademicBonusState {
  week: number;
  period: { start: string; end: string; startDate: Date; endDate: Date };
  remaining: number;
  deductions: { reason: string; amount: number }[];
  examAdjustments: { subject: string; examName?: string; rating: MajorExamRating; amount: number }[];
}

export interface RecentLog {
  id: number;
  type: string;
  amount: number;
  description: string;
  date: string;
}

export interface QuestDisplay {
  id: number;
  title: string;
  reward: number;
  type: string;
  status: QuestProof['status'];
  description: string;
}

export interface PendingProofDisplay {
  id: number;
  player: string;
  questTitle: string;
  type: string;
  date: string;
  reward: number;
}

export interface PlayerData {
  name: string;
  basePool: number;
  weeklyPoolEarned: number;
  weeklyPoolTotal: number;
  studyPoolRemaining: number;
  studyPoolTotal: number;
  monthlyPoolEarned: number;
  monthlyPoolTotal: number;
  monthlyPoolRank?: number | null;
  totalUnlocked: number;
  totalCap: number;
  recentLogs: RecentLog[];
  weeklyQuests: WeeklyQuestState[];
  academicBonus: AcademicBonusState[];
}

export interface GrowSyncData {
  playerData: PlayerData;
  academicRecords: AcademicRecord[];
  habitLogs: HabitLog[];
  habitProofs: HabitProof[];
  monthlyPoints: MonthlySchoolPoint[];
  quests: QuestDisplay[];
  pendingProofs: PendingProofDisplay[];
}
