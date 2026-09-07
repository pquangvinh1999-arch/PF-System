import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../constants/theme";
import { BudgetGroupStatus } from "../services/budgetService";
import { Badge } from "./Badge";

interface BudgetProgressBarProps {
  status: BudgetGroupStatus;
  style?: StyleProp<ViewStyle>;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ status, style }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.abs(val)) + " đ";
  };

  const getProgressColor = () => {
    if (status.isOverBudget) return Colors.danger;
    if (status.status === "warning") return Colors.warning;
    return status.color || Colors.primary;
  };

  const progressPercent = Math.min(status.spentRate, 100);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{status.icon}</Text>
          <View>
            <Text style={styles.groupName}>{status.name}</Text>
            <Text style={styles.percentageText}>
              Định mức: {status.allocatedPercentage}% thu nhập ({formatCurrency(status.allocatedAmount)})
            </Text>
          </View>
        </View>

        {status.isOverBudget ? (
          <Badge label={`Vượt ${status.spentRate}%`} type="danger" />
        ) : status.status === "warning" ? (
          <Badge label={`Cảnh báo ${status.spentRate}%`} type="warning" />
        ) : (
          <Badge label={`${status.spentRate}%`} type="primary" />
        )}
      </View>

      {/* Progress Track */}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${progressPercent}%`,
              backgroundColor: getProgressColor(),
            },
          ]}
        />
      </View>

      {/* Footer info */}
      <View style={styles.footer}>
        <Text style={styles.spentText}>
          Đã chi: <Text style={styles.boldText}>{formatCurrency(status.spentAmount)}</Text>
        </Text>
        <Text
          style={[
            styles.remainingText,
            { color: status.isOverBudget ? Colors.danger : Colors.textSecondary },
          ]}
        >
          {status.isOverBudget
            ? `Bội chi: +${formatCurrency(status.spentAmount - status.allocatedAmount)}`
            : `Còn lại: ${formatCurrency(status.remainingAmount)}`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  icon: {
    fontSize: 24,
  },
  groupName: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  percentageText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  track: {
    height: 10,
    backgroundColor: "#ECEAE4",
    borderRadius: 5,
    overflow: "hidden",
    marginVertical: Spacing.xs,
  },
  fill: {
    height: "100%",
    borderRadius: 5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  spentText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  boldText: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  remainingText: {
    ...Typography.caption,
    fontWeight: "600",
  },
});
