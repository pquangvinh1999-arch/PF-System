import { Goal, Transaction } from "../types";
import { GoalService } from "./goalService";
import { getCategoryBudgetGroup } from "../constants/categories";

export interface EmergencyFundCalc {
  avgEssentialMonthly: number;
  monthsCovered: number;
  targetMin3Months: number;
  targetMax6Months: number;
  chosenMonths: number;
  chosenTarget: number;
  currentSaved: number;
  progressPct: number;
  remaining: number;
  hasEnoughHistory: boolean;
  monthsOfHistory: number;
}

export const EmergencyFundService = {
  calculate(
    transactions: Transaction[],
    emergencyGoal: Goal | null | undefined,
    chosenMonths = 6,
    monthsToAverage = 3
  ): EmergencyFundCalc {
    const clampedMonths = Math.max(3, Math.min(6, Math.round(chosenMonths) || 6));
    const avg = GoalService.calculateAvgEssentialMonthly(transactions, monthsToAverage);

    const essentialByMonth: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      if (getCategoryBudgetGroup(t.category) !== "needs") continue;
      const m = String(t.date).substring(0, 7);
      essentialByMonth[m] = (essentialByMonth[m] || 0) + Number(t.amount);
    }
    const monthsOfHistory = Object.keys(essentialByMonth).length;
    const hasEnoughHistory = monthsOfHistory >= 1 && avg > 0;

    const targetMin3Months = avg * 3;
    const targetMax6Months = avg * 6;
    const chosenTarget = avg * clampedMonths;
    const currentSaved = emergencyGoal ? Number(emergencyGoal.current_amount) : 0;
    const progressPct =
      chosenTarget > 0
        ? Math.max(0, Math.min(100, Math.round((currentSaved / chosenTarget) * 100)))
        : 0;
    const remaining = Math.max(0, chosenTarget - currentSaved);

    return {
      avgEssentialMonthly: avg,
      monthsCovered: clampedMonths,
      targetMin3Months,
      targetMax6Months,
      chosenMonths: clampedMonths,
      chosenTarget,
      currentSaved,
      progressPct,
      remaining,
      hasEnoughHistory,
      monthsOfHistory,
    };
  },

  findEmergencyGoal(goals: Goal[]): Goal | null {
    return goals.find((g) => g.type === "emergency_fund") ?? null;
  },
};
