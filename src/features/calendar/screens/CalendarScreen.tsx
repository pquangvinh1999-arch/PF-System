import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import { Card, Badge, Button } from "../../../components";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { CalendarGrid, CalendarEventMarker } from "../components/CalendarGrid";
import { CalendarUtils } from "../utils/calendarUtils";

export const CalendarScreen: React.FC = () => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(
    CalendarUtils.getTodayString()
  );

  // Markers mẫu cho CalendarGrid
  const markers: Record<string, CalendarEventMarker> = {};

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
                  {isToday ? "Hôm nay • Chưa có sự kiện chi tiêu" : "Chưa có khoản chi lên lịch"}
                </Text>
              </View>
            </View>
            {isToday && <Badge label="Hôm nay" type="primary" />}
          </View>

          <View style={styles.emptyDayBox}>
            <Text style={styles.emptyDayText}>
              Chưa có khoản chi lớn nào được lên lịch cho ngày này.
            </Text>
          </View>
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
