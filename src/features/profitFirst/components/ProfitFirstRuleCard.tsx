import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { Card, Badge } from "../../../components";
import { ProfitFirstRule } from "../../../types";
import { PROFIT_FIRST_BUCKET_META } from "../../../services/profitFirstService";

interface Props {
  rules: ProfitFirstRule[];
  onPressConfigure: () => void;
}

export const ProfitFirstRuleCard: React.FC<Props> = ({ rules, onPressConfigure }) => {
  // Sắp xếp rules theo thứ tự chuẩn Profit First
  const sortedRules = [...rules].sort((a, b) => {
    const orderA = PROFIT_FIRST_BUCKET_META[a.category]?.orderIndex ?? 99;
    const orderB = PROFIT_FIRST_BUCKET_META[b.category]?.orderIndex ?? 99;
    return orderA - orderB;
  });

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.headerIcon}>💎</Text>
          <View>
            <Text style={styles.title}>Quy Tắc Profit First</Text>
            <Text style={styles.subTitle}>Tự động trích quỹ khi phát sinh doanh thu</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.configBtn}
          onPress={onPressConfigure}
          activeOpacity={0.7}
        >
          <Text style={styles.configBtnText}>⚙️ Cấu hình %</Text>
        </TouchableOpacity>
      </View>

      {/* Thanh phân bổ tỷ lệ ngang (Stacked Bar) */}
      <View style={styles.stackedBar}>
        {sortedRules.map((rule) => {
          const meta = PROFIT_FIRST_BUCKET_META[rule.category];
          const color = meta?.color || Colors.primary;
          const widthPct = Math.max(rule.percentage, 0);

          if (widthPct === 0) return null;

          return (
            <View
              key={rule.category}
              style={[
                styles.barSegment,
                { width: `${widthPct}%`, backgroundColor: color },
              ]}
            >
              {widthPct >= 10 && (
                <Text style={styles.barText}>{widthPct}%</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Danh sách 5 quỹ theo thứ tự Profit First */}
      <View style={styles.bucketsGrid}>
        {sortedRules.map((rule) => {
          const meta = PROFIT_FIRST_BUCKET_META[rule.category];
          const color = meta?.color || Colors.primary;
          const icon = meta?.icon || "💰";

          return (
            <View key={rule.category} style={styles.bucketItem}>
              <View style={styles.bucketItemLeft}>
                <View style={[styles.bucketColorDot, { backgroundColor: color }]} />
                <Text style={styles.bucketIcon}>{icon}</Text>
                <View style={styles.bucketTextWrap}>
                  <Text style={styles.bucketName}>{meta?.title || rule.name}</Text>
                  <Text style={styles.bucketDesc}>{meta?.shortDesc}</Text>
                </View>
              </View>
              <Badge
                label={`${rule.percentage}%`}
                type="primary"
                style={[styles.badge, { backgroundColor: color + "20" }]}
              />
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.businessTag + "30",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  headerIcon: {
    fontSize: 22,
  },
  title: {
    ...Typography.bodyMedium,
    fontWeight: "700",
    color: Colors.businessTag,
  },
  subTitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  configBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.businessTag + "15",
  },
  configBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.businessTag,
  },
  stackedBar: {
    flexDirection: "row",
    height: 20,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    backgroundColor: "#ECEAE4",
    marginVertical: Spacing.sm,
  },
  barSegment: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  barText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bucketsGrid: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  bucketItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  bucketItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  bucketColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bucketIcon: {
    fontSize: 14,
  },
  bucketTextWrap: {
    flex: 1,
  },
  bucketName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  bucketDesc: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
