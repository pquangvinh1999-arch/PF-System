/**
 * Các thuật toán tài chính chuyên gia theo PLAN.md & SKILLS.md
 */

export const FinanceFormulas = {
  // 50/30/20 Budgeting default percentages
  BUDGET_50_30_20: {
    needs: 0.5,
    wants: 0.3,
    savings: 0.2,
  },

  // Profit First order of distribution: Profit -> Tax -> Owner Pay -> Opex -> Reserve
  PROFIT_FIRST_ORDER: ["profit", "tax", "owner_pay", "opex", "reserve"] as const,
};

export * from "./budgetService";
export * from "./budgetAlertService";

