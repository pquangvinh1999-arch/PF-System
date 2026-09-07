const assert = require("assert");

console.log("=== RUNNING CASH FLOW FORECAST ALGORITHM UNIT TESTS ===");

const Colors = {
  primary: "#0F6E5B",
  primaryLight: "#E4F1EC",
  accent: "#D4A72C",
  accentLight: "#FBF1DA",
  success: "#1E8E5A",
  warning: "#E0972B",
  danger: "#D64545",
};

// Thuật toán theo đúng DESIGN.md mục 4
function calculateForecast({
  currentBalance,
  remainingExpectedIncome,
  unpaidPlannedExpenses,
  remainingBudget,
  warningThreshold = 1000000,
}) {
  const projectedEndBalance =
    currentBalance + remainingExpectedIncome - unpaidPlannedExpenses - remainingBudget;

  let status;
  let statusColor;
  let statusLabel;

  if (projectedEndBalance < 0) {
    status = "danger";
    statusColor = Colors.danger; // #D64545
    statusLabel = "Âm quỹ dự kiến";
  } else if (projectedEndBalance <= warningThreshold) {
    status = "warning";
    statusColor = Colors.warning; // #E0972B
    statusLabel = "Sát ngưỡng chi tiêu";
  } else {
    status = "safe";
    statusColor = Colors.success; // #1E8E5A
    statusLabel = "Dòng tiền an toàn";
  }

  const isNegative = projectedEndBalance < 0;
  const abs = Math.abs(Math.round(projectedEndBalance));
  const formattedBalance = (isNegative ? "-" : "") + abs.toLocaleString("vi-VN") + " đ";

  return {
    currentBalance,
    remainingExpectedIncome,
    unpaidPlannedExpenses,
    remainingBudget,
    projectedEndBalance,
    status,
    statusColor,
    statusLabel,
    displayText: "Số dư dự kiến cuối tháng sau khi trừ các khoản đã lên lịch:",
    formattedBalance,
  };
}

function computeUnpaidPlannedExpenses(plannedExpenses, period, accountId) {
  return plannedExpenses
    .filter((pe) => {
      const matchesPeriod = pe.due_date.startsWith(period);
      const matchesAccount = accountId ? pe.account_id === accountId : true;
      const isUnpaid = pe.status !== "paid";
      return matchesPeriod && matchesAccount && isUnpaid;
    })
    .reduce((sum, pe) => sum + pe.amount, 0);
}

function computeRemainingExpectedIncome(incomeSources, transactions, period, accountId) {
  const expectedMonthlyTotal = incomeSources
    .filter((s) => s.frequency === "monthly")
    .reduce((sum, s) => sum + s.amount, 0);

  const actualIncome = transactions
    .filter((t) => {
      const inPeriod = t.date.startsWith(period);
      const isIncome = t.type === "income";
      const matchesAccount = accountId ? t.account_id === accountId : true;
      return inPeriod && isIncome && matchesAccount;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  return Math.max(0, expectedMonthlyTotal - actualIncome);
}

function computeRemainingBudget(budgets, transactions, period, accountId) {
  const totalAllocatedBudget = budgets
    .filter((b) => {
      const inPeriod = b.period === period;
      const isExpenseGroup = b.group ? b.group !== "savings" : true;
      return inPeriod && isExpenseGroup;
    })
    .reduce((sum, b) => sum + (b.allocated_amount || 0), 0);

  const actualExpenses = transactions
    .filter((t) => {
      const inPeriod = t.date.startsWith(period);
      const isExpense = t.type === "expense";
      const matchesAccount = accountId ? t.account_id === accountId : true;
      return inPeriod && isExpense && matchesAccount;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  return Math.max(0, totalAllocatedBudget - actualExpenses);
}

// TEST 1: Kịch bản ĐỦ QUỸ (Safe - Xanh)
{
  const result = calculateForecast({
    currentBalance: 15000000,
    remainingExpectedIncome: 10000000,
    unpaidPlannedExpenses: 5000000,
    remainingBudget: 8000000,
  });

  // 15M + 10M - 5M - 8M = 12M
  assert.strictEqual(result.projectedEndBalance, 12000000);
  assert.strictEqual(result.status, "safe");
  assert.strictEqual(result.statusColor, "#1E8E5A");
  assert.strictEqual(result.displayText, "Số dư dự kiến cuối tháng sau khi trừ các khoản đã lên lịch:");
  console.log("--- TEST 1: Safe surplus cash flow forecast PASS (12M, green) ---");
}

// TEST 2: Kịch bản SÁT NGƯỠNG (Warning - Vàng)
{
  const result = calculateForecast({
    currentBalance: 5000000,
    remainingExpectedIncome: 0,
    unpaidPlannedExpenses: 2500000,
    remainingBudget: 2000000,
    warningThreshold: 1000000,
  });

  // 5M + 0 - 2.5M - 2M = 500,000 (<= 1,000,000)
  assert.strictEqual(result.projectedEndBalance, 500000);
  assert.strictEqual(result.status, "warning");
  assert.strictEqual(result.statusColor, "#E0972B");
  console.log("--- TEST 2: Warning tight threshold forecast PASS (500k, yellow) ---");
}

// TEST 3: Kịch bản ÂM QUỸ DỰ KIẾN (Danger - Đỏ)
{
  const result = calculateForecast({
    currentBalance: 3000000,
    remainingExpectedIncome: 2000000,
    unpaidPlannedExpenses: 4000000,
    remainingBudget: 3000000,
  });

  // 3M + 2M - 4M - 3M = -2M
  assert.strictEqual(result.projectedEndBalance, -2000000);
  assert.strictEqual(result.status, "danger");
  assert.strictEqual(result.statusColor, "#D64545");
  assert(result.formattedBalance.includes("-2.000.000"));
  console.log("--- TEST 3: Danger deficit forecast PASS (-2M, red) ---");
}

// TEST 4: Trích xuất chính xác PlannedExpense chưa "paid"
{
  const testExpenses = [
    { id: "1", title: "Học phí", amount: 3000000, due_date: "2026-09-15", status: "upcoming", account_id: "personal" },
    { id: "2", title: "Bảo hiểm xe", amount: 1500000, due_date: "2026-09-20", status: "paid", account_id: "personal" }, // Đã trả -> loại
    { id: "3", title: "Đám cưới bạn", amount: 1000000, due_date: "2026-09-28", status: "overdue", account_id: "personal" }, // Quá hạn -> tính
    { id: "4", title: "Tiền nhà tháng 10", amount: 5000000, due_date: "2026-10-05", status: "upcoming", account_id: "personal" }, // Tháng khác -> loại
  ];

  const totalUnpaid = computeUnpaidPlannedExpenses(testExpenses, "2026-09");
  // 3M + 1M = 4M
  assert.strictEqual(totalUnpaid, 4000000);
  console.log("--- TEST 4: Planned expenses unpaid filtering PASS (4M) ---");
}

// TEST 5: Tính thu nhập dự kiến và ngân sách chi tiêu còn lại
{
  const sources = [
    { id: "s1", amount: 20000000, frequency: "monthly" },
    { id: "s2", amount: 10000000, frequency: "monthly" },
    { id: "s3", amount: 5000000, frequency: "irregular" }, // Không tính irregular cố định
  ];

  // Đã nhận 18M lương
  const txs = [
    { type: "income", amount: 18000000, date: "2026-09-05" },
    { type: "expense", amount: 7000000, date: "2026-09-08" },
  ];

  const remainingIncome = computeRemainingExpectedIncome(sources, txs, "2026-09");
  // Expected = 30M, actual income = 18M -> remaining = 12M
  assert.strictEqual(remainingIncome, 12000000);

  const budgets = [
    { period: "2026-09", group: "needs", allocated_amount: 15000000 },
    { period: "2026-09", group: "wants", allocated_amount: 5000000 },
    { period: "2026-09", group: "savings", allocated_amount: 5000000 }, // savings không phải expense
  ];

  const remainingBudget = computeRemainingBudget(budgets, txs, "2026-09");
  // Total expense budget = 15M + 5M = 20M. Actual expense = 7M -> remaining = 13M
  assert.strictEqual(remainingBudget, 13000000);

  console.log("--- TEST 5: Remaining expected income & budget calculations PASS ---");
}

console.log("=== ALL CASH FLOW FORECAST UNIT TESTS PASSED 100% ===");
