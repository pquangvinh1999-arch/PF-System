import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Colors, Spacing, Typography } from "../../../constants/theme";
import { useAppStore } from "../../../store/useAppStore";
import { Goal } from "../../../types";
import { GoalCard } from "../../../components/GoalCard";
import { GoalSuggestionBar } from "../../../components/GoalSuggestionBar";
import { EmergencyFundCard } from "../../../components/EmergencyFundCard";
import { GoalFormModal } from "../components/GoalFormModal";
import { EmergencyFundService } from "../../../services/emergencyFundService";
import { Card } from "../../../components";

export const GoalsScreen: React.FC = () => {
  const goals = useAppStore((s) => s.goals);
  const transactions = useAppStore((s) => s.transactions);
  const addGoal = useAppStore((s) => s.addGoal);
  const updateGoal = useAppStore((s) => s.updateGoal);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [contributing, setContributing] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<"all" | Goal["type"]>("all");

  const deleteGoal = useAppStore((s) => s.deleteGoal);

  const filtered = useMemo(
    () => (filter === "all" ? goals : goals.filter((g) => g.type === filter)),
    [goals, filter]
  );

  const totals = useMemo(() => {
    const target = goals.reduce((s, g) => s + Number(g.target_amount), 0);
    const current = goals.reduce((s, g) => s + Number(g.current_amount), 0);
    const pct = target > 0 ? Math.round((current / target) * 100) : 0;
    return { target, current, pct };
  }, [goals]);

  const formatCurrency = (v: number) => new Intl.NumberFormat("vi-VN").format(v) + " đ";

  const openAdd = () => {
    setEditing(null);
    setContributing(null);
    setModalVisible(true);
  };
  const openEdit = (g: Goal) => {
    setEditing(g);
    setContributing(null);
    setModalVisible(true);
  };
  const openContribute = (g: Goal) => {
    setEditing(null);
    setContributing(g);
    setModalVisible(true);
  };

  const handleDelete = async (g: Goal) => {
    await deleteGoal(g.id);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <EmergencyFundCard
        transactions={transactions}
        goals={goals}
        onApplyTarget={async (targetAmount, months) => {
          const existing = EmergencyFundService.findEmergencyGoal(goals);
          if (existing) {
            await updateGoal(existing.id, { target_amount: Math.round(targetAmount) });
          } else {
            await addGoal({
              name: `Quỹ khẩn cấp ${months} tháng`,
              type: "emergency_fund",
              target_amount: Math.round(targetAmount),
              current_amount: 0,
            });
          }
        }}
      />

      <Card style={styles.summary}>
        <Text style={styles.summaryTitle}>🎯 Tổng tiến độ mục tiêu</Text>
        <Text style={styles.summaryValue}>
          {formatCurrency(totals.current)} / {formatCurrency(totals.target)}
        </Text>
        <Text style={styles.summaryPct}>{totals.pct}% hoàn thành · {goals.length} mục tiêu</Text>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
        {(
          [
            { id: "all", label: "Tất cả" },
            { id: "emergency_fund", label: "🛡️ Khẩn cấp" },
            { id: "short_term", label: "🎯 Ngắn hạn" },
            { id: "mid_term", label: "🚗 Trung hạn" },
            { id: "long_term", label: "🏡 Dài hạn" },
          ] as const
        ).map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.chip, filter === f.id && styles.chipActive]}
            onPress={() => setFilter(f.id as typeof filter)}
          >
            <Text style={[styles.chipText, filter === f.id && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
        <Text style={styles.addBtnText}>+ Thêm mục tiêu mới</Text>
      </TouchableOpacity>

      {filtered.length === 0 ? (
        <Card style={styles.empty}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>Chưa có mục tiêu nào</Text>
          <Text style={styles.emptyDesc}>Tạo mục tiêu đầu tiên: quỹ khẩn cấp, mua xe, du lịch...</Text>
        </Card>
      ) : (
        filtered.map((g) => (
          <View key={g.id}>
            <GoalCard goal={g} onPress={openEdit} onContribute={openContribute} />
            <GoalSuggestionBar goal={g} />
            <TouchableOpacity onPress={() => handleDelete(g)} style={styles.deleteLink}>
              <Text style={styles.deleteText}>Xóa “{g.name}”</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <GoalFormModal
        visible={modalVisible}
        goalToEdit={editing}
        contributeTo={contributing}
        onClose={() => {
          setModalVisible(false);
          setEditing(null);
          setContributing(null);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  summary: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderTopWidth: 3,
    borderTopColor: Colors.primary,
  },
  summaryTitle: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  summaryValue: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.primary,
    marginTop: 4,
  },
  summaryPct: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterBar: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  empty: {
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
  },
  emptyDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  deleteLink: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: Spacing.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteText: {
    fontSize: 11,
    color: Colors.danger,
    fontWeight: "600",
  },
});
