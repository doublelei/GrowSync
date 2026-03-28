import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const P = '雷雨声';
const action = process.argv[2];

// ═══════════════════════════════════════════════════════════
// February 2026 — 4 Mondays (2/2, 2/9, 2/16, 2/23)
// Feb 1 (Sun) belongs to Jan's last week
// Week 4 extends to 3/1 (Sun) — 3/1 belongs to Feb season
// ═══════════════════════════════════════════════════════════

const febMicroTests = [
  // Week 1 (2/2-2/8): solid performance
  { player_id: P, event_date: '2026-02-03', event_type: 'micro_test', subject: '英语', score: 92, max_score: 100 },
  { player_id: P, event_date: '2026-02-04', event_type: 'micro_test', subject: '数学', score: 97, max_score: 100 },
  { player_id: P, event_date: '2026-02-05', event_type: 'micro_test', subject: '语文', score: 96, max_score: 100 },

  // Week 2 (2/9-2/15): one strike (英语 below 90)
  { player_id: P, event_date: '2026-02-10', event_type: 'micro_test', subject: '英语', score: 85, max_score: 100, notes: '英语85<90' },
  { player_id: P, event_date: '2026-02-11', event_type: 'micro_test', subject: '数学', score: 99, max_score: 100 },

  // Week 3 (2/16-2/22): retest + fail, heavy strike week
  { player_id: P, event_date: '2026-02-17', event_type: 'micro_test', subject: '语文', score: 50, max_score: 100, notes: '不及格' },
  { player_id: P, event_date: '2026-02-18', event_type: 'micro_test', subject: '语文', score: 68, max_score: 100, is_retest: true, notes: '重测补救' },
  { player_id: P, event_date: '2026-02-19', event_type: 'micro_test', subject: '英语', score: 91, max_score: 100 },

  // Week 4 (2/23-3/1): test cross-month — 3/1 belongs to Feb season
  { player_id: P, event_date: '2026-02-25', event_type: 'micro_test', subject: '英语', score: 93, max_score: 100 },
  { player_id: P, event_date: '2026-03-01', event_type: 'micro_test', subject: '数学', score: 90, max_score: 100, notes: '3/1 Sun 归属二月W4，数学90<95 触发strike' },
];

const febMajorExams = [
  {
    player_id: P, event_date: '2026-02-14', event_type: 'major_exam', subject: '英语',
    exam_name: '期末模拟测试', score: 81, max_score: 100,
    class_avg: 72.5, highest_score: 95, class_rank: 6
  },
];

const febHabits = [
  // Week 1: both → ¥100
  { player_id: P, log_date: '2026-02-07', habit_type: '运动' },  // Sat
  { player_id: P, log_date: '2026-02-08', habit_type: '阅读' },  // Sun
  // Week 2: exercise only → ¥50
  { player_id: P, log_date: '2026-02-14', habit_type: '运动' },  // Sat
  // Week 3: none → ¥0
  // Week 4: both (weekend is 2/28 Sat + 3/1 Sun) → ¥100
  { player_id: P, log_date: '2026-02-28', habit_type: '阅读' },  // Sat
  { player_id: P, log_date: '2026-03-01', habit_type: '运动' },  // Sun (belongs to Feb W4)
];

const febPoints = [
  { player_id: P, month_id: '2026-02', total_score: 30, rank: 8, notes: '表现优秀，前10名' },
];

// ═══════════════════════════════════════════════════════════
// March 2026 — 5 Mondays (3/2, 3/9, 3/16, 3/23, 3/30)
// 3/1 (Sun) belongs to Feb W4
// Week 5 extends to 4/5 (Sun)
// ═══════════════════════════════════════════════════════════

const marMicroTests = [
  // Week 1 (3/2-3/8): clean week, all pass
  { player_id: P, event_date: '2026-03-03', event_type: 'micro_test', subject: '英语', score: 95, max_score: 100 },
  { player_id: P, event_date: '2026-03-04', event_type: 'micro_test', subject: '数学', score: 98, max_score: 100 },
  { player_id: P, event_date: '2026-03-05', event_type: 'micro_test', subject: '语文', score: 96, max_score: 100 },

  // Week 2 (3/9-3/15): fail + below threshold + retest = 3 strikes
  { player_id: P, event_date: '2026-03-10', event_type: 'micro_test', subject: '英语', score: 55, max_score: 100, notes: '不及格' },
  { player_id: P, event_date: '2026-03-11', event_type: 'micro_test', subject: '数学', score: 93, max_score: 100, notes: '数学93<95' },
  { player_id: P, event_date: '2026-03-12', event_type: 'micro_test', subject: '英语', score: 72, max_score: 100, is_retest: true, notes: '重测' },
  { player_id: P, event_date: '2026-03-13', event_type: 'micro_test', subject: '理综', score: 100, max_score: 100 },

  // Week 3 (3/16-3/22): completely empty — no records

  // Week 4 (3/23-3/29): threshold edges + multi-strike
  { player_id: P, event_date: '2026-03-23', event_type: 'micro_test', subject: '英语', score: 90, max_score: 100, notes: '刚好90不触发' },
  { player_id: P, event_date: '2026-03-24', event_type: 'micro_test', subject: '语文', score: 95, max_score: 100, notes: '刚好95不触发' },
  { player_id: P, event_date: '2026-03-25', event_type: 'micro_test', subject: '数学', score: 94, max_score: 100, notes: '94<95 strike' },
  { player_id: P, event_date: '2026-03-25', event_type: 'micro_test', subject: '理综', score: 88, max_score: 100, notes: '88<95 strike' },
  { player_id: P, event_date: '2026-03-26', event_type: 'micro_test', subject: '英语', score: 75, max_score: 100, is_retest: true, notes: '重测' },
  { player_id: P, event_date: '2026-03-27', event_type: 'micro_test', subject: '语文', score: 97, max_score: 100 },

  // Week 5 (3/30-4/5): retest only
  { player_id: P, event_date: '2026-03-30', event_type: 'micro_test', subject: '数学', score: 91, max_score: 100, is_retest: true },
];

const marMajorExams = [
  {
    player_id: P, event_date: '2026-03-13', event_type: 'major_exam', subject: '英语',
    exam_name: '第九单元 L1-L4测评', score: 76.5, max_score: 100,
    class_avg: 65.76, highest_score: 92, class_rank: 10
  },
  {
    player_id: P, event_date: '2026-03-27', event_type: 'major_exam', subject: '数学',
    exam_name: '期中模拟测试', score: 82, max_score: 120,
    class_avg: 75.3, highest_score: 108, class_rank: 8
  },
];

const marHabits = [
  // Week 1 (3/2-3/8): both weekend → ¥100
  { player_id: P, log_date: '2026-03-07', habit_type: '运动' },  // Sat
  { player_id: P, log_date: '2026-03-08', habit_type: '阅读' },  // Sun
  // Week 2 (3/9-3/15): exercise only → ¥50
  { player_id: P, log_date: '2026-03-10', habit_type: '阅读' },  // Tue (no reward)
  { player_id: P, log_date: '2026-03-14', habit_type: '运动' },  // Sat
  // Week 3 (3/16-3/22): none → ¥0
  // Week 4 (3/23-3/29): both weekend → ¥100
  { player_id: P, log_date: '2026-03-26', habit_type: '阅读' },  // Thu (no reward)
  { player_id: P, log_date: '2026-03-28', habit_type: '运动' },  // Sat
  { player_id: P, log_date: '2026-03-29', habit_type: '阅读' },  // Sun
  // Week 5 (3/30-4/5): weekend in April → ¥100
  { player_id: P, log_date: '2026-04-04', habit_type: '运动' },  // Sat
  { player_id: P, log_date: '2026-04-05', habit_type: '阅读' },  // Sun
];

const marPoints = [
  { player_id: P, month_id: '2026-03', total_score: 25, rank: 12, notes: '学习+1+1+4+3+1，周积分+1+6+3+4' },
];

const questProofs = [
  { player_id: P, quest_title: '体能训练', quest_type: '运动', status: 'pending', reward_amount: 50 },
  { player_id: P, quest_title: '知识拓展', quest_type: '阅读', status: 'under_review', reward_amount: 50 },
  { player_id: P, quest_title: '每日晨跑', quest_type: '运动', status: 'approved', reward_amount: 50 },
  { player_id: P, quest_title: '课外阅读笔记', quest_type: '阅读', status: 'pending', reward_amount: 50 },
];

// ═══════════════════════════════════════════════════════════

async function seedData() {
  console.log("Seeding Feb + March 2026 test data...\n");
  const inserts = [
    ['Feb micro tests', 'academic_records', febMicroTests],
    ['Feb major exams', 'academic_records', febMajorExams],
    ['Feb habits', 'habit_logs', febHabits],
    ['March micro tests', 'academic_records', marMicroTests],
    ['March major exams', 'academic_records', marMajorExams],
    ['March habits', 'habit_logs', marHabits],
    ['Quest proofs', 'quest_proofs', questProofs],
  ];

  for (const [label, table, data] of inserts) {
    console.log(`  ${label} (${data.length})...`);
    const res = await supabase.from(table).insert(data);
    if (res.error) { console.error(`  FAIL: ${res.error.message}`); return; }
  }

  // Upsert monthly points (dedup safe)
  console.log("  Monthly points...");
  const allPoints = [...febPoints, ...marPoints];
  const res = await supabase.from('monthly_school_points').upsert(allPoints, { onConflict: 'player_id,month_id' });
  if (res.error) { console.error(`  FAIL: ${res.error.message}`); return; }

  console.log("\n=== February 2026 (4 weeks) ===");
  console.log("  W1 (2/2-2/8):   Strike 0 → ¥50 | habits ¥100");
  console.log("  W2 (2/9-2/15):  Strike 1 (英语85<90) → ¥35 | habits ¥50");
  console.log("  W3 (2/16-2/22): Strike 2 (不及格+重考) → ¥20 | habits ¥0");
  console.log("  W4 (2/23-3/1):  Strike 1 (数学90<95) → ¥35 | habits ¥100");
  console.log("  Rank 8 → ¥200");
  console.log("  Total: ¥400 + ¥250 + ¥140 + ¥200 = ¥990 / ¥1000");

  console.log("\n=== March 2026 (5 weeks) ===");
  console.log("  W1 (3/2-3/8):   Strike 0 → ¥50 | habits ¥100");
  console.log("  W2 (3/9-3/15):  Strike 3 (不及格+不达标+重考) → ¥5 | habits ¥50");
  console.log("  W3 (3/16-3/22): Strike 0 (empty) → ¥50 | habits ¥0");
  console.log("  W4 (3/23-3/29): Strike 3 (数学+理综不达标+重考) → ¥5 | habits ¥100");
  console.log("  W5 (3/30-4/5):  Strike 1 (数学重考) → ¥35 | habits ¥100");
  console.log("  Rank 12 → ¥100");
  console.log("  Total: ¥400 + ¥350 + ¥145 + ¥100 = ¥995 / ¥1350");
}

async function clearData() {
  console.log("Clearing all test data...");
  await supabase.from('academic_records').delete().eq('player_id', P);
  await supabase.from('monthly_school_points').delete().eq('player_id', P);
  await supabase.from('habit_logs').delete().eq('player_id', P);
  await supabase.from('transactions').delete().eq('player_id', P);
  await supabase.from('quest_proofs').delete().eq('player_id', P);
  console.log("All data cleared!");
}

if (action === 'seed') {
  seedData();
} else if (action === 'clear') {
  clearData();
} else {
  console.log(`
  Usage:
  ------
  Seed test data:   node scripts/manage-test-data.js seed
  Clear test data:  node scripts/manage-test-data.js clear
  `);
}
