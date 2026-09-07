/**
 * DESIGN TOKENS cho app "Vén" - Tuân thủ tuyệt đối DESIGN.md
 */

export const Colors = {
  // Màu chính
  primary: "#0F6E5B",        // Xanh ngọc đậm - tin cậy, tăng trưởng
  primaryLight: "#E4F1EC",
  accent: "#D4A72C",         // Vàng đồng - thịnh vượng, tiết kiệm
  accentLight: "#FBF1DA",

  // Trạng thái
  success: "#1E8E5A",
  warning: "#E0972B",
  danger: "#D64545",

  // Nền & Chữ
  bg: "#F7F5F0",             // Nền ấm, không trắng lạnh
  surface: "#FFFFFF",
  textPrimary: "#1C1C1C",
  textSecondary: "#6B6B6B",
  border: "#E7E4DD",

  // Phân loại tài khoản
  businessTag: "#4A5FD1",    // Xanh tím tách biệt cho Business Account
  personalTag: "#0F6E5B",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  sm: 8,
  button: 12,
  card: 16,
  bottomSheet: 24,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  bodyLarge: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22 },
  bodyMedium: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
  caption: { fontSize: 11, fontWeight: "500" as const, lineHeight: 14 },
};

export const Shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modal: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
