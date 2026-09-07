const assert = require("assert");

console.log("=== RUNNING EMERGENCY FUND AUTO-CALC TESTS (Task 4.2) ===");

// Mirror logic: needs group mapping (subset of categories.ts)
const NEEDS_CATS = new Set(["Ăn uống", "Nhà ở & Tiện ích", "Đi lại", "Y tế & Sức khỏe", "Giáo dục / Con cái"]);
function calcAvgEssential(transactions, monthsToAverage = 3) {
  const byMonth = {};
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    if (!NEEDS_CATS.has(t.category)) continue;
    const m = String(t.date).substring(0, 7);
    byMonth[m] = (byMonth[m] || 0) + t.amount;
  }
  const months = Object.keys(byMonth).sort().slice(-monthsToAverage);
  if (months.length === 0) return { avg: 0, count: 0 };
  const total = months.reduce((s, m) => s + byMonth[m], 0);
  return { avg: Math.round(total / months.length), count: Object.keys(byMonth).length };
}
function emergencyCalc(transactions, currentSaved, chosenMonths = 6) {
  const clamped = Math.max(3, Math.min(6, Math.round(chosenMonths) || 6));
  const { avg, count } = calcAvgEssential(transactions);
  return {
    avg, monthsOfHistory: count, hasEnough: count >= 1 && avg > 0,
    min3: avg * 3, max6: avg * 6, target: avg * clamped,
    progress: avg * clamped > 0 ? Math.min(100, Math.round((currentSaved / (avg * clamped)) * 100)) : 0,
    remaining: Math.max(0, avg * clamped - currentSaved),
  };
}

// --- TEST 1: đủ lịch sử 3 tháng, TB 15M ---
{
  const txs = [
    { type: "expense", category: "Ăn uống", amount: 6000000, date: "2026-06-05" },
    { type: "expense", category: "Nhà ở & Tiện ích", amount: 8000000, date: "2026-06-10" },
    { type: "expense", category: "Đi lại", amount: 1000000, date: "2026-06-12" },
    { type: "expense", category: "Ăn uống", amount: 6500000, date: "2026-07-05" },
    { type: "expense", category: "Nhà ở & Tiện ích", amount: 8000000, date: "2026-07-10" },
    { type: "expense", category: "Y tế & Sức khỏe", amount: 500000, date: "2026-07-11" },
    { type: "expense", category: "Ăn uống", amount: 6000000, date: "2026-08-05" },
    { type: "expense", category: "Nhà ở & Tiện ích", amount: 8000000, date: "2026-08-10" },
    { type: "expense", category: "Giáo dục / Con cái", amount: 2000000, date: "2026-08-12" },
    // wants/business phải bị loại trừ
    { type: "expense", category: "Giải trí & Du lịch", amount: 5000000, date: "2026-08-15" },
    { type: "expense", category: "Vận hành kinh doanh", amount: 9000000, date: "2026-08-16" },
    { type: "income", category: "Lương cố định", amount: 30000000, date: "2026-08-01" },
  ];
  const r = emergencyCalc(txs, 20000000, 6);
  // T6: 15M, T7: 15M, T8: 16M => TB = 15.333...M => round 15333333
  assert.strictEqual(r.avg, 15333333);
  assert.strictEqual(r.monthsOfHistory, 3);
  assert.strictEqual(r.hasEnough, true);
  assert.strictEqual(r.min3, 15333333 * 3);
  assert.strictEqual(r.max6, 15333333 * 6);
  assert.strictEqual(r.target, 15333333 * 6);
  assert.strictEqual(r.remaining, 15333333 * 6 - 20000000);
  console.log("--- TEST 1: 3-month avg + 3/6x target PASS (avg=" + r.avg + ") ---");
}

// --- TEST 2: chọn 3 tháng vs 6 tháng ---
{
  const txs = [
    { type: "expense", category: "Ăn uống", amount: 10000000, date: "2026-08-05" },
  ];
  const r3 = emergencyCalc(txs, 0, 3);
  const r6 = emergencyCalc(txs, 0, 6);
  assert.strictEqual(r3.target, 30000000);
  assert.strictEqual(r6.target, 60000000);
  console.log("--- TEST 2: chosen months clamp 3-6 PASS ---");
}

// --- TEST 3: loại trừ wants/business/income ---
{
  const txs = [
    { type: "expense", category: "Giải trí & Du lịch", amount: 20000000, date: "2026-08-05" },
    { type: "income", category: "Lương cố định", amount: 50000000, date: "2026-08-01" },
  ];
  const r = emergencyCalc(txs, 0, 6);
  assert.strictEqual(r.avg, 0);
  assert.strictEqual(r.hasEnough, false);
  assert.strictEqual(r.target, 0);
  console.log("--- TEST 3: non-needs exclusion PASS ---");
}

// --- TEST 4: progress & remaining ---
{
  const txs = [{ type: "expense", category: "Ăn uống", amount: 12000000, date: "2026-08-05" }];
  const r = emergencyCalc(txs, 36000000, 6); // target 72M
  assert.strictEqual(r.progress, 50);
  assert.strictEqual(r.remaining, 36000000);
  const done = emergencyCalc(txs, 72000000, 6);
  assert.strictEqual(done.progress, 100);
  assert.strictEqual(done.remaining, 0);
  console.log("--- TEST 4: progress/remaining PASS ---");
}

// --- TEST 5: clamp months ngoài biên ---
{
  const txs = [{ type: "expense", category: "Ăn uống", amount: 10000000, date: "2026-08-05" }];
  assert.strictEqual(emergencyCalc(txs, 0, 2).target, 30000000); // clamp về 3
  assert.strictEqual(emergencyCalc(txs, 0, 9).target, 60000000); // clamp về 6
  console.log("--- TEST 5: months clamp PASS ---");
}

console.log("=== ALL EMERGENCY FUND TESTS PASSED 100% ===");
