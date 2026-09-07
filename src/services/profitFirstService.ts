import { ProfitFirstRule, ProfitFirstCategory } from "../types";
import { Colors } from "../constants/theme";

export interface ProfitFirstBucketMeta {
  category: ProfitFirstCategory;
  title: string;
  shortDesc: string;
  icon: string;
  color: string;
  orderIndex: number;
}

export const PROFIT_FIRST_BUCKET_META: Record<ProfitFirstCategory, ProfitFirstBucketMeta> = {
  profit: {
    category: "profit",
    title: "Lợi nhuận (Profit)",
    shortDesc: "Trích đầu tiên để tích lũy lợi nhuận kinh doanh",
    icon: "💎",
    color: Colors.success, // #1E8E5A
    orderIndex: 0,
  },
  tax: {
    category: "tax",
    title: "Thuế & Pháp lý (Tax)",
    shortDesc: "Quỹ nghĩa vụ thuế và pháp lý, tránh bị động cuối năm",
    icon: "🏛️",
    color: Colors.danger, // #D64545
    orderIndex: 1,
  },
  owner_pay: {
    category: "owner_pay",
    title: "Lương chủ shop (Owner Pay)",
    shortDesc: "Thu nhập định kỳ chuyển về tài khoản cá nhân",
    icon: "👤",
    color: Colors.primary, // #0F6E5B
    orderIndex: 2,
  },
  opex: {
    category: "opex",
    title: "Vận hành kinh doanh (Opex)",
    shortDesc: "Chi phí duy trì cửa hàng, nhập hàng, marketing",
    icon: "⚙️",
    color: Colors.businessTag, // #4A5FD1
    orderIndex: 3,
  },
  reserve: {
    category: "reserve",
    title: "Quỹ dự phòng (Reserve)",
    shortDesc: "Dự phòng rủi ro biến động doanh thu cho shop",
    icon: "🛡️",
    color: Colors.accent, // #D4A72C
    orderIndex: 4,
  },
};

export interface ProfitFirstPreset {
  id: string;
  name: string;
  description: string;
  percentages: Record<ProfitFirstCategory, number>;
}

export const PROFIT_FIRST_PRESETS: ProfitFirstPreset[] = [
  {
    id: "standard",
    name: "Tiêu chuẩn (Khuyến nghị)",
    description: "Cân đối giữa tích lũy lợi nhuận, chi phí vận hành và lương chủ",
    percentages: {
      profit: 5,
      tax: 15,
      owner_pay: 40,
      opex: 30,
      reserve: 10,
    },
  },
  {
    id: "lean",
    name: "Mô hình tinh gọn / Dịch vụ",
    description: "Phù hợp kinh doanh dịch vụ hoặc chi phí hàng hóa thấp",
    percentages: {
      profit: 10,
      tax: 15,
      owner_pay: 45,
      opex: 20,
      reserve: 10,
    },
  },
  {
    id: "growth",
    name: "Mở rộng & Tái đầu tư",
    description: "Dành cho giai đoạn tăng trưởng cần mở rộng mặt bằng, marketing",
    percentages: {
      profit: 5,
      tax: 15,
      owner_pay: 30,
      opex: 40,
      reserve: 10,
    },
  },
];

export interface AllocationItem {
  category: ProfitFirstCategory;
  title: string;
  icon: string;
  color: string;
  percentage: number;
  amount: number;
  orderIndex: number;
}

export interface RevenueAllocationResult {
  totalRevenue: number;
  allocations: AllocationItem[];
  isValid: boolean;
  totalPercentage: number;
}

export const ProfitFirstService = {
  getBucketMeta(category: ProfitFirstCategory): ProfitFirstBucketMeta {
    return PROFIT_FIRST_BUCKET_META[category];
  },

  validateRules(rules: ProfitFirstRule[]): { isValid: boolean; totalPercentage: number; error?: string } {
    if (!rules || rules.length === 0) {
      return { isValid: false, totalPercentage: 0, error: "Chưa có quy tắc phân bổ." };
    }

    const totalPercentage = rules.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0);
    const roundedTotal = Math.round(totalPercentage * 100) / 100;

    if (roundedTotal !== 100) {
      return {
        isValid: false,
        totalPercentage: roundedTotal,
        error: `Tổng tỷ lệ hiện là ${roundedTotal}%. Vui lòng điều chỉnh để tổng đúng 100%.`,
      };
    }

    for (const r of rules) {
      if (r.percentage < 0) {
        return {
          isValid: false,
          totalPercentage: roundedTotal,
          error: `Tỷ lệ nhóm "${r.name || r.category}" không được âm.`,
        };
      }
    }

    return { isValid: true, totalPercentage: 100 };
  },

  calculateAllocation(
    revenueAmount: number,
    rules: ProfitFirstRule[]
  ): RevenueAllocationResult {
    const { isValid, totalPercentage } = this.validateRules(rules);

    // Sắp xếp theo đúng thứ tự Profit First chuẩn: profit -> tax -> owner_pay -> opex -> reserve
    const sortedRules = [...rules].sort((a, b) => {
      const orderA = PROFIT_FIRST_BUCKET_META[a.category]?.orderIndex ?? 99;
      const orderB = PROFIT_FIRST_BUCKET_META[b.category]?.orderIndex ?? 99;
      return orderA - orderB;
    });

    let allocatedSum = 0;
    const allocations: AllocationItem[] = sortedRules.map((rule, index) => {
      const meta = PROFIT_FIRST_BUCKET_META[rule.category] || {
        title: rule.name || rule.category,
        icon: "💰",
        color: Colors.textSecondary,
        orderIndex: index,
      };

      // Làm tròn số tiền từng quỹ
      let amount = Math.round((revenueAmount * rule.percentage) / 100);
      allocatedSum += amount;

      return {
        category: rule.category,
        title: meta.title,
        icon: meta.icon,
        color: meta.color,
        percentage: rule.percentage,
        amount,
        orderIndex: meta.orderIndex,
      };
    });

    // Điều chỉnh số dư lẻ cuối cùng vào quỹ opex nếu có chênh lệch làm tròn
    const difference = revenueAmount - allocatedSum;
    if (difference !== 0 && allocations.length > 0) {
      const opexItem = allocations.find((a) => a.category === "opex") || allocations[allocations.length - 1];
      opexItem.amount += difference;
    }

    return {
      totalRevenue: revenueAmount,
      allocations,
      isValid,
      totalPercentage,
    };
  },
};
