import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { Card, Badge } from "../../../components";
import { BusinessCashFlowReport } from "../../../services/businessReportService";

interface Props {
  report: BusinessCashFlowReport;
}

export const BusinessCashFlowReportCard: React.FC<Props> = ({ report }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " đ";
  };

  const getStatusBadgeType = (status: "healthy" | "tight" | "loss") => {
    if (status === "healthy") return "success";
    if (status === "tight") return "warning";
    return "danger";
  };

  const getStatusLabel = (status: "healthy" | "tight" | "loss") => {
    if (status === "healthy") return "Lành mạnh";
    if (status === "tight") return "Biên hẹp";
    return "Thâm hụt / Lỗ";
  };

  return (
    <View style={styles.container}>
      {/* Overview P&L Card */}
      <Card style={styles.summaryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleWrap}>
            <Text style={styles.headerIcon}>🏢</Text>
            <View>
              <Text style={styles.title}>Dòng Tiền Kinh Doanh</Text>
              <Text style={styles.subTitle}>
                {report.accountName} • Kỳ {report.period}
              </Text>
            </View>
          </View>
          <Badge
            label={getStatusLabel(report.healthStatus)}
            type={getStatusBadgeType(report.healthStatus)}
          />
        </View>

        {/* 4 Chỉ số tài chính cốt lõi */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Doanh Thu</Text>
            <Text style={[styles.metricValue, { color: Colors.success }]}>
              +{formatCurrency(report.totalRevenue)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Chi Phí Vận Hành</Text>
            <Text style={[styles.metricValue, { color: Colors.danger }]}>
              -{formatCurrency(report.totalExpense)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Lợi Nhuận Ròng</Text>
            <Text
              style={[
                styles.metricValue,
                { color: report.netProfit >= 0 ? Colors.primary : Colors.danger },
              ]}
            >
              {report.netProfit >= 0 ? "+" : ""}
              {formatCurrency(report.netProfit)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Tỷ Suất LN</Text>
            <Text style={[styles.metricValue, { color: Colors.businessTag }]}>
              {report.profitMargin}%
            </Text>
          </View>
        </View>

        {/* Advice / Health evaluation */}
        <View style={styles.adviceBox}>
          <Text style={styles.adviceText}>💡 {report.recommendation}</Text>
        </View>
      </Card>

      {/* 5 Quỹ Profit First trong kỳ */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>💎 Phân Bổ 5 Quỹ Profit First</Text>
          <Text style={styles.sectionSub}>Tổng: {formatCurrency(report.totalRevenue)}</Text>
        </View>

        {/* Stacked bar */}
        <View style={styles.stackedBar}>
          {report.buckets.map((b) => {
            if (b.percentage <= 0) return null;
            return (
              <View
                key={b.category}
                style={[
                  styles.barSegment,
                  { width: `${b.percentage}%`, backgroundColor: b.color },
                ]}
              >
                {b.percentage >= 12 && (
                  <Text style={styles.barText}>{b.percentage}%</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Buckets list */}
        <View style={styles.bucketsList}>
          {report.buckets.map((b) => (
            <View key={b.category} style={styles.bucketRow}>
              <View style={styles.bucketMeta}>
                <View style={[styles.colorDot, { backgroundColor: b.color }]} />
                <Text style={styles.bucketIcon}>{b.icon}</Text>
                <Text style={styles.bucketName}>{b.name}</Text>
                <Text style={styles.bucketPct}>({b.percentage}%)</Text>
              </View>
              <Text style={[styles.bucketAmount, { color: b.color }]}>
                {formatCurrency(b.allocatedAmount)}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Rút lương chủ / Lợi nhuận về ví cá nhân */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>👤 Lương Chủ Đã Chuyển Về Cá Nhân</Text>
        </View>
        <View style={styles.withdrawalRow}>
          <View>
            <Text style={styles.withdrawalDesc}>
              Tổng tiền rút từ Ví Kinh doanh sang Ví Cá nhân trong kỳ:
            </Text>
            <Text style={styles.withdrawalHint}>
              (Đã hạch toán vào thu nhập cá nhân an toàn)
            </Text>
          </View>
          <Text style={styles.withdrawalAmount}>
            {formatCurrency(report.totalOwnerPayWithdrawn)}
          </Text>
        </View>
      </Card>

      {/* Cơ cấu chi phí vận hành (Opex) */}
      {report.expenseCategories.length > 0 && (
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>⚙️ Cơ Cấu Chi Phí Kinh Doanh</Text>
            <Text style={styles.sectionSub}>Tổng: {formatCurrency(report.totalExpense)}</Text>
          </View>

          <View style={styles.expenseCatsList}>
            {report.expenseCategories.map((cat) => (
              <View key={cat.category} style={styles.expenseCatItem}>
                <View style={styles.catInfoRow}>
                  <Text style={styles.catName}>{cat.category}</Text>
                  <Text style={styles.catAmount}>{formatCurrency(cat.amount)}</Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${Math.min(cat.percentage, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.catPct}>{cat.percentage}% chi phí</Text>
              </View>
            ))}
          </View>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  summaryCard: {
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.businessTag + "40",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerIcon: {
    fontSize: 22,
  },
  title: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.businessTag,
  },
  subTitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.card,
    padding: Spacing.sm,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  metricItem: {
    width: "48%",
    padding: Spacing.xs,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  adviceBox: {
    backgroundColor: Colors.businessTag + "10",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  adviceText: {
    fontSize: 11,
    color: Colors.businessTag,
    lineHeight: 16,
    fontWeight: "500",
  },
  sectionCard: {
    padding: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  stackedBar: {
    flexDirection: "row",
    height: 20,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    backgroundColor: "#ECEAE4",
    marginVertical: Spacing.xs,
  },
  barSegment: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  barText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bucketsList: {
    marginTop: Spacing.xs,
    gap: 4,
  },
  bucketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  bucketMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bucketIcon: {
    fontSize: 14,
  },
  bucketName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  bucketPct: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  bucketAmount: {
    fontSize: 12,
    fontWeight: "700",
  },
  withdrawalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  withdrawalDesc: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  withdrawalHint: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  withdrawalAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.primary,
  },
  expenseCatsList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  expenseCatItem: {
    gap: 2,
  },
  catInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  catName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  catAmount: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.danger,
  },
  track: {
    height: 6,
    backgroundColor: "#ECEAE4",
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: 2,
  },
  fill: {
    height: "100%",
    backgroundColor: Colors.businessTag,
    borderRadius: 3,
  },
  catPct: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "right",
  },
});
