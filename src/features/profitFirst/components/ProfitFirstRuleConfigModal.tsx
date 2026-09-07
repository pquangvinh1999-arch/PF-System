import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { Button, Badge } from "../../../components";
import { ProfitFirstRule, ProfitFirstCategory } from "../../../types";
import {
  ProfitFirstService,
  PROFIT_FIRST_BUCKET_META,
  PROFIT_FIRST_PRESETS,
} from "../../../services/profitFirstService";

interface Props {
  visible: boolean;
  accountId: string;
  initialRules: ProfitFirstRule[];
  onClose: () => void;
  onSave: (rules: ProfitFirstRule[]) => Promise<void>;
  onReset: () => Promise<void>;
}

export const ProfitFirstRuleConfigModal: React.FC<Props> = ({
  visible,
  accountId,
  initialRules,
  onClose,
  onSave,
  onReset,
}) => {
  const [rules, setRules] = useState<ProfitFirstRule[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("standard");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (visible && initialRules && initialRules.length > 0) {
      setRules([...initialRules]);
    }
  }, [visible, initialRules]);

  const validation = ProfitFirstService.validateRules(rules);

  const handleAdjust = (category: ProfitFirstCategory, delta: number) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.category === category) {
          const newPct = Math.max(0, Math.min(100, (r.percentage || 0) + delta));
          return { ...r, percentage: newPct };
        }
        return r;
      })
    );
    setSelectedPresetId("custom");
  };

  const applyPreset = (presetId: string) => {
    const preset = PROFIT_FIRST_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setRules((prev) =>
      prev.map((r) => ({
        ...r,
        percentage: preset.percentages[r.category] ?? r.percentage,
      }))
    );
    setSelectedPresetId(presetId);
  };

  const handleSave = async () => {
    if (!validation.isValid) {
      Alert.alert("Chưa hợp lệ", validation.error || "Tổng tỷ lệ phải đúng 100%.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(rules);
      onClose();
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể lưu quy tắc.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDefault = async () => {
    setIsSubmitting(true);
    try {
      await onReset();
      setSelectedPresetId("standard");
      onClose();
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể khôi phục.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sắp xếp rules theo thứ tự chuẩn Profit First
  const sortedRules = [...rules].sort((a, b) => {
    const orderA = PROFIT_FIRST_BUCKET_META[a.category]?.orderIndex ?? 99;
    const orderB = PROFIT_FIRST_BUCKET_META[b.category]?.orderIndex ?? 99;
    return orderA - orderB;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.headerIcon}>💎</Text>
              <View>
                <Text style={styles.title}>Cấu Hình Tỷ Lệ Profit First</Text>
                <Text style={styles.subTitle}>Áp dụng tự động cho Ví Kinh Doanh</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Presets */}
            <Text style={styles.sectionHeading}>Gợi ý công thức phân bổ:</Text>
            <View style={styles.presetsRow}>
              {PROFIT_FIRST_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetCard,
                      isSelected && styles.presetCardSelected,
                    ]}
                    onPress={() => applyPreset(preset.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.presetName,
                        isSelected && styles.presetNameSelected,
                      ]}
                    >
                      {preset.name}
                    </Text>
                    <Text style={styles.presetDesc}>{preset.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Total Percentage Bar */}
            <View style={styles.totalBarCard}>
              <View style={styles.totalHeaderRow}>
                <Text style={styles.totalLabel}>Tổng tỷ lệ phân bổ:</Text>
                <Badge
                  label={`${validation.totalPercentage}% / 100%`}
                  type={validation.isValid ? "success" : "danger"}
                />
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(validation.totalPercentage, 100)}%`,
                      backgroundColor: validation.isValid
                        ? Colors.success
                        : Colors.danger,
                    },
                  ]}
                />
              </View>

              {!validation.isValid && (
                <Text style={styles.validationErrorText}>{validation.error}</Text>
              )}
            </View>

            {/* 5 Buckets Slider / Stepper */}
            <Text style={styles.sectionHeading}>Tùy chỉnh 5 quỹ (Thứ tự Profit First):</Text>
            <View style={styles.bucketsList}>
              {sortedRules.map((rule) => {
                const meta = PROFIT_FIRST_BUCKET_META[rule.category];
                const color = meta?.color || Colors.primary;

                return (
                  <View key={rule.category} style={styles.bucketRow}>
                    <View style={styles.bucketMetaWrap}>
                      <View style={[styles.bulletDot, { backgroundColor: color }]} />
                      <Text style={styles.rowIcon}>{meta?.icon}</Text>
                      <View style={styles.bucketText}>
                        <Text style={styles.bucketTitle}>
                          {meta?.title || rule.name}
                        </Text>
                        <Text style={styles.bucketShortDesc}>
                          {meta?.shortDesc}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.stepperWrap}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleAdjust(rule.category, -5)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepBtnText}>-5%</Text>
                      </TouchableOpacity>

                      <View style={styles.pctDisplay}>
                        <Text style={styles.pctText}>{rule.percentage}%</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleAdjust(rule.category, +5)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepBtnText}>+5%</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Explanatory note */}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={styles.infoText}>
                Nguyên tắc Profit First: Trích Lợi nhuận & Thuế ngay khi nhận doanh thu trước khi chi tiêu vận hành, đảm bảo shop luôn sinh lời và an toàn tài chính.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Button
              title={isSubmitting ? "Đang xử lý..." : "Mặc định"}
              variant="outline"
              onPress={handleResetDefault}
              disabled={isSubmitting}
              style={styles.footerSecondaryBtn}
            />
            <Button
              title={isSubmitting ? "Đang lưu..." : "Lưu quy tắc"}
              variant="primary"
              disabled={!validation.isValid || isSubmitting}
              onPress={handleSave}
              style={styles.footerPrimaryBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.bottomSheet,
    borderTopRightRadius: BorderRadius.bottomSheet,
    maxHeight: "90%",
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerIcon: {
    fontSize: 26,
  },
  title: {
    ...Typography.h3,
    color: Colors.businessTag,
  },
  subTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 22,
    color: Colors.textSecondary,
    fontWeight: "700",
    padding: Spacing.xs,
  },
  body: {
    marginVertical: Spacing.xs,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  presetsRow: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  presetCard: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  presetCardSelected: {
    borderColor: Colors.businessTag,
    backgroundColor: Colors.businessTag + "10",
  },
  presetName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  presetNameSelected: {
    color: Colors.businessTag,
  },
  presetDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  totalBarCard: {
    backgroundColor: "#F8F7F4",
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#ECEAE4",
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: 6,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  validationErrorText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.danger,
    marginTop: 2,
  },
  bucketsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  bucketRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.sm,
    backgroundColor: Colors.bg,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bucketMetaWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  bulletDot: {
    width: 6,
    height: 18,
    borderRadius: 3,
  },
  rowIcon: {
    fontSize: 16,
  },
  bucketText: {
    flex: 1,
  },
  bucketTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  bucketShortDesc: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stepBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  stepBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  pctDisplay: {
    minWidth: 42,
    alignItems: "center",
  },
  pctText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.businessTag,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: Colors.businessTag + "10",
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    gap: Spacing.xs,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: Colors.businessTag,
    lineHeight: 16,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerSecondaryBtn: {
    flex: 1,
  },
  footerPrimaryBtn: {
    flex: 2,
  },
});
