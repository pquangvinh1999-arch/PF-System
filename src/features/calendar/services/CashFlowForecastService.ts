import { IncomeSource, Transaction, Budget, PlannedExpense, Account } from "../../../types";
import { Colors } from "../../../constants/theme";

export interface CashFlowForecastParams {
  currentBalance: number;
  remainingExpectedIncome: number;
  unpaidPlannedExpenses: number;
  remainingBudget: number;
  warningThreshold?: number; // default: 1,000,000 VND
}

export type ForecastStatus = "safe" | "warning" | "danger";

export interface CashFlowForecastResult {
  currentBalance: number;
  remainingExpectedIncome: number;
  unpaidPlannedExpenses: number;
  remainingBudget: number;
  projectedEndBalance: number;
  status: ForecastStatus;
  statusColor: string;
  statusBgColor: string;
  statusLabel: string;
  displayText: string;
  formattedBalance: string;
}

export class CashFlowForecastService {
  /**
   * Tính toán dự báo dòng tiền cuối tháng theo đúng công thức DESIGN.md mục 4:
   * Số dư hiện tại + Thu nhập dự kiến còn lại trong tháng − Tổng PlannedExpense chưa "paid" trong tháng − Ngân sách chi tiêu còn lại theo kế hoạch Budget
   */
  static calculateForecast(params: CashFlowForecastParams): CashFlowForecastResult {
    const {
      currentBalance,
      remainingExpectedIncome,
      unpaidPlannedExpenses,
      remainingBudget,
      warningThreshold = 1000000,
    } = params;

    const projectedEndBalance =
      currentBalance + remainingExpectedIncome - unpaidPlannedExpenses - remainingBudget;

    let status: ForecastStatus;
    let statusColor: string;
    let statusBgColor: string;
    let statusLabel: string;

    if (projectedEndBalance < 0) {
      status = "danger";
      statusColor = Colors.danger; // #D64545
      statusBgColor = "#FDE8E8";
      statusLabel = "Âm quỹ dự kiến";
    } else if (projectedEndBalance <= warningThreshold) {
      status = "warning";
      statusColor = Colors.warning; // #E0972B
      statusBgColor = "#FEF3C7";
      statusLabel = "Sát ngưỡng chi tiêu";
    } else {
      status = "safe";
      statusColor = Colors.success; // #1E8E5A
      statusBgColor = Colors.primaryLight; // #E4F1EC
      statusLabel = "Dòng tiền an toàn";
    }

    const formattedBalance = CashFlowForecastService.formatCurrency(projectedEndBalance);

    return {
      currentBalance,
      remainingExpectedIncome,
      unpaidPlannedExpenses,
      remainingBudget,
      projectedEndBalance,
      status,
      statusColor,
      statusBgColor,
      statusLabel,
      displayText: "Số dư dự kiến cuối tháng sau khi trừ các khoản đã lên lịch:",
      formattedBalance,
    };
  }

  static formatCurrency(amount: number): string {
    const isNegative = amount < 0;
    const abs = Math.abs(Math.round(amount));
    const formatted = abs.toLocaleString("vi-VN") + " đ";
    return isNegative ? `-${formatted}` : formatted;
  }

  /**
   * Tính tổng PlannedExpense chưa "paid" trong tháng (upcoming hoặc overdue)
   */
  static computeUnpaidPlannedExpenses(
    plannedExpenses: PlannedExpense[],
    period: string, // YYYY-MM
    accountId?: string
  ): number {
    return plannedExpenses
      .filter((pe) => {
        const matchesPeriod = pe.due_date.startsWith(period);
        const matchesAccount = accountId ? pe.account_id === accountId : true;
        const isUnpaid = pe.status !== "paid";
        return matchesPeriod && matchesAccount && isUnpaid;
      })
      .reduce((sum, pe) => sum + pe.amount, 0);
  }

  /**
   * Tính thu nhập dự kiến còn lại trong tháng:
   * max(0, tổng thu nhập kỳ vọng từ IncomeSource - thu nhập thực tế đã nhận trong tháng)
   */
  static computeRemainingExpectedIncome(
    incomeSources: IncomeSource[],
    transactions: Transaction[],
    period: string,
    accountId?: string
  ): number {
    // Tổng thu nhập kỳ vọng hàng tháng (từ nguồn thu cá nhân/chung)
    const expectedMonthlyTotal = incomeSources
      .filter((s) => s.frequency === "monthly")
      .reduce((sum, s) => sum + s.amount, 0);

    // Thu nhập thực tế đã ghi nhận trong kỳ
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

  /**
   * Tính ngân sách chi tiêu còn lại theo kế hoạch Budget:
   * max(0, tổng ngân sách chi tiêu được cấp (needs + wants) - chi tiêu thực tế trong tháng)
   */
  static computeRemainingBudget(
    budgets: Budget[],
    transactions: Transaction[],
    period: string,
    accountId?: string
  ): number {
    // Tổng ngân sách chi tiêu (thường là Needs + Wants cho chi tiêu cá nhân/gia đình)
    const totalAllocatedBudget = budgets
      .filter((b) => {
        const inPeriod = b.period === period;
        // Nếu có group, chỉ tính needs và wants (chi tiêu), không tính savings
        const isExpenseGroup = b.group ? b.group !== "savings" : true;
        return inPeriod && isExpenseGroup;
      })
      .reduce((sum, b) => sum + (b.allocated_amount || 0), 0);

    // Chi tiêu thực tế đã diễn ra trong tháng (loại trừ transfer và chi phí kinh doanh nếu xét riêng cá nhân)
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

  /**
   * Tính toán toàn diện forecast cho kỳ (period: YYYY-MM) từ state tổng
   */
  static getMonthForecast(params: {
    accounts: Account[];
    incomeSources: IncomeSource[];
    transactions: Transaction[];
    budgets: Budget[];
    plannedExpenses: PlannedExpense[];
    period: string; // YYYY-MM
    targetAccountId?: string;
    warningThreshold?: number;
  }): CashFlowForecastResult {
    const {
      accounts,
      incomeSources,
      transactions,
      budgets,
      plannedExpenses,
      period,
      targetAccountId,
      warningThreshold,
    } = params;

    // Số dư hiện tại
    let currentBalance = 0;
    if (targetAccountId) {
      const acc = accounts.find((a) => a.id === targetAccountId);
      currentBalance = acc ? acc.balance : 0;
    } else {
      // Mặc định ví cá nhân nếu có, hoặc tổng số dư
      const personalAcc = accounts.find((a) => a.type === "personal");
      currentBalance = personalAcc
        ? personalAcc.balance
        : accounts.reduce((s, a) => s + a.balance, 0);
    }

    const remainingExpectedIncome = CashFlowForecastService.computeRemainingExpectedIncome(
      incomeSources,
      transactions,
      period,
      targetAccountId
    );

    const unpaidPlannedExpenses = CashFlowForecastService.computeUnpaidPlannedExpenses(
      plannedExpenses,
      period,
      targetAccountId
    );

    const remainingBudget = CashFlowForecastService.computeRemainingBudget(
      budgets,
      transactions,
      period,
      targetAccountId
    );

    return CashFlowForecastService.calculateForecast({
      currentBalance,
      remainingExpectedIncome,
      unpaidPlannedExpenses,
      remainingBudget,
      warningThreshold,
    });
  }
}
