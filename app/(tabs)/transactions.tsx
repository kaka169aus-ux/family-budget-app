import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBudget } from "../../src/context/BudgetContext";
import Card from "../../src/components/Card";
import Badge from "../../src/components/Badge";
import MonthNavigator from "../../src/components/MonthNavigator";
import AddTransactionModal from "../../src/components/AddTransactionModal";
import { Colors, Spacing, BorderRadius } from "../../src/lib/theme";
import { fmtMoney, formatDate } from "../../src/lib/utils";
import { CATEGORIES, CATEGORY_MAP } from "../../src/lib/constants";
import { Transaction } from "../../src/lib/types";

export default function TransactionsScreen() {
  const data = useBudget();
  const [filterPerson, setFilterPerson] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    return data.monthTxns
      .filter(
        (t) =>
          (filterPerson === "all" || t.person === filterPerson) &&
          (filterCat === "all" || t.category === filterCat)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.monthTxns, filterPerson, filterCat]);

  const handleDelete = (tx: Transaction) => {
    Alert.alert("确认删除", `确定要删除「${tx.description}」吗？`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: () => data.removeTransaction(tx.id),
      },
    ]);
  };

  const handleEdit = (tx: Transaction) => {
    setEditTx(tx);
    setShowAdd(true);
  };

  const typeLabels: Record<string, { text: string; variant: "green" | "red" | "amber" | "blue" }> = {
    income: { text: "收入", variant: "green" },
    expense: { text: "支出", variant: "red" },
    investment: { text: "投资", variant: "amber" },
    savings: { text: "储蓄", variant: "blue" },
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>📋 交易明细</Text>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => {
              setEditTx(null);
              setShowAdd(true);
            }}
          >
            <Ionicons name="add" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Month nav */}
        <View style={s.monthRow}>
          <MonthNavigator
            monthKey={data.activeMonth}
            onPrev={data.goToPrevMonth}
            onNext={data.goToNextMonth}
          />
          <Text style={s.count}>{filtered.length} 条</Text>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
          <TouchableOpacity
            style={[s.filterChip, filterPerson === "all" && s.filterChipActive]}
            onPress={() => setFilterPerson("all")}
          >
            <Text style={[s.filterText, filterPerson === "all" && s.filterTextActive]}>
              全部成员
            </Text>
          </TouchableOpacity>
          {[data.settings.person1, data.settings.person2].map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.filterChip, filterPerson === p && s.filterChipActive]}
              onPress={() => setFilterPerson(filterPerson === p ? "all" : p)}
            >
              <Text style={[s.filterText, filterPerson === p && s.filterTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={s.filterDivider} />
          <TouchableOpacity
            style={[s.filterChip, filterCat === "all" && s.filterChipActive]}
            onPress={() => setFilterCat("all")}
          >
            <Text style={[s.filterText, filterCat === "all" && s.filterTextActive]}>
              全部类别
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[s.filterChip, filterCat === c.id && s.filterChipActive]}
              onPress={() => setFilterCat(filterCat === c.id ? "all" : c.id)}
            >
              <Text style={[s.filterText, filterCat === c.id && s.filterTextActive]}>
                {c.icon} {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transaction list */}
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>暂无交易记录</Text>
          </View>
        ) : (
          filtered.map((t) => {
            const cat = CATEGORY_MAP[t.category];
            const tl = typeLabels[t.type] || typeLabels.expense;
            return (
              <Card key={t.id} style={{ marginBottom: Spacing.sm }}>
                <TouchableOpacity
                  style={s.txCard}
                  onPress={() => handleEdit(t)}
                  onLongPress={() => handleDelete(t)}
                >
                  <View style={s.txLeft}>
                    <Text style={s.txIcon}>{cat?.icon || "📦"}</Text>
                    <View style={s.txInfo}>
                      <Text style={s.txDesc} numberOfLines={1}>
                        {t.description}
                      </Text>
                      <View style={s.txMetaRow}>
                        <Text style={s.txDate}>{t.date}</Text>
                        <Badge text={t.person} variant="blue" />
                        <Badge text={tl.text} variant={tl.variant} />
                      </View>
                    </View>
                  </View>
                  <View style={s.txRight}>
                    <Text
                      style={[
                        s.txAmt,
                        { color: t.type === "income" ? Colors.green : Colors.red },
                      ]}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {fmtMoney(t.amount)}
                    </Text>
                    <Text style={s.txCat}>{cat?.label}</Text>
                  </View>
                </TouchableOpacity>
              </Card>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <AddTransactionModal
        visible={showAdd}
        onClose={() => {
          setShowAdd(false);
          setEditTx(null);
        }}
        onSave={(tx) => {
          if (editTx) {
            data.editTransaction({ ...tx, id: editTx.id } as Transaction);
          } else {
            data.addTransaction(tx);
          }
        }}
        editTx={editTx}
        settings={data.settings}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  title: { fontSize: 18, fontWeight: "700", color: Colors.text },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  count: { fontSize: 13, color: Colors.text2 },
  filterRow: {
    marginBottom: Spacing.lg,
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  filterChipActive: {
    borderColor: Colors.green,
    backgroundColor: Colors.greenBg,
  },
  filterText: { fontSize: 12, color: Colors.text2, fontWeight: "500" },
  filterTextActive: { color: Colors.green },
  filterDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: { color: Colors.text3, fontSize: 14 },
  txCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  txIcon: { fontSize: 24 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, color: Colors.text, fontWeight: "500" },
  txMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  txDate: {
    fontSize: 11,
    color: Colors.text3,
    fontVariant: ["tabular-nums"],
  },
  txRight: { alignItems: "flex-end" },
  txAmt: {
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  txCat: { fontSize: 11, color: Colors.text3, marginTop: 2 },
});
