import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { Badge } from "../../../components";
import { ProfitFirstRule } from "../../../types";
import { ProfitFirstService } from "../../../services/profitFirstService";

interface Props {
  revenueAmount: number;
  rules: ProfitFirstRule[];
  title?: string;
  showStackedBar?: boolean;
}

export const ProfitFirstBreakdown: React.FC<Props> = ({
  revenueAmount,
  rules,
  title = "Phân Bổ Tự Động Profit First",
  showStackedBar = true,
}) => {
  if (revenueAmount <= 0) {
    return null;
  }

  const result = ProfitFirstService.calculateAllocation(revenueAmount, rules);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " đ";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.headerIcon}>💎</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <Badge
          label={`100% = ${formatCurrency(revenueAmount)}`}
          type="business"
        />
      </View>

      {/* Stacked Allocation Bar */}
      {showStackedBar && (
        <View style={styles.stackedBar}>
          {result.allocations.map((item) => {
            const widthPct = Math.max(item.percentage, 0);
            if (widthPct === 0) return null;
            return (
              <View
                key={item.category}
                style={[
                  styles.barSegment,
                  { width: `${widthPct}%`, backgroundColor: item.color },
                ]}
              >
                {widthPct >= 12 && (
                  <Text style={styles.segmentText}>{widthPct}%</Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Breakdown Items List */}
      <View style={styles.allocationsList}>
        {result.allocations.map((item) => (
          <View key={item.category} style={styles.allocationRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Text style={styles.itemIcon}>{item.icon}</Text>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.pctBadge}>({item.percentage}%)</Text>
            </View>
            <Text style={[styles.itemAmount, { color: item.color }]}>
              {formatCurrency(item.amount)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.footerNote}>
        💡 Dòng tiền tự động trích trước Lợi nhuận và Thuế trước khi phân bổ vào chi phí vận hành.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.businessTag + "08",
    borderRadius: BorderRadius.card,
    borderWidth: 1.5,
    borderColor: Colors.businessTag + "30",
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerIcon: {
    fontSize: 18,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: "700",
    color: Colors.businessTag,
  },
  stackedBar: {
    flexDirection: "row",
    height: 18,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    backgroundColor: "#ECEAE4",
    marginVertical: Spacing.xs,
  },
  barSegment: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  segmentText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  allocationsList: {
    marginTop: Spacing.xs,
    gap: 4,
  },
  allocationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemIcon: {
    fontSize: 14,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  pctBadge: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  itemAmount: {
    fontSize: 12,
    fontWeight: "700",
  },
  footerNote: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: Spacing.xs,
    lineHeight: 14,
  },
});
