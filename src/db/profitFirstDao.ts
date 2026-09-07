import { getDatabase } from "./index";
import { ProfitFirstRule, ProfitFirstCategory } from "../types";

export interface DefaultRuleTemplate {
  category: ProfitFirstCategory;
  name: string;
  percentage: number;
  order_index: number;
}

export const DEFAULT_PROFIT_FIRST_RULES: DefaultRuleTemplate[] = [
  {
    category: "profit",
    name: "Lợi nhuận (Profit)",
    percentage: 5,
    order_index: 0,
  },
  {
    category: "tax",
    name: "Thuế & Pháp lý (Tax)",
    percentage: 15,
    order_index: 1,
  },
  {
    category: "owner_pay",
    name: "Lương chủ shop (Owner Pay)",
    percentage: 40,
    order_index: 2,
  },
  {
    category: "opex",
    name: "Chi phí vận hành (Opex)",
    percentage: 30,
    order_index: 3,
  },
  {
    category: "reserve",
    name: "Quỹ dự phòng rủi ro (Reserve)",
    percentage: 10,
    order_index: 4,
  },
];

export const ProfitFirstDao = {
  async getRulesByAccountId(accountId: string): Promise<ProfitFirstRule[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ProfitFirstRule>(
      `SELECT * FROM profit_first_rules 
       WHERE account_id = ? 
       ORDER BY order_index ASC;`,
      [accountId]
    );

    if (!rows || rows.length === 0) {
      return this.createDefaultRules(accountId);
    }

    return rows.map((r) => ({
      ...r,
      is_active: Boolean(r.is_active),
    }));
  },

  async createDefaultRules(accountId: string): Promise<ProfitFirstRule[]> {
    const db = await getDatabase();
    const createdRules: ProfitFirstRule[] = [];

    for (const rule of DEFAULT_PROFIT_FIRST_RULES) {
      const id = `pfr_${Date.now()}_${rule.category}`;
      await db.runAsync(
        `INSERT INTO profit_first_rules (id, account_id, category, percentage, name, order_index, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1);`,
        [id, accountId, rule.category, rule.percentage, rule.name, rule.order_index]
      );
      createdRules.push({
        id,
        account_id: accountId,
        category: rule.category,
        percentage: rule.percentage,
        name: rule.name,
        order_index: rule.order_index,
        is_active: true,
      });
    }

    return createdRules;
  },

  async saveRules(accountId: string, rules: ProfitFirstRule[]): Promise<ProfitFirstRule[]> {
    const db = await getDatabase();

    // Xóa các rule cũ của account
    await db.runAsync(`DELETE FROM profit_first_rules WHERE account_id = ?;`, [accountId]);

    // Chèn các rule mới
    const savedRules: ProfitFirstRule[] = [];
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      const id = r.id || `pfr_${Date.now()}_${r.category}_${i}`;
      await db.runAsync(
        `INSERT INTO profit_first_rules (id, account_id, category, percentage, name, order_index, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          accountId,
          r.category,
          r.percentage,
          r.name || r.category,
          r.order_index ?? i,
          r.is_active ? 1 : 0,
        ]
      );
      savedRules.push({
        id,
        account_id: accountId,
        category: r.category,
        percentage: r.percentage,
        name: r.name,
        order_index: r.order_index ?? i,
        is_active: r.is_active ?? true,
      });
    }

    return savedRules;
  },

  async resetToDefault(accountId: string): Promise<ProfitFirstRule[]> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM profit_first_rules WHERE account_id = ?;`, [accountId]);
    return this.createDefaultRules(accountId);
  },
};
