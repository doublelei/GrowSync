# GrowSync

游戏化学业追踪与奖励系统，面向高中生设计。通过周一锚定的赛季模式，将学业表现、习惯养成和月度排名转化为可量化的奖金池。

## 奖金池规则

每月总奖金 = 基础池 + 习惯池 + 学业池 + 月度排名池

### 1. 基础保障池 — 固定 ¥400/月

每月固定发放，不受任何条件影响。

### 2. 每周习惯池 — 每周最高 ¥100

| 任务 | 奖金 | 达标条件 |
|------|------|---------|
| 运动 | ¥50 | 当周**周末**（周六或周日）完成一次运动打卡 |
| 阅读 | ¥50 | 当周**周末**（周六或周日）完成一次阅读打卡 |

- 工作日打卡不计入奖金（但会记录）
- 每周独立结算，不跨周累计

### 3. 每周学业表现池 — 每周基础 ¥50，触发 Strike 则扣减

每次 Strike 扣 ¥15，每周学业池 = max(0, 50 - Strike数 x 15)

**Strike 触发条件**（仅限小测 `micro_test`，大考不计入）：

| 条件 | 说明 |
|------|------|
| 英语 < 90 分 | 英语小测低于 90 分 |
| 其他科目 < 95 分 | 数学、语文、理综小测低于 95 分 |
| 不及格 < 60 分 | 任何科目低于 60 分 |
| 重测 (is_retest) | 标记为重测的成绩 |

- 一条成绩记录只算一个 Strike（即使同时满足多个条件）
- 大考（`major_exam`）记录不影响学业池，仅作档案追踪

### 4. 月度排名池 — 最高 ¥200

根据月底校内排名发放：

| 排名 | 奖金 |
|------|------|
| 前 10 名 | ¥200 |
| 前 20 名 | ¥100 |
| 前 30 名 | ¥50 |
| 30 名以后 | ¥0 |

- 需要手动录入月度排名数据
- 未录入排名时该池为 ¥0

## 赛季时间模型

采用**周一锚定**模式，彻底解耦自然月和周：

- 每个完整周为 **周一 ~ 周日**（7 天）
- 一个周属于其**周一所在的自然月**
- 最后一周的周末可能延伸到下月（如 3/30 周一的周属于三月，其周日 4/5 也归三月赛季）
- 月初周一之前的天数属于**上月最后一周**

示例 — 2026 年 3 月有 5 个周一：
```
第 1 周: 3/2 (Mon) – 3/8 (Sun)
第 2 周: 3/9 (Mon) – 3/15 (Sun)
第 3 周: 3/16 (Mon) – 3/22 (Sun)
第 4 周: 3/23 (Mon) – 3/29 (Sun)
第 5 周: 3/30 (Mon) – 4/5 (Sun)  ← 周日在四月，但归属三月赛季
```

3/1（Sun）属于 2 月最后一周，不计入 3 月赛季。

**月度奖金上限动态调整**：5 个周一的月份 → 习惯池上限 ¥500、学业池上限 ¥250；4 个周一的月份相应为 ¥400、¥200。

## 技术栈

- **前端**: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- **UI**: shadcn/ui + 自定义组件
- **数据库**: Supabase (PostgreSQL)，实时订阅自动刷新
- **部署**: Vercel

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（参考 .env.example）
cp .env.example .env.local
# 填入 Supabase URL 和 Anon Key

# 3. 初始化数据库（在 Supabase SQL Editor 中运行）
# supabase-schema-update.sql

# 4. 注入测试数据
npm run db:test-data

# 5. 启动开发服务器
npm run dev
```

## 数据库脚本

| 命令 | 说明 |
|------|------|
| `npm run db:seed` | 注入基础种子数据 |
| `npm run db:test-data` | 注入完整测试数据（Feb + March 2026） |
| `npm run db:clear-test` | 清除所有测试数据 |
| `npm run db:check` | 查看当前 academic_records 表内容 |
| `npm run db:test` | 测试 Supabase 连接 |

## 项目结构

```
src/
  app/page.tsx                  主页面（4 Tab 导航 + 月份切换）
  components/tabs/
    dashboard-tab.tsx           数据大屏（四大奖金池总览）
    quests-tab.tsx              任务大厅（每周自动生成运动+阅读任务）
    academic-tab.tsx            学业档案（HUD + 成绩大表 + 打卡/排名）
    admin-tab.tsx               管理工具（录入 + 删除 + 审批）
  hooks/useGrowSyncData.ts      数据加载 Hook（组合 queries + calculations）
  lib/
    calculations.ts             纯业务逻辑（奖金池计算，无 DB 依赖）
    queries.ts                  Supabase 查询层
    date-utils.ts               赛季时间模型（周一锚定）
    types.ts                    TypeScript 类型定义
    supabase.ts                 Supabase 客户端
scripts/                        数据库管理脚本
supabase-schema-update.sql      数据库 Schema（含去重约束）
```
