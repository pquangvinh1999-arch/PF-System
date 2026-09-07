import { Budget, BudgetGroup, Transaction } from "../types";
import { getCategoryBudgetGroup } from "../constants/categories";

export interface BudgetGroupStatus {
  group: BudgetGroup;
  name: string;
  allocatedPercentage: number;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  spentRate: number; // % của ngân sách đã tiêu
  isOverBudget: boolean;
  status: "normal" | "warning" | "danger";
  color: string;
  icon: string;
}

export interface MonthBudgetSummary {
  period: string;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  totalRate: number;
  groups: Record<BudgetGroup, BudgetGroupStatus>;
  isAnyOverBudget: boolean;
}

export const BudgetService = {
  calculateGroupStatus(
    period: string,
    budgets: Budget[],
    transactions: Transaction[]
  ): MonthBudgetSummary {
    const periodTransactions = transactions.filter(
      (t) => t.date.startsWith(period) && t.type === "expense"
    );

    // Tính spent theo từng group
    const spentByGroup: Record<BudgetGroup, number> = {
      needs: 0,
      wants: 0,
      savings: 0,
    };

    for (const tx of periodTransactions) {
      const group = getCategoryBudgetGroup(tx.category);
      if (group && group !== "business") {
        spentByGroup[group] = (spentByGroup[group] || 0) + tx.amount;
      }
    }

    // Lấy budget theo từng group (nếu chưa set thì mặc định 50/30/20 trên cơ sở tổng ngân sách hoặc fallback)
    const findGroupBudget = (grp: BudgetGroup): Budget | undefined => {
      return budgets.find((b) => b.group === grp || b.budget_group === grp);
    };

    const buildStatus = (
      grp: BudgetGroup,
      name: string,
      defaultPercent: number,
      color: string,
      icon: string
    ): BudgetGroupStatus => {
      const b = findGroupBudget(grp);
      const allocatedPercentage = b ? b.allocated_percentage : defaultPercent;
      const allocatedAmount = b ? b.allocated_amount : 0;
      const spentAmount = spentByGroup[grp] || 0;
      const remainingAmount = allocatedAmount - spentAmount;
      const spentRate = allocatedAmount > 0 ? Math.round((spentAmount / allocatedAmount) * 100) : 0;
      const isOverBudget = allocatedAmount > 0 && spentAmount > allocatedAmount;

      let status: "normal" | "warning" | "danger" = "normal";
      if (isOverBudget) {
        status = "danger";
      } else if (spentRate >= 80) {
        status = "warning";
      }

      return {
        group: grp,
        name,
        allocatedPercentage,
        allocatedAmount,
        spentAmount,
        remainingAmount,
        spentRate,
        isOverBudget,
        status,
        color,
        icon,
      };
    };

    const needsStatus = buildStatus("needs", "Thiết yếu (Needs)", 50, "#0F6E5B", "🏠");
    const wantsStatus = buildStatus("wants", "Cá nhân (Wants)", 30, "#D4A72C", "🛍️");
    const savingsStatus = buildStatus("savings", "Tiết kiệm (Savings)", 20, "#1E8E5A", "🛡️");

    const totalAllocated =
      needsStatus.allocatedAmount + wantsStatus.allocatedAmount + savingsStatus.allocatedAmount;
    const totalSpent =
      needsStatus.spentAmount + wantsStatus.spentAmount + savingsStatus.spentAmount;
    const totalRemaining = totalAllocated - totalSpent;
    const totalRate = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
    const isAnyOverBudget =
      needsStatus.isOverBudget || wantsStatus.isOverBudget || savingsStatus.isOverBudget;

    return {
      period,
      totalAllocated,
      totalSpent,
      totalRemaining,
      totalRate,
      groups: {
        needs: needsStatus,
        wants: wantsStatus,
        savings: savingsStatus,
      },
      isAnyOverBudget,
    };
  },
};
