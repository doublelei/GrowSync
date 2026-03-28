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

// ── March 2026 Week Map ──
// Partial week: 3/1 (Sun)
// Week 1: 3/2 (Mon) - 3/8 (Sun)
// Week 2: 3/9 (Mon) - 3/15 (Sun)
// Week 3: 3/16 (Mon) - 3/22 (Sun)  ← empty week (no data)
// Week 4: 3/23 (Mon) - 3/29 (Sun)
// Week 5: 3/30 (Mon) - 3/31 (Tue)

async function seedData() {
  console.log("Seeding comprehensive test data for March 2026...\n");

  // ── 1. Micro Tests ──
  // Covers: partial week, normal pass, threshold edge, below threshold,
  //         retest, fail (<60), multi-strike week, empty week
  const microTests = [
    // Partial week (3/1 Sun) — test that partial week captures data
    { player_id: P, event_date: '2026-03-01', event_type: 'micro_test', subject: '英语', score: 88, max_score: 100, notes: '部分周测试：英语<90 应触发strike' },

    // Week 1 (3/2-3/8) — clean week, all pass
    { player_id: P, event_date: '2026-03-03', event_type: 'micro_test', subject: '英语', score: 95, max_score: 100 },
    { player_id: P, event_date: '2026-03-04', event_type: 'micro_test', subject: '数学', score: 98, max_score: 100 },
    { player_id: P, event_date: '2026-03-05', event_type: 'micro_test', subject: '语文', score: 96, max_score: 100 },

    // Week 2 (3/9-3/15) — fail (<60) + retest, tests "不及格惩扣" + "重考惩扣"
    { player_id: P, event_date: '2026-03-10', event_type: 'micro_test', subject: '英语', score: 55, max_score: 100, notes: '听写大面积错误，不及格' },
    { player_id: P, event_date: '2026-03-11', event_type: 'micro_test', subject: '数学', score: 93, max_score: 100, notes: '数学<95 应触发strike' },
    { player_id: P, event_date: '2026-03-12', event_type: 'micro_test', subject: '英语', score: 72, max_score: 100, is_retest: true, notes: '重测补救' },
    { player_id: P, event_date: '2026-03-13', event_type: 'micro_test', subject: '理综', score: 100, max_score: 100 },

    // Week 3 (3/16-3/22) — completely empty, no records at all

    // Week 4 (3/23-3/29) — threshold edge cases + multi-strike
    { player_id: P, event_date: '2026-03-23', event_type: 'micro_test', subject: '英语', score: 90, max_score: 100, notes: '英语刚好90，不触发' },
    { player_id: P, event_date: '2026-03-24', event_type: 'micro_test', subject: '语文', score: 95, max_score: 100, notes: '语文刚好95，不触发' },
    { player_id: P, event_date: '2026-03-25', event_type: 'micro_test', subject: '数学', score: 94, max_score: 100, notes: '数学94<95 触发strike' },
    { player_id: P, event_date: '2026-03-25', event_type: 'micro_test', subject: '理综', score: 88, max_score: 100, notes: '理综88<95 触发strike' },
    { player_id: P, event_date: '2026-03-26', event_type: 'micro_test', subject: '英语', score: 75, max_score: 100, is_retest: true, notes: '重测成绩' },
    { player_id: P, event_date: '2026-03-27', event_type: 'micro_test', subject: '语文', score: 97, max_score: 100 },

    // Week 5 (3/30-3/31) — retest only
    { player_id: P, event_date: '2026-03-30', event_type: 'micro_test', subject: '数学', score: 91, max_score: 100, is_retest: true },
  ];

  // ── 2. Major Exams (don't affect strike pool) ──
  const majorExams = [
    {
      player_id: P,
      event_date: '2026-03-13',
      event_type: 'major_exam',
      subject: '英语',
      exam_name: '第九单元 L1-L4测评',
      score: 76.5,
      max_score: 100,
      class_avg: 65.76,
      highest_score: 92,
      class_rank: 10
    },
    {
      player_id: P,
      event_date: '2026-03-27',
      event_type: 'major_exam',
      subject: '数学',
      exam_name: '期中模拟测试',
      score: 82,
      max_score: 120,
      class_avg: 75.3,
      highest_score: 108,
      class_rank: 8
    },
  ];

  // ── 3. Habit Logs ──
  // Mix of weekday (no reward) and weekend (reward) check-ins
  const habits = [
    // Week 1: both weekend habits → ¥100
    { player_id: P, log_date: '2026-03-07', habit_type: '运动' },  // Sat
    { player_id: P, log_date: '2026-03-08', habit_type: '阅读' },  // Sun

    // Week 2: only exercise on weekend → ¥50
    { player_id: P, log_date: '2026-03-10', habit_type: '阅读' },  // Tue (weekday, no reward)
    { player_id: P, log_date: '2026-03-14', habit_type: '运动' },  // Sat

    // Week 3: empty — no habits at all → ¥0

    // Week 4: both weekend habits → ¥100
    { player_id: P, log_date: '2026-03-26', habit_type: '阅读' },  // Thu (weekday, no reward)
    { player_id: P, log_date: '2026-03-28', habit_type: '运动' },  // Sat
    { player_id: P, log_date: '2026-03-29', habit_type: '阅读' },  // Sun

    // Week 5: no weekend days (Mon-Tue only) → ¥0
  ];

  // ── 4. Monthly School Points ──
  const points = [
    { player_id: P, month_id: '2026-03', total_score: 25, rank: 12, notes: '学习+1+1+4+3+1，周积分+1+6+3+4' },
  ];

  // ── Insert ──
  let res;

  console.log("  Inserting micro tests (" + microTests.length + " records)...");
  res = await supabase.from('academic_records').insert(microTests);
  if (res.error) return console.error("  FAIL:", res.error.message);

  console.log("  Inserting major exams (" + majorExams.length + " records)...");
  res = await supabase.from('academic_records').insert(majorExams);
  if (res.error) return console.error("  FAIL:", res.error.message);

  console.log("  Inserting monthly points...");
  res = await supabase.from('monthly_school_points').upsert(points, { onConflict: 'player_id,month_id' });
  if (res.error) return console.error("  FAIL:", res.error.message);

  console.log("  Inserting habit logs (" + habits.length + " records)...");
  res = await supabase.from('habit_logs').upsert(habits, { onConflict: 'player_id,log_date,habit_type' });
  if (res.error) return console.error("  FAIL:", res.error.message);

  console.log("\nDone! Expected results:");
  console.log("  Partial (3/1):      Strike 1 (英语88<90)         → ¥35 | habits ¥0");
  console.log("  Week 1 (3/2-3/8):   Strike 0                     → ¥50 | habits ¥100 (Sat运动+Sun阅读)");
  console.log("  Week 2 (3/9-3/15):  Strike 3 (不及格+分值不达标+重考) → ¥5  | habits ¥50  (Sat运动 only)");
  console.log("  Week 3 (3/16-3/22): Strike 0 (empty week)        → ¥50 | habits ¥0");
  console.log("  Week 4 (3/23-3/29): Strike 3 (数学+理综不达标+重考)  → ¥5  | habits ¥100 (Sat运动+Sun阅读)");
  console.log("  Week 5 (3/30-3/31): Strike 1 (数学重考)           → ¥35 | habits ¥0");
  console.log("  Monthly rank 12 → ¥100");
  console.log("  Total = ¥400 + ¥250 + ¥180 + ¥100 = ¥930");
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
