import { TransactionType, AccountType, BudgetGroup } from "../types";

export interface CategoryItem {
  id: string;
  name: string;
  type: TransactionType;
  budgetGroup?: BudgetGroup | "business";
  icon: string;
  color: string;
  accountScope: "personal" | "business" | "both";
  description?: string;
}

export const CATEGORIES: CategoryItem[] = [
  // --- EXPENSE: Thiết yếu (Needs - 50%) ---
  {
    id: "cat_food",
    name: "Ăn uống",
    type: "expense",
    budgetGroup: "needs",
    icon: "🍜",
    color: "#E0972B",
    accountScope: "personal",
    description: "Cơm trưa, đi chợ, siêu thị, thực phẩm gia đình",
  },
  {
    id: "cat_housing",
    name: "Nhà ở & Tiện ích",
    type: "expense",
    budgetGroup: "needs",
    icon: "🏠",
    color: "#0F6E5B",
    accountScope: "personal",
    description: "Tiền thuê nhà, điện, nước, internet, phí dịch vụ",
  },
  {
    id: "cat_transport",
    name: "Đi lại",
    type: "expense",
    budgetGroup: "needs",
    icon: "🛵",
    color: "#4A5FD1",
    accountScope: "personal",
    description: "Xăng xe, bảo dưỡng, gửi xe, Grab / xe công nghệ",
  },
  {
    id: "cat_health",
    name: "Y tế & Sức khỏe",
    type: "expense",
    budgetGroup: "needs",
    icon: "💊",
    color: "#D64545",
    accountScope: "personal",
    description: "Khám bệnh, thuốc men, bảo hiểm y tế",
  },
  {
    id: "cat_education",
    name: "Giáo dục / Con cái",
    type: "expense",
    budgetGroup: "needs",
    icon: "📚",
    color: "#3B82F6",
    accountScope: "personal",
    description: "Học phí, sách vở, sữa và tã cho con",
  },

  // --- EXPENSE: Mong muốn / Cá nhân (Wants - 30%) ---
  {
    id: "cat_entertainment",
    name: "Giải trí & Du lịch",
    type: "expense",
    budgetGroup: "wants",
    icon: "🎬",
    color: "#EC4899",
    accountScope: "personal",
    description: "Xem phim, nghỉ dưỡng, du lịch gia đình",
  },
  {
    id: "cat_shopping",
    name: "Mua sắm cá nhân",
    type: "expense",
    budgetGroup: "wants",
    icon: "🛍️",
    color: "#8B5CF6",
    accountScope: "personal",
    description: "Quần áo, mỹ phẩm, đồ gia dụng tùy thích",
  },
  {
    id: "cat_coffee_social",
    name: "Cafe & Hẹn hò",
    type: "expense",
    budgetGroup: "wants",
    icon: "☕",
    color: "#D4A72C",
    accountScope: "personal",
    description: "Cà phê bạn bè, liên hoan tiệc tùng",
  },
  {
    id: "cat_other_expense",
    name: "Chi tiêu khác",
    type: "expense",
    budgetGroup: "wants",
    icon: "💳",
    color: "#6B7280",
    accountScope: "personal",
    description: "Các khoản phát sinh cá nhân nhỏ lẻ khác",
  },

  // --- EXPENSE: Tiết kiệm & Đầu tư (Savings - 20%) ---
  {
    id: "cat_emergency_fund",
    name: "Quỹ khẩn cấp",
    type: "expense",
    budgetGroup: "savings",
    icon: "🛡️",
    color: "#1E8E5A",
    accountScope: "personal",
    description: "Trích tiết kiệm dự phòng 3-6 tháng chi phí",
  },
  {
    id: "cat_investment_expense",
    name: "Tích lũy & Đầu tư",
    type: "expense",
    budgetGroup: "savings",
    icon: "📈",
    color: "#10B981",
    accountScope: "personal",
    description: "Mua vàng, chứng chỉ quỹ, gửi tiết kiệm sinh lãi",
  },

  // --- EXPENSE: Kinh doanh (Business Account) ---
  {
    id: "cat_cogs",
    name: "Giá vốn / Nhập hàng",
    type: "expense",
    budgetGroup: "business",
    icon: "📦",
    color: "#4A5FD1",
    accountScope: "business",
    description: "Nhập nguyên vật liệu, nguồn hàng cho shop",
  },
  {
    id: "cat_opex",
    name: "Vận hành kinh doanh",
    type: "expense",
    budgetGroup: "business",
    icon: "⚙️",
    color: "#6366F1",
    accountScope: "business",
    description: "Phí ship, đóng gói, phần mềm bán hàng, hosting",
  },
  {
    id: "cat_marketing",
    name: "Marketing & Bán hàng",
    type: "expense",
    budgetGroup: "business",
    icon: "📢",
    color: "#F59E0B",
    accountScope: "business",
    description: "Chạy quảng cáo Facebook, Shopee Ads, livestream",
  },
  {
    id: "cat_tax_business",
    name: "Thuế & Phí nhà nước",
    type: "expense",
    budgetGroup: "business",
    icon: "🏛️",
    color: "#EF4444",
    accountScope: "business",
    description: "Thuế hộ kinh doanh, thuế môn bài, VAT",
  },
  {
    id: "cat_biz_other",
    name: "Chi phí shop khác",
    type: "expense",
    budgetGroup: "business",
    icon: "🧾",
    color: "#64748B",
    accountScope: "business",
    description: "Các khoản phát sinh của hoạt động kinh doanh",
  },

  // --- INCOME: Thu nhập ---
  {
    id: "cat_salary",
    name: "Lương cố định",
    type: "income",
    icon: "💵",
    color: "#1E8E5A",
    accountScope: "personal",
    description: "Lương tháng từ văn phòng / công ty",
  },
  {
    id: "cat_biz_revenue",
    name: "Doanh thu Shop Online",
    type: "income",
    icon: "🏪",
    color: "#4A5FD1",
    accountScope: "business",
    description: "Doanh thu bán hàng từ shop / cửa hàng",
  },
  {
    id: "cat_bonus",
    name: "Tiền thưởng & Hoa hồng",
    type: "income",
    icon: "🎁",
    color: "#D4A72C",
    accountScope: "personal",
    description: "Thưởng quý, KPI, hoa hồng bán hàng",
  },
  {
    id: "cat_investment_income",
    name: "Lợi nhuận đầu tư",
    type: "income",
    icon: "📈",
    color: "#10B981",
    accountScope: "both",
    description: "Cổ tức, lãi suất tiết kiệm, lợi nhuận tài chính",
  },
  {
    id: "cat_other_income",
    name: "Thu nhập khác",
    type: "income",
    icon: "💰",
    color: "#0F6E5B",
    accountScope: "both",
    description: "Các khoản thu không cố định khác",
  },

  // --- TRANSFER: Chuyển khoản ---
  {
    id: "cat_internal_transfer",
    name: "Chuyển tiền nội bộ",
    type: "transfer",
    icon: "⇄",
    color: "#4A5FD1",
    accountScope: "both",
    description: "Điều chuyển số dư giữa các ví",
  },
  {
    id: "cat_owner_pay",
    name: "Rút lợi nhuận / Lương chủ shop",
    type: "transfer",
    icon: "👛",
    color: "#0F6E5B",
    accountScope: "both",
    description: "Chuyển từ ví kinh doanh sang ví cá nhân theo Profit First",
  },
  {
    id: "cat_capital_injection",
    name: "Cấp vốn kinh doanh",
    type: "transfer",
    icon: "💼",
    color: "#D4A72C",
    accountScope: "both",
    description: "Bổ sung vốn lưu động từ ví cá nhân sang ví shop",
  },
];

export const getCategoriesByType = (
  type: TransactionType,
  accountType?: AccountType
): CategoryItem[] => {
  return CATEGORIES.filter((cat) => {
    if (cat.type !== type) return false;
    if (!accountType) return true;
    return cat.accountScope === "both" || cat.accountScope === accountType;
  });
};

export const getCategoryByName = (name: string): CategoryItem | undefined => {
  return CATEGORIES.find((cat) => cat.name === name);
};

export const getCategoryIcon = (name: string): string => {
  const cat = getCategoryByName(name);
  if (cat) return cat.icon;
  // Fallback
  if (name.includes("Ăn") || name.includes("Cơm")) return "🍜";
  if (name.includes("Nhà") || name.includes("Điện")) return "🏠";
  if (name.includes("Xe") || name.includes("Đi lại")) return "🛵";
  if (name.includes("Lương")) return "💵";
  if (name.includes("Shop") || name.includes("Hàng")) return "📦";
  if (name.includes("Chuyển")) return "⇄";
  return "💳";
};

export const getCategoryColor = (name: string): string => {
  const cat = getCategoryByName(name);
  return cat ? cat.color : "#0F6E5B";
};

export const getCategoryBudgetGroup = (name: string): BudgetGroup | "business" | undefined => {
  const cat = getCategoryByName(name);
  return cat?.budgetGroup;
};
