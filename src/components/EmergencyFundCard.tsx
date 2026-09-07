import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../constants/theme";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { EmergencyFundService } from "../services/emergencyFundService";
import { Goal, Transaction } from "../types";

interface EmergencyFundCardProps {
  transactions: Transaction[];
  goals: Goal[];
  onApplyTarget?: (targetAmount: number, months: number) => void;
}

export const EmergencyFundCard: React.FC<EmergencyFundCardProps> = ({
  transactions,
  goals,
  onApplyTarget,
}) => {
  const [months, setMonths] = useState<number>(6);
  const emergencyGoal = EmergencyFundService.findEmergencyGoal(goals);
  const calc = EmergencyFundService.calculate(transactions, emergencyGoal, months);

  const formatCurrency = (v: number) => new Intl.NumberFormat("vi-VN").format(Math.round(v)) + " đ";

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>🛡️</Text>
          <View>
            <Text style={styles.title}>Quỹ khẩn cấp (tự tính)</Text>
            <Text style={styles.subtitle}>
              {calc.hasEnoughHistory
                ? `Dựa trên ${calc.monthsOfHistory} tháng chi thiết yếu · TB ${formatCurrency(calc.avgEssentialMonthly)}/tháng`
                : "Chưa đủ lịch sử chi tiêu thiết yếu — hãy nhập thu chi trước"}
            </Text>
          </View>
        </View>
        <Badge
          label={calc.hasEnoughHistory ? `${calc.progressPct}%` : "Chưa có dữ liệu"}
          type={calc.progressPct >= 100 ? "success" : calc.hasEnoughHistory ? "primary" : "warning"}
        />
      </View>

      {calc.hasEnoughHistory ? (
        <View>
          <View style={styles.monthRow}>
            {[3, 4, 5, 6].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.monthChip, months === m && styles.monthChipActive]}
                onPress={() => setMonths(m)}
                activeOpacity={0.8}
              >
                <Text style={[styles.monthText, months === m && styles.monthTextActive]}>
                  {m} tháng
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.targetBox}>
            <Text style={styles.targetLabel}>
              Mục tiêu {calc.chosenMonths} tháng:{" "}
              <Text style={styles.targetValue}>{formatCurrency(calc.chosenTarget)}</Text>
            </Text>
            <Text style={styles.rangeText}>
              Ngưỡng chuẩn: {formatCurrency(calc.targetMin3Months)} (3 th) –{" "}
              {formatCurrency(calc.targetMax6Months)} (6 th)
            </Text>
          </View>

          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.min(calc.progressPct, 100)}%`,
                  backgroundColor:
                    calc.progressPct >= 100 ? Colors.success : Colors.primary,
                },
              ]}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.savedText}>
              Đã tích lũy: <Text style={styles.bold}>{formatCurrency(calc.currentSaved)}</Text>
            </Text>
            <Text style={styles.remainingText}>
              {calc.remaining <= 0 ? "🎉 Đủ quỹ!" : `Còn thiếu: ${formatCurrency(calc.remaining)}`}
            </Text>
          </View>

          {onApplyTarget && (
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => onApplyTarget(calc.chosenTarget, calc.chosenMonths)}
              activeOpacity={0.8}
            >
              <Text style={styles.applyText}>
                ✓ Đặt {formatCurrency(calc.chosenTarget)} làm mục tiêu quỹ khẩn cấp
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.noDataBox}>
          <Text style={styles.noDataText}>
            💡 Chi phí thiết yếu = nhóm Needs (Ăn uống, Nhà ở, Đi lại, Y tế, Giáo dục). App sẽ tự
            tính trung bình 3 tháng gần nhất × 3–6 tháng khi bạn đã ghi nhận chi tiêu.
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderTopWidth: 3,
    borderTopColor: Colors.success,
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
    flex: 1,
    marginRight: Spacing.sm,
  },
  icon: {
    fontSize: 26,
    marginRight: Spacing.sm,
  },
  title: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  monthRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  monthChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  monthChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  monthText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  monthTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  targetBox: {
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  targetLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  targetValue: {
    fontWeight: "800",
    color: Colors.primary,
  },
  rangeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
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
    marginTop: Spacing.xs,
  },
  savedText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  bold: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  remainingText: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.primary,
  },
  applyBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  applyText: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.primary,
  },
  noDataBox: {
    backgroundColor: Colors.accentLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  noDataText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
