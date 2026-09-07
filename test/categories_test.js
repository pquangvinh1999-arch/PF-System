const assert = require('node:assert');

// Simulate CATEGORIES mapping
const CATEGORIES = [
  { id: "cat_food", name: "Ăn uống", type: "expense", budgetGroup: "needs", accountScope: "personal" },
  { id: "cat_housing", name: "Nhà ở & Tiện ích", type: "expense", budgetGroup: "needs", accountScope: "personal" },
  { id: "cat_transport", name: "Đi lại", type: "expense", budgetGroup: "needs", accountScope: "personal" },
  { id: "cat_entertainment", name: "Giải trí & Du lịch", type: "expense", budgetGroup: "wants", accountScope: "personal" },
  { id: "cat_cogs", name: "Giá vốn / Nhập hàng", type: "expense", budgetGroup: "business", accountScope: "business" },
  { id: "cat_salary", name: "Lương cố định", type: "income", accountScope: "personal" },
  { id: "cat_biz_revenue", name: "Doanh thu Shop Online", type: "income", accountScope: "business" },
  { id: "cat_internal_transfer", name: "Chuyển tiền nội bộ", type: "transfer", accountScope: "both" },
];

function getCategoriesByType(type, accountType) {
  return CATEGORIES.filter((cat) => {
    if (cat.type !== type) return false;
    if (!accountType) return true;
    return cat.accountScope === "both" || cat.accountScope === accountType;
  });
}

// TEST 1: Filter expense for Personal account
const personalExpenses = getCategoriesByType("expense", "personal");
assert(personalExpenses.some(c => c.name === "Ăn uống"), "Personal expenses must have Ăn uống");
assert(!personalExpenses.some(c => c.name === "Giá vốn / Nhập hàng"), "Personal expenses must NOT have Giá vốn");
console.log("--- TEST 1: Personal expense categories PASS ---");

// TEST 2: Filter expense for Business account
const businessExpenses = getCategoriesByType("expense", "business");
assert(businessExpenses.some(c => c.name === "Giá vốn / Nhập hàng"), "Business expenses must have Giá vốn");
console.log("--- TEST 2: Business expense categories PASS ---");

// TEST 3: Category breakdown calculation
const sampleTransactions = [
  { category: "Ăn uống", amount: 3000000, type: "expense" },
  { category: "Ăn uống", amount: 2000000, type: "expense" },
  { category: "Đi lại", amount: 1000000, type: "expense" },
  { category: "Lương", amount: 25000000, type: "income" },
];

const expenseTxs = sampleTransactions.filter(t => t.type === "expense");
const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
assert.strictEqual(totalExpense, 6000000, "Total expense must be 6,000,000");

const catTotals = {};
for (const t of expenseTxs) {
  catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
}
assert.strictEqual(catTotals["Ăn uống"], 5000000, "Ăn uống total must be 5,000,000");
assert.strictEqual(catTotals["Đi lại"], 1000000, "Đi lại total must be 1,000,000");

const percentFood = Math.round((catTotals["Ăn uống"] / totalExpense) * 100);
const percentTransport = Math.round((catTotals["Đi lại"] / totalExpense) * 100);
assert.strictEqual(percentFood, 83, "Food % should be 83%");
assert.strictEqual(percentTransport, 17, "Transport % should be 17%");
console.log("--- TEST 3: Category breakdown percentage PASS (Food: 83%, Transport: 17%) ---");

console.log("=== ALL CATEGORY UNIT TESTS PASSED 100% ===");
