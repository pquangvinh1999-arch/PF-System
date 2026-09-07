import { create } from "zustand";
import { User, IncomeSource, Account, Transaction, Budget, ProfitFirstRule } from "../types";
import { UsersDao } from "../db/usersDao";
import { IncomeSourcesDao } from "../db/incomeSourcesDao";
import { AccountsDao } from "../db/accountsDao";
import { TransactionsDao } from "../db/transactionsDao";
import { BudgetsDao } from "../db/budgetsDao";
import { ProfitFirstDao } from "../db/profitFirstDao";

interface AppState {
  user: User | null;
  incomeSources: IncomeSource[];
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  profitFirstRules: ProfitFirstRule[];
  isLoading: boolean;
  isOnboarded: boolean;

  fetchInitialData: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchBudgets: (period: string) => Promise<void>;
  fetchProfitFirstRules: (accountId: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setIncomeSources: (sources: IncomeSource[]) => void;
  setAccounts: (accounts: Account[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  setProfitFirstRules: (rules: ProfitFirstRule[]) => void;
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
  isLoading: true,
  isOnboarded: false,

  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      const user = await UsersDao.getCurrentUser();
      const currentPeriod = new Date().toISOString().substring(0, 7);
      if (user) {
        const [incomeSources, accounts, transactions, budgets] = await Promise.all([
          IncomeSourcesDao.getByUserId(user.id),
          AccountsDao.getAll(),
          TransactionsDao.getAll(),
          BudgetsDao.getByPeriod(currentPeriod),
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
          isOnboarded: false,
          isLoading: false,
        });
      }
    } catch (err) {
      console.error("fetchInitialData error:", err);
      set({ isLoading: false });
    }
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
