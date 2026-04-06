import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBudget } from "../../src/context/BudgetContext";
import Card from "../../src/components/Card";
import SectionTitle from "../../src/components/SectionTitle";
import MonthNavigator from "../../src/components/MonthNavigator";
import TrendChart from "../../src/components/charts/TrendChart";
import CategoryChart from "../../src/components/charts/CategoryChart";
import PersonChart from "../../src/components/charts/PersonChart";
import { Colors, Spacing } from "../../src/lib/theme";
import { fmtMoney } from "../../src/lib/utils";

export default function AnalyticsScreen() {
  const data = useBudget();

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>📈 图表分析</Text>
        </View>

        <View style={s.monthRow}>
          <MonthNavigator
            monthKey={data.activeMonth}
            onPrev={data.goToPrevMonth}
            onNext={data.goToNextMonth}
          />
        </View>

        {/* 收支趋势 */}
        <Card style={{ marginBottom: Spacing.lg }}>
          <SectionTitle>📊 收支趋势（近6月）</SectionTitle>
          {data.trendData.length > 1 ? (
            <>
              <TrendChart data={data.trendData} />
              <View style={s.legendRow}>
                {[
                  { color: Colors.green,  label: "收入" },
                  { color: Colors.red,    label: "支出" },
                  { color: Colors.blue,   label: "储蓄投资" },
                ].map((l) => (
                  <View key={l.label} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: l.color }]} />
                    <Text style={s.legendText}>{l.label}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={s.empty}>需要更多月份数据</Text>
          )}
        </Card>

        {/* 类别排名 */}
        <Card style={{ marginBottom: Spacing.lg }}>
          <SectionTitle>🏷️ 各类别支出排名</SectionTitle>
          {data.catBreakdown.length > 0 ? (
            <CategoryChart data={data.catBreakdown} />
          ) : (
            <Text style={s.empty}>暂无支出数据</Text>
          )}
          {/* Detail list */}
          {data.catBreakdown.map((c) => {
            const total = data.totalExpense + data.totalInvest + data.totalSavings;
            const pct = total > 0 ? ((c.value / total) * 100).toFixed(0) : "0";
            return (
              <View key={c.id} style={s.catRow}>
                <View style={s.catLeft}>
                  <View style={[s.catDot, { backgroundColor: c.color }]} />
                  <Text style={s.catLabel}>{c.icon} {c.label}</Text>
                </View>
                <Text style={s.catValue}>{fmtMoney(c.value)}</Text>
                <Text style={s.catPct}>{pct}%</Text>
              </View>
            );
          })}
        </Card>

        {/* 双人对比 */}
        <Card style={{ marginBottom: Spacing.lg }}>
          <SectionTitle>
            👥 {data.settings.person1} vs {data.settings.person2}
          </SectionTitle>
          {data.personData.some((p) => p.income + p.expense > 0) ? (
            <PersonChart data={data.personData} />
          ) : (
            <Text style={s.empty}>暂无对比数据</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.bg },
  scroll:     { flex: 1, paddingHorizontal: Spacing.lg },
  header: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  title:      { fontSize: 18, fontWeight: "700", color: Colors.text },
  monthRow:   { marginBottom: Spacing.lg },
  empty:      { color: Colors.text3, textAlign: "center", padding: 20 },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: Spacing.md,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.text2 },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  catLeft:  { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  catDot:   { width: 6, height: 6, borderRadius: 3 },
  catLabel: { fontSize: 12, color: Colors.text2 },
  catValue: {
    fontSize: 12, fontWeight: "600", color: Colors.text,
    fontVariant: ["tabular-nums"], marginRight: 8,
  },
  catPct: { fontSize: 11, color: Colors.text3, width: 36, textAlign: "right" },
});
