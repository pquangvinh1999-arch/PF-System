const assert = require("assert");

// Mock categories map
const CATEGORY_MAP = {
  "Ăn uống": "needs",
  "Nhà cửa": "needs",
  "Đi lại": "needs",
  "Giải trí": "wants",
  "Mua sắm": "wants",
  "Tiết kiệm": "savings",
  "Đầu tư": "savings",
  "Vận hành shop": "business",
};

function getCategoryBudgetGroup(cat) {
  return CATEGORY_MAP[cat] || "wants";
}

function calculateAllocation(period, budgets, transactions) {
  const periodTxs = transactions.filter((t) => t.date.startsWith(period));
  const incomeTxs = periodTxs.filter((t) => t.type === "income");
  const expenseTxs = periodTxs.filter((t) => t.type === "expense");

  const totalIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0);
  const totalActualExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);

  const spentByGroup = {
    needs: 0,
    wants: 0,
    savings: 0,
  };

  for (const tx of expenseTxs) {
    const grp = getCategoryBudgetGroup(tx.category);
    if (grp && grp !== "business") {
      spentByGroup[grp] += tx.amount;
    }
  }

  const groupMeta = {
    needs: { name: "Thiết yếu (Needs)", color: "#0F6E5B", defaultPct: 50 },
    wants: { name: "Cá nhân (Wants)", color: "#D4A72C", defaultPct: 30 },
    savings: { name: "Tiết kiệm & Đầu tư (Savings)", color: "#1E8E5A", defaultPct: 20 },
  };

  const groupKeys = ["needs", "wants", "savings"];
  let totalPlannedExpense = 0;
  const items = [];
  const totalPersonalExpense = spentByGroup.needs + spentByGroup.wants + spentByGroup.savings;
  let totalDeviation = 0;

  for (const grp of groupKeys) {
    const budget = budgets.find((b) => b.group === grp || b.budget_group === grp);
    const plannedPercent = budget ? budget.allocated_percentage : groupMeta[grp].defaultPct;
    const plannedAmount = budget
      ? budget.allocated_amount
      : Math.round((totalIncome * plannedPercent) / 100);

    totalPlannedExpense += plannedAmount;

    const actualAmount = spentByGroup[grp];
    const actualPercent =
      totalPersonalExpense > 0
        ? Math.round((actualAmount / totalPersonalExpense) * 100)
        : 0;
    const actualOfIncomePercent =
      totalIncome > 0 ? Math.round((actualAmount / totalIncome) * 100) : 0;

    const variancePercent = actualPercent - plannedPercent;
    const varianceAmount = actualAmount - plannedAmount;

    let status = "on_track";
    if (actualAmount > plannedAmount && plannedAmount > 0) {
      status = "exceeded";
    } else if (actualAmount < plannedAmount * 0.7 && plannedAmount > 0) {
      status = "under";
    }

    totalDeviation += Math.abs(variancePercent);

    items.push({
      group: grp,
      groupName: groupMeta[grp].name,
      color: groupMeta[grp].color,
      plannedPercent,
      plannedAmount,
      actualPercent,
      actualOfIncomePercent,
      actualAmount,
      variancePercent,
      varianceAmount,
      status,
    });
  }

  let healthScore = 100;
  if (totalPersonalExpense > 0) {
    healthScore = Math.max(0, Math.min(100, Math.round(100 - totalDeviation / 1.5)));
  }

  return {
    period,
    totalIncome,
    totalPlannedExpense,
    totalActualExpense: totalPersonalExpense,
    healthScore,
    groups: items,
    hasData: totalPersonalExpense > 0 || totalIncome > 0,
  };
}

// ---------------- TESTS ----------------
console.log("=== RUNNING BUDGET ALLOCATION CHART UNIT TESTS ===");

// TEST 1: Default 50/30/20 plan without existing budgets
const incomeTxs = [
  { id: "1", type: "income", category: "Lương", amount: 30000000, date: "2026-09-05" },
];
const report1 = calculateAllocation("2026-09", [], incomeTxs);
assert.strictEqual(report1.totalIncome, 30000000);
assert.strictEqual(report1.totalPlannedExpense, 30000000);
const needsItem1 = report1.groups.find((g) => g.group === "needs");
const wantsItem1 = report1.groups.find((g) => g.group === "wants");
const savingsItem1 = report1.groups.find((g) => g.group === "savings");
assert.strictEqual(needsItem1.plannedPercent, 50);
assert.strictEqual(needsItem1.plannedAmount, 15000000);
assert.strictEqual(wantsItem1.plannedPercent, 30);
assert.strictEqual(wantsItem1.plannedAmount, 9000000);
assert.strictEqual(savingsItem1.plannedPercent, 20);
assert.strictEqual(savingsItem1.plannedAmount, 6000000);
console.log("--- TEST 1: Default 50/30/20 planned allocation PASS ---");

// TEST 2: Actual spending calculation & percentage distribution
const mixedTxs = [
  { id: "1", type: "income", category: "Lương", amount: 30000000, date: "2026-09-05" },
  { id: "2", type: "expense", category: "Ăn uống", amount: 10000000, date: "2026-09-10" }, // needs
  { id: "3", type: "expense", category: "Nhà cửa", amount: 5000000, date: "2026-09-12" }, // needs (total needs = 15M = 50%)
  { id: "4", type: "expense", category: "Giải trí", amount: 9000000, date: "2026-09-15" }, // wants (total wants = 9M = 30%)
  { id: "5", type: "expense", category: "Tiết kiệm", amount: 6000000, date: "2026-09-20" }, // savings (total savings = 6M = 20%)
  { id: "6", type: "expense", category: "Vận hành shop", amount: 12000000, date: "2026-09-21" }, // business expense (excluded from personal)
];
const report2 = calculateAllocation("2026-09", [], mixedTxs);
assert.strictEqual(report2.totalActualExpense, 30000000);
const needsItem2 = report2.groups.find((g) => g.group === "needs");
const wantsItem2 = report2.groups.find((g) => g.group === "wants");
const savingsItem2 = report2.groups.find((g) => g.group === "savings");
assert.strictEqual(needsItem2.actualPercent, 50);
assert.strictEqual(wantsItem2.actualPercent, 30);
assert.strictEqual(savingsItem2.actualPercent, 20);
assert.strictEqual(needsItem2.variancePercent, 0);
assert.strictEqual(wantsItem2.variancePercent, 0);
assert.strictEqual(savingsItem2.variancePercent, 0);
assert.strictEqual(report2.healthScore, 100);
console.log("--- TEST 2: Exact plan matching & 100 score PASS ---");

// TEST 3: Variance & Exceeded Status
const overspentTxs = [
  { id: "1", type: "income", category: "Lương", amount: 20000000, date: "2026-09-01" },
  { id: "2", type: "expense", category: "Ăn uống", amount: 14000000, date: "2026-09-10" }, // needs = 14M (70% of 20M total spent)
  { id: "3", type: "expense", category: "Giải trí", amount: 4000000, date: "2026-09-12" }, // wants = 4M (20%)
  { id: "4", type: "expense", category: "Tiết kiệm", amount: 2000000, date: "2026-09-15" }, // savings = 2M (10%)
];
const report3 = calculateAllocation("2026-09", [], overspentTxs);
const needsItem3 = report3.groups.find((g) => g.group === "needs");
assert.strictEqual(needsItem3.actualPercent, 70);
assert.strictEqual(needsItem3.variancePercent, 20); // 70% - 50%
assert.strictEqual(needsItem3.status, "exceeded"); // 14M > 10M planned
assert.ok(report3.healthScore < 100);
console.log(`--- TEST 3: Overspent variance & health score (${report3.healthScore}) PASS ---`);

// TEST 4: Custom budget rules (60/25/15)
const customBudgets = [
  { id: "b1", period: "2026-09", category: "needs", allocated_percentage: 60, allocated_amount: 18000000, group: "needs" },
  { id: "b2", period: "2026-09", category: "wants", allocated_percentage: 25, allocated_amount: 7500000, group: "wants" },
  { id: "b3", period: "2026-09", category: "savings", allocated_percentage: 15, allocated_amount: 4500000, group: "savings" },
];
const report4 = calculateAllocation("2026-09", customBudgets, mixedTxs);
const needsItem4 = report4.groups.find((g) => g.group === "needs");
const wantsItem4 = report4.groups.find((g) => g.group === "wants");
const savingsItem4 = report4.groups.find((g) => g.group === "savings");
assert.strictEqual(needsItem4.plannedPercent, 60);
assert.strictEqual(needsItem4.plannedAmount, 18000000);
assert.strictEqual(wantsItem4.plannedPercent, 25);
assert.strictEqual(wantsItem4.plannedAmount, 7500000);
assert.strictEqual(savingsItem4.plannedPercent, 15);
assert.strictEqual(savingsItem4.plannedAmount, 4500000);
console.log("--- TEST 4: Custom budget rules (60/25/15) integration PASS ---");

console.log("=== ALL BUDGET ALLOCATION CHART UNIT TESTS PASSED 100% ===");
