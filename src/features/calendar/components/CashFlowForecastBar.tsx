import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Spacing, Typography, BorderRadius, Shadows } from "../../../constants/theme";
import { CashFlowForecastResult, CashFlowForecastService } from "../services/CashFlowForecastService";

export interface CashFlowForecastBarProps {
  forecast: CashFlowForecastResult;
  onPressDetails?: () => void;
  defaultExpanded?: boolean;
}

export const CashFlowForecastBar: React.FC<CashFlowForecastBarProps> = ({
  forecast,
  onPressDetails,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  const statusIcons: Record<string, string> = {
    safe: "🟢",
    warning: "🟡",
    danger: "🔴",
  };

  const statusBadgeBg: Record<string, string> = {
    safe: Colors.primaryLight,
    warning: "#FEF3C7",
    danger: "#FDE8E8",
  };

  const statusBadgeText: Record<string, string> = {
    safe: Colors.primary,
    warning: "#B45309",
    danger: Colors.danger,
  };

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
    if (onPressDetails) {
      onPressDetails();
    }
  };

  return (
    <View style={[styles.container, Shadows.card]}>
      {/* Thanh viền trạng thái bên trái */}
      <View style={[styles.indicatorStrip, { backgroundColor: forecast.statusColor }]} />

      <View style={styles.innerContent}>
        {/* Hàng trạng thái & nút mở rộng */}
        <View style={styles.topRow}>
          <View
            style={[
              styles.badge,
              { backgroundColor: statusBadgeBg[forecast.status] || Colors.primaryLight },
            ]}
          >
            <Text style={styles.badgeIcon}>{statusIcons[forecast.status] || "⚪"}</Text>
            <Text
              style={[
                styles.badgeText,
                { color: statusBadgeText[forecast.status] || Colors.primary },
              ]}
            >
              {forecast.statusLabel}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.expandToggleBtn}
            onPress={toggleExpand}
            activeOpacity={0.7}
          >
            <Text style={styles.expandToggleText}>
              {isExpanded ? "Thu gọn ▲" : "Công thức ▼"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nội dung thông điệp chính theo DESIGN.md mục 4 */}
        <Text style={styles.promptLabel}>{forecast.displayText}</Text>
        <Text style={[styles.projectedAmount, { color: forecast.statusColor }]}>
          {forecast.formattedBalance}
        </Text>

        {/* Chi tiết công thức tính khi mở rộng */}
        {isExpanded && (
          <View style={styles.breakdownContainer}>
            <View style={styles.divider} />
            <Text style={styles.breakdownTitle}>Chi tiết đối soát dòng tiền:</Text>

            <View style={styles.formulaRow}>
              <Text style={styles.formulaLabel}>1. Số dư hiện tại</Text>
              <Text style={styles.formulaPlus}>
                +{CashFlowForecastService.formatCurrency(forecast.currentBalance)}
              </Text>
            </View>

            <View style={styles.formulaRow}>
              <Text style={styles.formulaLabel}>2. Thu nhập dự kiến còn lại</Text>
              <Text style={styles.formulaPlus}>
                +{CashFlowForecastService.formatCurrency(forecast.remainingExpectedIncome)}
              </Text>
            </View>

            <View style={styles.formulaRow}>
              <Text style={styles.formulaLabel}>3. Chi tiêu đã lên lịch</Text>
              <Text style={styles.formulaMinus}>
                -{CashFlowForecastService.formatCurrency(forecast.unpaidPlannedExpenses)}
              </Text>
            </View>

            <View style={styles.formulaRow}>
              <Text style={styles.formulaLabel}>4. Ngân sách chi tiêu còn lại</Text>
              <Text style={styles.formulaMinus}>
                -{CashFlowForecastService.formatCurrency(forecast.remainingBudget)}
              </Text>
            </View>

            <View style={[styles.formulaRow, styles.formulaTotalRow]}>
              <Text style={styles.formulaTotalLabel}>= Dự báo số dư cuối tháng</Text>
              <Text style={[styles.formulaTotalValue, { color: forecast.statusColor }]}>
                {forecast.formattedBalance}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  indicatorStrip: {
    width: 6,
  },
  innerContent: {
    flex: 1,
    padding: Spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badgeIcon: {
    fontSize: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  expandToggleBtn: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  expandToggleText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  promptLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  projectedAmount: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  breakdownContainer: {
    marginTop: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  formulaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  formulaLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  formulaPlus: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.success,
  },
  formulaMinus: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.danger,
  },
  formulaTotalRow: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  formulaTotalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  formulaTotalValue: {
    fontSize: 13,
    fontWeight: "700",
  },
});
