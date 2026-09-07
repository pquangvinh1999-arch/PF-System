import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Transaction } from "../types";
import { Colors, Spacing, Typography, BorderRadius } from "../constants/theme";
import { getCategoryIcon, getCategoryColor } from "../constants/categories";

interface TransactionRowProps {
  transaction: Transaction;
  accountName?: string;
  onPress?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  accountName,
  onPress,
  onDelete,
}) => {
  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";
  const isTransfer = transaction.type === "transfer";

  const amountColor = isIncome
    ? Colors.success
    : isExpense
    ? Colors.danger
    : Colors.businessTag;

  const prefix = isIncome ? "+" : isExpense ? "-" : "⇄ ";

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " đ";
  };

  const catIcon = getCategoryIcon(transaction.category);
  const catColor = getCategoryColor(transaction.category);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.container}
      onPress={() => onPress && onPress(transaction)}
    >
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{catIcon}</Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.topLine}>
          <Text style={styles.category} numberOfLines={1}>
            {transaction.category}
          </Text>
          <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1}>
            {prefix}
            {formatCurrency(transaction.amount)}
          </Text>
        </View>

        <View style={styles.bottomLine}>
          <Text style={styles.note} numberOfLines={1}>
            {transaction.note || transaction.date}
          </Text>
          {accountName ? (
            <View style={styles.accountTag}>
              <Text style={styles.accountTagText}>{accountName}</Text>
            </View>
          ) : (
            <Text style={styles.date}>{transaction.date}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  iconText: {
    fontSize: 20,
  },
  infoContainer: {
    flex: 1,
  },
  topLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  category: {
    ...Typography.bodyMedium,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  amount: {
    ...Typography.bodyMedium,
    fontWeight: "700",
  },
  bottomLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  note: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  date: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  accountTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "#EAE8E3",
  },
  accountTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
});
