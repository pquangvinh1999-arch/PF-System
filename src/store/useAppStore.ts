import { create } from "zustand";
import { User, IncomeSource, Account, Transaction, Budget, ProfitFirstRule, PlannedExpense, Goal, Debt } from "../types";
import { UsersDao } from "../db/usersDao";
import { IncomeSourcesDao } from "../db/incomeSourcesDao";
import { AccountsDao } from "../db/accountsDao";
import { TransactionsDao } from "../db/transactionsDao";
import { BudgetsDao } from "../db/budgetsDao";
import { ProfitFirstDao } from "../db/profitFirstDao";
import { PlannedExpensesDao } from "../db/plannedExpensesDao";
import { GoalsDao } from "../db/goalsDao";
import { DebtsDao } from "../db/debtsDao";
import { SettingsDao, SETTINGS_KEYS } from "../db/settingsDao";
import { LockService } from "../services/lockService";

interface AppState {
  user: User | null;
  incomeSources: IncomeSource[];
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  profitFirstRules: ProfitFirstRule[];
  plannedExpenses: PlannedExpense[];
  goals: Goal[];
  debts: Debt[];
  isLoading: boolean;
  isOnboarded: boolean;

  fetchInitialData: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchBudgets: (period: string) => Promise<void>;
  fetchProfitFirstRules: (accountId: string) => Promise<void>;
  fetchPlannedExpenses: (period?: string) => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchDebts: () => Promise<void>;
  setUser: (user: User | null) => void;
  setIncomeSources: (sources: IncomeSource[]) => void;
  setAccounts: (accounts: Account[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  setProfitFirstRules: (rules: ProfitFirstRule[]) => void;
  setPlannedExpenses: (expenses: PlannedExpense[]) => void;
  setGoals: (goals: Goal[]) => void;
  saveProfitFirstRules: (accountId: string, rules: ProfitFirstRule[]) => Promise<ProfitFirstRule[]>;
  resetProfitFirstRules: (accountId: string) => Promise<ProfitFirstRule[]>;
  addTransaction: (
    data: Parameters<typeof TransactionsDao.create>[0]
  ) => Promise<Transaction>;
  updateTransaction: (
    id: string,
    data: Parameters<typeof TransactionsDao.update>[1]
  ) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<boolean>;
  addPlannedExpense: (
    data: Parameters<typeof PlannedExpensesDao.create>[0]
  ) => Promise<PlannedExpense>;
  updatePlannedExpense: (
    id: string,
    data: Parameters<typeof PlannedExpensesDao.update>[1]
  ) => Promise<PlannedExpense | null>;
  deletePlannedExpense: (id: string) => Promise<boolean>;
  addGoal: (data: Parameters<typeof GoalsDao.create>[0]) => Promise<Goal>;
  updateGoal: (
    id: string,
    data: Parameters<typeof GoalsDao.update>[1]
  ) => Promise<Goal | null>;
  deleteGoal: (id: string) => Promise<boolean>;
  addDebt: (data: Parameters<typeof DebtsDao.create>[0]) => Promise<Debt>;
  updateDebt: (
    id: string,
    data: Parameters<typeof DebtsDao.update>[1]
  ) => Promise<Debt | null>;
  deleteDebt: (id: string) => Promise<boolean>;

  // Security (Phase 7.1)
  isLocked: boolean;
  lockEnabled: boolean;
  pinHash: string | null;
  biometricEnabled: boolean;
  loadSecuritySettings: () => Promise<void>;
  setupPin: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  disableLock: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  unlock: () => void;
  lock: () => void;
  restoreBackup: (data: Record<string, any[]>) => Promise<void>;
  saveBudgetRules: (
    period: string,
    rules: {
      needsPercentage: number;
      wantsPercentage: number;
      savingsPercentage: number;
      expectedIncome: number;
    }
  ) => Promise<Budget[]>;
  completeOnboarding: (
    userName: string,
    sources: Array<{ name: string; type: any; amount: number; frequency: any }>,
    personalBalance: number,
    businessBalance: number
  ) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  incomeSources: [],
  accounts: [],
  transactions: [],
  budgets: [],
  profitFirstRules: [],
  plannedExpenses: [],
  goals: [],
  debts: [],
  isLocked: false,
  lockEnabled: false,
  pinHash: null,
  biometricEnabled: false,
  isLoading: true,
  isOnboarded: false,

  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      const user = await UsersDao.getCurrentUser();
      const currentPeriod = new Date().toISOString().substring(0, 7);
      if (user) {
        const [incomeSources, accounts, transactions, budgets, plannedExpenses, goals, debts] = await Promise.all([
          IncomeSourcesDao.getByUserId(user.id),
          AccountsDao.getAll(),
          TransactionsDao.getAll(),
          BudgetsDao.getByPeriod(currentPeriod),
          PlannedExpensesDao.getAll(),
          GoalsDao.getAll(),
          DebtsDao.getAll(),
        ]);

        const businessAcc = accounts.find((a) => a.type === "business");
        let profitFirstRules: ProfitFirstRule[] = [];
        if (businessAcc) {
          profitFirstRules = await ProfitFirstDao.getRulesByAccountId(businessAcc.id);
        }

        set({
          user,
          incomeSources,
          accounts,
          transactions,
          budgets,
          profitFirstRules,
          plannedExpenses,
          goals,
          debts,
          isOnboarded: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          incomeSources: [],
          accounts: [],
          transactions: [],
          budgets: [],
          profitFirstRules: [],
          plannedExpenses: [],
          goals: [],
          debts: [],
          isOnboarded: false,
          isLoading: false,
        });
      }
    } catch (err) {
      console.error("fetchInitialData error:", err);
      set({ isLoading: false });
    }
    await get().loadSecuritySettings();
  },

  fetchTransactions: async () => {
    try {
      const transactions = await TransactionsDao.getAll();
      set({ transactions });
    } catch (err) {
      console.error("fetchTransactions error:", err);
    }
  },

  fetchAccounts: async () => {
    try {
      const accounts = await AccountsDao.getAll();
      set({ accounts });
    } catch (err) {
      console.error("fetchAccounts error:", err);
    }
  },

  fetchBudgets: async (period: string) => {
    try {
      const budgets = await BudgetsDao.getByPeriod(period);
      set({ budgets });
    } catch (err) {
      console.error("fetchBudgets error:", err);
    }
  },

  setUser: (user) => set({ user, isOnboarded: Boolean(user) }),
  setIncomeSources: (incomeSources) => set({ incomeSources }),
  setAccounts: (accounts) => set({ accounts }),
  setTransactions: (transactions) => set({ transactions }),
  setBudgets: (budgets) => set({ budgets }),
  setProfitFirstRules: (profitFirstRules) => set({ profitFirstRules }),

  fetchProfitFirstRules: async (accountId: string) => {
    try {
      const profitFirstRules = await ProfitFirstDao.getRulesByAccountId(accountId);
      set({ profitFirstRules });
    } catch (err) {
      console.error("fetchProfitFirstRules error:", err);
    }
  },

  saveProfitFirstRules: async (accountId: string, rules: ProfitFirstRule[]) => {
    const profitFirstRules = await ProfitFirstDao.saveRules(accountId, rules);
    set({ profitFirstRules });
    return profitFirstRules;
  },

  resetProfitFirstRules: async (accountId: string) => {
    const profitFirstRules = await ProfitFirstDao.resetToDefault(accountId);
    set({ profitFirstRules });
    return profitFirstRules;
  },

  saveBudgetRules: async (period, rules) => {
    const createdBudgets = await BudgetsDao.saveGroupRules(period, rules);
    const budgets = await BudgetsDao.getByPeriod(period);
    set({ budgets });
    return createdBudgets;
  },

  addTransaction: async (data) => {
    const newTx = await TransactionsDao.create(data);
    const [transactions, accounts] = await Promise.all([
      TransactionsDao.getAll(),
      AccountsDao.getAll(),
    ]);
    set({ transactions, accounts });
    return newTx;
  },

  updateTransaction: async (id, data) => {
    const updated = await TransactionsDao.update(id, data);
    const [transactions, accounts] = await Promise.all([
      TransactionsDao.getAll(),
      AccountsDao.getAll(),
    ]);
    set({ transactions, accounts });
    return updated;
  },

  deleteTransaction: async (id) => {
    const success = await TransactionsDao.delete(id);
    if (success) {
      const [transactions, accounts] = await Promise.all([
        TransactionsDao.getAll(),
        AccountsDao.getAll(),
      ]);
      set({ transactions, accounts });
    }
    return success;
  },

  fetchPlannedExpenses: async (period?: string) => {
    try {
      const plannedExpenses = period
        ? await PlannedExpensesDao.getByPeriod(period)
        : await PlannedExpensesDao.getAll();
      set({ plannedExpenses });
    } catch (err) {
      console.error("fetchPlannedExpenses error:", err);
    }
  },

  setPlannedExpenses: (plannedExpenses) => set({ plannedExpenses }),
  setGoals: (goals) => set({ goals }),

  fetchGoals: async () => {
    try {
      const goals = await GoalsDao.getAll();
      set({ goals });
    } catch (err) {
      console.error("fetchGoals error:", err);
    }
  },

  fetchDebts: async () => {
    try {
      const debts = await DebtsDao.getAll();
      set({ debts });
    } catch (err) {
      console.error("fetchDebts error:", err);
    }
  },

  addPlannedExpense: async (data) => {
    const newPe = await PlannedExpensesDao.create(data);
    const plannedExpenses = await PlannedExpensesDao.getAll();
    set({ plannedExpenses });
    return newPe;
  },

  updatePlannedExpense: async (id, data) => {
    const updated = await PlannedExpensesDao.update(id, data);
    const plannedExpenses = await PlannedExpensesDao.getAll();
    set({ plannedExpenses });
    return updated;
  },

  deletePlannedExpense: async (id) => {
    const success = await PlannedExpensesDao.delete(id);
    if (success) {
      const plannedExpenses = await PlannedExpensesDao.getAll();
      set({ plannedExpenses });
    }
    return success;
  },

  addGoal: async (data) => {
    const g = await GoalsDao.create(data);
    const goals = await GoalsDao.getAll();
    set({ goals });
    return g;
  },

  updateGoal: async (id, data) => {
    const updated = await GoalsDao.update(id, data);
    const goals = await GoalsDao.getAll();
    set({ goals });
    return updated;
  },

  deleteGoal: async (id) => {
    const success = await GoalsDao.delete(id);
    if (success) {
      const goals = await GoalsDao.getAll();
      set({ goals });
    }
    return success;
  },

  addDebt: async (data) => {
    const d = await DebtsDao.create(data);
    const debts = await DebtsDao.getAll();
    set({ debts });
    return d;
  },

  updateDebt: async (id, data) => {
    const updated = await DebtsDao.update(id, data);
    const debts = await DebtsDao.getAll();
    set({ debts });
    return updated;
  },

  deleteDebt: async (id) => {
    const success = await DebtsDao.delete(id);
    if (success) {
      const debts = await DebtsDao.getAll();
      set({ debts });
    }
    return success;
  },

  loadSecuritySettings: async () => {
    try {
      const [hash, enabled, bio] = await Promise.all([
        SettingsDao.get(SETTINGS_KEYS.pinHash),
        SettingsDao.get(SETTINGS_KEYS.lockEnabled),
        SettingsDao.get(SETTINGS_KEYS.biometricEnabled),
      ]);
      const lockOn = enabled === "1" && Boolean(hash);
      set({
        pinHash: hash,
        lockEnabled: lockOn,
        biometricEnabled: bio === "1",
        isLocked: lockOn,
      });
    } catch (err) {
      console.error("loadSecuritySettings error:", err);
    }
  },

  setupPin: async (pin) => {
    const check = LockService.validatePinFormat(pin);
    if (!check.ok) return { ok: false, error: check.error };
    const hash = LockService.hashPin(pin.trim());
    await SettingsDao.set(SETTINGS_KEYS.pinHash, hash);
    await SettingsDao.set(SETTINGS_KEYS.lockEnabled, "1");
    set({ pinHash: hash, lockEnabled: true, isLocked: false });
    return { ok: true };
  },

  disableLock: async () => {
    await SettingsDao.set(SETTINGS_KEYS.lockEnabled, "0");
    await SettingsDao.remove(SETTINGS_KEYS.pinHash);
    await SettingsDao.set(SETTINGS_KEYS.biometricEnabled, "0");
    set({ lockEnabled: false, pinHash: null, biometricEnabled: false, isLocked: false });
  },

  setBiometricEnabled: async (enabled) => {
    await SettingsDao.set(SETTINGS_KEYS.biometricEnabled, enabled ? "1" : "0");
    set({ biometricEnabled: enabled });
  },

  unlock: () => set({ isLocked: false }),
  lock: () => {
    const { lockEnabled } = get();
    if (lockEnabled) set({ isLocked: true });
  },

  restoreBackup: async (data) => {
    const { getDatabase } = await import("../db");
    const db = await getDatabase();
    const arr = (k: string): any[] => (Array.isArray(data[k]) ? data[k] : []);
    // Thứ tự: xóa bảng con trước (tránh FK), chèn bảng cha trước
    await db.execAsync("PRAGMA foreign_keys = OFF;");
    try {
      for (const t of ["transactions", "planned_expenses", "income_sources", "profit_first_rules", "budgets", "goals", "debts", "accounts", "users"]) {
        await db.runAsync(`DELETE FROM ${t};`);
      }
      for (const u of arr("users")) {
        await db.runAsync(`INSERT INTO users (id, name, currency, created_at) VALUES (?, ?, ?, ?);`, [u.id, u.name, u.currency || "VND", u.created_at]);
      }
      for (const a of arr("accounts")) {
        await db.runAsync(`INSERT INTO accounts (id, name, type, balance, initial_balance, color, icon, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`, [a.id, a.name, a.type, a.balance, a.initial_balance ?? a.balance, a.color || null, a.icon || null, a.is_default ? 1 : 0, a.created_at]);
      }
      for (const s of arr("income_sources")) {
        await db.runAsync(`INSERT INTO income_sources (id, user_id, name, type, amount, frequency, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`, [s.id, s.user_id, s.name, s.type, s.amount, s.frequency, s.date || null, s.created_at]);
      }
      for (const t of arr("transactions")) {
        await db.runAsync(`INSERT INTO transactions (id, account_id, type, category, amount, date, income_source_id, to_account_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, [t.id, t.account_id, t.type, t.category, t.amount, t.date, t.income_source_id || null, t.to_account_id || null, t.note || null, t.created_at]);
      }
      for (const b of arr("budgets")) {
        await db.runAsync(`INSERT INTO budgets (id, period, category, allocated_percentage, allocated_amount, budget_group, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`, [b.id, b.period, b.category, b.allocated_percentage, b.allocated_amount, b.budget_group || b.group || null, b.created_at]);
      }
      for (const r of arr("profit_first_rules")) {
        await db.runAsync(`INSERT INTO profit_first_rules (id, account_id, category, percentage, name, order_index, is_active) VALUES (?, ?, ?, ?, ?, ?, ?);`, [r.id, r.account_id, r.category, r.percentage, r.name || null, r.order_index ?? 0, r.is_active === false || r.is_active === 0 ? 0 : 1]);
      }
      for (const g of arr("goals")) {
        await db.runAsync(`INSERT INTO goals (id, type, name, target_amount, current_amount, deadline, monthly_target_contribution, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`, [g.id, g.type, g.name, g.target_amount, g.current_amount, g.deadline || null, g.monthly_target_contribution ?? null, g.created_at]);
      }
      for (const p of arr("planned_expenses")) {
        await db.runAsync(`INSERT INTO planned_expenses (id, title, amount, due_date, category, account_id, recurrence, linked_goal_id, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, [p.id, p.title, p.amount, p.due_date, p.category, p.account_id, p.recurrence, p.linked_goal_id || null, p.status, p.note || null]);
      }
      for (const d of arr("debts")) {
        await db.runAsync(`INSERT INTO debts (id, name, balance, interest_rate, min_payment, strategy, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`, [d.id, d.name, d.balance, d.interest_rate, d.min_payment, d.strategy, d.created_at]);
      }
    } finally {
      await db.execAsync("PRAGMA foreign_keys = ON;");
    }
    await get().fetchInitialData();
  },

  completeOnboarding: async (userName, sources, personalBalance, businessBalance) => {
    set({ isLoading: true });
    try {
      // 1. Tạo user
      const user = await UsersDao.createUser(userName);

      // 2. Tạo các nguồn thu nhập
      const createdSources: IncomeSource[] = [];
      for (const s of sources) {
        const src = await IncomeSourcesDao.create(user.id, s.name, s.type, s.amount, s.frequency);
        createdSources.push(src);
      }

      // 3. Khởi tạo 2 tài khoản cốt lõi: Personal & Business
      const personalAcc = await AccountsDao.create(
        "Ví Cá nhân",
        "personal",
        personalBalance,
        "#0F6E5B",
        "wallet",
        true
      );
      const businessAcc = await AccountsDao.create(
        "Ví Kinh doanh (Shop)",
        "business",
        businessBalance,
        "#4A5FD1",
        "briefcase",
        false
      );
      const profitFirstRules = await ProfitFirstDao.createDefaultRules(businessAcc.id);

      set({
        user,
        incomeSources: createdSources,
        accounts: [personalAcc, businessAcc],
        profitFirstRules,
        isOnboarded: true,
        isLoading: false,
      });
    } catch (err) {
      console.error("completeOnboarding error:", err);
      set({ isLoading: false });
      throw err;
    }
  },
}));
