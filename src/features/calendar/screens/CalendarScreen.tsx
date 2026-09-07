import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { Card, Badge } from "../../../components";
import { Colors, Spacing, Typography } from "../../../constants/theme";
import { CalendarGrid, CalendarEventMarker } from "../components/CalendarGrid";
import { CashFlowForecastBar } from "../components/CashFlowForecastBar";
import { CashFlowForecastService } from "../services/CashFlowForecastService";
import { CalendarUtils } from "../utils/calendarUtils";
import { useAppStore } from "../../../store/useAppStore";

export const CalendarScreen: React.FC = () => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(
    CalendarUtils.getTodayString()
  );

  const {
    accounts,
    incomeSources,
    transactions,
    budgets,
    plannedExpenses,
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

  const formattedSelectedDateTitle = (() => {
    const [y, m, d] = selectedDate.split("-");
    return `Ngày ${parseInt(d, 10)} tháng ${parseInt(m, 10)}, ${y}`;
  })();

  const isToday = selectedDate === CalendarUtils.getTodayString();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Lịch Chi Tiêu Xa</Text>
            <Text style={styles.subtitle}>
              Nhìn trước các khoản chi lớn để chủ động phân bổ dòng tiền
            </Text>
          </View>
          <Badge label="Thay thế Map" type="accent" />
        </View>

        {/* Thanh dự báo dòng tiền (Cash Flow Forecast Bar) ở trên cùng */}
        <CashFlowForecastBar forecast={forecast} defaultExpanded={false} />

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
            {isToday && <Badge label="Hôm nay" type="primary" />}
          </View>

          {selectedDayExpenses.length > 0 ? (
            <View style={styles.dayExpensesList}>
              {selectedDayExpenses.map((pe) => (
                <View key={pe.id} style={styles.expenseItem}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseTitle}>{pe.title}</Text>
                    <Text style={styles.expenseCategory}>
                      {pe.category} • {pe.account_id === "business" ? "🏢 Shop" : "👤 Cá nhân"}
                    </Text>
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>
                      -{CashFlowForecastService.formatCurrency(pe.amount)}
                    </Text>
                    <Badge
                      label={
                        pe.status === "paid"
                          ? "Đã chi"
                          : pe.status === "overdue"
                          ? "Quá hạn"
                          : "Sắp tới"
                      }
                      type={
                        pe.status === "paid"
                          ? "success"
                          : pe.status === "overdue"
                          ? "danger"
                          : "accent"
                      }
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyDayBox}>
              <Text style={styles.emptyDayText}>
                Chưa có khoản chi lớn nào được lên lịch cho ngày này.
              </Text>
            </View>
          )}
        </Card>
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
});
