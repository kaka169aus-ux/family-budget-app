import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBudget } from "../../src/context/BudgetContext";
import Card from "../../src/components/Card";
import SectionTitle from "../../src/components/SectionTitle";
import ProgressBar from "../../src/components/ProgressBar";
import MonthNavigator from "../../src/components/MonthNavigator";
import { Colors, Spacing, BorderRadius } from "../../src/lib/theme";
import { fmtMoney } from "../../src/lib/utils";

export default function AdviceScreen() {
  const data = useBudget();

  // Budget rules
  const budgetRules = [
    {
      label: "必需开销",
      pct: data.needsPct,
      target: 50,
      color: Colors.blue,
      actual: data.needs,
      desc: "住房、水电、食品、交通、医疗",
    },
    {
      label: "弹性消费",
      pct: data.wantsPct,
      target: 30,
      color: Colors.amber,
      actual: data.wants,
      desc: "外出就餐、娱乐、旅游、其他",
    },
    {
      label: "储蓄投资",
      pct: data.savPct,
      target: 20,
      color: Colors.green,
      actual: data.savInv,
      desc: "投资定投、储蓄存款",
    },
  ];

  // Smart advices
  const advices: { icon: string; color: string; text: string }[] = [];

  if (data.catBreakdown.length > 0) {
    const top = data.catBreakdown[0];
    const pct = data.totalExpense > 0 ? ((top.value / data.totalExpense) * 100).toFixed(0) : "0";
    advices.push({
      icon: "🔍",
      color: Colors.amber,
      text: `本月最大支出类别：${top.icon} ${top.label}（${fmtMoney(top.value)}），占总支出的 ${pct}%`,
    });
  }

  // Compare dining with prev month
  if (data.prevTxns.length > 0) {
    const prevDining = data.prevTxns
      .filter((t) => t.category === "dining")
      .reduce((s, t) => s + t.amount, 0);
    const curDining = data.monthTxns
      .filter((t) => t.category === "dining")
      .reduce((s, t) => s + t.amount, 0);
    if (curDining > prevDining * 1.2 && curDining > 0 && prevDining > 0) {
      const change = (((curDining - prevDining) / prevDining) * 100).toFixed(0);
      advices.push({
        icon: "🍽️",
        color: Colors.red,
        text: `外出就餐支出较上月增长 ${change}%，建议控制在 ${fmtMoney(prevDining)} 以内`,
      });
    }
  }

  // Entertainment check
  const entAmt = data.monthTxns
    .filter((t) => t.category === "entertainment")
    .reduce((s, t) => s + t.amount, 0);
  if (entAmt > data.totalIncome * 0.1 && data.totalIncome > 0) {
    advices.push({
      icon: "🎮",
      color: Colors.red,
      text: `娱乐/冲动消费已占收入的 ${((entAmt / data.totalIncome) * 100).toFixed(0)}%，建议设定每月预算上限`,
    });
  }

  // Savings rate
  if (data.savPct < 20) {
    advices.push({
      icon: "💰",
      color: Colors.amber,
      text: `储蓄投资比例（${data.savPct}%）低于建议的 20%，建议增加每月定投金额`,
    });
  } else {
    advices.push({
      icon: "🌟",
      color: Colors.green,
      text: `储蓄投资比例（${data.savPct}%）达标！继续保持，你们的财务习惯很棒`,
    });
  }

  // Emergency fund
  const emergencyTarget = data.totalExpense * 6;
  if (data.totalSaved < emergencyTarget && emergencyTarget > 0) {
    advices.push({
      icon: "🛡️",
      color: Colors.blue,
      text: `建议建立 ${fmtMoney(emergencyTarget)} 的应急基金（6个月支出），当前还差 ${fmtMoney(emergencyTarget - data.totalSaved)}`,
    });
  }

  // Balance warning
  if (data.balance < 0) {
    advices.push({
      icon: "⚠️",
      color: Colors.red,
      text: `本月出现赤字 ${fmtMoney(Math.abs(data.balance))}，请检查是否有不必要的大额支出`,
    });
  }

  // Person comparison advice
  const p1Expense = data.personData[0]?.expense || 0;
  const p2Expense = data.personData[1]?.expense || 0;
  if (p1Expense > 0 && p2Expense > 0) {
    const ratio = p1Expense / (p1Expense + p2Expense);
    if (ratio > 0.65) {
      advices.push({
        icon: "👥",
        color: Colors.purple,
        text: `${data.settings.person1}承担了 ${(ratio * 100).toFixed(0)}% 的支出，可以考虑更均衡的分担方式`,
      });
    } else if (ratio < 0.35) {
      advices.push({
        icon: "👥",
        color: Colors.purple,
        text: `${data.settings.person2}承担了 ${((1 - ratio) * 100).toFixed(0)}% 的支出，可以考虑更均衡的分担方式`,
      });
    }
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>💡 预算建议</Text>
        </View>

        <View style={s.monthRow}>
          <MonthNavigator
            monthKey={data.activeMonth}
            onPrev={data.goToPrevMonth}
            onNext={data.goToNextMonth}
          />
        </View>

        {/* 50/30/20 Rule */}
        <Card style={{ marginBottom: Spacing.lg }}>
          <SectionTitle>📐 50/30/20 预算法则</SectionTitle>
          <Text style={s.ruleDesc}>
            将收入分为：50% 必需开销 / 30% 弹性消费 / 20% 储蓄投资
          </Text>

          {budgetRules.map((rule) => {
            const fillPct = rule.target > 0 ? (rule.pct / rule.target) * 100 : 0;
            const over = rule.pct > rule.target;
            return (
              <View key={rule.label} style={s.ruleItem}>
                <View style={s.ruleHeader}>
                  <View>
                    <Text style={s.ruleLabel}>{rule.label}</Text>
                    <Text style={s.ruleSubDesc}>{rule.desc}</Text>
                  </View>
                  <View style={s.ruleRight}>
                    <Text style={[s.rulePct, { color: rule.color }]}>
                      {rule.pct}%
                    </Text>
                    <Text style={s.ruleTarget}>/ {rule.target}%</Text>
                  </View>
                </View>
                <ProgressBar percent={fillPct} color={rule.color} height={10} />
                <View style={s.ruleFooter}>
                  <Text style={s.ruleActual}>
                    实际 {fmtMoney(rule.actual)} / 建议{" "}
                    {fmtMoney((data.totalIncome * rule.target) / 100)}
                  </Text>
                  {Math.abs(rule.pct - rule.target) > 5 && (
                    <Text
                      style={[
                        s.ruleStatus,
                        { color: over ? Colors.red : Colors.green },
                      ]}
                    >
                      {over ? "⚠️ 超出" : "✓ 良好"}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </Card>

        {/* Smart advice */}
        <Card style={{ marginBottom: 20 }}>
          <SectionTitle>💡 智能建议</SectionTitle>
          {advices.map((a, i) => (
            <View
              key={i}
              style={[s.adviceCard, { borderLeftColor: a.color }]}
            >
              <Text style={s.adviceIcon}>{a.icon}</Text>
              <Text style={s.adviceText}>{a.text}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  header: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  title: { fontSize: 18, fontWeight: "700", color: Colors.text },
  monthRow: { marginBottom: Spacing.lg },
  ruleDesc: {
    fontSize: 12,
    color: Colors.text2,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  ruleItem: { marginBottom: Spacing.lg },
  ruleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  ruleLabel: { fontSize: 14, fontWeight: "600", color: Colors.text },
  ruleSubDesc: { fontSize: 11, color: Colors.text3, marginTop: 2 },
  ruleRight: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  rulePct: {
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  ruleTarget: { fontSize: 12, color: Colors.text3 },
  ruleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  ruleActual: { fontSize: 11, color: Colors.text3 },
  ruleStatus: { fontSize: 11, fontWeight: "600" },
  adviceCard: {
    backgroundColor: Colors.surface2,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  adviceIcon: { fontSize: 16, marginTop: 1 },
  adviceText: { fontSize: 13, color: Colors.text, flex: 1, lineHeight: 20 },
});
