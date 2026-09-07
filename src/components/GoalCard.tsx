import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../constants/theme";
import { Goal } from "../types";
import { GoalService, GOAL_TYPE_META } from "../services/goalService";
import { Badge } from "./Badge";
import { Card } from "./Card";

interface GoalCardProps {
  goal: Goal;
  onPress?: (goal: Goal) => void;
  onContribute?: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onPress, onContribute }) => {
  const meta = GOAL_TYPE_META[goal.type];
  const progress = GoalService.calculateProgress(goal);
  const remaining = GoalService.getRemaining(goal);
  const status = GoalService.getStatus(goal);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN").format(val) + " đ";

  const getProgressColor = () => {
    if (status === "completed") return Colors.success;
    if (progress >= 70) return Colors.primary;
    if (progress >= 30) return Colors.accent;
    return Colors.warning;
  };

  return (
    <TouchableOpacity onPress={() => onPress?.(goal)} activeOpacity={0.85}>
      <Card style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.icon}>{meta.icon}</Text>
            <View style={styles.titleCol}>
              <Text style={styles.name} numberOfLines={1}>
                {goal.name}
              </Text>
              <Text style={styles.typeLabel}>
                {meta.label}
                {goal.deadline ? ` · ⏰ ${goal.deadline}` : ""}
              </Text>
            </View>
          </View>
          {status === "completed" ? (
            <Badge label="Hoàn thành" type="success" />
          ) : status === "on_track" ? (
            <Badge label={`${progress}%`} type="primary" />
          ) : (
            <Badge label="Mới" type="warning" />
          )}
        </View>

        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${Math.min(progress, 100)}%`, backgroundColor: getProgressColor() },
            ]}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.progressText}>
            Đã tích lũy:{" "}
            <Text style={styles.boldText}>{formatCurrency(Number(goal.current_amount))}</Text>
            {" / "}
            {formatCurrency(Number(goal.target_amount))}
          </Text>
          <Text style={[styles.remainingText, status === "completed" && styles.doneText]}>
            {status === "completed"
              ? "🎉 Đạt mục tiêu!"
              : `Còn thiếu: ${formatCurrency(remaining)}`}
          </Text>
        </View>

        {onContribute && status !== "completed" && (
          <TouchableOpacity
            style={styles.contributeBtn}
            onPress={() => onContribute(goal)}
            activeOpacity={0.8}
          >
            <Text style={styles.contributeText}>+ Góp thêm</Text>
          </TouchableOpacity>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
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
  titleCol: {
    flex: 1,
  },
  name: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  typeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 1,
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
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  boldText: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  remainingText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  doneText: {
    color: Colors.success,
    fontWeight: "700",
  },
  contributeBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  contributeText: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.primary,
  },
});
