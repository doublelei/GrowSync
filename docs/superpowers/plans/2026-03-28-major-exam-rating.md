# Major Exam Rating System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-tier rating system (bonus/neutral/penalty) for major exams that integrates into the weekly academic pool, with auto-suggestion and manual admin confirmation.

**Architecture:** Extend the existing `academic_records` table with two new columns (`major_exam_rating`, `rating_reason`). Add a pure `suggestRating()` function in calculations.ts. Extend the weekly academic pool formula to include confirmed exam adjustments. Add rating confirmation UI in admin-tab and display in dashboard-tab.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase (PostgreSQL), Tailwind CSS v4, shadcn/ui, TanStack Query

**Spec:** `docs/superpowers/specs/2026-03-28-major-exam-rating-design.md`

---

### Task 1: Database Schema — Add rating columns

**Files:**
- Modify: `scripts/supabase-schema-update.sql:78-82`

- [ ] **Step 1: Add migration statements**

Append after line 82 in the "Incremental column additions" section:

```sql
ALTER TABLE academic_records ADD COLUMN IF NOT EXISTS major_exam_rating TEXT CHECK (major_exam_rating IN ('bonus', 'neutral', 'penalty'));
ALTER TABLE academic_records ADD COLUMN IF NOT EXISTS rating_reason TEXT;
```

- [ ] **Step 2: Run migration manually**

Run the two ALTER TABLE statements in the Supabase SQL Editor (or via `psql`). These are idempotent — safe to re-run.

- [ ] **Step 3: Commit**

```bash
git add scripts/supabase-schema-update.sql
git commit -m "feat(db): add major_exam_rating and rating_reason columns"
```

---

### Task 2: Types & Constants — Add rating types and thresholds

**Files:**
- Modify: `src/lib/types.ts:22-37`
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Extend AcademicRecord type**

In `src/lib/types.ts`, add two fields to the `AcademicRecord` interface (after line 35 `is_retest`):

```typescript
  major_exam_rating?: 'bonus' | 'neutral' | 'penalty' | null;
  rating_reason?: string | null;
```

Also add the `MajorExamRating` type alias at the top of the file (after line 1):

```typescript
export type MajorExamRating = 'bonus' | 'neutral' | 'penalty';
```

- [ ] **Step 2: Extend WeeklyQuestState and AcademicBonusState types**

In `src/lib/types.ts`, extend the `academic` field in `WeeklyQuestState` (line 89). Replace:

```typescript
  academic: { earned: number; strikes: number; deductions: { reason: string; amount: number }[] };
```

With:

```typescript
  academic: {
    earned: number;
    strikes: number;
    deductions: { reason: string; amount: number }[];
    examAdjustments: { subject: string; examName?: string; rating: MajorExamRating; amount: number }[];
  };
```

Extend `AcademicBonusState` (after line 96 `deductions`). Add:

```typescript
  examAdjustments: { subject: string; examName?: string; rating: MajorExamRating; amount: number }[];
```

- [ ] **Step 3: Add constants**

In `src/lib/constants.ts`, add after line 12 (`STRIKE_PENALTY`):

```typescript
// ── Major Exam Rating ──
export const MAJOR_EXAM_BONUS = 25;
export const MAJOR_EXAM_PENALTY = -25;
export const MAJOR_EXAM_BONUS_SCORE_RATE = 0.9;
export const MAJOR_EXAM_PENALTY_SCORE_RATE = 0.75;
export const MAJOR_EXAM_BONUS_RANK = 3;
export const MAJOR_EXAM_PENALTY_RANK = 9;
export const RATING_REASON_PRESETS = ['试卷偏难', '进步明显', '退步明显', '特殊情况'] as const;
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/constants.ts
git commit -m "feat: add major exam rating types and constants"
```

---

### Task 3: Calculation Logic — suggestRating + weekly pool integration

**Files:**
- Modify: `src/lib/calculations.ts:1-91`

- [ ] **Step 1: Add imports for new constants**

In `src/lib/calculations.ts`, extend the import from `./constants` (lines 18-25) to also include:

```typescript
  MAJOR_EXAM_BONUS,
  MAJOR_EXAM_PENALTY,
  MAJOR_EXAM_BONUS_SCORE_RATE,
  MAJOR_EXAM_PENALTY_SCORE_RATE,
  MAJOR_EXAM_BONUS_RANK,
  MAJOR_EXAM_PENALTY_RANK,
```

Also add `MajorExamRating` to the import from `./types` (line 1-14).

- [ ] **Step 2: Add suggestRating function**

Add before `calculateWeeklyQuests` (before line 29):

```typescript
export function suggestRating(record: AcademicRecord): MajorExamRating {
  const scoreRate = record.score / record.max_score;

  if (scoreRate >= MAJOR_EXAM_BONUS_SCORE_RATE) return 'bonus';
  if (record.highest_score != null && record.score >= record.highest_score) return 'bonus';
  if (record.class_rank != null && record.class_rank <= MAJOR_EXAM_BONUS_RANK) return 'bonus';

  if (scoreRate < MAJOR_EXAM_PENALTY_SCORE_RATE) return 'penalty';
  if (record.class_rank != null && record.class_rank >= MAJOR_EXAM_PENALTY_RANK) return 'penalty';

  return 'neutral';
}

function ratingToAmount(rating: MajorExamRating): number {
  if (rating === 'bonus') return MAJOR_EXAM_BONUS;
  if (rating === 'penalty') return MAJOR_EXAM_PENALTY;
  return 0;
}
```

- [ ] **Step 3: Integrate major exam ratings into calculateWeeklyQuests**

Inside the `weeks.map` callback in `calculateWeeklyQuests` (after the strike calculation block ending at line 76), add major exam processing:

```typescript
    // Major exam rating adjustments (only confirmed ratings)
    const majorExamsThisWeek = academicsWithDate.filter(
      a => a.dateObj >= w.startDate && a.dateObj <= endOfDay
        && a.event_type === 'major_exam'
        && a.major_exam_rating != null,
    );

    const examAdjustments = majorExamsThisWeek.map(a => ({
      subject: a.subject,
      examName: a.exam_name,
      rating: a.major_exam_rating as MajorExamRating,
      amount: ratingToAmount(a.major_exam_rating as MajorExamRating),
    }));

    const examAdjustmentTotal = examAdjustments.reduce((sum, ea) => sum + ea.amount, 0);
    const academicPoolRemaining = Math.max(0, WEEKLY_ACADEMIC_BASE - strikes * STRIKE_PENALTY + examAdjustmentTotal);
```

Note: This replaces the existing `academicPoolRemaining` calculation (line 76). The old line was:
```typescript
    const academicPoolRemaining = Math.max(0, WEEKLY_ACADEMIC_BASE - strikes * STRIKE_PENALTY);
```

- [ ] **Step 4: Update the return object to include examAdjustments**

Update the return object in the `weeks.map` callback (line 88) to include `examAdjustments`:

```typescript
      academic: { earned: academicPoolRemaining, strikes, deductions, examAdjustments },
```

- [ ] **Step 5: Update aggregatePlayerData to pass examAdjustments through to academicBonus**

In `aggregatePlayerData` (around line 128), update the `academicBonus` mapping:

```typescript
  const academicBonus: AcademicBonusState[] = weeklyQuests.map(w => ({
    week: w.week,
    period: w.period,
    remaining: w.academic.earned,
    deductions: w.academic.deductions,
    examAdjustments: w.academic.examAdjustments,
  }));
```

- [ ] **Step 6: Verify the app compiles**

```bash
cd /home/yutian/GrowSync && npx next build 2>&1 | tail -20
```

Expected: Build succeeds (or only warnings, no type errors).

- [ ] **Step 7: Commit**

```bash
git add src/lib/calculations.ts
git commit -m "feat: integrate major exam ratings into weekly academic pool calculation"
```

---

### Task 4: Mutation — Update rating on existing records

**Files:**
- Modify: `src/hooks/useMutations.ts`

- [ ] **Step 1: Add useUpdateMajorExamRating mutation**

Add after `useInsertMajorExam` (after line 175):

```typescript
interface RatingInput {
  recordId: number;
  rating: 'bonus' | 'neutral' | 'penalty';
  reason?: string;
}

export function useUpdateMajorExamRating(monthId: string) {
  const inv = useInvalidate(monthId);
  return useMutation({
    mutationFn: async (input: RatingInput) => {
      const { error } = await supabase
        .from('academic_records')
        .update({
          major_exam_rating: input.rating,
          rating_reason: input.reason ?? null,
        })
        .eq('id', input.recordId);
      if (error) throw error;
    },
    onSuccess: () => inv.academics(),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useMutations.ts
git commit -m "feat: add useUpdateMajorExamRating mutation"
```

---

### Task 5: Admin UI — Rating confirmation for unrated major exams

**Files:**
- Modify: `src/components/tabs/admin-tab.tsx`

- [ ] **Step 1: Add imports**

At the top of `admin-tab.tsx`, add to existing imports:

```typescript
import { useUpdateMajorExamRating } from "@/hooks/useMutations";
import { suggestRating } from "@/lib/calculations";
import { RATING_REASON_PRESETS } from "@/lib/constants";
import type { MajorExamRating } from "@/lib/types";
```

- [ ] **Step 2: Initialize the mutation hook**

Inside the `AdminTab` component, after line 78 (`rejectHabitProof`), add:

```typescript
  const updateRating = useUpdateMajorExamRating(monthId);
```

- [ ] **Step 3: Compute unrated major exams**

After the `pendingHabitProofs` line (line 194), add:

```typescript
  const unratedMajorExams = academicRecords.filter(
    r => r.event_type === 'major_exam' && r.major_exam_rating == null,
  );
```

- [ ] **Step 4: Add the ExamRatingCard component**

Add as a new component at the bottom of the file (before the closing of the module, after the `HabitProofReviewItem` component):

```typescript
function ExamRatingCard({ record, onConfirm, isPending }: {
  record: AcademicRecord;
  onConfirm: (rating: MajorExamRating, reason?: string) => void;
  isPending: boolean;
}) {
  const [selectedRating, setSelectedRating] = useState<MajorExamRating | null>(null);
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);

  const suggested = suggestRating(record);
  const scoreRate = record.score / record.max_score;

  // Build matched conditions list
  const conditions: string[] = [];
  if (scoreRate >= 0.9) conditions.push(`得分率 ${(scoreRate * 100).toFixed(0)}% ≥ 90%`);
  if (record.highest_score != null && record.score >= record.highest_score) conditions.push('最高���');
  if (record.class_rank != null && record.class_rank <= 3) conditions.push(`排名第 ${record.class_rank}`);
  if (scoreRate < 0.75) conditions.push(`得分率 ${(scoreRate * 100).toFixed(0)}% < 75%`);
  if (record.class_rank != null && record.class_rank >= 9) conditions.push(`排名第 ${record.class_rank}`);

  const current = selectedRating ?? suggested;
  const isOverride = selectedRating != null && selectedRating !== suggested;

  const ratingConfig = {
    bonus: { label: '加分 +¥25', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
    neutral: { label: '不变 ¥0', className: 'bg-muted/20 text-foreground border-border/50' },
    penalty: { label: '扣分 -¥25', className: 'bg-destructive/10 text-destructive border-destructive/30' },
  } as const;

  return (
    <div className="p-3 border border-border/50 rounded-md space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono text-muted-foreground">{record.event_date}</span>
            <span className="font-medium">{record.subject}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {record.exam_name} · {record.score}/{record.max_score}
            {record.class_rank != null && ` · 排名第${record.class_rank}`}
            {record.highest_score != null && ` · 最高${record.highest_score}`}
          </div>
        </div>
        <div className={`text-[10px] px-1.5 py-0.5 rounded border ${ratingConfig[suggested].className}`}>
          建议: {ratingConfig[suggested].label}
        </div>
      </div>

      {conditions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {conditions.map((c, i) => (
            <span key={i} className="text-[9px] bg-muted/30 text-muted-foreground px-1.5 py-0.5 rounded">{c}</span>
          ))}
        </div>
      )}

      <div className="flex gap-1.5">
        {(['bonus', 'neutral', 'penalty'] as const).map(r => (
          <button
            key={r}
            onClick={() => {
              setSelectedRating(r);
              setShowReason(r !== suggested);
            }}
            className={`flex-1 text-[10px] py-1.5 rounded border transition-all ${
              current === r
                ? ratingConfig[r].className + ' font-semibold ring-1 ring-offset-1 ring-primary/30'
                : 'bg-muted/10 text-muted-foreground border-border/30 hover:border-border'
            }`}
          >
            {ratingConfig[r].label}
          </button>
        ))}
      </div>

      {showReason && isOverride && (
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1">
            {RATING_REASON_PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => setReason(preset)}
                className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                  reason === preset
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-muted/10 text-muted-foreground border-border/30 hover:border-border'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="自定义原因(选填)"
            className="w-full bg-muted/20 border border-border/50 rounded-md px-2 py-1 text-[10px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      )}

      <Button
        size="sm"
        className="w-full"
        disabled={isPending}
        onClick={() => onConfirm(current, isOverride ? reason || undefined : undefined)}
      >
        {isPending ? '提交中...' : '确认评级'}
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Add the "待评级" section to the admin tab JSX**

In the `AdminTab` return JSX, add a new section after the major exam form section (after line 269, the closing `</Section>` for the major exam form). Only render when there are unrated exams:

```tsx
      {/* 2b. Unrated major exams — rating confirmation */}
      {unratedMajorExams.length > 0 && (
        <Card className="shadow-none border-primary/30 bg-primary/5">
          <div className="p-4 bg-primary/10 border-b border-primary/20">
            <div className="text-sm font-semibold text-foreground">待评级大考</div>
            <div className="text-xs text-muted-foreground mt-0.5">{unratedMajorExams.length} 条大考成绩等待评级</div>
          </div>
          <CardContent className="p-4 space-y-3">
            {unratedMajorExams.map(record => (
              <ExamRatingCard
                key={record.id}
                record={record}
                isPending={updateRating.isPending}
                onConfirm={(rating, reason) => {
                  updateRating.mutate(
                    { recordId: record.id, rating, reason },
                    {
                      onSuccess: () => toast.success(`${record.subject}「${record.exam_name}」评级已确认`),
                      onError: (err) => toast.error("评级失败: " + err.message),
                    },
                  );
                }}
              />
            ))}
          </CardContent>
        </Card>
      )}
```

- [ ] **Step 6: Add rating badge to the records list**

In the academic records list (around line 316-319), update the record display to show rating status. Replace the existing record content div:

```tsx
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-muted-foreground">{r.event_date}</span>
                      <span className="font-medium">{r.subject}</span>
                      {r.is_retest && <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">重测</Badge>}
                      {r.event_type === 'major_exam' && r.major_exam_rating === 'bonus' && (
                        <Badge className="text-[9px] px-1 py-0 h-3.5 bg-emerald-500/20 text-emerald-600 border-emerald-500/30">加分</Badge>
                      )}
                      {r.event_type === 'major_exam' && r.major_exam_rating === 'penalty' && (
                        <Badge className="text-[9px] px-1 py-0 h-3.5 bg-destructive/20 text-destructive border-destructive/30">扣分</Badge>
                      )}
                      {r.event_type === 'major_exam' && r.major_exam_rating === 'neutral' && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">不变</Badge>
                      )}
                      {r.event_type === 'major_exam' && r.major_exam_rating == null && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-orange-400/50 text-orange-500">待评级</Badge>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {r.exam_name || (r.event_type === 'micro_test' ? '小测' : r.event_type === 'major_exam' ? '大��' : r.event_type)} · {r.score}/{r.max_score}
                    </div>
                  </div>
```

- [ ] **Step 7: Verify build**

```bash
cd /home/yutian/GrowSync && npx next build 2>&1 | tail -20
```

- [ ] **Step 8: Commit**

```bash
git add src/components/tabs/admin-tab.tsx src/hooks/useMutations.ts
git commit -m "feat(admin): add major exam rating confirmation UI"
```

---

### Task 6: Dashboard UI — Show exam adjustments in weekly breakdown

**Files:**
- Modify: `src/components/tabs/dashboard-tab.tsx:76-99`

- [ ] **Step 1: Add exam adjustments to the weekly academic display**

In the dashboard academic section, inside the `playerData.academicBonus.map` callback (around lines 86-90), add exam adjustment display after the deductions and before the remaining amount. Replace the inner content of the map:

```tsx
                {playerData.academicBonus.map((w: AcademicBonusState, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-background/40 p-2.5 rounded-md border border-border/30">
                    <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-foreground/80">第 {w.week} 周</span>
                    <span className="text-[9px] text-muted-foreground/60">{w.period.start} - {w.period.end}</span>
                  </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <div className="flex flex-col items-end gap-0.5">
                        {w.deductions.map((d, i) => (
                          <span key={i} className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-sm font-sans text-[10px]">{d.reason}</span>
                        ))}
                        {w.examAdjustments.map((ea, i) => (
                          <span
                            key={`ea-${i}`}
                            className={`px-1.5 py-0.5 rounded-sm font-sans text-[10px] ${
                              ea.rating === 'bonus'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : ea.rating === 'penalty'
                                  ? 'bg-destructive/10 text-destructive'
                                  : 'hidden'
                            }`}
                          >
                            {ea.subject}{ea.examName ? `(${ea.examName})` : ''}: {ea.amount > 0 ? '+' : ''}{ea.amount}
                          </span>
                        ))}
                      </div>
                      <span className={w.remaining === WEEKLY_ACADEMIC_BASE ? "text-foreground" : w.remaining > WEEKLY_ACADEMIC_BASE ? "text-emerald-600 font-bold" : w.remaining > 0 ? "text-orange-500 font-bold" : "text-destructive font-bold"}>
                        本周: &yen;{w.remaining}/{WEEKLY_ACADEMIC_BASE}
                      </span>
                    </div>
                  </div>
                ))}
```

Note the color logic change: `w.remaining > WEEKLY_ACADEMIC_BASE` now shows green (bonus pushed it above base).

- [ ] **Step 2: Verify build**

```bash
cd /home/yutian/GrowSync && npx next build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/tabs/dashboard-tab.tsx
git commit -m "feat(dashboard): show major exam rating adjustments in weekly breakdown"
```

---

### Task 7: Rules Page — Add major exam rating rules

**Files:**
- Modify: `src/app/rules/page.tsx:57-73`

- [ ] **Step 1: Update the academic rules section**

Replace the entire academic Card (lines 57-73) with an expanded version that includes both micro test and major exam rules:

```tsx
        {/* 学习表现 — 小测 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">学习表现奖金 — ���测</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-foreground/80 leading-relaxed">
            <p>每周基础 <span className="font-mono font-semibold">¥100</span>，根据日常小测成绩扣分：</p>
            <div className="bg-muted/10 rounded-md p-3 space-y-1.5">
              <Rule text="英语小测低于 90 分 → 扣 ¥20" warn />
              <Rule text="数学/语文/理综小测低于 95 分 → 扣 ¥20" warn />
              <Rule text="重考的成绩 → 额外扣 ¥20" warn />
            </div>
            <p className="text-muted-foreground text-[10px] pt-1">
              每次扣 ¥20，扣完为止（最低 ¥0）。
            </p>
          </CardContent>
        </Card>

        {/* 学习表现 — 大考 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">学习表现奖金 — 大考评级</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-foreground/80 leading-relaxed">
            <p>大考成绩按三档评级，计入所在周的学业池：</p>
            <div className="space-y-1.5">
              <Tier rank="加分（满足任一：得分率≥90% / 最高分 / 排名前3）" reward="+¥25" highlight />
              <Tier rank="不变（默认档位）" reward="¥0" />
              <Tier rank="扣分（满足任一：得分率<75% / 排名第9名及以后）" reward="-¥25" />
            </div>
            <div className="bg-muted/10 rounded-md p-3 space-y-1.5 mt-2">
              <Rule text="系统根据成绩自动建议档位，需人工确认" />
              <Rule text="确认前大考不影响学业池计算" />
              <Rule text="大考加分可使当周学业池超过 ¥100" />
            </div>
            <p className="text-muted-foreground text-[10px] pt-1">
              期中/期末考试使用独立规则，此处暂不涉及。
            </p>
          </CardContent>
        </Card>
```

- [ ] **Step 2: Verify build**

```bash
cd /home/yutian/GrowSync && npx next build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/rules/page.tsx
git commit -m "feat(rules): add major exam rating rules to rules page"
```

---

### Task 8: Verify end-to-end and final commit

- [ ] **Step 1: Full build check**

```bash
cd /home/yutian/GrowSync && npx next build 2>&1 | tail -30
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run lint**

```bash
cd /home/yutian/GrowSync && npx next lint 2>&1 | tail -20
```

Expected: No errors (warnings OK).

- [ ] **Step 3: Manual smoke test checklist**

Run `npm run dev` and verify:
1. Admin tab → "录入大考" → enter a major exam → after save, "待评级大考" card appears
2. The rating card shows auto-suggestion with matched conditions
3. Can select a different tier, reason field appears for overrides
4. Confirm rating → card disappears, record shows rating badge in record list
5. Dashboard tab → "考试奖励" → expand → week shows exam adjustment line item
6. Rules page → new "大考评级" card is displayed correctly

- [ ] **Step 4: Verify DB migration was applied**

In Supabase SQL Editor or psql:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'academic_records' AND column_name IN ('major_exam_rating', 'rating_reason');
```

Expected: Two rows returned.
