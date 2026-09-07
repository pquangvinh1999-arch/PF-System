const assert = require("assert");

const DEFAULT_RULES = [
  { category: "profit", name: "Lợi nhuận", percentage: 5, order_index: 0 },
  { category: "tax", name: "Thuế", percentage: 15, order_index: 1 },
  { category: "owner_pay", name: "Lương chủ", percentage: 40, order_index: 2 },
  { category: "opex", name: "Vận hành", percentage: 30, order_index: 3 },
  { category: "reserve", name: "Dự phòng", percentage: 10, order_index: 4 },
];

function isBusinessRevenueTransaction(tx, account) {
  return (
    tx.type === "income" &&
    (account.type === "business" || tx.category === "Doanh thu kinh doanh")
  );
}

function generateProfitFirstBreakdown(revenueAmount, rules) {
  const orderMap = { profit: 0, tax: 1, owner_pay: 2, opex: 3, reserve: 4 };
  const sortedRules = [...rules].sort(
    (a, b) => (orderMap[a.category] ?? 99) - (orderMap[b.category] ?? 99)
  );

  let allocatedSum = 0;
  const allocations = sortedRules.map((r) => {
    const amount = Math.round((revenueAmount * r.percentage) / 100);
    allocatedSum += amount;
    return {
      category: r.category,
      name: r.name,
      percentage: r.percentage,
      amount,
    };
  });

  const diff = revenueAmount - allocatedSum;
  if (diff !== 0 && allocations.length > 0) {
    const opex = allocations.find((a) => a.category === "opex") || allocations[allocations.length - 1];
    opex.amount += diff;
  }

  const summary = allocations
    .map((a) => `${a.name}: ${a.amount.toLocaleString("vi-VN")}đ (${a.percentage}%)`)
    .join(" | ");

  return {
    allocations,
    summary,
  };
}

console.log("=== RUNNING PROFIT FIRST AUTO-ALLOCATION UNIT TESTS ===");

// TEST 1: Detect business revenue transaction
const personalAcc = { id: "p1", type: "personal", name: "Ví Cá nhân" };
const businessAcc = { id: "b1", type: "business", name: "Ví Kinh doanh" };

const salaryTx = { type: "income", category: "Lương", amount: 25000000 };
assert.strictEqual(isBusinessRevenueTransaction(salaryTx, personalAcc), false);

const bizRevenueTx = { type: "income", category: "Doanh thu kinh doanh", amount: 40000000 };
assert.strictEqual(isBusinessRevenueTransaction(bizRevenueTx, businessAcc), true);
console.log("--- TEST 1: Business revenue transaction detection PASS ---");

// TEST 2: Real-time auto-allocation breakdown for 20,000,000 đ
const result20M = generateProfitFirstBreakdown(20000000, DEFAULT_RULES);
assert.strictEqual(result20M.allocations.length, 5);
assert.strictEqual(result20M.allocations[0].amount, 1000000); // Profit 5%
assert.strictEqual(result20M.allocations[1].amount, 3000000); // Tax 15%
assert.strictEqual(result20M.allocations[2].amount, 8000000); // Owner Pay 40%
assert.strictEqual(result20M.allocations[3].amount, 6000000); // Opex 30%
assert.strictEqual(result20M.allocations[4].amount, 2000000); // Reserve 10%
const sum20M = result20M.allocations.reduce((sum, a) => sum + a.amount, 0);
assert.strictEqual(sum20M, 20000000);
assert.ok(result20M.summary.includes("Lợi nhuận: 1.000.000đ (5%)"));
console.log("--- TEST 2: 20M VND auto-allocation calculation PASS ---");

// TEST 3: Note integration with [Profit First] tag
function buildTransactionNote(userNote, breakdownSummary) {
  const trimmed = (userNote || "").trim();
  return trimmed
    ? `${trimmed}\n[Profit First]: ${breakdownSummary}`
    : `[Profit First]: ${breakdownSummary}`;
}

const noteWithExisting = buildTransactionNote("Tiền bán hàng đợt 1", result20M.summary);
assert.ok(noteWithExisting.startsWith("Tiền bán hàng đợt 1\n[Profit First]:"));
assert.ok(noteWithExisting.includes("Lương chủ: 8.000.000đ (40%)"));

const noteWithoutExisting = buildTransactionNote("", result20M.summary);
assert.ok(noteWithoutExisting.startsWith("[Profit First]:"));
console.log("--- TEST 3: Transaction note integration with [Profit First] tag PASS ---");

// TEST 4: Conservation on irregular odd amounts
const irregularAmount = 17777777;
const irregularResult = generateProfitFirstBreakdown(irregularAmount, DEFAULT_RULES);
const sumIrregular = irregularResult.allocations.reduce((sum, a) => sum + a.amount, 0);
assert.strictEqual(sumIrregular, irregularAmount);
console.log("--- TEST 4: Irregular odd revenue conservation PASS ---");

// TEST 5: Custom preset (Lean 10/15/45/20/10)
const leanRules = [
  { category: "profit", name: "Lợi nhuận", percentage: 10 },
  { category: "tax", name: "Thuế", percentage: 15 },
  { category: "owner_pay", name: "Lương chủ", percentage: 45 },
  { category: "opex", name: "Vận hành", percentage: 20 },
  { category: "reserve", name: "Dự phòng", percentage: 10 },
];
const leanResult = generateProfitFirstBreakdown(50000000, leanRules);
assert.strictEqual(leanResult.allocations.find((a) => a.category === "profit").amount, 5000000); // 10%
assert.strictEqual(leanResult.allocations.find((a) => a.category === "owner_pay").amount, 22500000); // 45%
assert.strictEqual(leanResult.allocations.find((a) => a.category === "opex").amount, 10000000); // 20%
console.log("--- TEST 5: Lean custom preset auto-allocation PASS ---");

console.log("=== ALL PROFIT FIRST AUTO-ALLOCATION UNIT TESTS PASSED 100% ===");
