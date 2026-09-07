import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { Card, Badge } from "../../../components";
import { BudgetAllocationReport } from "../../../services/budgetChartService";

interface Props {
  report: BudgetAllocationReport;
  onPressAdjust?: () => void;
}

export const BudgetAllocationChart: React.FC<Props> = ({ report }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " đ";
  };

  const getScoreBadgeType = (score: number): "success" | "warning" | "danger" => {
    if (score >= 85) return "success";
    if (score >= 70) return "warning";
    return "danger";
  };

  return (
    <Card style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.icon}>📊</Text>
          <View>
            <Text style={styles.title}>Biểu Đồ Phân Bổ Chi Tiêu</Text>
            <Text style={styles.subTitle}>Kế hoạch vs Thực tế kỳ {report.period}</Text>
          </View>
        </View>
        <Badge
          label={`Điểm bám sát: ${report.healthScore}/100`}
          type={getScoreBadgeType(report.healthScore)}
        />
      </View>

      {/* Message Evaluation */}
      <View style={styles.evalBox}>
        <Text style={styles.evalText}>💡 {report.evaluationMessage}</Text>
      </View>

      {/* Thanh 1: Phân bổ Kế hoạch */}
      <View style={styles.chartSection}>
        <View style={styles.barLabelRow}>
          <Text style={styles.barSectionLabel}>Kế hoạch theo tỷ lệ ngân sách</Text>
          <Text style={styles.barSectionAmount}>
            Tổng: {formatCurrency(report.totalPlannedExpense)}
          </Text>
        </View>
        <View style={styles.stackedBar}>
          {report.groups.map((grp) => {
            const widthPct = Math.max(grp.plannedPercent, 0);
            if (widthPct === 0) return null;
            return (
              <View
                key={`plan-${grp.group}`}
                style={[
                  styles.barSegment,
                  { width: `${widthPct}%`, backgroundColor: grp.color },
                ]}
              >
                {widthPct >= 15 && (
                  <Text style={styles.segmentText}>{widthPct}%</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Thanh 2: Phân bổ Thực tế */}
      <View style={styles.chartSection}>
        <View style={styles.barLabelRow}>
          <Text style={styles.barSectionLabel}>Thực tế chi tiêu trong tháng</Text>
          <Text style={styles.barSectionAmount}>
            Đã chi: {formatCurrency(report.totalActualExpense)}
          </Text>
        </View>

        {report.totalActualExpense === 0 ? (
          <View style={styles.emptyActualBar}>
            <Text style={styles.emptyActualText}>Chưa có phát sinh chi tiêu</Text>
          </View>
        ) : (
          <View style={styles.stackedBar}>
            {report.groups.map((grp) => {
              const widthPct = Math.max(grp.actualPercent, 0);
              if (widthPct === 0) return null;
              return (
                <View
                  key={`actual-${grp.group}`}
                  style={[
                    styles.barSegment,
                    { width: `${widthPct}%`, backgroundColor: grp.color },
                  ]}
                >
                  {widthPct >= 15 && (
                    <Text style={styles.segmentText}>{widthPct}%</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Legend & Bảng so sánh chi tiết 3 nhóm */}
      <View style={styles.comparisonTable}>
        {report.groups.map((grp) => {
          const isExceeded = grp.status === "exceeded";
          const isUnder = grp.status === "under";

          return (
            <View key={grp.group} style={styles.tableRow}>
              {/* Cột trái: Tên nhóm & Dot màu */}
              <View style={styles.groupMetaCol}>
                <View style={[styles.colorDot, { backgroundColor: grp.color }]} />
                <View>
                  <Text style={styles.groupNameText}>{grp.groupName}</Text>
                  <Text style={styles.groupDetailText}>
                    KH: {grp.plannedPercent}% ({formatCurrency(grp.plannedAmount)})
                  </Text>
                </View>
              </View>

              {/* Cột phải: Thực tế & Độ lệch */}
              <View style={styles.groupValuesCol}>
                <Text style={styles.actualValueText}>
                  TT: {grp.actualPercent}% ({formatCurrency(grp.actualAmount)})
                </Text>
                <View style={styles.badgeWrap}>
                  {grp.variancePercent === 0 ? (
                    <Text style={styles.varianceZero}>Khớp 100%</Text>
                  ) : grp.variancePercent > 0 ? (
                    <Text style={[styles.varianceText, styles.varianceOver]}>
                      +{grp.variancePercent}% ({isExceeded ? "Lạm chi" : "Cao hơn KH"})
                    </Text>
                  ) : (
                    <Text style={[styles.varianceText, styles.varianceUnder]}>
                      {grp.variancePercent}% ({isUnder ? "Tiết kiệm" : "Dưới định mức"})
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  subTitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  evalBox: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  evalText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: "600",
    lineHeight: 16,
  },
  chartSection: {
    marginBottom: Spacing.md,
  },
  barLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  barSectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  barSectionAmount: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  stackedBar: {
    flexDirection: "row",
    height: 24,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    backgroundColor: "#ECEAE4",
  },
  barSegment: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  segmentText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyActualBar: {
    height: 24,
    backgroundColor: "#F0EFEA",
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  emptyActualText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  comparisonTable: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  groupMetaCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  groupNameText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  groupDetailText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  groupValuesCol: {
    alignItems: "flex-end",
  },
  actualValueText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  badgeWrap: {
    marginTop: 2,
  },
  varianceZero: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.success,
  },
  varianceText: {
    fontSize: 10,
    fontWeight: "700",
  },
  varianceOver: {
    color: Colors.danger,
  },
  varianceUnder: {
    color: Colors.primary,
  },
});
