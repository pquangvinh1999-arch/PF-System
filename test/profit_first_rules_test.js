const assert = require("assert");
const { DatabaseSync } = require("node:sqlite");

const PROFIT_FIRST_ORDER = ["profit", "tax", "owner_pay", "opex", "reserve"];

const DEFAULT_PROFIT_FIRST_RULES = [
  { category: "profit", name: "Lợi nhuận (Profit)", percentage: 5, order_index: 0 },
  { category: "tax", name: "Thuế & Pháp lý (Tax)", percentage: 15, order_index: 1 },
  { category: "owner_pay", name: "Lương chủ shop (Owner Pay)", percentage: 40, order_index: 2 },
  { category: "opex", name: "Chi phí vận hành (Opex)", percentage: 30, order_index: 3 },
  { category: "reserve", name: "Quỹ dự phòng rủi ro (Reserve)", percentage: 10, order_index: 4 },
];

const PROFIT_FIRST_PRESETS = [
  {
    id: "standard",
    percentages: { profit: 5, tax: 15, owner_pay: 40, opex: 30, reserve: 10 },
  },
  {
    id: "lean",
    percentages: { profit: 10, tax: 15, owner_pay: 45, opex: 20, reserve: 10 },
  },
  {
    id: "growth",
    percentages: { profit: 5, tax: 15, owner_pay: 30, opex: 40, reserve: 10 },
  },
];

function validateRules(rules) {
  if (!rules || rules.length === 0) {
    return { isValid: false, totalPercentage: 0, error: "Chưa có quy tắc phân bổ." };
  }
  const totalPercentage = rules.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0);
  const roundedTotal = Math.round(totalPercentage * 100) / 100;
  if (roundedTotal !== 100) {
    return {
      isValid: false,
      totalPercentage: roundedTotal,
      error: `Tổng tỷ lệ hiện là ${roundedTotal}%. Vui lòng điều chỉnh để tổng đúng 100%.`,
    };
  }
  for (const r of rules) {
    if (r.percentage < 0) {
      return {
        isValid: false,
        totalPercentage: roundedTotal,
        error: `Tỷ lệ nhóm "${r.name || r.category}" không được âm.`,
      };
    }
  }
  return { isValid: true, totalPercentage: 100 };
}

function calculateAllocation(revenueAmount, rules) {
  const { isValid, totalPercentage } = validateRules(rules);
  const orderMap = { profit: 0, tax: 1, owner_pay: 2, opex: 3, reserve: 4 };
  const sortedRules = [...rules].sort(
    (a, b) => (orderMap[a.category] ?? 99) - (orderMap[b.category] ?? 99)
  );

  let allocatedSum = 0;
  const allocations = sortedRules.map((rule) => {
    const amount = Math.round((revenueAmount * rule.percentage) / 100);
    allocatedSum += amount;
    return {
      category: rule.category,
      percentage: rule.percentage,
      amount,
    };
  });

  const difference = revenueAmount - allocatedSum;
  if (difference !== 0 && allocations.length > 0) {
    const opexItem = allocations.find((a) => a.category === "opex") || allocations[allocations.length - 1];
    opexItem.amount += difference;
  }

  return {
    totalRevenue: revenueAmount,
    allocations,
    isValid,
    totalPercentage,
  };
}

console.log("=== RUNNING PROFIT FIRST RULES & ALLOCATION UNIT TESTS ===");

// TEST 1: Default rules & strict Mike Michalowicz distribution order
assert.strictEqual(DEFAULT_PROFIT_FIRST_RULES.length, 5);
DEFAULT_PROFIT_FIRST_RULES.forEach((rule, idx) => {
  assert.strictEqual(rule.category, PROFIT_FIRST_ORDER[idx]);
  assert.strictEqual(rule.order_index, idx);
});
const valDefault = validateRules(DEFAULT_PROFIT_FIRST_RULES);
assert.strictEqual(valDefault.isValid, true);
assert.strictEqual(valDefault.totalPercentage, 100);
console.log("--- TEST 1: Default rules & strict Profit First order PASS ---");

// TEST 2: Presets integrity (Standard, Lean, Growth)
PROFIT_FIRST_PRESETS.forEach((preset) => {
  const total = Object.values(preset.percentages).reduce((sum, p) => sum + p, 0);
  assert.strictEqual(total, 100, `Preset ${preset.id} must sum to 100%`);
  PROFIT_FIRST_ORDER.forEach((cat) => {
    assert.ok(preset.percentages[cat] > 0, `Preset ${preset.id} missing category ${cat}`);
  });
});
console.log("--- TEST 2: All presets sum to 100% & contain all 5 buckets PASS ---");

// TEST 3: Validation failure cases
const invalidSumRules = [
  { category: "profit", percentage: 10 },
  { category: "tax", percentage: 15 },
  { category: "owner_pay", percentage: 40 },
  { category: "opex", percentage: 30 },
  { category: "reserve", percentage: 10 }, // total = 105%
];
const valInvalidSum = validateRules(invalidSumRules);
assert.strictEqual(valInvalidSum.isValid, false);
assert.strictEqual(valInvalidSum.totalPercentage, 105);

const negativeRules = [
  { category: "profit", percentage: -5 },
  { category: "tax", percentage: 15 },
  { category: "owner_pay", percentage: 50 },
  { category: "opex", percentage: 30 },
  { category: "reserve", percentage: 10 }, // total = 100% but negative
];
const valNegative = validateRules(negativeRules);
assert.strictEqual(valNegative.isValid, false);
console.log("--- TEST 3: Rule validation (sum != 100, negative % rejection) PASS ---");

// TEST 4: Revenue allocation math (50M VND standard)
const revenue = 50000000;
const allocResult = calculateAllocation(revenue, DEFAULT_PROFIT_FIRST_RULES);
assert.strictEqual(allocResult.isValid, true);
assert.strictEqual(allocResult.allocations.length, 5);

const profitAlloc = allocResult.allocations.find((a) => a.category === "profit");
const taxAlloc = allocResult.allocations.find((a) => a.category === "tax");
const ownerPayAlloc = allocResult.allocations.find((a) => a.category === "owner_pay");
const opexAlloc = allocResult.allocations.find((a) => a.category === "opex");
const reserveAlloc = allocResult.allocations.find((a) => a.category === "reserve");

assert.strictEqual(profitAlloc.amount, 2500000); // 5% of 50M
assert.strictEqual(taxAlloc.amount, 7500000);   // 15% of 50M
assert.strictEqual(ownerPayAlloc.amount, 20000000); // 40% of 50M
assert.strictEqual(opexAlloc.amount, 15000000);     // 30% of 50M
assert.strictEqual(reserveAlloc.amount, 5000000);   // 10% of 50M

const sumAlloc = allocResult.allocations.reduce((sum, a) => sum + a.amount, 0);
assert.strictEqual(sumAlloc, revenue);
console.log("--- TEST 4: 50M revenue allocation math & sum conservation PASS ---");

// TEST 5: Rounding conservation on fractional / uneven amounts
const unevenRevenue = 33333333;
const unevenResult = calculateAllocation(unevenRevenue, DEFAULT_PROFIT_FIRST_RULES);
const sumUneven = unevenResult.allocations.reduce((sum, a) => sum + a.amount, 0);
assert.strictEqual(sumUneven, unevenRevenue, "Sum of allocations must strictly equal uneven revenue");
console.log("--- TEST 5: Odd revenue amount rounding balance PASS ---");

// TEST 6: SQLite table persistence for profit_first_rules
const db = new DatabaseSync(":memory:");
db.exec(`CREATE TABLE accounts (id TEXT PRIMARY KEY, name TEXT, type TEXT);`);
db.exec(`INSERT INTO accounts VALUES ('acc_biz_1', 'Ví Shop', 'business');`);

db.exec(`
  CREATE TABLE profit_first_rules (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('profit', 'tax', 'owner_pay', 'opex', 'reserve')),
    percentage REAL NOT NULL,
    name TEXT,
    order_index INTEGER DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
  );
`);

const insertStmt = db.prepare(`
  INSERT INTO profit_first_rules (id, account_id, category, percentage, name, order_index, is_active)
  VALUES (?, ?, ?, ?, ?, ?, 1);
`);

DEFAULT_PROFIT_FIRST_RULES.forEach((r, idx) => {
  insertStmt.run(`pfr_${idx}`, "acc_biz_1", r.category, r.percentage, r.name, r.order_index);
});

const rows = db.prepare("SELECT * FROM profit_first_rules WHERE account_id = ? ORDER BY order_index ASC").all("acc_biz_1");
assert.strictEqual(rows.length, 5);
assert.strictEqual(rows[0].category, "profit");
assert.strictEqual(rows[0].percentage, 5);
assert.strictEqual(rows[4].category, "reserve");
assert.strictEqual(rows[4].percentage, 10);
console.log("--- TEST 6: SQLite profit_first_rules schema & persistence PASS ---");

console.log("=== ALL PROFIT FIRST RULES UNIT TESTS PASSED 100% ===");
