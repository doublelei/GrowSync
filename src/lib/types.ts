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
  
  // Extended Optional Fields for deep academic tracking
  exam_name?: string;     // for unit tests e.g. 'U9L1'
  class_avg?: number;     // class average
  highest_score?: number; // class highest
  class_rank?: number;    // student's rank
  is_retest?: boolean;    // for micro_tests (e.g., F to 75)
  
  created_at: string;
}

export interface MonthlySchoolPoint {
  id: string;
  player_id: string;
  month_id: string;      // e.g. '2026-03'
  total_score: number;   // e.g. 25
  rank?: number; // Added for the 4-module ranking tiers
  notes?: string;
  created_at: string;
}

export interface HabitLog {
  id: number;
  player_id: string;
  log_date: string;
  habit_type: '阅读' | '运动';
  created_at: string;
}

export interface WeekPeriod {
  start: string;
  end: string;
  startDate: Date;
  endDate: Date;
}

export interface WeeklyQuestState {
  week: number;
  period: WeekPeriod;
  exercise: { earned: number; status: 'pending' | 'completed' };
  reading: { earned: number; status: 'pending' | 'completed' };
}

export interface AcademicBonusState {
  week: number;
  period: WeekPeriod;
  remaining: number;
  deductions: { reason: string; amount: number }[];
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
  totalUnlocked: number;
  totalCap: number;
  recentLogs: { id: number; type: string; amount: number; description: string; date: string }[];
  weeklyQuests: WeeklyQuestState[];
  academicBonus: AcademicBonusState[];
}
