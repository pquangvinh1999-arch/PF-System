import { Debt, DebtStrategy } from "../types";

export interface DebtValidationResult {
  isValid: boolean;
  error?: string;
  data?: { name: string; balance: number; interest_rate: number; min_payment: number; strategy: DebtStrategy };
}

export interface PayoffStep {
  order: number;
  debtId: string;
  debtName: string;
  balance: number;
  interestRate: number;
  minPayment: number;
  estimatedMonthsToClear: number;
}

function parseNum(v: unknown): number {
  if (typeof v === "number") return v;
  return parseFloat(String(v ?? "").replace(/[.\sđ₫,%]/g, "").replace(/,/g, ""));
}

export const DebtService = {
  validateDebtInput(input: {
    name?: unknown;
    balance?: unknown;
    interestRate?: unknown;
    minPayment?: unknown;
    strategy?: unknown;
  }): DebtValidationResult {
    const name = String(input.name ?? "").trim();
    if (!name) return { isValid: false, error: "Vui lòng nhập tên khoản nợ" };
    if (name.length > 80) return { isValid: false, error: "Tên khoản nợ tối đa 80 ký tự" };

    const balance = parseNum(input.balance);
    if (isNaN(balance) || balance <= 0)
      return { isValid: false, error: "Vui lòng nhập dư nợ hợp lệ (> 0)" };

    const rate = parseNum(input.interestRate);
    if (isNaN(rate) || rate < 0 || rate > 100)
      return { isValid: false, error: "Lãi suất phải từ 0 đến 100 (%/năm)" };

    const minPay = parseNum(input.minPayment);
    if (isNaN(minPay) || minPay <= 0)
      return { isValid: false, error: "Vui lòng nhập khoản trả tối thiểu (> 0)" };

    const strategy: DebtStrategy = input.strategy === "avalanche" ? "avalanche" : "snowball";
    return {
      isValid: true,
      data: {
        name,
        balance: Math.round(balance),
        interest_rate: Math.round(rate * 100) / 100,
        min_payment: Math.round(minPay),
        strategy,
      },
    };
  },

  /**
   * Task 5.2 — Snowball: số dư tăng dần. Avalanche: lãi suất giảm dần.
   * Đúng SKILLS Nhóm G.
   */
  sortByStrategy(debts: Debt[], strategy: DebtStrategy): Debt[] {
    const arr = [...debts];
    if (strategy === "snowball") {
      arr.sort((a, b) => Number(a.balance) - Number(b.balance) || Number(b.interest_rate) - Number(a.interest_rate));
    } else {
      arr.sort((a, b) => Number(b.interest_rate) - Number(a.interest_rate) || Number(a.balance) - Number(b.balance));
    }
    return arr;
  },

  /**
   * Task 5.3 — Lịch trả nợ dự kiến: mô phỏng trả tối thiểu hàng tháng + lãi.
   * estimatedMonthsToClear = số tháng để xóa từng khoản nếu chỉ trả min_payment.
   * Công thức amortized đơn giản: balance_n+1 = balance_n * (1 + r/12) - minPay.
   */
  buildPayoffPlan(debts: Debt[], strategy: DebtStrategy, maxMonths = 600): PayoffStep[] {
    const ordered = this.sortByStrategy(debts, strategy);
    return ordered.map((d, idx) => ({
      order: idx + 1,
      debtId: d.id,
      debtName: d.name,
      balance: Number(d.balance),
      interestRate: Number(d.interest_rate),
      minPayment: Number(d.min_payment),
      estimatedMonthsToClear: this.estimateMonths(Number(d.balance), Number(d.interest_rate), Number(d.min_payment), maxMonths),
    }));
  },

  estimateMonths(balance: number, annualRatePct: number, minPayment: number, maxMonths = 600): number {
    if (balance <= 0) return 0;
    if (minPayment <= 0) return maxMonths;
    const r = annualRatePct / 100 / 12;
    if (r <= 0) return Math.ceil(balance / minPayment);
    if (minPayment <= balance * r) return maxMonths; // trả không đủ lãi
    let b = balance;
    let m = 0;
    while (b > 0 && m < maxMonths) {
      b = b * (1 + r) - minPayment;
      m += 1;
    }
    return m;
  },

  totals(debts: Debt[]): { totalBalance: number; totalMinPayment: number; count: number } {
    return {
      totalBalance: debts.reduce((s, d) => s + Number(d.balance), 0),
      totalMinPayment: debts.reduce((s, d) => s + Number(d.min_payment), 0),
      count: debts.length,
    };
  },
};
