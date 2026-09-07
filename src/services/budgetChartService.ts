import { Budget, BudgetGroup, Transaction } from "../types";
import { getCategoryBudgetGroup } from "../constants/categories";
import { Colors } from "../constants/theme";

export interface GroupAllocationItem {
  group: BudgetGroup;
  groupName: string;
  color: string;
  plannedPercent: number;
  plannedAmount: number;
  actualPercent: number; // % trên tổng chi tiêu thực tế
  actualOfIncomePercent: number; // % trên tổng thu nhập
  actualAmount: number;
  variancePercent: number; // actualPercent - plannedPercent
  varianceAmount: number; // actualAmount - plannedAmount
  status: "on_track" | "exceeded" | "under";
}

export interface BudgetAllocationReport {
  period: string;
  totalIncome: number;
  totalPlannedExpense: number;
  totalActualExpense: number;
  healthScore: number; // 0 - 100 điểm
  evaluationMessage: string;
  groups: GroupAllocationItem[];
  hasData: boolean;
}

export const BudgetChartService = {
  calculateAllocation(
    period: string,
    budgets: Budget[],
    transactions: Transaction[]
  ): BudgetAllocationReport {
    // 1. Lấy giao dịch trong kỳ
    const periodTxs = transactions.filter((t) => t.date.startsWith(period));
    const incomeTxs = periodTxs.filter((t) => t.type === "income");
    const expenseTxs = periodTxs.filter((t) => t.type === "expense");

    const totalIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0);
    const totalActualExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);

    // 2. Phân loại expense theo nhóm
    const spentByGroup: Record<BudgetGroup, number> = {
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

    const groupMeta: Record<BudgetGroup, { name: string; color: string; defaultPct: number }> = {
      needs: {
        name: "Thiết yếu (Needs)",
        color: Colors.primary, // #0F6E5B
        defaultPct: 50,
      },
      wants: {
        name: "Cá nhân (Wants)",
        color: Colors.accent, // #D4A72C
        defaultPct: 30,
      },
      savings: {
        name: "Tiết kiệm & Đầu tư (Savings)",
        color: Colors.success, // #1E8E5A
        defaultPct: 20,
      },
    };

    const groupKeys: BudgetGroup[] = ["needs", "wants", "savings"];

    let totalPlannedExpense = 0;
    const items: GroupAllocationItem[] = [];

    // Tổng chi tiêu cá nhân thực tế (không gồm business)
    const totalPersonalExpense =
      spentByGroup.needs + spentByGroup.wants + spentByGroup.savings;

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

      let status: "on_track" | "exceeded" | "under" = "on_track";
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

    // Tính điểm sức khỏe ngân sách (Budget Health Score)
    // Nếu tổng độ lệch 0% -> 100 điểm, mỗi 2% lệch trừ 1 điểm
    let healthScore = 100;
    if (totalPersonalExpense > 0) {
      healthScore = Math.max(0, Math.min(100, Math.round(100 - totalDeviation / 1.5)));
    } else {
      healthScore = 100;
    }

    // Đánh giá tổng quan
    let evaluationMessage = "Chưa có phát sinh chi tiêu cá nhân trong tháng.";
    if (totalPersonalExpense > 0) {
      const exceededGroup = items.find((i) => i.status === "exceeded");
      if (healthScore >= 85) {
        evaluationMessage = "Xuất sắc! Cơ cấu chi tiêu bám rất sát kế hoạch ngân sách.";
      } else if (healthScore >= 70) {
        if (exceededGroup) {
          evaluationMessage = `Cơ cấu chi tiêu khá ổn, tuy nhiên nhóm ${exceededGroup.groupName} đang vượt định mức.`;
        } else {
          evaluationMessage = "Cơ cấu chi tiêu ở mức cân bằng, hãy duy trì kỷ luật tích lũy.";
        }
      } else {
        evaluationMessage = "Cảnh báo: Cơ cấu chi tiêu đang lệch nhiều so với mục tiêu kế hoạch ban đầu.";
      }
    }

    return {
      period,
      totalIncome,
      totalPlannedExpense,
      totalActualExpense: totalPersonalExpense,
      healthScore,
      evaluationMessage,
      groups: items,
      hasData: totalPersonalExpense > 0 || totalIncome > 0,
    };
  },
};
