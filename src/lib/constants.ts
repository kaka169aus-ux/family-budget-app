import { Category } from "./types";

export const CATEGORIES: Category[] = [
  { id: "housing", label: "住房", icon: "🏠", color: "#6C5CE7" },
  { id: "utilities", label: "水电煤气", icon: "💡", color: "#FDCB6E" },
  { id: "groceries", label: "食品采购", icon: "🛒", color: "#00B894" },
  { id: "dining", label: "外出就餐", icon: "🍽️", color: "#E17055" },
  { id: "transport", label: "交通出行", icon: "🚗", color: "#0984E3" },
  { id: "health", label: "医疗健康", icon: "💊", color: "#D63031" },
  { id: "entertainment", label: "娱乐消费", icon: "🎮", color: "#E84393" },
  { id: "travel", label: "旅游度假", icon: "✈️", color: "#00CEC9" },
  { id: "investment", label: "投资支出", icon: "📈", color: "#A29BFE" },
  { id: "savings", label: "储蓄转入", icon: "💰", color: "#55EFC4" },
  { id: "income", label: "收入", icon: "💵", color: "#2ECC71" },
  { id: "other", label: "其他", icon: "📦", color: "#B2BEC3" },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

export const AUTO_RULES: { pattern: RegExp; cat: string }[] = [
  { pattern: /woolworths|coles|aldi|costco|超市|菜市/i, cat: "groceries" },
  { pattern: /origin|agl|energy|电费|水费|煤气|gas bill/i, cat: "utilities" },
  {
    pattern: /uber eats|doordash|menulog|mcdonald|kfc|餐厅|外卖|饭店/i,
    cat: "dining",
  },
  {
    pattern: /uber|opal|taxi|公交|地铁|油费|petrol|shell|bp|滴滴/i,
    cat: "transport",
  },
  {
    pattern: /netflix|spotify|steam|游戏|电影|cinema|bilibili/i,
    cat: "entertainment",
  },
  {
    pattern: /qantas|airbnb|booking|酒店|机票|hotel|flight|携程/i,
    cat: "travel",
  },
  { pattern: /pharmacy|医院|doctor|clinic|药|诊所/i, cat: "health" },
  { pattern: /rent|mortgage|房租|房贷|物业/i, cat: "housing" },
  { pattern: /vanguard|etf|stock|基金|股票|invest/i, cat: "investment" },
  { pattern: /salary|工资|payroll|wage|bonus|奖金|收入/i, cat: "income" },
  { pattern: /saving|储蓄|存款/i, cat: "savings" },
];

export const NEED_CATEGORIES = [
  "housing",
  "utilities",
  "groceries",
  "transport",
  "health",
];
export const WANT_CATEGORIES = ["dining", "entertainment", "travel", "other"];

export const DEFAULT_SETTINGS = {
  person1: "我",
  person2: "另一半",
  savingsGoal: 50000,
  currency: "AUD",
};
