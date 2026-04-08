import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBudget } from "../../src/context/BudgetContext";
import Card from "../../src/components/Card";
import Badge from "../../src/components/Badge";
import MonthNavigator from "../../src/components/MonthNavigator";
import AddTransactionModal from "../../src/components/AddTransactionModal";
import { Colors, Spacing, BorderRadius } from "../../src/lib/theme";
import { fmtMoney } from "../../src/lib/utils";
import { CATEGORIES, CATEGORY_MAP } from "../../src/lib/constants";
import { Transaction } from "../../src/lib/types";

export default function TransactionsScreen() {
  const data = useBudget();
  const [filterPerson, setFilterPerson] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  // Batch selection
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
    if (Platform.OS === "web") {
      // Web 上使用 window.confirm
      if (window.confirm(`确定要删除「${tx.description}」吗？`)) {
        data.removeTransaction(tx.id);
      }
    } else {
      // Native 上使用 Alert.alert
      Alert.alert("确认删除", `确定要删除「${tx.description}」吗？`, [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: () => data.removeTransaction(tx.id),
        },
      ]);
    }
  };

  const handleCopy = (tx: Transaction) => {
    data.copyTransaction(tx);
  };

  const handleEdit = (tx: Transaction) => {
    setEditTx(tx);
    setShowAdd(true);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((t) => t.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selected.size === 0) return;
    const msg = `确定要删除选中的 ${selected.size} 条记录吗？`;
    
    if (Platform.OS === "web") {
      if (window.confirm(msg)) {
        data.removeMultipleTransactions(Array.from(selected));
        setSelected(new Set());
        setSelectMode(false);
      }
    } else {
      Alert.alert(
        "批量删除",
        msg,
        [
          { text: "取消", style: "cancel" },
          {
            text: "删除",
            style: "destructive",
            onPress: async () => {
              await data.removeMultipleTransactions(Array.from(selected));
              setSelected(new Set());
              setSelectMode(false);
            },
          },
        ]
      );
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
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
          <View style={s.headerBtns}>
            {selectMode ? (
              <>
                <TouchableOpacity style={s.headerAction} onPress={toggleSelectAll}>
                  <Text style={s.headerActionText}>
                    {selected.size === filtered.length ? "取消全选" : "全选"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.headerAction, s.headerActionDanger]}
                  onPress={handleBatchDelete}
                >
                  <Ionicons name="trash" size={14} color={Colors.red} />
                  <Text style={[s.headerActionText, { color: Colors.red }]}>
                    删除 ({selected.size})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.headerAction} onPress={exitSelectMode}>
                  <Text style={s.headerActionText}>完成</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={s.headerAction}
                  onPress={() => setSelectMode(true)}
                >
                  <Ionicons name="checkbox-outline" size={14} color={Colors.text2} />
                  <Text style={s.headerActionText}>选择</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.addBtn}
                  onPress={() => {
                    setEditTx(null);
                    setShowAdd(true);
                  }}
                >
                  <Ionicons name="add" size={20} color={Colors.text} />
                </TouchableOpacity>
              </>
            )}
          </View>
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
            const isSelected = selected.has(t.id);
            return (
              <Card key={t.id} style={{ marginBottom: Spacing.sm }}>
                <View style={s.txCard}>
                  {/* Checkbox in select mode */}
                  {selectMode && (
                    <TouchableOpacity
                      style={s.checkbox}
                      onPress={() => toggleSelect(t.id)}
                    >
                      <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={22}
                        color={isSelected ? Colors.green : Colors.text3}
                      />
                    </TouchableOpacity>
                  )}

                  {/* Main content — tap to edit */}
                  <TouchableOpacity
                    style={s.txMain}
                    onPress={() => (selectMode ? toggleSelect(t.id) : handleEdit(t))}
                    activeOpacity={0.7}
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

                  {/* Action buttons (not in select mode) */}
                  {!selectMode && (
                    <View style={s.txActions}>
                      <TouchableOpacity
                        style={s.actionBtn}
                        onPress={() => handleCopy(t)}
                      >
                        <Ionicons name="copy-outline" size={16} color={Colors.text3} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.actionBtn}
                        onPress={() => handleDelete(t)}
                      >
                        <Ionicons name="trash-outline" size={16} color={Colors.red} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
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
        onSaveRecurring={(txns) => {
          data.importTransactions(txns);
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
  headerBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  headerActionDanger: {
    borderColor: Colors.red + "40",
    backgroundColor: Colors.redBg,
  },
  headerActionText: { fontSize: 12, color: Colors.text2, fontWeight: "500" },
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
    alignItems: "center",
  },
  checkbox: {
    marginRight: 10,
  },
  txMain: {
    flex: 1,
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
  txActions: {
    flexDirection: "row",
    gap: 4,
    marginLeft: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
