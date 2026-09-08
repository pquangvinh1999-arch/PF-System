import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Colors, Spacing, Typography, BorderRadius } from "../../../constants/theme";
import { Card } from "../../../components";
import { BiometricService } from "../../../services/biometricService";

interface LockScreenProps {
  pinHash: string;
  biometricEnabled: boolean;
  onUnlock: () => void;
}

/**
 * Task 7.1 — Màn hình khóa app: PIN trước, sinh trắc học (nếu bật).
 */
export const LockScreen: React.FC<LockScreenProps> = ({ pinHash, biometricEnabled, onUnlock }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handlePin = () => {
    setError("");
    if (!BiometricService.verifyPin(pin.trim(), pinHash)) {
      setError("Sai mã PIN. Vui lòng thử lại.");
      return;
    }
    onUnlock();
  };

  const handleBiometric = async () => {
    setBusy(true);
    setError("");
    try {
      const ok = await BiometricService.authenticate();
      if (ok) onUnlock();
      else setError("Xác thực sinh trắc học thất bại — hãy dùng mã PIN.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <Card style={styles.card}>
        <Text style={styles.logo}>🔒</Text>
        <Text style={styles.title}>Tài Chính Nhà Bơ</Text>
        <Text style={styles.sub}>Nhập mã PIN để mở khóa dữ liệu tài chính</Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          secureTextEntry
          maxLength={6}
          placeholder="••••"
          placeholderTextColor={Colors.textSecondary}
          onSubmitEditing={handlePin}
        />
        {Boolean(error) && <Text style={styles.error}>⚠️ {error}</Text>}
        <TouchableOpacity style={styles.unlockBtn} onPress={handlePin} activeOpacity={0.85}>
          <Text style={styles.unlockText}>Mở khóa</Text>
        </TouchableOpacity>
        {biometricEnabled && (
          <TouchableOpacity style={styles.bioBtn} onPress={handleBiometric} disabled={busy} activeOpacity={0.85}>
            <Text style={styles.bioText}>
              {busy ? "Đang xác thực..." : "👆 Dùng Face ID / Vân tay"}
            </Text>
          </TouchableOpacity>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg, justifyContent: "center", padding: Spacing.xl },
  card: { padding: Spacing.xl, alignItems: "center" },
  logo: { fontSize: 48, marginBottom: Spacing.sm },
  title: { ...Typography.h2, color: Colors.textPrimary },
  sub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.md, textAlign: "center" },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.button,
    padding: Spacing.md,
    fontSize: 22,
    textAlign: "center",
    letterSpacing: 8,
    color: Colors.textPrimary,
    backgroundColor: Colors.bg,
  },
  error: { color: Colors.danger, fontSize: 12, fontWeight: "600", marginTop: Spacing.sm },
  unlockBtn: { width: "100%", marginTop: Spacing.md, backgroundColor: Colors.primary, borderRadius: BorderRadius.button, paddingVertical: Spacing.md, alignItems: "center" },
  unlockText: { color: "#FFFFFF", fontWeight: "700" },
  bioBtn: { marginTop: Spacing.sm, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  bioText: { color: Colors.primary, fontWeight: "700", fontSize: 13 },
});
