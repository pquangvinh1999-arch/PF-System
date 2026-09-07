import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../constants/theme";
import { Debt } from "../types";
import { Card } from "./Card";
import { Badge } from "./Badge";

interface DebtRowProps {
  debt: Debt;
  priorityOrder?: number;
  strategyLabel?: string;
  onPress?: (debt: Debt) => void;
}

export const DebtRow: React.FC<DebtRowProps> = ({ debt, priorityOrder, strategyLabel, onPress }) => {
  const formatCurrency = (v: number) => new Intl.NumberFormat("vi-VN").format(Math.round(v)) + " đ";

  return (
    <TouchableOpacity onPress={() => onPress?.(debt)} activeOpacity={0.85}>
      <Card style={styles.container}>
        <View style={styles.header}>
          <View style={styles.left}>
            {priorityOrder !== undefined && (
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{priorityOrder}</Text>
              </View>
            )}
            <View style={styles.titleCol}>
              <Text style={styles.name} numberOfLines={1}>
                💳 {debt.name}
              </Text>
              <Text style={styles.sub}>
                Lãi {debt.interest_rate}%/năm · Trả tối thiểu {formatCurrency(Number(debt.min_payment))}/th
                {strategyLabel ? ` · ${strategyLabel}` : ""}
              </Text>
            </View>
          </View>
          <Badge label={formatCurrency(Number(debt.balance))} type="danger" />
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  rankText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  titleCol: {
    flex: 1,
  },
  name: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
