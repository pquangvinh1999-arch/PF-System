import { Transaction } from "../types";

export type ScopeFilter = "personal" | "business" | "family";

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
  sharePct: number;
}

export interface MonthlyReport {
  period: string;
  prevPeriod: string;
  scope: ScopeFilter;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  byCategoryExpense: CategoryTotal[];
  byCategoryIncome: CategoryTotal[];
  prevTotalIncome: number;
  prevTotalExpense: number;
  prevNetSavings: number;
  deltaIncome: number;
  deltaExpense: number;
  deltaNet: number;
  txCount: number;
}

export interface QuarterMonthPoint {
  period: string;
  income: number;
  expense: number;
  net: number;
  savingsRate: number;
}

export interface QuarterlyReport {
  quarterLabel: string;
  months: QuarterMonthPoint[];
  scope: ScopeFilter;
  totalIncome: number;
  totalExpense: number;
  totalNet: number;
  avgSavingsRate: number;
  trend: "up" | "down" | "flat";
}

function prevMonth(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function inScope(t: Transaction, scope: ScopeFilter, personalIds: Set<string>, businessIds: Set<string>): boolean {
  if (scope === "family") return true;
  if (t.type === "transfer") {
    // transfer chỉ tính khi liên quan ví thuộc scope (tránh double count)
    if (scope === "personal")
      return personalIds.has(t.account_id) || (t.to_account_id ? personalIds.has(t.to_account_id) : false);
    return businessIds.has(t.account_id) || (t.to_account_id ? businessIds.has(t.to_account_id) : false);
  }
  if (scope === "personal") return personalIds.has(t.account_id);
  return businessIds.has(t.account_id);
}

export const ReportService = {
  monthly(
    period: string,
    transactions: Transaction[],
    accountIdToType: Record<string, "personal" | "business">,
    scope: ScopeFilter = "family"
  ): MonthlyReport {
    const personalIds = new Set(
      Object.entries(accountIdToType).filter(([, t]) => t === "personal").map(([id]) => id)
    );
    const businessIds = new Set(
      Object.entries(accountIdToType).filter(([, t]) => t === "business").map(([id]) => id)
    );
    const prev = prevMonth(period);

    const sum = (list: Transaction[], type: "income" | "expense") =>
      list.filter((t) => t.type === type).reduce((s, t) => s + Number(t.amount), 0);

    const cur = transactions.filter((t) => t.date.startsWith(period) && inScope(t, scope, personalIds, businessIds));
    const prv = transactions.filter((t) => t.date.startsWith(prev) && inScope(t, scope, personalIds, businessIds));

    const totalIncome = sum(cur, "income");
    const totalExpense = sum(cur, "expense");
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    const prevTotalIncome = sum(prv, "income");
    const prevTotalExpense = sum(prv, "expense");
    const prevNetSavings = prevTotalIncome - prevTotalExpense;

    const groupBy = (list: Transaction[], type: "income" | "expense"): CategoryTotal[] => {
      const map: Record<string, { total: number; count: number }> = {};
      for (const t of list.filter((x) => x.type === type)) {
        map[t.category] = map[t.category] || { total: 0, count: 0 };
        map[t.category].total += Number(t.amount);
        map[t.category].count += 1;
      }
      const denom = type === "expense" ? totalExpense : totalIncome;
      return Object.entries(map)
        .map(([category, v]) => ({
          category,
          total: v.total,
          count: v.count,
          sharePct: denom > 0 ? Math.round((v.total / denom) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total);
    };

    return {
      period,
      prevPeriod: prev,
      scope,
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      byCategoryExpense: groupBy(cur, "expense"),
      byCategoryIncome: groupBy(cur, "income"),
      prevTotalIncome,
      prevTotalExpense,
      prevNetSavings,
      deltaIncome: totalIncome - prevTotalIncome,
      deltaExpense: totalExpense - prevTotalExpense,
      deltaNet: netSavings - prevNetSavings,
      txCount: cur.length,
    };
  },

  quarterly(
    year: number,
    quarter: 1 | 2 | 3 | 4,
    transactions: Transaction[],
    accountIdToType: Record<string, "personal" | "business">,
    scope: ScopeFilter = "family"
  ): QuarterlyReport {
    const startMonth = (quarter - 1) * 3 + 1;
    const months = [0, 1, 2].map((i) => {
      const m = startMonth + i;
      return `${year}-${String(m).padStart(2, "0")}`;
    });
    const points: QuarterMonthPoint[] = months.map((p) => {
      const r = this.monthly(p, transactions, accountIdToType, scope);
      return { period: p, income: r.totalIncome, expense: r.totalExpense, net: r.netSavings, savingsRate: r.savingsRate };
    });
    const totalIncome = points.reduce((s, p) => s + p.income, 0);
    const totalExpense = points.reduce((s, p) => s + p.expense, 0);
    const totalNet = totalIncome - totalExpense;
    const avgSavingsRate = totalIncome > 0 ? Math.round((totalNet / totalIncome) * 100) : 0;
    const trend: "up" | "down" | "flat" =
      points[2].savingsRate > points[0].savingsRate ? "up" : points[2].savingsRate < points[0].savingsRate ? "down" : "flat";
    return {
      quarterLabel: `Q${quarter}/${year}`,
      months: points,
      scope,
      totalIncome,
      totalExpense,
      totalNet,
      avgSavingsRate,
      trend,
    };
  },

  toCSVMonthly(r: MonthlyReport): string {
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      "Bao cao thang,Period,Scope,Tong thu,Tong chi,Tiet kiem rong,Ty le tich luy (%),So giao dich",
      ["monthly", r.period, r.scope, r.totalIncome, r.totalExpense, r.netSavings, r.savingsRate, r.txCount].map(esc).join(","),
      "",
      "Nhom chi tieu,So tien,So luong,Ty trong (%)",
      ...r.byCategoryExpense.map((c) => [c.category, c.total, c.count, c.sharePct].map(esc).join(",")),
      "",
      "Nhom thu nhap,So tien,So luong,Ty trong (%)",
      ...r.byCategoryIncome.map((c) => [c.category, c.total, c.count, c.sharePct].map(esc).join(",")),
      "",
      `So voi thang truoc (${r.prevPeriod}),Thu nhap truoc,Chi tieu truoc,Tiet kiem truoc,Chenh thu,Chenh chi,Chenh ròng`,
      ["compare", r.prevTotalIncome, r.prevTotalExpense, r.prevNetSavings, r.deltaIncome, r.deltaExpense, r.deltaNet].map(esc).join(","),
    ];
    return lines.join("\n");
  },

  toCSVQuarterly(r: QuarterlyReport): string {
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      "Bao cao quy,Quy,Scope,Tong thu,Tong chi,Tiet kiem rong,Ty le TB (%),Xu huong",
      ["quarterly", r.quarterLabel, r.scope, r.totalIncome, r.totalExpense, r.totalNet, r.avgSavingsRate, r.trend].map(esc).join(","),
      "",
      "Thang,Thu,Chi,Rong,Ty le (%)",
      ...r.months.map((m) => [m.period, m.income, m.expense, m.net, m.savingsRate].map(esc).join(",")),
    ];
    return lines.join("\n");
  },
};
