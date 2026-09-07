import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Share } from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../constants/theme";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { MonthlyReport, QuarterlyReport, ReportService } from "../services/reportService";
import { getCategoryIcon } from "../constants/categories";

export const MonthlyReportCard: React.FC<{ report: MonthlyReport }> = ({ report }) => {
  const fmt = (v: number) => new Intl.NumberFormat("vi-VN").format(Math.round(v)) + " đ";
  const deltaBadge = (d: number) =>
    d > 0 ? `+${fmt(d)}` : d < 0 ? `-${fmt(Math.abs(d))}` : "±0 đ";

  const handleShare = async () => {
    try {
      await Share.share({ message: ReportService.toCSVMonthly(report), title: `Báo cáo ${report.period}` });
    } catch {
      // bỏ qua lỗi share
    }
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📅 Báo cáo tháng {report.period}</Text>
          <Text style={styles.sub}>
            {report.txCount} giao dịch · Phạm vi:{" "}
            {report.scope === "family" ? "Tổng hợp gia đình" : report.scope === "personal" ? "Cá nhân" : "Kinh doanh"}
          </Text>
        </View>
        <Badge label={`Tích lũy ${report.savingsRate}%`} type={report.savingsRate >= 20 ? "success" : report.savingsRate >= 0 ? "warning" : "danger"} />
      </View>

      <View style={styles.grid}>
        <View style={styles.metric}>
          <Text style={styles.label}>Tổng thu</Text>
          <Text style={[styles.val, { color: Colors.success }]}>+{fmt(report.totalIncome)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.label}>Tổng chi</Text>
          <Text style={[styles.val, { color: Colors.danger }]}>-{fmt(report.totalExpense)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.label}>Tiết kiệm ròng</Text>
          <Text style={[styles.val, { color: report.netSavings >= 0 ? Colors.primary : Colors.danger }]}>
            {fmt(report.netSavings)}
          </Text>
        </View>
      </View>

      <View style={styles.compareBox}>
        <Text style={styles.compareTitle}>So với {report.prevPeriod}:</Text>
        <Text style={styles.compareText}>
          Thu {deltaBadge(report.deltaIncome)} · Chi {deltaBadge(report.deltaExpense)} · Ròng{" "}
          {deltaBadge(report.deltaNet)}
        </Text>
      </View>

      {report.byCategoryExpense.slice(0, 5).map((c) => (
        <View key={c.category} style={styles.catRow}>
          <Text style={styles.catName}>
            {getCategoryIcon(c.category)} {c.category} ×{c.count}
          </Text>
          <Text style={styles.catVal}>
            {fmt(c.total)} · {c.sharePct}%
          </Text>
        </View>
      ))}

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
        <Text style={styles.shareText}>📤 Chia sẻ CSV tháng {report.period}</Text>
      </TouchableOpacity>
    </Card>
  );
};

export const QuarterlyReportCard: React.FC<{ report: QuarterlyReport }> = ({ report }) => {
  const fmt = (v: number) => new Intl.NumberFormat("vi-VN").format(Math.round(v)) + " đ";
  const trendIcon = report.trend === "up" ? "📈" : report.trend === "down" ? "📉" : "➖";

  const handleShare = async () => {
    try {
      await Share.share({ message: ReportService.toCSVQuarterly(report), title: `Báo cáo ${report.quarterLabel}` });
    } catch {
      // bỏ qua
    }
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📊 Báo cáo {report.quarterLabel}</Text>
          <Text style={styles.sub}>
            {trendIcon} Xu hướng tiết kiệm: {report.trend === "up" ? "Tăng" : report.trend === "down" ? "Giảm" : "Ổn định"} ·
            TB {report.avgSavingsRate}%
          </Text>
        </View>
        <Badge
          label={`${report.avgSavingsRate}%`}
          type={report.avgSavingsRate >= 20 ? "success" : report.avgSavingsRate >= 0 ? "warning" : "danger"}
        />
      </View>

      {report.months.map((m) => (
        <View key={m.period} style={styles.catRow}>
          <Text style={styles.catName}>{m.period}</Text>
          <Text style={styles.catVal}>
            +{fmt(m.income)} / -{fmt(m.expense)} · {m.savingsRate}%
          </Text>
        </View>
      ))}

      <View style={styles.grid}>
        <View style={styles.metric}>
          <Text style={styles.label}>Tổng thu quý</Text>
          <Text style={[styles.val, { color: Colors.success }]}>+{fmt(report.totalIncome)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.label}>Tổng chi quý</Text>
          <Text style={[styles.val, { color: Colors.danger }]}>-{fmt(report.totalExpense)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
        <Text style={styles.shareText}>📤 Chia sẻ CSV {report.quarterLabel}</Text>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: { padding: Spacing.md, marginBottom: Spacing.md },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md, gap: Spacing.sm },
  title: { ...Typography.bodyMedium, fontWeight: "700", color: Colors.textPrimary },
  sub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  grid: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm },
  metric: { flex: 1, backgroundColor: Colors.bg, borderRadius: BorderRadius.sm, padding: Spacing.sm },
  label: { fontSize: 11, color: Colors.textSecondary },
  val: { fontSize: 13, fontWeight: "800", marginTop: 2 },
  compareBox: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, padding: Spacing.sm, marginBottom: Spacing.sm },
  compareTitle: { fontSize: 11, fontWeight: "700", color: Colors.primary },
  compareText: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  catRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  catName: { fontSize: 12, color: Colors.textPrimary, fontWeight: "600", flex: 1 },
  catVal: { fontSize: 12, color: Colors.textSecondary, fontWeight: "700" },
  shareBtn: { marginTop: Spacing.md, backgroundColor: Colors.primary, borderRadius: BorderRadius.button, paddingVertical: Spacing.sm, alignItems: "center" },
  shareText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
});
