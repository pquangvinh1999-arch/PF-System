import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import { Card, Badge, Button } from "../../../components";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { CalendarGrid, CalendarEventMarker } from "../components/CalendarGrid";
import { CashFlowForecastBar } from "../components/CashFlowForecastBar";
import { PlannedExpenseSheet } from "../components/PlannedExpenseSheet";
import { CashFlowForecastService } from "../services/CashFlowForecastService";
import { CalendarUtils } from "../utils/calendarUtils";
import { useAppStore } from "../../../store/useAppStore";
import { PlannedExpense } from "../../../types";
import { NotificationService } from "../../../services/notificationService";

export const CalendarScreen: React.FC = () => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(
    CalendarUtils.getTodayString()
  );
  const [isSheetVisible, setIsSheetVisible] = useState<boolean>(false);
  const [expenseToEdit, setExpenseToEdit] = useState<PlannedExpense | null>(null);

  const {
    accounts,
    incomeSources,
    transactions,
    budgets,
    plannedExpenses,
    updatePlannedExpense,
  } = useAppStore();

  const period = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  // Dự báo dòng tiền (CashFlowForecastBar)
  const forecast = useMemo(() => {
    return CashFlowForecastService.getMonthForecast({
      accounts,
      incomeSources,
      transactions,
      budgets,
      plannedExpenses,
      period,
    });
  }, [accounts, incomeSources, transactions, budgets, plannedExpenses, period]);

  // Markers sự kiện chi tiêu cho CalendarGrid
  const markers = useMemo(() => {
    const map: Record<string, CalendarEventMarker> = {};
    for (const pe of plannedExpenses) {
      if (!pe.due_date) continue;
      if (!map[pe.due_date]) {
        map[pe.due_date] = {
          date: pe.due_date,
          totalAmount: pe.amount,
          count: 1,
        };
      } else {
        map[pe.due_date].totalAmount += pe.amount;
        map[pe.due_date].count += 1;
      }
    }
    return map;
  }, [plannedExpenses]);

  // Danh sách các khoản chi của ngày đang chọn
  const selectedDayExpenses = useMemo(() => {
    return plannedExpenses.filter((pe) => pe.due_date === selectedDate);
  }, [plannedExpenses, selectedDate]);

  // Các khoản chi sắp đến hạn trong vòng 7 ngày tới (Local Notification reminder)
  const upcomingReminders = useMemo(() => {
    return NotificationService.getUpcomingExpensesWithinDays(plannedExpenses, 7);
  }, [plannedExpenses]);

  const formattedSelectedDateTitle = (() => {
    const [y, m, d] = selectedDate.split("-");
    return `Ngày ${parseInt(d, 10)} tháng ${parseInt(m, 10)}, ${y}`;
  })();

  const isToday = selectedDate === CalendarUtils.getTodayString();

  const handleAddNew = (date?: string) => {
    if (date) setSelectedDate(date);
    setExpenseToEdit(null);
    setIsSheetVisible(true);
  };

  const handleEditExpense = (expense: PlannedExpense) => {
    setExpenseToEdit(expense);
    setIsSheetVisible(true);
  };

  const handleToggleStatus = async (expense: PlannedExpense) => {
    const nextStatus = expense.status === "paid" ? "upcoming" : "paid";
    await updatePlannedExpense(expense.id, { status: nextStatus });
    if (nextStatus === "paid") {
      await NotificationService.cancelNotification(expense.id);
    } else {
      await NotificationService.schedulePlannedExpenseReminder(
        { ...expense, status: nextStatus },
        7
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Lịch Chi Tiêu Xa</Text>
            <Text style={styles.subtitle}>
              Nhìn trước các khoản chi lớn để chủ động phân bổ dòng tiền
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => handleAddNew(selectedDate)}
          >
            <Text style={styles.headerAddBtnText}>+ Thêm</Text>
          </TouchableOpacity>
        </View>

        {/* Thanh dự báo dòng tiền (Cash Flow Forecast Bar) ở trên cùng */}
        <CashFlowForecastBar forecast={forecast} defaultExpanded={false} />

        {/* Thẻ nhắc hạn chi tiêu sắp tới (7 ngày tới - Local Notification indicator) */}
        {upcomingReminders.length > 0 && (
          <Card style={styles.remindersBannerCard}>
            <View style={styles.remindersHeader}>
              <View style={styles.remindersTitleWrap}>
                <Text style={styles.remindersIcon}>🔔</Text>
                <View>
                  <Text style={styles.remindersTitle}>
                    Nhắc hạn ({upcomingReminders.length} khoản chi trong 7 ngày tới)
                  </Text>
                  <Text style={styles.remindersSub}>
                    Tổng chuẩn bị:{" "}
                    {CashFlowForecastService.formatCurrency(
                      upcomingReminders.reduce((s, e) => s + e.amount, 0)
                    )}
                  </Text>
                </View>
              </View>
              <Badge label="7 ngày tới" type="accent" />
            </View>
            <View style={styles.remindersList}>
              {upcomingReminders.slice(0, 3).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.reminderItemRow}
                  onPress={() => {
                    setSelectedDate(item.due_date);
                    handleEditExpense(item);
                  }}
                >
                  <Text style={styles.reminderItemTitle} numberOfLines={1}>
                    • {item.title}
                  </Text>
                  <View style={styles.reminderItemRight}>
                    <Text style={styles.reminderItemDate}>{item.due_date}</Text>
                    <Text style={styles.reminderItemAmount}>
                      -{CashFlowForecastService.formatCurrency(item.amount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Lưới lịch tháng (CalendarGrid) */}
        <CalendarGrid
          currentYear={currentYear}
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          markers={markers}
          onSelectDate={setSelectedDate}
          onMonthChange={(y, m) => {
            setCurrentYear(y);
            setCurrentMonth(m);
          }}
        />

        {/* Khối chi tiết ngày được chọn */}
        <Card style={styles.selectedDayCard}>
          <View style={styles.selectedDayHeader}>
            <View style={styles.selectedDayTitleWrap}>
              <Text style={styles.selectedDayIcon}>📅</Text>
              <View>
                <Text style={styles.selectedDayTitle}>
                  {formattedSelectedDateTitle}
                </Text>
                <Text style={styles.selectedDaySub}>
                  {selectedDayExpenses.length > 0
                    ? `${selectedDayExpenses.length} khoản chi đã lên lịch`
                    : isToday
                    ? "Hôm nay • Chưa có sự kiện chi tiêu"
                    : "Chưa có khoản chi lên lịch"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.cardAddBtn}
              onPress={() => handleAddNew(selectedDate)}
            >
              <Text style={styles.cardAddBtnText}>+ Thêm chi tiêu</Text>
            </TouchableOpacity>
          </View>

          {selectedDayExpenses.length > 0 ? (
            <View style={styles.dayExpensesList}>
              {selectedDayExpenses.map((pe) => (
                <TouchableOpacity
                  key={pe.id}
                  style={styles.expenseItem}
                  onPress={() => handleEditExpense(pe)}
                  activeOpacity={0.7}
                >
                  <View style={styles.expenseInfo}>
                    <View style={styles.expenseTitleRow}>
                      <Text style={styles.expenseTitle}>{pe.title}</Text>
                      {pe.recurrence !== "none" && (
                        <Text style={styles.recurrenceTag}>
                          {pe.recurrence === "monthly" ? "🔁 Tháng" : "🔁 Năm"}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.expenseCategory}>
                      {pe.category} •{" "}
                      {pe.account_id === "business" ? "🏢 Shop" : "👤 Cá nhân"}
                      {pe.linked_goal_id ? ` • 🎯 Quỹ dự phòng` : ""}
                    </Text>
                    {pe.note ? (
                      <Text style={styles.expenseNote} numberOfLines={1}>
                        💬 {pe.note}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.expenseRight}>
                    <Text
                      style={[
                        styles.expenseAmount,
                        pe.status === "paid" && styles.expenseAmountPaid,
                      ]}
                    >
                      -{CashFlowForecastService.formatCurrency(pe.amount)}
                    </Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(pe);
                      }}
                    >
                      <Badge
                        label={
                          pe.status === "paid"
                            ? "✓ Đã chi"
                            : pe.status === "overdue"
                            ? "⚠️ Quá hạn"
                            : "⏳ Sắp tới"
                        }
                        type={
                          pe.status === "paid"
                            ? "success"
                            : pe.status === "overdue"
                            ? "danger"
                            : "accent"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyDayBox}>
              <Text style={styles.emptyDayText}>
                Chưa có khoản chi lớn nào được lên lịch cho ngày này.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => handleAddNew(selectedDate)}
              >
                <Text style={styles.emptyAddBtnText}>
                  + Lên lịch chi tiêu cho ngày này
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* PlannedExpenseSheet Bottom Sheet Modal */}
        <PlannedExpenseSheet
          visible={isSheetVisible}
          expenseToEdit={expenseToEdit}
          initialDate={selectedDate}
          onClose={() => {
            setIsSheetVisible(false);
            setExpenseToEdit(null);
          }}
        />
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
    maxWidth: "80%",
  },
  selectedDayCard: {
    padding: Spacing.md,
  },
  selectedDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },
  selectedDayTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  selectedDayIcon: {
    fontSize: 20,
  },
  selectedDayTitle: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  selectedDaySub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dayExpensesList: {
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  expenseCategory: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  expenseRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  expenseAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.danger,
  },
  emptyDayBox: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyDayText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
  },
  headerAddBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.button,
  },
  headerAddBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  cardAddBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  cardAddBtnText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  expenseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  recurrenceTag: {
    fontSize: 10,
    backgroundColor: Colors.accentLight,
    color: Colors.warning,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    fontWeight: "600",
  },
  expenseNote: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    fontStyle: "italic",
  },
  expenseAmountPaid: {
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  emptyAddBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.button,
  },
  emptyAddBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  remindersBannerCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  remindersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  remindersTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  remindersIcon: {
    fontSize: 18,
  },
  remindersTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  remindersSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  remindersList: {
    marginTop: Spacing.xs,
    gap: 4,
  },
  reminderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  reminderItemTitle: {
    fontSize: 12,
    color: Colors.textPrimary,
    flex: 1,
  },
  reminderItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  reminderItemDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  reminderItemAmount: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.danger,
  },
});
