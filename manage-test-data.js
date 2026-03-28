import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ 初始化失败：缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY 请检查 .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const action = process.argv[2];

async function seedData() {
  console.log("🌱 正在注入仿真测试数据...");

  // 1. 注入黄纸条小测听写 (包含重测)
  const dictations = [
    { player_id: '雷雨声', event_date: '2026-03-27', event_type: 'micro_test', subject: '英语', score: 90, max_score: 100 },
    { player_id: '雷雨声', event_date: '2026-03-27', event_type: 'micro_test', subject: '语文', score: 95, max_score: 100 },
    { player_id: '雷雨声', event_date: '2026-03-27', event_type: 'micro_test', subject: '理综', score: 100, max_score: 100 },
    { player_id: '雷雨声', event_date: '2026-03-28', event_type: 'micro_test', subject: '数学', score: 98, max_score: 100 },
    // 重测数据
    { player_id: '雷雨声', event_date: '2026-03-29', event_type: 'micro_test', subject: '英语', score: 75, max_score: 100, is_retest: true, notes: "黑色成绩为重测后成绩" },
    { player_id: '雷雨声', event_date: '2026-03-30', event_type: 'micro_test', subject: '数学', score: 91, max_score: 100, is_retest: true },
  ];

  // 2. 注入大考成绩 (小程序截图数据)
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

  // 3. 注入当月底操行积分总结 (黑板积分图)
  const points = [
    { player_id: '雷雨声', month_id: '2026-03', total_score: 25, rank: 12, notes: '学习+1+1+4+3+1，周积分+1+6+3+4' }
  ];

  // 4. 模拟几天连续课外打卡
  const habits = [
    { player_id: '雷雨声', log_date: '2026-03-26', habit_type: '运动' },
    { player_id: '雷雨声', log_date: '2026-03-26', habit_type: '阅读' },
    { player_id: '雷雨声', log_date: '2026-03-27', habit_type: '阅读' },
    { player_id: '雷雨声', log_date: '2026-03-28', habit_type: '运动' },
  ];

  // Start Insertions
  console.log("   ➤ 注入小测...");
  let res = await supabase.from('academic_records').insert(dictations);
  if (res.error) return console.error(res.error);

  console.log("   ➤ 注入单元大考...");
  res = await supabase.from('academic_records').insert(majorExams);
  if (res.error) return console.error(res.error);

  console.log("   ➤ 注入在校操行分...");
  res = await supabase.from('monthly_school_points').insert(points);
  if (res.error) return console.error(res.error);

  console.log("   ➤ 注入课外打卡...");
  res = await supabase.from('habit_logs').insert(habits);
  if (res.error) return console.error(res.error);

  console.log("✅ 仿真数据 (黄纸条/小程序记录) 已全部成功注入数据库中！即刻刷新页面查看大表。");
}

async function clearData() {
  console.log("🗑️ 正在清除学业表单测试数据...");
  // Clear only data belonging to 雷雨声
  const playerId = '雷雨声';
  
  await supabase.from('academic_records').delete().eq('player_id', playerId);
  await supabase.from('monthly_school_points').delete().eq('player_id', playerId);
  await supabase.from('habit_logs').delete().eq('player_id', playerId);

  console.log("✅ 干净收场：大屏上的学业、积分、打卡记录已全部卸载！");
}

if (action === 'seed') {
  seedData();
} else if (action === 'clear') {
  clearData();
} else {
  console.log(`
  🛠 测试数据管理器使用说明:
  ----------------------------
  插入仿真测试数据:  node manage-test-data.js seed
  一键清空测试数据:  node manage-test-data.js clear
  `);
}
