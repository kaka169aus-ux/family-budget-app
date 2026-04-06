import { Transaction } from "./types";

export function generateSampleData(): Omit<Transaction, "id" | "created_at">[] {
  const now = new Date();
  const items: Omit<Transaction, "id" | "created_at">[] = [];

  const addTx = (
    daysAgo: number,
    amt: number,
    cat: string,
    desc: string,
    person: string,
    type: Transaction["type"] = "expense"
  ) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    items.push({
      date: d.toISOString().slice(0, 10),
      amount: amt,
      category: cat,
      description: desc,
      person,
      type,
    });
  };

  // ─── 本月 (Month 0) ───
  addTx(2, 8500, "income", "月薪 - 公司A", "我", "income");
  addTx(1, 7200, "income", "月薪 - 公司B", "另一半", "income");
  addTx(3, 185, "groceries", "Woolworths 周末采购", "我");
  addTx(5, 220, "groceries", "Coles 食品", "另一半");
  addTx(4, 95, "utilities", "Origin Energy 电费", "我");
  addTx(6, 78, "utilities", "AGL 煤气费", "我");
  addTx(7, 65, "dining", "外卖 Uber Eats", "另一半");
  addTx(8, 120, "dining", "周末餐厅聚餐", "我");
  addTx(10, 45, "transport", "Opal 公交充值", "另一半");
  addTx(9, 89, "entertainment", "Steam 游戏", "我");
  addTx(11, 299, "entertainment", "AirPods 冲动消费", "另一半");
  addTx(3, 2000, "investment", "Vanguard ETF 定投", "我", "investment");
  addTx(4, 1500, "savings", "储蓄账户转入", "另一半", "savings");
  addTx(12, 2100, "housing", "房租", "我");
  addTx(6, 35, "transport", "加油 Shell", "我");
  addTx(14, 150, "health", "牙科检查", "另一半");

  // ─── 上月 (Month 1) ───
  addTx(32, 8500, "income", "月薪 - 公司A", "我", "income");
  addTx(31, 7200, "income", "月薪 - 公司B", "另一半", "income");
  addTx(35, 210, "groceries", "Woolworths", "我");
  addTx(38, 195, "groceries", "Aldi 采购", "另一半");
  addTx(36, 102, "utilities", "电费", "我");
  addTx(40, 85, "dining", "餐厅", "另一半");
  addTx(42, 55, "transport", "Uber", "我");
  addTx(44, 1800, "travel", "周末短途旅行 Blue Mountains", "我");
  addTx(44, 650, "travel", "Airbnb 住宿", "另一半");
  addTx(33, 2000, "investment", "Vanguard ETF", "我", "investment");
  addTx(34, 1500, "savings", "储蓄", "另一半", "savings");
  addTx(37, 2100, "housing", "房租", "我");
  addTx(39, 68, "entertainment", "Netflix+Spotify", "另一半");
  addTx(41, 42, "health", "药房买药", "我");

  // ─── 前月 (Month 2) ───
  addTx(62, 8500, "income", "月薪", "我", "income");
  addTx(61, 7200, "income", "月薪", "另一半", "income");
  addTx(65, 240, "groceries", "Costco 大采购", "我");
  addTx(66, 180, "groceries", "Coles", "另一半");
  addTx(67, 98, "utilities", "水电", "我");
  addTx(68, 75, "utilities", "煤气", "另一半");
  addTx(70, 150, "dining", "生日聚餐", "我");
  addTx(71, 42, "transport", "加油", "另一半");
  addTx(72, 580, "entertainment", "Switch 游戏机 冲动消费", "我");
  addTx(63, 2000, "investment", "ETF", "我", "investment");
  addTx(64, 1000, "savings", "储蓄", "另一半", "savings");
  addTx(69, 2100, "housing", "房租", "我");
  addTx(73, 88, "dining", "周末烧烤", "另一半");

  return items;
}
