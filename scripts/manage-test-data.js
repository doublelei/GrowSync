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

const action = process.argv[2];

async function seedData() {
  console.log("Seeding test data...");

  const dictations = [
    { player_id: '雷雨声', event_date: '2026-03-27', event_type: 'micro_test', subject: '英语', score: 90, max_score: 100 },
    { player_id: '雷雨声', event_date: '2026-03-27', event_type: 'micro_test', subject: '语文', score: 95, max_score: 100 },
    { player_id: '雷雨声', event_date: '2026-03-27', event_type: 'micro_test', subject: '理综', score: 100, max_score: 100 },
    { player_id: '雷雨声', event_date: '2026-03-28', event_type: 'micro_test', subject: '数学', score: 98, max_score: 100 },
    { player_id: '雷雨声', event_date: '2026-03-29', event_type: 'micro_test', subject: '英语', score: 75, max_score: 100, is_retest: true, notes: "重测后成绩" },
    { player_id: '雷雨声', event_date: '2026-03-30', event_type: 'micro_test', subject: '数学', score: 91, max_score: 100, is_retest: true },
  ];

  const majorExams = [
    {
      player_id: '雷雨声',
      event_date: '2026-03-27',
      event_type: 'major_exam',
      subject: '英语',
      exam_name: '第九单元 L1-L4测评',
      score: 76.5,
      max_score: 100,
      class_avg: 65.76,
      highest_score: 92,
      class_rank: 10
    }
  ];

  const points = [
    { player_id: '雷雨声', month_id: '2026-03', total_score: 25, rank: 12, notes: '学习+1+1+4+3+1，周积分+1+6+3+4' }
  ];

  const habits = [
    { player_id: '雷雨声', log_date: '2026-03-26', habit_type: '运动' },
    { player_id: '雷雨声', log_date: '2026-03-26', habit_type: '阅读' },
    { player_id: '雷雨声', log_date: '2026-03-27', habit_type: '阅读' },
    { player_id: '雷雨声', log_date: '2026-03-28', habit_type: '运动' },
  ];

  let res;

  console.log("  Inserting micro tests...");
  res = await supabase.from('academic_records').insert(dictations);
  if (res.error) return console.error(res.error);

  console.log("  Inserting major exams...");
  res = await supabase.from('academic_records').insert(majorExams);
  if (res.error) return console.error(res.error);

  console.log("  Inserting monthly points...");
  res = await supabase.from('monthly_school_points').insert(points);
  if (res.error) return console.error(res.error);

  console.log("  Inserting habit logs...");
  res = await supabase.from('habit_logs').insert(habits);
  if (res.error) return console.error(res.error);

  console.log("Test data seeded successfully!");
}

async function clearData() {
  console.log("Clearing test data...");
  const playerId = '雷雨声';

  await supabase.from('academic_records').delete().eq('player_id', playerId);
  await supabase.from('monthly_school_points').delete().eq('player_id', playerId);
  await supabase.from('habit_logs').delete().eq('player_id', playerId);

  console.log("All test data cleared!");
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
