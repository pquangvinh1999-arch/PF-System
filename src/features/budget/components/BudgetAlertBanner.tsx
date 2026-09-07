import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { BudgetAlertReport } from "../../../services/budgetAlertService";
import { Badge } from "../../../components/Badge";

interface Props {
  report: BudgetAlertReport;
  onPressDetails: () => void;
}

export const BudgetAlertBanner: React.FC<Props> = ({ report, onPressDetails }) => {
  if (report.highestAlertLevel === "safe") {
    return null;
  }

  const isDanger = report.highestAlertLevel === "danger";

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " đ";
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPressDetails}
      style={[
        styles.container,
        isDanger ? styles.containerDanger : styles.containerWarning,
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{isDanger ? "🚨" : "⚠️"}</Text>
      </View>

      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, isDanger ? styles.titleDanger : styles.titleWarning]}>
            {isDanger ? "CẢNH BÁO BỘI CHI NGÂN SÁCH" : "CHÚ Ý NGƯỠNG CHI TIÊU"}
          </Text>
          <Badge
            label={isDanger ? `Vượt ${formatCurrency(report.totalOverspent)}` : "Chạm 80%"}
            type={isDanger ? "danger" : "warning"}
          />
        </View>

        <Text style={[styles.desc, isDanger ? styles.descDanger : styles.descWarning]}>
          {isDanger
            ? `Có nhóm chi tiêu đã vượt định mức phân bổ. Chạm để xem phân tích chi tiết & giải pháp.`
            : `Một số nhóm chi tiêu đã tiêu quá 80% hạn mức tháng. Chạm để kiểm tra chi tiết.`}
        </Text>
      </View>

      <View style={styles.actionArrow}>
        <Text style={[styles.arrowText, isDanger ? styles.arrowDanger : styles.arrowWarning]}>
          →
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  containerDanger: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
  },
  containerWarning: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 26,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  titleDanger: {
    color: Colors.danger,
  },
  titleWarning: {
    color: "#B45309",
  },
  desc: {
    ...Typography.caption,
    lineHeight: 16,
  },
  descDanger: {
    color: "#991B1B",
  },
  descWarning: {
    color: "#92400E",
  },
  actionArrow: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: Spacing.xs,
  },
  arrowText: {
    fontSize: 18,
    fontWeight: "700",
  },
  arrowDanger: {
    color: Colors.danger,
  },
  arrowWarning: {
    color: "#B45309",
  },
});
