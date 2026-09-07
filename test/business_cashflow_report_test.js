const assert = require("assert");

const DEFAULT_RULES = [
  { category: "profit", name: "Lợi nhuận (Profit)", percentage: 5, order_index: 0 },
  { category: "tax", name: "Thuế & Pháp lý (Tax)", percentage: 15, order_index: 1 },
  { category: "owner_pay", name: "Lương chủ shop (Owner Pay)", percentage: 40, order_index: 2 },
  { category: "opex", name: "Chi phí vận hành (Opex)", percentage: 30, order_index: 3 },
  { category: "reserve", name: "Quỹ dự phòng rủi ro (Reserve)", percentage: 10, order_index: 4 },
];

function generateReport(period, businessAccount, transactions, rules) {
  const periodTxs = transactions.filter((t) => t.date.startsWith(period));

  const revenueTxs = periodTxs.filter(
    (t) => t.account_id === businessAccount.id && t.type === "income"
  );
  const totalRevenue = revenueTxs.reduce((sum, t) => sum + t.amount, 0);

  const expenseTxs = periodTxs.filter(
    (t) => t.account_id === businessAccount.id && t.type === "expense"
  );
  const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);

  const withdrawalTxs = periodTxs.filter(
    (t) => t.account_id === businessAccount.id && t.type === "transfer"
  );
  const totalOwnerPayWithdrawn = withdrawalTxs.reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalRevenue - totalExpense;
  const profitMargin =
    totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const catMap = {};
  for (const t of expenseTxs) {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  }

  const expenseCategories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      percentage:
        totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }));

  // Profit First buckets allocation
  let allocatedSum = 0;
  const buckets = rules.map((r) => {
    const amount = Math.round((totalRevenue * r.percentage) / 100);
    allocatedSum += amount;
    return {
      category: r.category,
      name: r.name,
      percentage: r.percentage,
      allocatedAmount: amount,
    };
  });

  const diff = totalRevenue - allocatedSum;
  if (diff !== 0 && buckets.length > 0) {
    const opex = buckets.find((b) => b.category === "opex") || buckets[buckets.length - 1];
    opex.allocatedAmount += diff;
  }

  let healthStatus = "healthy";
  let recommendation = "";
  if (totalRevenue === 0) {
    healthStatus = "tight";
    recommendation = "Chưa phát sinh doanh thu trong kỳ này.";
  } else if (netProfit < 0) {
    healthStatus = "loss";
    recommendation = `Shop đang lỗ thâm hụt ${Math.abs(netProfit).toLocaleString("vi-VN")} đ.`;
  } else if (profitMargin >= 25) {
    healthStatus = "healthy";
    recommendation = `Biên lợi nhuận xuất sắc (${profitMargin}%).`;
  } else {
    healthStatus = "tight";
    recommendation = `Biên lợi nhuận mỏng (${profitMargin}%).`;
  }

  return {
    period,
    accountId: businessAccount.id,
    accountName: businessAccount.name,
    totalRevenue,
    totalExpense,
    netProfit,
    profitMargin,
    totalOwnerPayWithdrawn,
    buckets,
    expenseCategories,
    healthStatus,
    recommendation,
  };
}

console.log("=== RUNNING BUSINESS CASH FLOW REPORT UNIT TESTS ===");

const bizAcc = { id: "acc_biz", name: "Ví Shop Quần Áo", type: "business" };
const persAcc = { id: "acc_pers", name: "Ví Cá Nhân", type: "personal" };

// TEST 1: Standard profitable month
const txsMonth1 = [
  // Revenue
  { id: "1", account_id: "acc_biz", type: "income", category: "Doanh thu kinh doanh", amount: 60000000, date: "2026-09-05" },
  // Opex Expenses
  { id: "2", account_id: "acc_biz", type: "expense", category: "Nhập hàng", amount: 25000000, date: "2026-09-10" },
  { id: "3", account_id: "acc_biz", type: "expense", category: "Vận hành shop", amount: 11000000, date: "2026-09-12" }, // total expense = 36M
  // Owner Pay transfer to personal account
  { id: "4", account_id: "acc_biz", to_account_id: "acc_pers", type: "transfer", category: "Chuyển khoản", amount: 20000000, date: "2026-09-15" },
  // Unrelated personal expense
  { id: "5", account_id: "acc_pers", type: "expense", category: "Ăn uống", amount: 5000000, date: "2026-09-16" },
];

const report1 = generateReport("2026-09", bizAcc, txsMonth1, DEFAULT_RULES);
assert.strictEqual(report1.totalRevenue, 60000000);
assert.strictEqual(report1.totalExpense, 36000000);
assert.strictEqual(report1.netProfit, 24000000);
assert.strictEqual(report1.profitMargin, 40); // (24M / 60M) * 100 = 40%
assert.strictEqual(report1.totalOwnerPayWithdrawn, 20000000);
assert.strictEqual(report1.healthStatus, "healthy");
console.log("--- TEST 1: Profitable month P&L and metrics calculation PASS ---");

// TEST 2: 5 Profit First buckets allocation verification
const profitBucket = report1.buckets.find((b) => b.category === "profit");
const taxBucket = report1.buckets.find((b) => b.category === "tax");
const ownerBucket = report1.buckets.find((b) => b.category === "owner_pay");
const opexBucket = report1.buckets.find((b) => b.category === "opex");
const reserveBucket = report1.buckets.find((b) => b.category === "reserve");

assert.strictEqual(profitBucket.allocatedAmount, 3000000); // 5% of 60M
assert.strictEqual(taxBucket.allocatedAmount, 9000000);   // 15% of 60M
assert.strictEqual(ownerBucket.allocatedAmount, 24000000); // 40% of 60M
assert.strictEqual(opexBucket.allocatedAmount, 18000000);  // 30% of 60M
assert.strictEqual(reserveBucket.allocatedAmount, 6000000); // 10% of 60M
console.log("--- TEST 2: 5 Profit First buckets allocation calculation PASS ---");

// TEST 3: Expense category breakdown
assert.strictEqual(report1.expenseCategories.length, 2);
assert.strictEqual(report1.expenseCategories[0].category, "Nhập hàng");
assert.strictEqual(report1.expenseCategories[0].amount, 25000000);
assert.strictEqual(report1.expenseCategories[0].percentage, 69); // 25/36 = 69%
assert.strictEqual(report1.expenseCategories[1].category, "Vận hành shop");
assert.strictEqual(report1.expenseCategories[1].percentage, 31); // 11/36 = 31%
console.log("--- TEST 3: Business expense category breakdown PASS ---");

// TEST 4: Loss scenario detection
const txsLoss = [
  { id: "1", account_id: "acc_biz", type: "income", category: "Doanh thu kinh doanh", amount: 20000000, date: "2026-09-02" },
  { id: "2", account_id: "acc_biz", type: "expense", category: "Vận hành shop", amount: 28000000, date: "2026-09-10" },
];
const reportLoss = generateReport("2026-09", bizAcc, txsLoss, DEFAULT_RULES);
assert.strictEqual(reportLoss.totalRevenue, 20000000);
assert.strictEqual(reportLoss.totalExpense, 28000000);
assert.strictEqual(reportLoss.netProfit, -8000000);
assert.strictEqual(reportLoss.healthStatus, "loss");
assert.ok(reportLoss.recommendation.includes("đang lỗ thâm hụt"));
console.log("--- TEST 4: Loss scenario detection PASS ---");

// TEST 5: Zero revenue scenario
const reportZero = generateReport("2026-09", bizAcc, [], DEFAULT_RULES);
assert.strictEqual(reportZero.totalRevenue, 0);
assert.strictEqual(reportZero.totalExpense, 0);
assert.strictEqual(reportZero.netProfit, 0);
assert.strictEqual(reportZero.profitMargin, 0);
assert.strictEqual(reportZero.healthStatus, "tight");
console.log("--- TEST 5: Zero revenue scenario PASS ---");

console.log("=== ALL BUSINESS CASH FLOW REPORT UNIT TESTS PASSED 100% ===");
