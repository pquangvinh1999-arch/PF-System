import { getDatabase } from "./index";
import { Account, AccountType } from "../types";

export const AccountsDao = {
  async getAll(): Promise<Account[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>("SELECT * FROM accounts ORDER BY created_at ASC;");
    return rows.map((r) => ({
      ...r,
      is_default: Boolean(r.is_default),
    }));
  },

  async create(
    name: string,
    type: AccountType,
    initialBalance = 0,
    color?: string,
    icon?: string,
    isDefault = false
  ): Promise<Account> {
    const db = await getDatabase();
    const id = "acc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    const createdAt = new Date().toISOString();
    await db.runAsync(
      "INSERT INTO accounts (id, name, type, balance, initial_balance, color, icon, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
      [id, name, type, initialBalance, initialBalance, color || "", icon || "", isDefault ? 1 : 0, createdAt]
    );
    return {
      id,
      name,
      type,
      balance: initialBalance,
      initial_balance: initialBalance,
      color,
      icon,
      is_default: isDefault,
      created_at: createdAt,
    };
  },
  async getById(id: string): Promise<Account | null> {
    const db = await getDatabase();
    const r = await db.getFirstAsync<any>("SELECT * FROM accounts WHERE id = ?;", [id]);
    if (!r) return null;
    return {
      ...r,
      is_default: Boolean(r.is_default),
    };
  },

  async updateBalance(id: string, delta: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync("UPDATE accounts SET balance = balance + ? WHERE id = ?;", [delta, id]);
  },

  async recalculateBalance(accountId: string): Promise<number> {
    const db = await getDatabase();
    const acc = await this.getById(accountId);
    if (!acc) return 0;

    // Tính tổng income
    const incRes = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE account_id = ? AND type = 'income';",
      [accountId]
    );
    // Tính tổng expense
    const expRes = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE account_id = ? AND type = 'expense';",
      [accountId]
    );
    // Tính tổng transfer out
    const transferOutRes = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE account_id = ? AND type = 'transfer';",
      [accountId]
    );
    // Tính tổng transfer in
    const transferInRes = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE to_account_id = ? AND type = 'transfer';",
      [accountId]
    );

    const totalIncome = incRes?.total || 0;
    const totalExpense = expRes?.total || 0;
    const totalTransferOut = transferOutRes?.total || 0;
    const totalTransferIn = transferInRes?.total || 0;

    const newBalance = acc.initial_balance + totalIncome - totalExpense - totalTransferOut + totalTransferIn;
    await db.runAsync("UPDATE accounts SET balance = ? WHERE id = ?;", [newBalance, accountId]);
    return newBalance;
  },
};
