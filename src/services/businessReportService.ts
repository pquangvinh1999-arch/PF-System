import { Account, Transaction, ProfitFirstRule, ProfitFirstCategory } from "../types";
import { ProfitFirstService, PROFIT_FIRST_BUCKET_META } from "./profitFirstService";
import { Colors } from "../constants/theme";

export interface BusinessExpenseCategoryItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface ProfitFirstBucketSummary {
  category: ProfitFirstCategory;
  name: string;
  icon: string;
  color: string;
  percentage: number;
  allocatedAmount: number;
}

export interface BusinessCashFlowReport {
  period: string;
  accountId: string;
  accountName: string;
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number; // %
  totalOwnerPayWithdrawn: number;
  buckets: ProfitFirstBucketSummary[];
  expenseCategories: BusinessExpenseCategoryItem[];
  healthStatus: "healthy" | "tight" | "loss";
  recommendation: string;
  transactionCount: number;
}

export const BusinessReportService = {
  generateReport(
    period: string,
    businessAccount: Account,
    transactions: Transaction[],
    rules: ProfitFirstRule[]
  ): BusinessCashFlowReport {
    // 1. Lọc giao dịch của business account trong kỳ
    const periodTxs = transactions.filter((t) => t.date.startsWith(period));

    // Doanh thu kinh doanh: các khoản thu nhập vào ví business
    const revenueTxs = periodTxs.filter(
      (t) => t.account_id === businessAccount.id && t.type === "income"
    );
    const totalRevenue = revenueTxs.reduce((sum, t) => sum + t.amount, 0);

    // Chi phí kinh doanh: các khoản expense từ ví business
    const expenseTxs = periodTxs.filter(
      (t) => t.account_id === businessAccount.id && t.type === "expense"
    );
    const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);

    // Các khoản chuyển tiền từ ví business sang ví khác (thường là rút lương chủ / lợi nhuận về ví cá nhân)
    const withdrawalTxs = periodTxs.filter(
      (t) => t.account_id === businessAccount.id && t.type === "transfer"
    );
    const totalOwnerPayWithdrawn = withdrawalTxs.reduce((sum, t) => sum + t.amount, 0);

    // Lợi nhuận ròng = Doanh thu - Chi phí vận hành
    const netProfit = totalRevenue - totalExpense;
    const profitMargin =
      totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    // 2. Phân loại chi phí theo danh mục kinh doanh
    const catMap: Record<string, number> = {};
    for (const t of expenseTxs) {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    }

    const expenseCategories: BusinessExpenseCategoryItem[] = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      }));

    // 3. Phân bổ Profit First theo 5 quỹ
    const allocationResult = ProfitFirstService.calculateAllocation(
      totalRevenue,
      rules
    );

    const buckets: ProfitFirstBucketSummary[] = allocationResult.allocations.map(
      (item) => ({
        category: item.category,
        name: item.title,
        icon: item.icon,
        color: item.color,
        percentage: item.percentage,
        allocatedAmount: item.amount,
      })
    );

    // 4. Đánh giá sức khỏe dòng tiền kinh doanh
    let healthStatus: "healthy" | "tight" | "loss" = "healthy";
    let recommendation = "Shop hoạt động ổn định, hãy tiếp tục duy trì tỷ lệ trích quỹ.";

    if (totalRevenue === 0) {
      healthStatus = "tight";
      recommendation = "Chưa phát sinh doanh thu trong kỳ này. Rà soát lại kế hoạch bán hàng.";
    } else if (netProfit < 0) {
      healthStatus = "loss";
      recommendation = `Shop đang lỗ thâm hụt ${Math.abs(netProfit).toLocaleString("vi-VN")} đ. Cần cắt giảm ngay chi phí vận hành (Opex) không cốt lõi.`;
    } else if (profitMargin >= 25) {
      healthStatus = "healthy";
      recommendation = `Biên lợi nhuận xuất sắc (${profitMargin}%). Hãy chuyển ngay phần Lợi nhuận tích lũy sang tài khoản riêng để bảo vệ thành quả.`;
    } else if (profitMargin >= 10) {
      healthStatus = "healthy";
      recommendation = `Biên lợi nhuận ${profitMargin}% ở mức tốt. Đảm bảo dự phòng thuế đầy đủ cho cuối năm.`;
    } else {
      healthStatus = "tight";
      recommendation = `Biên lợi nhuận mỏng (${profitMargin}%). Cân nhắc tối ưu giá vốn hàng bán hoặc chi phí mặt bằng/marketing.`;
    }

    const totalBizTxs = periodTxs.filter(
      (t) =>
        t.account_id === businessAccount.id ||
        t.to_account_id === businessAccount.id
    ).length;

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
      transactionCount: totalBizTxs,
    };
  },
};
