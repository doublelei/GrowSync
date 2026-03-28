const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const lines = envFile.split('\n');
let url = '';
let key = '';

lines.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function seed() {
  console.log("Seeding real test data into Supabase...");

  // Transactions
  console.log("Inserting transactions...");
  await supabase.from('transactions').insert([
    { player_id: '雷雨声', amount: 400, transaction_type: 'earned', description: '基础保障资金 (当月)' },
    { player_id: '雷雨声', amount: 50, transaction_type: 'earned', description: '第 1 周：运动打卡核销' },
    { player_id: '雷雨声', amount: 50, transaction_type: 'earned', description: '第 1 周：阅读打卡核销' },
    { player_id: '雷雨声', amount: -50, transaction_type: 'deducted', description: '第 2 周学业风控：触发F级处分' },
  ]);

  // Academic Records
  console.log("Inserting academic records...");
  await supabase.from('academic_records').insert([
    { player_id: '雷雨声', event_date: '2026-03-05', event_type: '单页小测', subject: '英语', score: 65, max_score: 100, notes: '听写大面积错误' },
    { player_id: '雷雨声', event_date: '2026-03-12', event_type: '周作业考核', subject: '英语', score: 85, max_score: 100, notes: '状态回暖，表现良好' },
  ]);

  // Quest Proofs
  console.log("Inserting quest proofs...");
  await supabase.from('quest_proofs').insert([
    { player_id: '雷雨声', quest_title: '体能训练', quest_type: '运动', status: 'pending', reward_amount: 50, week_start_date: '2026-03-09' },
    { player_id: '雷雨声', quest_title: '知识拓展', quest_type: '阅读', status: 'under_review', reward_amount: 50, week_start_date: '2026-03-09' },
  ]);
  
  console.log("Database seeded successfully!");
}

seed();
