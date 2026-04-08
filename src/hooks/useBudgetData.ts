import { useState, useEffect, useCallback } from "react";
import { Transaction, Settings, CategoryBreakdown, PersonData, MonthData } from "../lib/types";
import {
  getAllTransactions,
  insertTransaction,
  insertManyTransactions,
  updateTransaction,
  deleteTransaction,
  deleteAllTransactions,
  getSettings,
  saveSettings as dbSaveSettings,
} from "../lib/database";
import { CATEGORIES, NEED_CATEGORIES, WANT_CATEGORIES, DEFAULT_SETTINGS } from "../lib/constants";
import { monthKey, monthLabel, monthLabelShort, pctChange } from "../lib/utils";

export function useBudgetData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [currentMonthKey, setCurrentMonthKey] = useState("");

  // ─── Load data ───
  const loadData = useCallback(async () => {
    try {
      const [txns, sett] = await Promise.all([getAllTransactions(), getSettings()]);
      setTransactions(txns);
      setSettings(sett);
      if (!currentMonthKey && txns.length > 0) {
        setCurrentMonthKey(monthKey(txns[0].date));
      }
    } catch (e) {
      console.error("Load error:", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Mutations ───
  const addTransaction = useCallback(
    async (tx: Omit<Transaction, "id" | "created_at">) => {
      await insertTransaction(tx);
      await loadData();
    },
    [loadData]
  );

  const editTransaction = useCallback(
    async (tx: Transaction) => {
      await updateTransaction(tx);
      await loadData();
    },
    [loadData]
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      await deleteTransaction(id);
      await loadData();
    },
    [loadData]
  );

  const removeMultipleTransactions = useCallback(
    async (ids: string[]) => {
      for (const id of ids) await deleteTransaction(id);
      await loadData();
    },
    [loadData]
  );

  const copyTransaction = useCallback(
    async (tx: Transaction) => {
      const { id, created_at, ...rest } = tx;
      await insertTransaction(rest);
      await loadData();
    },
    [loadData]
  );

  const importTransactions = useCallback(
    async (txns: Omit<Transaction, "id" | "created_at">[]) => {
      await insertManyTransactions(txns);
      await loadData();
      return txns.length;
    },
    [loadData]
  );

  const resetToSample = useCallback(async () => {
    await deleteAllTransactions();
    await dbSaveSettings(DEFAULT_SETTINGS);
    setTransactions([]);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const updateSettings = useCallback(
    async (newSettings: Settings) => {
      await dbSaveSettings(newSettings);
      setSettings(newSettings);
    },
    []
  );

  // ─── Computed ───
  const allMonths = [...new Set(transactions.map((t) => monthKey(t.date)))].sort().reverse();
  const activeMonth = currentMonthKey || allMonths[0] || monthKey(new Date().toISOString());

  const monthTxns = transactions.filter((t) => monthKey(t.date) === activeMonth);

  const totalIncome = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalInvest = monthTxns.filter((t) => t.type === "investment").reduce((s, t) => s + t.amount, 0);
  const totalSavings = monthTxns.filter((t) => t.type === "savings").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense - totalInvest - totalSavings;

  // Previous month
  const prevIdx = allMonths.indexOf(activeMonth);
  const prevMonthKey = prevIdx >= 0 && prevIdx < allMonths.length - 1 ? allMonths[prevIdx + 1] : null;
  const prevTxns = prevMonthKey ? transactions.filter((t) => monthKey(t.date) === prevMonthKey) : [];
  const prevExpense = prevTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const expenseChange = pctChange(totalExpense, prevExpense);

  // Category breakdown
  const catBreakdown: CategoryBreakdown[] = CATEGORIES
    .filter((c) => c.id !== "income")
    .map((c) => {
      const sum = monthTxns
        .filter((t) => t.category === c.id && t.type !== "income")
        .reduce((s, t) => s + t.amount, 0);
      return { ...c, value: sum };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  // Trend data (last 6 months)
  const trendData: MonthData[] = allMonths
    .slice(0, 6)
    .reverse()
    .map((mk) => {
      const mTxns = transactions.filter((t) => monthKey(t.date) === mk);
      return {
        month: monthLabelShort(mk),
        income: mTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
        expense: mTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
        savingsInvestment: mTxns
          .filter((t) => t.type === "investment" || t.type === "savings")
          .reduce((s, t) => s + t.amount, 0),
      };
    });

  // Person data
  const personData: PersonData[] = [settings.person1, settings.person2].map((p) => {
    const pTx = monthTxns.filter((t) => t.person === p);
    return {
      name: p,
      income: pTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: pTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  // Savings goal
  const totalSaved = transactions
    .filter((t) => t.type === "savings" || t.type === "investment")
    .reduce((s, t) => s + t.amount, 0);
  const goalPct = Math.min(100, (totalSaved / settings.savingsGoal) * 100);

  // 50/30/20
  const needs = monthTxns
    .filter((t) => NEED_CATEGORIES.includes(t.category) && t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const wants = monthTxns
    .filter((t) => WANT_CATEGORIES.includes(t.category) && t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const savInv = totalInvest + totalSavings;
  const needsPct = totalIncome > 0 ? Math.round((needs / totalIncome) * 100) : 0;
  const wantsPct = totalIncome > 0 ? Math.round((wants / totalIncome) * 100) : 0;
  const savPct = totalIncome > 0 ? Math.round((savInv / totalIncome) * 100) : 0;

  // Person category comparison
  const personCatComparison = CATEGORIES.filter((c) => c.id !== "income")
    .map((c) => {
      const v1 = monthTxns
        .filter((t) => t.person === settings.person1 && t.category === c.id && t.type !== "income")
        .reduce((s, t) => s + t.amount, 0);
      const v2 = monthTxns
        .filter((t) => t.person === settings.person2 && t.category === c.id && t.type !== "income")
        .reduce((s, t) => s + t.amount, 0);
      return v1 + v2 > 0 ? { category: c.label, v1, v2 } : null;
    })
    .filter(Boolean) as { category: string; v1: number; v2: number }[];

  // Navigation
  const goToPrevMonth = useCallback(() => {
    const i = allMonths.indexOf(activeMonth);
    if (i < allMonths.length - 1) setCurrentMonthKey(allMonths[i + 1]);
  }, [allMonths, activeMonth]);

  const goToNextMonth = useCallback(() => {
    const i = allMonths.indexOf(activeMonth);
    if (i > 0) setCurrentMonthKey(allMonths[i - 1]);
  }, [allMonths, activeMonth]);

  return {
    // State
    transactions,
    settings,
    loaded,
    activeMonth,
    allMonths,
    monthTxns,

    // Stats
    totalIncome,
    totalExpense,
    totalInvest,
    totalSavings,
    balance,
    expenseChange,
    prevTxns,

    // Breakdowns
    catBreakdown,
    trendData,
    personData,
    personCatComparison,

    // Goals
    totalSaved,
    goalPct,
    needs,
    wants,
    savInv,
    needsPct,
    wantsPct,
    savPct,

    // Actions
    addTransaction,
    editTransaction,
    removeTransaction,
    removeMultipleTransactions,
    copyTransaction,
    importTransactions,
    resetToSample,
    updateSettings,
    loadData,
    goToPrevMonth,
    goToNextMonth,
    setCurrentMonthKey,
  };
}
