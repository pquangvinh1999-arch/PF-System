import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../constants/theme";
import { Goal } from "../types";
import { GoalService } from "../services/goalService";

interface GoalSuggestionBarProps {
  goal: Goal;
  todayStr?: string;
}

/**
 * Task 4.3 — Gợi ý số tiền cần tiết kiệm mỗi tháng để đạt mục tiêu đúng hạn.
 * Công thức: còn thiếu / số tháng còn lại (làm tròn lên).
 */
export const GoalSuggestionBar: React.FC<GoalSuggestionBarProps> = ({ goal, todayStr }) => {
  const formatCurrency = (v: number) => new Intl.NumberFormat("vi-VN").format(Math.round(v)) + " đ";

  if (GoalService.isCompleted(goal)) {
    return (
      <View style={[styles.box, styles.doneBox]}>
        <Text style={[styles.text, styles.doneText]}>🎉 Đã hoàn thành — không cần góp thêm!</Text>
      </View>
    );
  }

  if (!goal.deadline) {
    const remaining = GoalService.getRemaining(goal);
    return (
      <View style={[styles.box, styles.neutralBox]}>
        <Text style={styles.text}>
          💡 Chưa đặt hạn — còn thiếu {formatCurrency(remaining)}. Hãy đặt deadline để nhận gợi ý
          mỗi tháng.
        </Text>
      </View>
    );
  }

  const s = GoalService.suggestMonthlyContribution(goal, todayStr);

  if (s.isOverdue) {
    return (
      <View style={[styles.box, styles.overdueBox]}>
        <Text style={[styles.text, styles.overdueText]}>
          ⏰ Đã quá hạn ({goal.deadline}) — còn thiếu {formatCurrency(GoalService.getRemaining(goal))}.
          Hãy gia hạn hoặc góp ngay toàn bộ.
        </Text>
      </View>
    );
  }

  const urgent = s.monthlyNeeded >= 10000000;
  return (
    <View style={[styles.box, urgent ? styles.urgentBox : styles.normalBox]}>
      <Text style={[styles.text, urgent && styles.urgentText]}>
        📆 Còn {s.monthsLeft} tháng (đến {goal.deadline}) · Cần tích lũy{" "}
        <Text style={styles.bold}>{formatCurrency(s.monthlyNeeded)}/tháng</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: -4,
    marginBottom: Spacing.md,
  },
  normalBox: {
    backgroundColor: "#E4F1EC",
  },
  urgentBox: {
    backgroundColor: "#FBF1DA",
  },
  overdueBox: {
    backgroundColor: "#FEE2E2",
  },
  neutralBox: {
    backgroundColor: "#F1EFE9",
  },
  doneBox: {
    backgroundColor: "#E6F6EC",
  },
  text: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 17,
  },
  bold: {
    fontWeight: "800",
  },
  urgentText: {
    color: "#8A5A00",
  },
  overdueText: {
    color: Colors.danger,
    fontWeight: "600",
  },
  doneText: {
    color: Colors.success,
    fontWeight: "700",
  },
});
