const assert = require('node:assert');

// Month navigation helper
function getPrevMonth(selectedMonth) {
  const [y, m] = selectedMonth.split("-").map(Number);
  const prev = new Date(y, m - 2, 1);
  const newY = prev.getFullYear();
  const newM = String(prev.getMonth() + 1).padStart(2, "0");
  return `${newY}-${newM}`;
}

function getNextMonth(selectedMonth) {
  const [y, m] = selectedMonth.split("-").map(Number);
  const next = new Date(y, m, 1);
  const newY = next.getFullYear();
  const newM = String(next.getMonth() + 1).padStart(2, "0");
  return `${newY}-${newM}`;
}

// TEST 1: Month navigation
assert.strictEqual(getPrevMonth("2026-09"), "2026-08", "Prev of 2026-09 should be 2026-08");
assert.strictEqual(getNextMonth("2026-09"), "2026-10", "Next of 2026-09 should be 2026-10");
assert.strictEqual(getPrevMonth("2026-01"), "2025-12", "Prev of 2026-01 should cross year to 2025-12");
assert.strictEqual(getNextMonth("2026-12"), "2027-01", "Next of 2026-12 should cross year to 2027-01");
console.log("--- TEST 1: Month navigation PASS ---");

// Sample transactions across different months
const sampleTxs = [
  { id: '1', date: '2026-09-01', amount: 25000000, type: 'income' },
  { id: '2', date: '2026-09-05', amount: 5000000, type: 'expense' },
  { id: '3', date: '2026-09-10', amount: 3000000, type: 'expense' },
  { id: '4', date: '2026-08-28', amount: 10000000, type: 'income' }, // Previous month
  { id: '5', date: '2026-10-02', amount: 2000000, type: 'expense' }, // Next month
];

function calculateMonthSummary(transactions, month) {
  const monthTransactions = transactions.filter((t) => t.date.startsWith(month));
  const monthIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = monthIncome - monthExpense;
  const savingsRate = monthIncome > 0 ? Math.round((netCashFlow / monthIncome) * 100) : 0;

  return { monthIncome, monthExpense, netCashFlow, savingsRate, count: monthTransactions.length };
}

// TEST 2: Calculations for 2026-09
const summary09 = calculateMonthSummary(sampleTxs, "2026-09");
assert.strictEqual(summary09.count, 3, "2026-09 has 3 transactions");
assert.strictEqual(summary09.monthIncome, 25000000, "Income is 25M");
assert.strictEqual(summary09.monthExpense, 8000000, "Expense is 8M");
assert.strictEqual(summary09.netCashFlow, 17000000, "Net cash flow is 17M");
assert.strictEqual(summary09.savingsRate, 68, "Savings rate is 68%");
console.log("--- TEST 2: 2026-09 Monthly summary calculation PASS (Income: 25M, Expense: 8M, Net: 17M, Rate: 68%) ---");

// TEST 3: Negative cash flow (bội chi)
const overspentTxs = [
  { id: '1', date: '2026-09-01', amount: 10000000, type: 'income' },
  { id: '2', date: '2026-09-05', amount: 15000000, type: 'expense' },
];
const summaryOver = calculateMonthSummary(overspentTxs, "2026-09");
assert.strictEqual(summaryOver.netCashFlow, -5000000, "Net cash flow should be -5M");
assert.strictEqual(summaryOver.savingsRate, -50, "Savings rate should be -50%");
console.log("--- TEST 3: Deficit / Overspent calculation PASS ---");

console.log("=== ALL DASHBOARD SUMMARY UNIT TESTS PASSED 100% ===");
