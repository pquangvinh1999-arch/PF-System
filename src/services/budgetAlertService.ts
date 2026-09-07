import { Budget, BudgetGroup, Transaction } from "../types";
import { getCategoryBudgetGroup } from "../constants/categories";

export type AlertLevel = "safe" | "warning" | "danger";

export interface GroupAlert {
  group: BudgetGroup;
  groupName: string;
  level: AlertLevel;
  allocatedAmount: number;
  spentAmount: number;
  overAmount: number; // Số tiền vượt nếu > 0
  remainingAmount: number;
  spentRate: number; // % đã tiêu
  message: string;
  recommendation: string;
  topTransactions: Transaction[];
}

export interface BudgetAlertReport {
  period: string;
  hasDanger: boolean;
  hasWarning: boolean;
  alerts: GroupAlert[];
  highestAlertLevel: AlertLevel;
  totalOverspent: number;
}

export const BudgetAlertService = {
  checkBudgetAlerts(
    period: string,
    budgets: Budget[],
    transactions: Transaction[]
  ): BudgetAlertReport {
    // 1. Lấy chi tiêu expense trong kỳ
    const periodExpenses = transactions.filter(
      (t) => t.date.startsWith(period) && t.type === "expense"
    );

    // 2. Phân loại transactions theo group
    const txByGroup: Record<BudgetGroup, Transaction[]> = {
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

    const groupNames: Record<BudgetGroup, string> = {
      needs: "Thiết yếu (Needs)",
      wants: "Cá nhân (Wants)",
      savings: "Tiết kiệm & Đầu tư (Savings)",
    };

    const alerts: GroupAlert[] = [];
    let totalOverspent = 0;
    let hasDanger = false;
    let hasWarning = false;

    (["needs", "wants", "savings"] as BudgetGroup[]).forEach((grp) => {
      const budget = budgets.find((b) => b.group === grp || b.budget_group === grp);
      const allocatedAmount = budget ? budget.allocated_amount : 0;
      const groupTxs = txByGroup[grp];
      const spentAmount = groupTxs.reduce((sum, t) => sum + t.amount, 0);
      const spentRate = allocatedAmount > 0 ? Math.round((spentAmount / allocatedAmount) * 100) : 0;
      const remainingAmount = allocatedAmount - spentAmount;
      const overAmount = remainingAmount < 0 ? Math.abs(remainingAmount) : 0;

      let level: AlertLevel = "safe";
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

      // Lấy top 3 giao dịch lớn nhất trong nhóm
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

    const highestAlertLevel: AlertLevel = hasDanger
      ? "danger"
      : hasWarning
      ? "warning"
      : "safe";

    return {
      period,
      hasDanger,
      hasWarning,
      alerts,
      highestAlertLevel,
      totalOverspent,
    };
  },
};
