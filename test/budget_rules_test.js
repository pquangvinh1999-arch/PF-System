const { DatabaseSync } = require('node:sqlite');
const assert = require('node:assert');

const db = new DatabaseSync(':memory:');
db.exec(`
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  category TEXT NOT NULL,
  allocated_percentage REAL NOT NULL,
  allocated_amount REAL NOT NULL,
  budget_group TEXT CHECK(budget_group IN ('needs', 'wants', 'savings')),
  created_at TEXT NOT NULL
);
`);

// 1. Percentage validation function
function validatePercentages(needs, wants, savings) {
  const sum = needs + wants + savings;
  return sum === 100;
}

// TEST 1: Percentage validation
assert.strictEqual(validatePercentages(50, 30, 20), true, "50/30/20 should be valid");
assert.strictEqual(validatePercentages(60, 25, 15), true, "60/25/15 should be valid");
assert.strictEqual(validatePercentages(40, 20, 40), true, "40/20/40 should be valid");
assert.strictEqual(validatePercentages(50, 30, 10), false, "90% total should be invalid");
assert.strictEqual(validatePercentages(50, 30, 30), false, "110% total should be invalid");
console.log("--- TEST 1: Customizable % validation PASS ---");

// 2. Calculation of allocated amounts
function calculateAllocations(income, needsP, wantsP, savingsP) {
  assert(validatePercentages(needsP, wantsP, savingsP), "Percentages must total 100%");
  const needsAmt = Math.round((needsP / 100) * income);
  const wantsAmt = Math.round((wantsP / 100) * income);
  const savingsAmt = Math.round((savingsP / 100) * income);
  return { needsAmt, wantsAmt, savingsAmt, total: needsAmt + wantsAmt + savingsAmt };
}

// TEST 2: Amount allocation
const alloc1 = calculateAllocations(45000000, 50, 30, 20);
assert.strictEqual(alloc1.needsAmt, 22500000, "50% Needs of 45M is 22.5M");
assert.strictEqual(alloc1.wantsAmt, 13500000, "30% Wants of 45M is 13.5M");
assert.strictEqual(alloc1.savingsAmt, 9000000, "20% Savings of 45M is 9M");
assert.strictEqual(alloc1.total, 45000000, "Sum of allocations must equal expected income");
console.log("--- TEST 2: 50/30/20 allocation math PASS (22.5M / 13.5M / 9M) ---");

// TEST 3: Customized allocation (60/25/15)
const alloc2 = calculateAllocations(50000000, 60, 25, 15);
assert.strictEqual(alloc2.needsAmt, 30000000, "60% Needs of 50M is 30M");
assert.strictEqual(alloc2.wantsAmt, 12500000, "25% Wants of 50M is 12.5M");
assert.strictEqual(alloc2.savingsAmt, 7500000, "15% Savings of 50M is 7.5M");
assert.strictEqual(alloc2.total, 50000000, "Sum of custom allocations must equal expected income");
console.log("--- TEST 3: Customized 60/25/15 allocation math PASS (30M / 12.5M / 7.5M) ---");

// TEST 4: SQLite persistence of custom budget rules
function saveGroupRules(period, rules) {
  const alloc = calculateAllocations(rules.expectedIncome, rules.needsPercentage, rules.wantsPercentage, rules.savingsPercentage);
  const createdAt = new Date().toISOString();

  db.prepare("INSERT OR REPLACE INTO budgets VALUES ('bgt_needs', ?, 'Thiết yếu (Needs)', ?, ?, 'needs', ?)").run(period, rules.needsPercentage, alloc.needsAmt, createdAt);
  db.prepare("INSERT OR REPLACE INTO budgets VALUES ('bgt_wants', ?, 'Cá nhân (Wants)', ?, ?, 'wants', ?)").run(period, rules.wantsPercentage, alloc.wantsAmt, createdAt);
  db.prepare("INSERT OR REPLACE INTO budgets VALUES ('bgt_savings', ?, 'Tiết kiệm (Savings)', ?, ?, 'savings', ?)").run(period, rules.savingsPercentage, alloc.savingsAmt, createdAt);
}

saveGroupRules('2026-09', {
  needsPercentage: 50,
  wantsPercentage: 30,
  savingsPercentage: 20,
  expectedIncome: 45000000
});

const rows = db.prepare("SELECT * FROM budgets WHERE period = '2026-09'").all();
assert.strictEqual(rows.length, 3, "Phải lưu đủ 3 bản ghi ngân sách cho kỳ 2026-09");
const needsRow = rows.find(r => r.budget_group === 'needs');
assert.strictEqual(needsRow.allocated_percentage, 50, "Needs % lưu vào SQLite đúng 50%");
assert.strictEqual(needsRow.allocated_amount, 22500000, "Needs amount lưu vào SQLite đúng 22.5M");
console.log("--- TEST 4: SQLite budget persistence PASS ---");

console.log("=== ALL BUDGET RULES UNIT TESTS PASSED 100% ===");
