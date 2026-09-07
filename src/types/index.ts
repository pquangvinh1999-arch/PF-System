/**
 * Data Models cốt lõi theo đúng PLAN.md mục 4 và DESIGN.md mục 4
 */

export interface User {
  id: string;
  name: string;
  currency: string;
  created_at: string;
}

export type IncomeSourceType = "fixed_salary" | "business_revenue" | "other";
export type FrequencyType = "monthly" | "weekly" | "irregular";

export interface IncomeSource {
  id: string;
  user_id: string;
  name: string;
  type: IncomeSourceType;
  amount: number;
  frequency: FrequencyType;
  date?: string; // Ngày nhận
  created_at: string;
}

export type AccountType = "personal" | "business";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  initial_balance: number;
  color?: string;
  icon?: string;
  is_default: boolean;
  created_at: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  account_id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string; // ISO date string YYYY-MM-DD
  income_source_id?: string;
  to_account_id?: string; // Dùng khi type là transfer
  note?: string;
  created_at: string;
}

export type BudgetGroup = "needs" | "wants" | "savings"; // 50/30/20

export interface Budget {
  id: string;
  period: string; // YYYY-MM
  category: string;
  allocated_percentage: number;
  allocated_amount: number;
  group?: BudgetGroup;
  spent_amount?: number;
  created_at: string;
}

export type ProfitFirstCategory = "profit" | "tax" | "owner_pay" | "opex" | "reserve";

export interface ProfitFirstRule {
  id: string;
  account_id: string; // chỉ áp dụng cho business account
  category: ProfitFirstCategory;
  percentage: number;
  name?: string;
  order_index?: number;
  is_active?: boolean;
}

export type GoalType = "emergency_fund" | "short_term" | "mid_term" | "long_term";

export interface Goal {
  id: string;
  type: GoalType;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  monthly_target_contribution?: number;
  created_at: string;
}

export type DebtStrategy = "snowball" | "avalanche";

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interest_rate: number;
  min_payment: number;
  strategy: DebtStrategy;
  created_at: string;
}

export type PlannedExpenseRecurrence = "none" | "monthly" | "yearly";
export type PlannedExpenseStatus = "upcoming" | "paid" | "overdue";

/**
 * Khớp 100% DESIGN.md mục 4
 */
export interface PlannedExpense {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  category: string;
  account_id: "personal" | "business" | string;
  recurrence: PlannedExpenseRecurrence;
  linked_goal_id?: string | null;
  status: PlannedExpenseStatus;
  note?: string;
}

/**
 * Khớp 100% PLAN.md mục 4:
 * Report (auto-generated monthly/quarterly summary)
 */
export interface Report {
  id: string;
  period: string; // vd: "2026-09" hoặc "2026-Q3"
  type: "monthly" | "quarterly";
  total_income: number;
  total_expense: number;
  net_savings: number;
  savings_rate: number; // % tiết kiệm / thu nhập
  category_breakdown: Record<string, number>;
  generated_at: string;
}

export interface CashFlowForecast {
  current_balance: number;
  total_planned_expenses: number;
  projected_end_of_month_balance: number;
  status: "safe" | "warning" | "danger";
}
