import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Card, Badge, Button, TransactionRow, BudgetProgressBar } from "../../../components";
import { Colors, Spacing, Typography, BorderRadius, Shadows } from "../../../constants/theme";
import { useAppStore } from "../../../store/useAppStore";
import { Transaction } from "../../../types";
import { TransactionFormModal } from "../../transactions/components/TransactionFormModal";
import { BudgetConfigModal } from "../../budget/components/BudgetConfigModal";
import { BudgetAlertBanner } from "../../budget/components/BudgetAlertBanner";
import { BudgetAlertModal } from "../../budget/components/BudgetAlertModal";
import { getCategoryIcon } from "../../../constants/categories";
import { BudgetService } from "../../../services/budgetService";
import { BudgetAlertService } from "../../../services/budgetAlertService";
import { MainTabParamList } from "../../../navigation/types";

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const accounts = useAppStore((state) => state.accounts);
  const transactions = useAppStore((state) => state.transactions);
  const budgets = useAppStore((state) => state.budgets);
  const fetchBudgets = useAppStore((state) => state.fetchBudgets);
  const user = useAppStore((state) => state.user);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState<boolean>(false);
  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("Tất cả");

  // Bộ chọn tháng YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prev = new Date(y, m - 2, 1);
    const newY = prev.getFullYear();
    const newM = String(prev.getMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const next = new Date(y, m, 1);
    const newY = next.getFullYear();
    const newM = String(next.getMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${newY}-${newM}`);
  };

  const personalAccount = accounts.find((a) => a.type === "personal");
  const businessAccount = accounts.find((a) => a.type === "business");

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " đ";
  };

  // Tính toán số liệu thu chi theo tháng
  const monthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));

  // Tải ngân sách tháng hiện tại
  useEffect(() => {
    fetchBudgets(selectedMonth);
  }, [selectedMonth, fetchBudgets]);

  const budgetSummary = BudgetService.calculateGroupStatus(
    selectedMonth,
    budgets,
    transactions
  );

  const budgetAlertReport = BudgetAlertService.checkBudgetAlerts(
    selectedMonth,
    budgets,
    transactions
  );

  const monthIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = monthIncome - monthExpense;
  const savingsRate = monthIncome > 0 ? Math.round((netCashFlow / monthIncome) * 100) : 0;

  const filteredTransactions =
    selectedCategoryFilter === "Tất cả"
      ? monthTransactions
      : monthTransactions.filter((t) => t.category === selectedCategoryFilter);

  const handleOpenAdd = () => {
    setSelectedTx(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setSelectedTx(tx);
    setModalVisible(true);
  };

  const getAccountName = (accId: string) => {
    const acc = accounts.find((a) => a.id === accId);
    return acc ? acc.name : undefined;
  };

  const formattedMonthTitle = (() => {
    const [y, m] = selectedMonth.split("-");
    return `Tháng ${m}/${y}`;
  })();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header người dùng */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Xin chào,</Text>
            <Text style={styles.userName}>{user?.name || "Gia đình"}</Text>
          </View>
          <Button
            title="+ Thêm thu chi"
            variant="primary"
            style={styles.addBtn}
            onPress={handleOpenAdd}
          />
        </View>

        {/* Bộ chọn tháng (Month Selector) */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrowBtn}>
            <Text style={styles.monthArrowText}>◀</Text>
          </TouchableOpacity>
          <View style={styles.monthCenter}>
            <Text style={styles.monthTitle}>{formattedMonthTitle}</Text>
            <Text style={styles.monthSubtitle}>Tổng quan dòng tiền trong tháng</Text>
          </View>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrowBtn}>
            <Text style={styles.monthArrowText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Khối tóm tắt thu chi tháng: Tổng thu / Tổng chi / Dòng tiền ròng */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tổng Thu Nhập</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>
                +{formatCurrency(monthIncome)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tổng Chi Tiêu</Text>
              <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                -{formatCurrency(monthExpense)}
              </Text>
            </View>
          </View>

          <View style={styles.netCashFlowBox}>
            <View>
              <Text style={styles.netCashFlowLabel}>Thặng dư / Tiết kiệm ròng</Text>
              <Text
                style={[
                  styles.netCashFlowValue,
                  { color: netCashFlow >= 0 ? Colors.primary : Colors.danger },
                ]}
              >
                {netCashFlow >= 0 ? "+" : ""}
                {formatCurrency(netCashFlow)}
              </Text>
            </View>
            {monthIncome > 0 && (
              <Badge
                label={`Tích lũy ${savingsRate}%`}
                type={savingsRate >= 20 ? "primary" : savingsRate > 0 ? "warning" : "danger"}
              />
            )}
          </View>
        </Card>

        {/* Thẻ số dư 2 tài khoản (Tách bạch Personal & Business) */}
        <View style={styles.accountsRow}>
          <Card style={[styles.accountCard, styles.personalCard]}>
            <Badge label="Ví Cá nhân" type="primary" style={styles.accountBadge} />
            <Text style={styles.accountBalance}>
              {formatCurrency(personalAccount?.balance || 0)}
            </Text>
            <Text style={styles.accountNote}>Dòng tiền gia đình & chi tiêu</Text>
          </Card>

          <Card style={[styles.accountCard, styles.businessCard]}>
            <Badge label="Ví Kinh doanh" type="business" style={styles.accountBadge} />
            <Text style={styles.accountBalance}>
              {formatCurrency(businessAccount?.balance || 0)}
            </Text>
            <Text style={styles.accountNote}>Dòng tiền shop / kinh doanh phụ</Text>
          </Card>
        </View>

        {/* Khối Quick Feature Tiles: Lịch chi tiêu, Ví, Báo cáo */}
        <View style={styles.quickTilesRow}>
          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate("Calendar")}
          >
            <Text style={styles.quickTileIcon}>📅</Text>
            <Text style={styles.quickTileText}>Lịch Chi Tiêu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate("Accounts")}
          >
            <Text style={styles.quickTileIcon}>👛</Text>
            <Text style={styles.quickTileText}>Quản Lý Ví</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate("Reports")}
          >
            <Text style={styles.quickTileIcon}>📊</Text>
            <Text style={styles.quickTileText}>Báo Cáo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text style={styles.quickTileIcon}>⚙️</Text>
            <Text style={styles.quickTileText}>Cài Đặt</Text>
          </TouchableOpacity>
        </View>

        {/* Khối Ngân sách 50/30/20 tùy biến */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ngân sách 50/30/20 ({formattedMonthTitle})</Text>
          <TouchableOpacity onPress={() => setBudgetModalVisible(true)}>
            <Text style={styles.seeAllText}>⚙️ Tùy biến %</Text>
          </TouchableOpacity>
        </View>

        {/* Cảnh báo ngưỡng ngân sách (>=80% warning, >=100% danger) */}
        <BudgetAlertBanner
          report={budgetAlertReport}
          onPressDetails={() => setAlertModalVisible(true)}
        />

        {/* 3 Thanh tiến độ nhóm 50/30/20 */}
        <BudgetProgressBar status={budgetSummary.groups.needs} />
        <BudgetProgressBar status={budgetSummary.groups.wants} />
        <BudgetProgressBar status={budgetSummary.groups.savings} />

        {/* Thống kê phân bổ chi tiêu theo Danh mục trong tháng */}
        {monthTransactions.some((t) => t.type === "expense") && (
          <Card style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Phân bổ Chi tiêu theo Danh mục ({formattedMonthTitle})</Text>
            <View style={styles.breakdownList}>
              {(() => {
                const expenseTxs = monthTransactions.filter((t) => t.type === "expense");
                const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
                const catTotals: Record<string, number> = {};
                for (const t of expenseTxs) {
                  catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
                }
                const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

                return sortedCats.slice(0, 4).map(([catName, catAmount]) => {
                  const percent = totalExpense > 0 ? Math.round((catAmount / totalExpense) * 100) : 0;
                  return (
                    <View key={catName} style={styles.breakdownItem}>
                      <View style={styles.breakdownItemLeft}>
                        <Text style={styles.breakdownCatName}>
                          {getCategoryIcon(catName)} {catName}
                        </Text>
                        <Text style={styles.breakdownCatAmount}>{formatCurrency(catAmount)}</Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressBar, { width: `${Math.min(percent, 100)}%` }]} />
                      </View>
                      <Text style={styles.percentText}>{percent}%</Text>
                    </View>
                  );
                });
              })()}
            </View>
          </Card>
        )}

        {/* Danh sách giao dịch theo tháng */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Giao dịch {formattedMonthTitle}</Text>
          <TouchableOpacity onPress={handleOpenAdd}>
            <Text style={styles.seeAllText}>+ Giao dịch mới</Text>
          </TouchableOpacity>
        </View>

        {/* Bộ lọc danh mục */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {["Tất cả", "Ăn uống", "Nhà ở & Tiện ích", "Đi lại", "Lương cố định", "Doanh thu Shop Online", "Khác"].map(
            (cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  selectedCategoryFilter === cat && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategoryFilter(cat)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategoryFilter === cat && styles.filterChipTextActive,
                  ]}
                >
                  {cat === "Tất cả" ? "Tất cả" : `${getCategoryIcon(cat)} ${cat}`}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        {filteredTransactions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>
              {selectedCategoryFilter === "Tất cả"
                ? `Chưa có giao dịch nào trong ${formattedMonthTitle}`
                : `Không có giao dịch "${selectedCategoryFilter}" trong ${formattedMonthTitle}`}
            </Text>
            <Text style={styles.emptyDesc}>
              Bấm "+ Thêm thu chi" ở trên để ghi nhận khoản chi tiêu hoặc nguồn thu nhập đầu tiên.
            </Text>
          </Card>
        ) : (
          filteredTransactions.slice(0, 20).map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              accountName={getAccountName(tx.account_id)}
              onPress={handleOpenEdit}
            />
          ))
        )}
      </ScrollView>

      {/* Modal CRUD Transaction */}
      <TransactionFormModal
        visible={modalVisible}
        transactionToEdit={selectedTx}
        onClose={() => {
          setModalVisible(false);
          setSelectedTx(null);
        }}
      />

      {/* Modal Cấu hình Ngân sách 50/30/20 tùy biến */}
      <BudgetConfigModal
        visible={budgetModalVisible}
        period={selectedMonth}
        onClose={() => setBudgetModalVisible(false)}
        onSuccess={() => fetchBudgets(selectedMonth)}
      />

      {/* Modal Chi tiết Cảnh báo Ngân sách */}
      <BudgetAlertModal
        visible={alertModalVisible}
        report={budgetAlertReport}
        onClose={() => setAlertModalVisible(false)}
        onOpenConfig={() => setBudgetModalVisible(true)}
      />
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
    marginBottom: Spacing.lg,
  },
  welcomeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  userName: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  addBtn: {
    paddingHorizontal: Spacing.md,
    height: 40,
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monthArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  monthArrowText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "700",
  },
  monthCenter: {
    alignItems: "center",
  },
  monthTitle: {
    ...Typography.bodyLarge,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  monthSubtitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  summaryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    ...Typography.bodyLarge,
    fontWeight: "800",
    fontSize: 15,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  netCashFlowBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
  },
  netCashFlowLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  netCashFlowValue: {
    ...Typography.h2,
    fontSize: 20,
    fontWeight: "800",
  },
  quickTilesRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickTile: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickTileIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  quickTileText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  accountsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  accountCard: {
    flex: 1,
    padding: Spacing.md,
  },
  personalCard: {
    borderTopWidth: 3,
    borderTopColor: Colors.primary,
  },
  businessCard: {
    borderTopWidth: 3,
    borderTopColor: Colors.businessTag,
  },
  accountBadge: {
    marginBottom: Spacing.sm,
    alignSelf: "flex-start",
  },
  accountBalance: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  accountNote: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  seeAllText: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.primary,
  },
  breakdownCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  breakdownTitle: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  breakdownList: {
    gap: Spacing.sm,
  },
  breakdownItem: {
    marginBottom: Spacing.xs,
  },
  breakdownItemLeft: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  breakdownCatName: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  breakdownCatAmount: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.danger,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#ECEAE4",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  percentText: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textSecondary,
    alignSelf: "flex-end",
    marginTop: 2,
  },
  filterBar: {
    flexDirection: "row",
    gap: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
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
  overBudgetAlertCard: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  alertIcon: {
    fontSize: 28,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.danger,
    marginBottom: 2,
  },
  alertDesc: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.danger,
    lineHeight: 16,
  },
});

