# Major Exam Rating System Design

## Context

GrowSync currently tracks major exam (`major_exam`) records as archival data only — they don't affect the weekly academic pool. This design adds a three-tier rating system that integrates major exam performance into the existing weekly academic reward calculation.

The class has ~20 students with high score variance (std dev), making rank-based evaluation more meaningful than class-average comparisons.

## Requirements

1. Each major exam record gets an independent three-tier rating: bonus / neutral / penalty
2. System auto-suggests a rating based on available data; admin manually confirms or overrides
3. Unconfirmed ratings do NOT affect calculations (防误判)
4. Ratings are integrated into the weekly academic pool of the week the exam falls in
5. Mid-term and final exams are excluded (future separate rules)

## Rating Tiers

| Tier | Key | Amount | Auto-suggest conditions (any one) |
|------|-----|--------|-----------------------------------|
| 加分 | `bonus` | +¥25 | score/max_score ≥ 0.9 ; score = highest_score ; class_rank ≤ 3 |
| 不变 | `neutral` | ¥0 | Default — no bonus/penalty condition triggered |
| 扣分 | `penalty` | -¥25 | score/max_score < 0.75 ; class_rank ≥ 9 |

Conditions are evaluated only when the relevant field is non-null (e.g., rank condition skipped if `class_rank` is NULL).

## Weekly Academic Pool Formula Change

**Before:**
```
weekAcademic = max(0, 100 - strikes × 20)
```

**After:**
```
examAdjustment = sum of confirmed major_exam ratings in this week (+25, 0, or -25 each)
weekAcademic = max(0, 100 - strikes × 20 + examAdjustment)
```

- The pool CAN exceed ¥100 when exam bonuses are present (intentional reward for strong performance)
- The pool floor remains ¥0

## Auto-Suggest Algorithm

```typescript
function suggestRating(record: AcademicRecord): 'bonus' | 'neutral' | 'penalty' {
  const scoreRate = record.score / record.max_score;

  // Check bonus conditions
  if (scoreRate >= 0.9) return 'bonus';
  if (record.highest_score != null && record.score >= record.highest_score) return 'bonus';
  if (record.class_rank != null && record.class_rank <= 3) return 'bonus';

  // Check penalty conditions
  if (scoreRate < 0.75) return 'penalty';
  if (record.class_rank != null && record.class_rank >= 9) return 'penalty';

  return 'neutral';
}
```

Priority: bonus conditions checked first, then penalty, then default neutral. A record matching both bonus and penalty conditions (edge case: e.g., score_rate 0.9+ but rank ≥ 9) resolves to bonus — the admin can override.

## Manual Override Flow

1. Admin enters a major exam record (existing form in admin-tab)
2. After save, a rating card appears showing:
   - Auto-suggested tier with matched condition(s) highlighted
   - Three buttons: 🟢 加分 / ⚪ 不变 / 🔴 扣分
   - An optional reason selector (visible when overriding the suggestion)
3. Preset reasons: `试卷偏难` / `进步明显` / `退步明显` / `特殊情况`
4. Free-text custom reason also available
5. On confirm → writes `major_exam_rating` and `rating_reason` to the record

For existing unrated major exams, a batch "待评级" list in the admin tab shows all records where `major_exam_rating IS NULL` and `event_type = 'major_exam'`.

## Data Model Changes

Two new columns on `academic_records`:

```sql
ALTER TABLE academic_records
  ADD COLUMN major_exam_rating TEXT CHECK (major_exam_rating IN ('bonus', 'neutral', 'penalty')),
  ADD COLUMN rating_reason TEXT;
```

- `major_exam_rating`: NULL = unrated (not yet confirmed), non-NULL = confirmed
- `rating_reason`: Optional text, only meaningful when admin overrides auto-suggestion

No new tables needed.

## Constant Additions

```typescript
// in constants.ts
export const MAJOR_EXAM_BONUS = 25;      // +¥25 for 'bonus' rating
export const MAJOR_EXAM_PENALTY = -25;    // -¥25 for 'penalty' rating

export const MAJOR_EXAM_BONUS_SCORE_RATE = 0.9;    // ≥ 90% score rate → suggest bonus
export const MAJOR_EXAM_PENALTY_SCORE_RATE = 0.75;  // < 75% score rate → suggest penalty
export const MAJOR_EXAM_BONUS_RANK = 3;             // rank ≤ 3 → suggest bonus
export const MAJOR_EXAM_PENALTY_RANK = 9;            // rank ≥ 9 → suggest penalty

export const RATING_REASON_PRESETS = [
  '试卷偏难',
  '进步明显',
  '退步明显',
  '特殊情况',
] as const;
```

## UI Changes

### Admin Tab — Rating Confirmation

After inserting a major exam record, or when viewing unrated records:

- Card per unrated exam: subject, score, date, auto-suggestion with reason
- Three-button selector for tier
- Collapsible reason field (text select + free input)
- Confirm button saves to DB

### Dashboard Tab — Weekly Breakdown

The existing weekly academic breakdown already shows deductions. Add:

- Major exam adjustments as line items (e.g., "数学大考: 加分 +¥25" or "英语大考: 扣分 -¥25")
- Distinguished visually from strike deductions (green for bonus, red for penalty)

### Rules Page

Update the rules page to include major exam rating rules (the README section 3b content).

## Calculation Changes

In `calculations.ts`, the `calculateWeeklyQuests` function currently filters academics to `micro_test` only. Changes:

1. Add a second filter pass for `major_exam` records with non-null `major_exam_rating`
2. Sum their adjustments: bonus → +25, neutral → 0, penalty → -25
3. Add to the week's academic pool (before the max(0, ...) floor)

The `WeeklyQuestState.academic` type needs extension:

```typescript
academic: {
  earned: number;
  strikes: number;
  deductions: { reason: string; amount: number }[];
  examAdjustments: { subject: string; exam_name?: string; rating: string; amount: number }[];
}
```

## Scope Exclusions

- Mid-term / final exam special rules (future work)
- Retroactive rating changes (admin can delete and re-enter if needed)
- Rating history / audit log
