import { Goal, GoalType, Transaction } from "../types";
import { getCategoryBudgetGroup } from "../constants/categories";

export const GOAL_TYPE_META: Record<
  GoalType,
  { label: string; icon: string; color: string; hint: string }
> = {
  emergency_fund: {
    label: "Quỹ khẩn cấp",
    icon: "🛡️",
    color: "#1E8E5A",
    hint: "3–6 tháng chi phí thiết yếu",
  },
  short_term: {
    label: "Ngắn hạn",
    icon: "🎯",
    color: "#0F6E5B",
    hint: "Dưới 12 tháng",
  },
  mid_term: {
    label: "Trung hạn",
    icon: "🚗",
    color: "#4A5FD1",
    hint: "1–5 năm",
  },
  long_term: {
    label: "Dài hạn",
    icon: "🏡",
    color: "#D4A72C",
    hint: "Trên 5 năm",
  },
};

export const VALID_GOAL_TYPES: GoalType[] = [
  "emergency_fund",
  "short_term",
  "mid_term",
  "long_term",
];

export interface GoalValidationResult {
  isValid: boolean;
  error?: string;
  data?: {
    name: string;
    type: GoalType;
    target_amount: number;
    current_amount: number;
    deadline?: string;
  };
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(s: string): boolean {
  if (!DATE_REGEX.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  );
}

export function parseAmountInput(amount: unknown): number {
  if (typeof amount === "number") return amount;
  const cleaned = String(amount ?? "")
    .replace(/[.\sđ₫]/g, "")
    .replace(/,/g, "");
  const n = parseFloat(cleaned);
  return n;
}

export const GoalService = {
  validateGoalInput(input: {
    name?: unknown;
    type?: unknown;
    targetAmount?: unknown;
    currentAmount?: unknown;
    deadline?: unknown;
  }): GoalValidationResult {
    const name = String(input.name ?? "").trim();
    if (!name) {
      return { isValid: false, error: "Vui lòng nhập tên mục tiêu" };
    }
    if (name.length > 80) {
      return { isValid: false, error: "Tên mục tiêu tối đa 80 ký tự" };
    }

    const type = input.type as GoalType;
    if (!VALID_GOAL_TYPES.includes(type)) {
      return { isValid: false, error: "Loại mục tiêu không hợp lệ" };
    }

    const target = parseAmountInput(input.targetAmount);
    if (isNaN(target) || target <= 0) {
      return { isValid: false, error: "Vui lòng nhập số tiền mục tiêu hợp lệ (> 0)" };
    }
    if (target > 100_000_000_000) {
      return { isValid: false, error: "Số tiền mục tiêu quá lớn" };
    }

    let current = 0;
    if (
      input.currentAmount !== undefined &&
      input.currentAmount !== null &&
      String(input.currentAmount).trim() !== ""
    ) {
      current = parseAmountInput(input.currentAmount);
      if (isNaN(current) || current < 0) {
        return { isValid: false, error: "Số tiền đã tích lũy phải >= 0" };
      }
      if (current > target) {
        return { isValid: false, error: "Số tiền đã tích lũy không được vượt quá mục tiêu" };
      }
    }

    let deadline: string | undefined;
    if (
      input.deadline !== undefined &&
      input.deadline !== null &&
      String(input.deadline).trim() !== ""
    ) {
      deadline = String(input.deadline).trim();
      if (!isValidDateString(deadline)) {
        return {
          isValid: false,
          error: "Hạn hoàn thành không đúng định dạng YYYY-MM-DD (ví dụ: 2026-12-31)",
        };
      }
    }

    return {
      isValid: true,
      data: { name, type, target_amount: Math.round(target), current_amount: Math.round(current), deadline },
    };
  },

  calculateProgress(goal: Pick<Goal, "target_amount" | "current_amount">): number {
    const target = Number(goal.target_amount);
    const current = Number(goal.current_amount);
    if (!target || target <= 0) return 0;
    const pct = Math.round((current / target) * 100);
    return Math.max(0, Math.min(100, pct));
  },

  getRemaining(goal: Pick<Goal, "target_amount" | "current_amount">): number {
    return Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));
  },

  isCompleted(goal: Pick<Goal, "target_amount" | "current_amount">): boolean {
    return Number(goal.current_amount) >= Number(goal.target_amount) && Number(goal.target_amount) > 0;
  },

  getStatus(goal: Goal): "completed" | "on_track" | "new" {
    if (this.isCompleted(goal)) return "completed";
    if (Number(goal.current_amount) > 0) return "on_track";
    return "new";
  },

  /**
   * Tính chi phí thiết yếu trung bình/tháng từ lịch sử Transaction.
   * Chỉ tính expense thuộc nhóm needs (Ăn uống, Nhà ở, Đi lại, Y tế, Giáo dục).
   * Dùng cho Task 4.2 (Emergency Fund auto-calc).
   */
  calculateAvgEssentialMonthly(transactions: Transaction[], monthsToAverage = 3): number {
    const essentialByMonth: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const group = getCategoryBudgetGroup(t.category);
      if (group !== "needs") continue;
      const month = String(t.date).substring(0, 7);
      essentialByMonth[month] = (essentialByMonth[month] || 0) + Number(t.amount);
    }
    const months = Object.keys(essentialByMonth).sort().slice(-monthsToAverage);
    if (months.length === 0) return 0;
    const total = months.reduce((s, m) => s + essentialByMonth[m], 0);
    return Math.round(total / months.length);
  },

  /**
   * Gợi ý số tiền cần tiết kiệm mỗi tháng để đạt mục tiêu đúng hạn.
   * Dùng cho Task 4.3. Đặt ở đây để tái sử dụng.
   * todayStr dạng YYYY-MM-DD để test được deterministically.
   */
  suggestMonthlyContribution(
    goal: Pick<Goal, "target_amount" | "current_amount" | "deadline">,
    todayStr?: string
  ): { monthsLeft: number; monthlyNeeded: number; isOverdue: boolean } {
    const remaining = this.getRemaining(goal);
    if (!goal.deadline) {
      return { monthsLeft: 0, monthlyNeeded: remaining, isOverdue: false };
    }
    const today = todayStr ? new Date(todayStr + "T00:00:00") : new Date();
    const dl = new Date(goal.deadline + "T00:00:00");
    if (isNaN(dl.getTime())) {
      return { monthsLeft: 0, monthlyNeeded: remaining, isOverdue: false };
    }
    let monthsLeft =
      (dl.getFullYear() - today.getFullYear()) * 12 +
      (dl.getMonth() - today.getMonth()) +
      1;
    if (dl.getTime() < today.getTime()) {
      return { monthsLeft: 0, monthlyNeeded: remaining, isOverdue: true };
    }
    monthsLeft = Math.max(1, monthsLeft);
    return {
      monthsLeft,
      monthlyNeeded: Math.ceil(remaining / monthsLeft),
      isOverdue: false,
    };
  },
};
