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

async function seed() {
  console.log("Seeding real test data into Supabase...");

  console.log("  Inserting transactions...");
  await supabase.from('transactions').insert([
    { player_id: '雷雨声', amount: 400, transaction_type: 'earned', description: '基础保障资金 (当月)' },
    { player_id: '雷雨声', amount: 50, transaction_type: 'earned', description: '第 1 周：运动打卡核销' },
    { player_id: '雷雨声', amount: 50, transaction_type: 'earned', description: '第 1 周：阅读打卡核销' },
    { player_id: '雷雨声', amount: -50, transaction_type: 'deducted', description: '第 2 周学业风控：触发F级处分' },
  ]);

  console.log("  Inserting academic records...");
  await supabase.from('academic_records').insert([
    { player_id: '雷雨声', event_date: '2026-03-05', event_type: 'micro_test', subject: '英语', score: 65, max_score: 100, notes: '听写大面积错误' },
    { player_id: '雷雨声', event_date: '2026-03-12', event_type: 'micro_test', subject: '英语', score: 85, max_score: 100, notes: '状态回暖，表现良好' },
  ]);

  console.log("  Inserting quest proofs...");
  await supabase.from('quest_proofs').insert([
    { player_id: '雷雨声', quest_title: '体能训练', quest_type: '运动', status: 'pending', reward_amount: 50 },
    { player_id: '雷雨声', quest_title: '知识拓展', quest_type: '阅读', status: 'under_review', reward_amount: 50 },
  ]);

  console.log("Database seeded successfully!");
}

seed();
