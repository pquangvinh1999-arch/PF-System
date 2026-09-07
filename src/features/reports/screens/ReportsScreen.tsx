import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Card, Badge, Button } from "../../../components";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { useAppStore } from "../../../store/useAppStore";
import { BusinessReportService } from "../../../services/businessReportService";
import { BusinessCashFlowReportCard } from "../../profitFirst/components/BusinessCashFlowReportCard";

export const ReportsScreen: React.FC = () => {
  const accounts = useAppStore((state) => state.accounts);
  const transactions = useAppStore((state) => state.transactions);
  const profitFirstRules = useAppStore((state) => state.profitFirstRules);

  const [activeTab, setActiveTab] = useState<"personal" | "business">("business");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // "YYYY-MM"
  );

  const personalAccount = accounts.find((a) => a.type === "personal");
  const businessAccount = accounts.find((a) => a.type === "business");

  // Xử lý chuyển tháng
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, "0")}`);
  };

  const formattedMonthTitle = (() => {
    const [year, month] = selectedMonth.split("-");
    return `Tháng ${parseInt(month, 10)}/${year}`;
  })();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " đ";
  };

  // Tính số liệu cho tab Cá nhân
  const personalTxs = transactions.filter(
    (t) =>
      t.date.startsWith(selectedMonth) &&
      (t.account_id === personalAccount?.id ||
        (personalAccount && t.to_account_id === personalAccount.id))
  );

  const personalIncome = personalTxs
    .filter((t) => t.type === "income" || (t.type === "transfer" && t.to_account_id === personalAccount?.id))
    .reduce((sum, t) => sum + t.amount, 0);

  const personalExpense = personalTxs
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const personalNet = personalIncome - personalExpense;
  const personalSavingsRate =
    personalIncome > 0 ? Math.round((personalNet / personalIncome) * 100) : 0;

  // Báo cáo Kinh doanh
  const businessReport = businessAccount
    ? BusinessReportService.generateReport(
        selectedMonth,
        businessAccount,
        transactions,
        profitFirstRules
      )
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Báo Cáo & Phân Tích</Text>
            <Text style={styles.subtitle}>
              Minh bạch dòng tiền Cá nhân & Kinh doanh
            </Text>
          </View>

          {/* Month Selector Mini */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrow}>
              <Text style={styles.arrowText}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{formattedMonthTitle}</Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrow}>
              <Text style={styles.arrowText}>▶</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Switcher: Cá nhân vs Kinh doanh */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "personal" && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab("personal")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "personal" && styles.tabTextActive,
              ]}
            >
              👤 Tài Chính Cá Nhân
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "business" && styles.tabBtnBizActive,
            ]}
            onPress={() => setActiveTab("business")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "business" && styles.tabTextBizActive,
              ]}
            >
              🏢 Dòng Tiền Kinh Doanh
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === "business" ? (
          businessReport ? (
            <BusinessCashFlowReportCard report={businessReport} />
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🏢</Text>
              <Text style={styles.emptyTitle}>Chưa có Ví Kinh Doanh</Text>
              <Text style={styles.emptyDesc}>
                Vui lòng vào tab Ví & Tài khoản để khởi tạo ví kinh doanh hoặc shop của bạn.
              </Text>
            </Card>
          )
        ) : (
          <View style={styles.personalSection}>
            {/* Personal Summary Card */}
            <Card style={styles.personalCard}>
              <View style={styles.personalHeaderRow}>
                <View>
                  <Text style={styles.personalCardTitle}>Tổng Quan Tài Chính Cá Nhân</Text>
                  <Text style={styles.personalCardSub}>Kỳ {formattedMonthTitle}</Text>
                </View>
                <Badge
                  label={personalNet >= 0 ? `Thặng dư +${formatCurrency(personalNet)}` : `Bội chi -${formatCurrency(Math.abs(personalNet))}`}
                  type={personalNet >= 0 ? "success" : "danger"}
                />
              </View>

              <View style={styles.personalMetricsGrid}>
                <View style={styles.personalMetric}>
                  <Text style={styles.metricLabel}>Tổng Thu Nhập</Text>
                  <Text style={[styles.metricVal, { color: Colors.success }]}>
                    +{formatCurrency(personalIncome)}
                  </Text>
                </View>

                <View style={styles.personalMetric}>
                  <Text style={styles.metricLabel}>Tổng Chi Tiêu</Text>
                  <Text style={[styles.metricVal, { color: Colors.danger }]}>
                    -{formatCurrency(personalExpense)}
                  </Text>
                </View>

                <View style={styles.personalMetric}>
                  <Text style={styles.metricLabel}>Thặng Dư Ròng</Text>
                  <Text
                    style={[
                      styles.metricVal,
                      { color: personalNet >= 0 ? Colors.primary : Colors.danger },
                    ]}
                  >
                    {formatCurrency(personalNet)}
                  </Text>
                </View>

                <View style={styles.personalMetric}>
                  <Text style={styles.metricLabel}>Tỷ Lệ Tích Lũy</Text>
                  <Text style={[styles.metricVal, { color: Colors.accent }]}>
                    {personalSavingsRate}%
                  </Text>
                </View>
              </View>

              <View style={styles.personalAdviceBox}>
                <Text style={styles.personalAdviceText}>
                  💡 Chi tiêu cá nhân được tách biệt hoàn toàn khỏi chi phí kinh doanh để bảo vệ tài sản gia đình.
                </Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  monthArrow: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  arrowText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  monthTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.button,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.button - 2,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabBtnBizActive: {
    backgroundColor: Colors.businessTag,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  tabTextBizActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptyDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  personalSection: {
    gap: Spacing.md,
  },
  personalCard: {
    padding: Spacing.md,
  },
  personalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  personalCardTitle: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  personalCardSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  personalMetricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.card,
    padding: Spacing.sm,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  personalMetric: {
    width: "48%",
    padding: Spacing.xs,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: "800",
  },
  personalAdviceBox: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  personalAdviceText: {
    fontSize: 11,
    color: Colors.primary,
    lineHeight: 16,
    fontWeight: "500",
  },
});
