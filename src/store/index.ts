import { User, Account, Transaction, Budget, Goal, Debt, PlannedExpense, Report } from "../types";

export interface AppState {
  user: User | null;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];
  plannedExpenses: PlannedExpense[];
  reports: Report[];
  activeAccountId: string | null;
  isLoading: boolean;
}

export const initialAppState: AppState = {
  user: null,
  accounts: [],
  transactions: [],
  budgets: [],
  goals: [],
  debts: [],
  plannedExpenses: [],
  reports: [],
  activeAccountId: null,
  isLoading: false,
};
