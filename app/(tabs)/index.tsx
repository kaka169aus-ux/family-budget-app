import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBudget } from "../../src/context/BudgetContext";
import DonutChart from "../../src/components/charts/DonutChart";
import StatCard from "../../src/components/StatCard";
import Card from "../../src/components/Card";
import SectionTitle from "../../src/components/SectionTitle";
import ProgressBar from "../../src/components/ProgressBar";
import MonthNavigator from "../../src/components/MonthNavigator";
import Badge from "../../src/components/Badge";
import AddTransactionModal from "../../src/components/AddTransactionModal";
import ImportModal from "../../src/components/ImportModal";
import { Colors, Spacing, BorderRadius } from "../../src/lib/theme";
import { fmtMoney, formatDate } from "../../src/lib/utils";
import { CATEGORY_MAP } from "../../src/lib/constants";

export default function DashboardScreen() {
  const data = useBudget();
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  if (!data.loaded) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.loading}>
          <ActivityIndicator size="large" color={Colors.green} />
        </View>
      </SafeAreaView>
    );
  }

  const recentTxns = data.monthTxns
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.logo}>
            💰 家庭<Text style={{ color: Colors.green }}>记账</Text>本
          </Text>
          <View style={s.headerBtns}>
            <TouchableOpacity style={s.headerBtn} onPress={() => setShowAdd(true)}>
              <Text style={s.headerBtnText}>+ 记一笔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.headerBtn} onPress={() => setShowImport(true)}>
              <Text style={s.headerBtnText}>导入</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Month nav */}
        <View style={s.monthRow}>
          <MonthNavigator
            monthKey={data.activeMonth}
            onPrev={data.goToPrevMonth}
            onNext={data.goToNextMonth}
          />
        </View>

        {/* Stat cards */}
        <View style={s.statsRow}>
          <StatCard label="本月收入" icon="💵" value={fmtMoney(data.totalIncome)} valueColor={Colors.green} />
          <StatCard
            label="本月支出"
            icon="🔻"
            value={fmtMoney(data.totalExpense)}
            valueColor={Colors.red}
            sub={data.expenseChange !== 0 ? `${data.expenseChange > 0 ? "↑" : "↓"}${Math.abs(data.expenseChange)}% 较上月` : undefined}
            subColor={data.expenseChange > 0 ? Colors.red : Colors.green}
          />
        </View>
        <View style={s.statsRow}>
          <StatCard label="投资+储蓄" icon="📈" value={fmtMoney(data.totalInvest + data.totalSavings)} valueColor={Colors.blue} />
          <StatCard
            label="本月结余"
            icon="💎"
            value={fmtMoney(data.balance)}
            valueColor={data.balance >= 0 ? Colors.green : Colors.red}
          />
        </View>

        {/* Pie chart */}
        {data.catBreakdown.length > 0 && (
          <Card style={{ marginTop: Spacing.lg }}>
            <SectionTitle>支出分类占比</SectionTitle>
            <View style={s.pieContainer}>
              <DonutChart data={data.catBreakdown} total={data.totalExpense} />
              <View style={s.pieLegend}>
                {data.catBreakdown.slice(0, 6).map((c) => (
                  <View key={c.id} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: c.color }]} />
                    <Text style={s.legendLabel} numberOfLines={1}>
                      {c.label}
                    </Text>
                    <Text style={s.legendValue}>{fmtMoney(c.value)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        )}

        {/* Savings goal */}
        <Card style={{ marginTop: Spacing.lg }}>
          <SectionTitle>🎯 储蓄目标</SectionTitle>
          <View style={s.goalRow}>
            <Text style={s.goalCurrent}>{fmtMoney(data.totalSaved)}</Text>
            <Text style={s.goalTarget}>目标 {fmtMoney(data.settings.savingsGoal)}</Text>
          </View>
          <ProgressBar percent={data.goalPct} color={Colors.green} />
          <Text style={s.goalPct}>
            已完成{" "}
            <Text style={{ color: Colors.green, fontWeight: "600" }}>
              {data.goalPct.toFixed(1)}%
            </Text>
            {data.savInv > 0 && (
              <Text>
                {" "}
                · 预计{" "}
                {Math.ceil(
                  (data.settings.savingsGoal - data.totalSaved) / data.savInv
                )}{" "}
                个月达成
              </Text>
            )}
          </Text>
        </Card>

        {/* Recent transactions */}
        <Card style={{ marginTop: Spacing.lg, marginBottom: 20 }}>
          <SectionTitle>最近交易</SectionTitle>
          {recentTxns.map((t) => {
            const cat = CATEGORY_MAP[t.category];
            return (
              <View key={t.id} style={s.txRow}>
                <View style={s.txLeft}>
                  <Text style={s.txIcon}>{cat?.icon || "📦"}</Text>
                  <View>
                    <Text style={s.txDesc} numberOfLines={1}>
                      {t.description}
                    </Text>
                    <Text style={s.txMeta}>
                      {formatDate(t.date)} · {t.person}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    s.txAmt,
                    { color: t.type === "income" ? Colors.green : Colors.red },
                  ]}
                >
                  {t.type === "income" ? "+" : "-"}
                  {fmtMoney(t.amount)}
                </Text>
              </View>
            );
          })}
        </Card>
      </ScrollView>

      <AddTransactionModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={data.addTransaction}
        settings={data.settings}
      />
      <ImportModal
        visible={showImport}
        onClose={() => setShowImport(false)}
        onImport={data.importTransactions}
        settings={data.settings}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  logo: { fontSize: 20, fontWeight: "700", color: Colors.text },
  headerBtns: { flexDirection: "row", gap: Spacing.sm },
  headerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  headerBtnText: { color: Colors.text, fontSize: 12, fontWeight: "500" },
  monthRow: { marginBottom: Spacing.lg },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  pieContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 60,
    overflow: "visible",
  },
  pieLegend: { flex: 1, gap: 8, minWidth: 0 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 12, minWidth: 0, paddingRight: 16 },
  legendDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  legendLabel: { fontSize: 13, color: Colors.text2, minWidth: 60, fontWeight: "500" },
  legendValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
    flexShrink: 0,
    minWidth: 65,
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  goalCurrent: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    fontVariant: ["tabular-nums"],
  },
  goalTarget: { fontSize: 13, color: Colors.text2 },
  goalPct: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 12,
    color: Colors.text2,
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  txLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  txIcon: { fontSize: 20 },
  txDesc: { fontSize: 13, color: Colors.text, maxWidth: 180 },
  txMeta: { fontSize: 11, color: Colors.text3, marginTop: 2 },
  txAmt: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
