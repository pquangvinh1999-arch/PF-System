const assert = require('node:assert');

// Mock getCategoryBudgetGroup mapping
function getCategoryBudgetGroup(category) {
  if (["Ăn uống", "Nhà ở & Tiện ích", "Đi lại", "Y tế & Sức khỏe", "Hóa đơn sinh hoạt"].includes(category)) {
    return "needs";
  }
  if (["Mua sắm", "Giải trí", "Du lịch", "Cà phê & Hẹn hò", "Làm đẹp & Thể thao"].includes(category)) {
    return "wants";
  }
  if (["Tiết kiệm khẩn cấp", "Đầu tư chứng khoán", "Quỹ tích lũy mua nhà", "Bảo hiểm nhân thọ"].includes(category)) {
    return "savings";
  }
  if (["Nhập hàng kinh doanh", "Marketing & Quảng cáo", "Chi phí vận hành shop"].includes(category)) {
    return "business";
  }
  return undefined;
}

// Service logic under test
function checkBudgetAlerts(period, budgets, transactions) {
  const periodExpenses = transactions.filter(
    (t) => t.date.startsWith(period) && t.type === "expense"
  );

  const txByGroup = {
    needs: [],
    wants: [],
    savings: [],
  };

  for (const tx of periodExpenses) {
    const grp = getCategoryBudgetGroup(tx.category);
    if (grp && grp !== "business") {
      txByGroup[grp].push(tx);
    }
  }

  const groupNames = {
    needs: "Thiết yếu (Needs)",
    wants: "Cá nhân (Wants)",
    savings: "Tiết kiệm & Đầu tư (Savings)",
  };

  const alerts = [];
  let totalOverspent = 0;
  let hasDanger = false;
  let hasWarning = false;

  ["needs", "wants", "savings"].forEach((grp) => {
    const budget = budgets.find((b) => b.group === grp || b.budget_group === grp);
    const allocatedAmount = budget ? budget.allocated_amount : 0;
    const groupTxs = txByGroup[grp];
    const spentAmount = groupTxs.reduce((sum, t) => sum + t.amount, 0);
    const spentRate = allocatedAmount > 0 ? Math.round((spentAmount / allocatedAmount) * 100) : 0;
    const remainingAmount = allocatedAmount - spentAmount;
    const overAmount = remainingAmount < 0 ? Math.abs(remainingAmount) : 0;

    let level = "safe";
    let message = `Chi tiêu trong mức an toàn (${spentRate}%).`;
    let recommendation = "Duy trì nhịp chi tiêu hợp lý.";

    if (allocatedAmount > 0 && spentAmount >= allocatedAmount) {
      level = "danger";
      hasDanger = true;
      totalOverspent += overAmount;
      message = `Bội chi ngân sách ${groupNames[grp]}! Đã vượt ${overAmount.toLocaleString("vi-VN")} đ.`;
      if (grp === "needs") {
        recommendation = "Rà soát lại các hóa đơn sinh hoạt, tiện ích hoặc chi phí sửa chữa đột xuất.";
      } else if (grp === "wants") {
        recommendation = "Cắt giảm ngay các khoản chi giải trí, ăn ngoài, mua sắm không thực sự cần thiết trong tuần còn lại.";
      } else {
        recommendation = "Xem lại kế hoạch tích lũy và chuyển tiền vào quỹ tiết kiệm ngay khi có nguồn thu.";
      }
    } else if (allocatedAmount > 0 && spentRate >= 80) {
      level = "warning";
      hasWarning = true;
      message = `Cảnh báo: Đã dùng ${spentRate}% ngân sách ${groupNames[grp]} (chỉ còn ${remainingAmount.toLocaleString("vi-VN")} đ).`;
      recommendation = "Hạn chế phát sinh thêm các khoản chi trong nhóm này cho đến hết kỳ kế toán.";
    }

    const sortedTxs = [...groupTxs].sort((a, b) => b.amount - a.amount);
    const topTransactions = sortedTxs.slice(0, 3);

    alerts.push({
      group: grp,
      groupName: groupNames[grp],
      level,
      allocatedAmount,
      spentAmount,
      overAmount,
      remainingAmount,
      spentRate,
      message,
      recommendation,
      topTransactions,
    });
  });

  const highestAlertLevel = hasDanger ? "danger" : hasWarning ? "warning" : "safe";

  return {
    period,
    hasDanger,
    hasWarning,
    alerts,
    highestAlertLevel,
    totalOverspent,
  };
}

// Sample Budgets (Needs 20M, Wants 10M, Savings 10M)
const testBudgets = [
  { group: "needs", allocated_amount: 20000000 },
  { group: "wants", allocated_amount: 10000000 },
  { group: "savings", allocated_amount: 10000000 },
];

// TEST 1: Safe spending (< 80%)
const safeTxs = [
  { id: '1', date: '2026-09-02', category: 'Ăn uống', amount: 5000000, type: 'expense' }, // 25% of Needs
  { id: '2', date: '2026-09-03', category: 'Mua sắm', amount: 3000000, type: 'expense' }, // 30% of Wants
];
const safeReport = checkBudgetAlerts('2026-09', testBudgets, safeTxs);
assert.strictEqual(safeReport.highestAlertLevel, 'safe', 'All groups under 80% should have safe level');
assert.strictEqual(safeReport.hasWarning, false, 'hasWarning should be false');
assert.strictEqual(safeReport.hasDanger, false, 'hasDanger should be false');
console.log('--- TEST 1: Safe threshold (< 80%) PASS ---');

// TEST 2: Warning threshold (80% - 99%)
const warningTxs = [
  { id: '1', date: '2026-09-02', category: 'Ăn uống', amount: 17000000, type: 'expense' }, // 17M / 20M = 85% Needs
  { id: '2', date: '2026-09-03', category: 'Mua sắm', amount: 3000000, type: 'expense' },  // 30% Wants
];
const warningReport = checkBudgetAlerts('2026-09', testBudgets, warningTxs);
assert.strictEqual(warningReport.highestAlertLevel, 'warning', 'Needs at 85% should trigger warning');
assert.strictEqual(warningReport.hasWarning, true, 'hasWarning should be true');
assert.strictEqual(warningReport.hasDanger, false, 'hasDanger should be false');
const needsAlert = warningReport.alerts.find(a => a.group === 'needs');
assert.strictEqual(needsAlert.level, 'warning', 'Needs alert level should be warning');
assert.strictEqual(needsAlert.spentRate, 85, 'Needs spentRate should be 85%');
assert.strictEqual(needsAlert.remainingAmount, 3000000, 'Remaining should be 3M');
console.log('--- TEST 2: Warning threshold (85%) PASS ---');

// TEST 3: Danger threshold (Over-budget > 100%)
const dangerTxs = [
  { id: '1', date: '2026-09-02', category: 'Ăn uống', amount: 15000000, type: 'expense' },
  { id: '2', date: '2026-09-05', category: 'Mua sắm', amount: 7000000, type: 'expense' },
  { id: '3', date: '2026-09-08', category: 'Giải trí', amount: 4500000, type: 'expense' }, // Wants total: 11.5M / 10M = 115%
  { id: '4', date: '2026-09-12', category: 'Cà phê & Hẹn hò', amount: 1000000, type: 'expense' }, // Wants total: 12.5M
];
const dangerReport = checkBudgetAlerts('2026-09', testBudgets, dangerTxs);
assert.strictEqual(dangerReport.highestAlertLevel, 'danger', 'Wants at 125% should trigger danger');
assert.strictEqual(dangerReport.hasDanger, true, 'hasDanger should be true');
assert.strictEqual(dangerReport.totalOverspent, 2500000, 'Total overspent should be 2.5M');
const wantsAlert = dangerReport.alerts.find(a => a.group === 'wants');
assert.strictEqual(wantsAlert.level, 'danger', 'Wants alert level should be danger');
assert.strictEqual(wantsAlert.overAmount, 2500000, 'Wants overAmount should be 2.5M');
assert.strictEqual(wantsAlert.spentRate, 125, 'Wants spentRate should be 125%');
console.log('--- TEST 3: Danger threshold (125% over-budget) PASS ---');

// TEST 4: Top transactions identification
assert.strictEqual(wantsAlert.topTransactions.length, 3, 'Should take top 3 transactions');
assert.strictEqual(wantsAlert.topTransactions[0].amount, 7000000, 'Top 1 transaction is Mua sắm 7M');
assert.strictEqual(wantsAlert.topTransactions[1].amount, 4500000, 'Top 2 transaction is Giải trí 4.5M');
assert.strictEqual(wantsAlert.topTransactions[2].amount, 1000000, 'Top 3 transaction is Cà phê 1M');
console.log('--- TEST 4: Top 3 offending transactions identified PASS ---');

// TEST 5: Actionable recommendation verification
assert(wantsAlert.recommendation.includes('Cắt giảm ngay'), 'Wants over-budget recommendation must advise cutting non-essential spending');
console.log('--- TEST 5: Actionable advice generation PASS ---');

console.log('=== ALL BUDGET ALERTS UNIT TESTS PASSED 100% ===');
