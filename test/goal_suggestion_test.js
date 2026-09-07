const assert = require("assert");

console.log("=== RUNNING GOAL MONTHLY SUGGESTION TESTS (Task 4.3) ===");

// Mirror of GoalService.suggestMonthlyContribution
function suggest(goal, todayStr) {
  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));
  if (!goal.deadline) return { monthsLeft: 0, monthlyNeeded: remaining, isOverdue: false };
  const today = todayStr ? new Date(todayStr + "T00:00:00") : new Date();
  const dl = new Date(goal.deadline + "T00:00:00");
  if (isNaN(dl.getTime())) return { monthsLeft: 0, monthlyNeeded: remaining, isOverdue: false };
  let monthsLeft = (dl.getFullYear() - today.getFullYear()) * 12 + (dl.getMonth() - today.getMonth()) + 1;
  if (dl.getTime() < today.getTime()) return { monthsLeft: 0, monthlyNeeded: remaining, isOverdue: true };
  monthsLeft = Math.max(1, monthsLeft);
  return { monthsLeft, monthlyNeeded: Math.ceil(remaining / monthsLeft), isOverdue: false };
}

// --- TEST 1: còn 4 tháng (09->12/2026), thiếu 40M => 10M/tháng ---
{
  const r = suggest({ target_amount: 50000000, current_amount: 10000000, deadline: "2026-12-31" }, "2026-09-07");
  assert.strictEqual(r.monthsLeft, 4);
  assert.strictEqual(r.monthlyNeeded, 10000000);
  assert.strictEqual(r.isOverdue, false);
  console.log("--- TEST 1: basic 4-month suggestion PASS ---");
}

// --- TEST 2: làm tròn lên (ceil) ---
{
  const r = suggest({ target_amount: 10000000, current_amount: 0, deadline: "2026-11-30" }, "2026-09-07");
  assert.strictEqual(r.monthsLeft, 3); // 09,10,11
  assert.strictEqual(r.monthlyNeeded, Math.ceil(10000000 / 3));
  console.log("--- TEST 2: ceil rounding PASS (" + r.monthlyNeeded + "/tháng) ---");
}

// --- TEST 3: quá hạn ---
{
  const r = suggest({ target_amount: 10000000, current_amount: 2000000, deadline: "2026-08-15" }, "2026-09-07");
  assert.strictEqual(r.isOverdue, true);
  assert.strictEqual(r.monthlyNeeded, 8000000);
  console.log("--- TEST 3: overdue detection PASS ---");
}

// --- TEST 4: không deadline ---
{
  const r = suggest({ target_amount: 10000000, current_amount: 3000000 });
  assert.strictEqual(r.monthsLeft, 0);
  assert.strictEqual(r.monthlyNeeded, 7000000);
  console.log("--- TEST 4: no-deadline fallback PASS ---");
}

// --- TEST 5: qua năm (12/2026 -> 02/2027 = 3 tháng) ---
{
  const r = suggest({ target_amount: 9000000, current_amount: 0, deadline: "2027-02-28" }, "2026-12-15");
  assert.strictEqual(r.monthsLeft, 3);
  assert.strictEqual(r.monthlyNeeded, 3000000);
  console.log("--- TEST 5: year-boundary PASS ---");
}

// --- TEST 6: cùng tháng => tối thiểu 1 tháng ---
{
  const r = suggest({ target_amount: 5000000, current_amount: 0, deadline: "2026-09-30" }, "2026-09-07");
  assert.strictEqual(r.monthsLeft, 1);
  assert.strictEqual(r.monthlyNeeded, 5000000);
  console.log("--- TEST 6: same-month min-1 PASS ---");
}

console.log("=== ALL GOAL SUGGESTION TESTS PASSED 100% ===");
