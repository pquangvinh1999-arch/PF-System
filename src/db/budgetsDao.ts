import { getDatabase } from "./index";
import { Budget, BudgetGroup } from "../types";

export const BudgetsDao = {
  async getByPeriod(period: string): Promise<Budget[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      "SELECT * FROM budgets WHERE period = ? ORDER BY created_at ASC;",
      [period]
    );
    return rows.map((r) => ({
      ...r,
      group: r.budget_group as BudgetGroup,
    }));
  },

  async getById(id: string): Promise<Budget | null> {
    const db = await getDatabase();
    const r = await db.getFirstAsync<any>("SELECT * FROM budgets WHERE id = ?;", [id]);
    if (!r) return null;
    return {
      ...r,
      group: r.budget_group as BudgetGroup,
    };
  },

  async upsert(budget: {
    period: string;
    category: string;
    allocated_percentage: number;
    allocated_amount: number;
    budget_group?: BudgetGroup;
  }): Promise<Budget> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<any>(
      "SELECT * FROM budgets WHERE period = ? AND category = ?;",
      [budget.period, budget.category]
    );

    const createdAt = new Date().toISOString();

    if (existing) {
      await db.runAsync(
        `UPDATE budgets SET
           allocated_percentage = ?,
           allocated_amount = ?,
           budget_group = ?
         WHERE id = ?;`,
        [
          budget.allocated_percentage,
          budget.allocated_amount,
          budget.budget_group || null,
          existing.id,
        ]
      );
      return {
        id: existing.id,
        period: budget.period,
        category: budget.category,
        allocated_percentage: budget.allocated_percentage,
        allocated_amount: budget.allocated_amount,
        group: budget.budget_group,
        budget_group: budget.budget_group,
        created_at: existing.created_at,
      };
    } else {
      const id = "bgt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
      await db.runAsync(
        `INSERT INTO budgets (id, period, category, allocated_percentage, allocated_amount, budget_group, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          budget.period,
          budget.category,
          budget.allocated_percentage,
          budget.allocated_amount,
          budget.budget_group || null,
          createdAt,
        ]
      );
      return {
        id,
        period: budget.period,
        category: budget.category,
        allocated_percentage: budget.allocated_percentage,
        allocated_amount: budget.allocated_amount,
        group: budget.budget_group,
        budget_group: budget.budget_group,
        created_at: createdAt,
      };
    }
  },

  async saveGroupRules(
    period: string,
    rules: {
      needsPercentage: number;
      wantsPercentage: number;
      savingsPercentage: number;
      expectedIncome: number;
    }
  ): Promise<Budget[]> {
    const needsAmount = Math.round((rules.needsPercentage / 100) * rules.expectedIncome);
    const wantsAmount = Math.round((rules.wantsPercentage / 100) * rules.expectedIncome);
    const savingsAmount = Math.round((rules.savingsPercentage / 100) * rules.expectedIncome);

    const bNeeds = await this.upsert({
      period,
      category: "Thiết yếu (Needs)",
      allocated_percentage: rules.needsPercentage,
      allocated_amount: needsAmount,
      budget_group: "needs",
    });

    const bWants = await this.upsert({
      period,
      category: "Cá nhân (Wants)",
      allocated_percentage: rules.wantsPercentage,
      allocated_amount: wantsAmount,
      budget_group: "wants",
    });

    const bSavings = await this.upsert({
      period,
      category: "Tiết kiệm & Đầu tư (Savings)",
      allocated_percentage: rules.savingsPercentage,
      allocated_amount: savingsAmount,
      budget_group: "savings",
    });

    return [bNeeds, bWants, bSavings];
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM budgets WHERE id = ?;", [id]);
    return true;
  },
};
