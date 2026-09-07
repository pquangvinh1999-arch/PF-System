import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { CalendarUtils } from "../utils/calendarUtils";

export interface CalendarEventMarker {
  date: string;
  totalAmount: number;
  count: number;
}

interface CalendarGridProps {
  currentYear: number;
  currentMonth: number; // 1 - 12
  selectedDate: string; // YYYY-MM-DD
  markers?: Record<string, CalendarEventMarker>;
  onSelectDate: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentYear,
  currentMonth,
  selectedDate,
  markers = {},
  onSelectDate,
  onMonthChange,
}) => {
  const daysInMonth = CalendarUtils.getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = CalendarUtils.getFirstDayOfWeek(currentYear, currentMonth);
  const todayStr = CalendarUtils.getTodayString();

  const handlePrevMonth = () => {
    let y = currentYear;
    let m = currentMonth - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    onMonthChange(y, m);
  };

  const handleNextMonth = () => {
    let y = currentYear;
    let m = currentMonth + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    onMonthChange(y, m);
  };

  const handleJumpToToday = () => {
    const now = new Date();
    onMonthChange(now.getFullYear(), now.getMonth() + 1);
    onSelectDate(todayStr);
  };

  // Tạo mảng các ô lịch
  const calendarCells = [];
  // 1. Padding rỗng đầu tháng
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // 2. Các ngày trong tháng
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  return (
    <View style={styles.container}>
      {/* Header điều hướng tháng */}
      <View style={styles.headerRow}>
        <View style={styles.navControls}>
          <TouchableOpacity
            style={styles.arrowBtn}
            onPress={handlePrevMonth}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.arrowText}>◀</Text>
          </TouchableOpacity>

          <Text style={styles.monthTitle}>
            Tháng {String(currentMonth).padStart(2, "0")} / {currentYear}
          </Text>

          <TouchableOpacity
            style={styles.arrowBtn}
            onPress={handleNextMonth}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.arrowText}>▶</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.todayBtn}
          onPress={handleJumpToToday}
          activeOpacity={0.7}
        >
          <Text style={styles.todayBtnText}>Hôm nay</Text>
        </TouchableOpacity>
      </View>

      {/* Hàng thứ trong tuần (T2 -> CN) */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day, idx) => (
          <View key={day} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                idx >= 5 && styles.weekendText, // T7, CN
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Lưới các ngày trong tháng (Full-width grid) */}
      <View style={styles.grid}>
        {calendarCells.map((dayNum, index) => {
          if (dayNum === null) {
            return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
          }

          const dateStr = CalendarUtils.formatDateString(currentYear, currentMonth, dayNum);
          const isSelected = selectedDate === dateStr;
          const isToday = todayStr === dateStr;
          const marker = markers[dateStr];
          const hasEvents = Boolean(marker && marker.count > 0);

          return (
            <TouchableOpacity
              key={dateStr}
              activeOpacity={0.7}
              style={[
                styles.dayCell,
                isToday && styles.dayCellToday,
                isSelected && styles.dayCellSelected,
              ]}
              onPress={() => onSelectDate(dateStr)}
            >
              <Text
                style={[
                  styles.dayNumberText,
                  isToday && styles.dayNumberToday,
                  isSelected && styles.dayNumberSelected,
                ]}
              >
                {dayNum}
              </Text>

              {/* Dấu chấm Accent hoặc số tiền tóm tắt theo DESIGN.md */}
              {hasEvents && (
                <View style={styles.markerWrap}>
                  <View
                    style={[
                      styles.markerDot,
                      isSelected && styles.markerDotSelected,
                    ]}
                  />
                  {marker.totalAmount > 0 && (
                    <Text
                      style={[
                        styles.markerAmountText,
                        isSelected && styles.markerAmountSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {CalendarUtils.formatShortCurrency(marker.totalAmount)}
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  arrowBtn: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bg,
  },
  arrowText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  monthTitle: {
    ...Typography.bodyLarge,
    fontWeight: "700",
    color: Colors.textPrimary,
    minWidth: 130,
    textAlign: "center",
  },
  todayBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  weekdaysRow: {
    flexDirection: "row",
    marginBottom: Spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  weekendText: {
    color: Colors.accent,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCellEmpty: {
    width: "14.285%",
    height: 52,
  },
  dayCell: {
    width: "14.285%",
    height: 52,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 4,
    borderRadius: BorderRadius.sm,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + "30",
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  dayNumberToday: {
    color: Colors.primary,
    fontWeight: "800",
  },
  dayNumberSelected: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  markerWrap: {
    alignItems: "center",
    marginTop: 2,
    gap: 1,
  },
  markerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.accent, // #D4A72C chuẩn DESIGN.md
  },
  markerDotSelected: {
    backgroundColor: Colors.accentLight,
  },
  markerAmountText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.accent,
  },
  markerAmountSelected: {
    color: "#FFFFFF",
  },
});
