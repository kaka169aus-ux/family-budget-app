/**
 * 数据访问层
 *
 * ┌─────────────┬──────────────────────────────────────────────────────┐
 * │  平台       │  存储方案                                            │
 * ├─────────────┼──────────────────────────────────────────────────────┤
 * │  iOS/Android│  expo-sqlite  →  本地 budget.db（离线可用）          │
 * │  Web (dev)  │  REST API     →  backend/data.db（持久化，刷新不丢）  │
 * └─────────────┴──────────────────────────────────────────────────────┘
 */
import { Platform } from "react-native";
import { Transaction, Settings } from "./types";
import { DEFAULT_SETTINGS } from "./constants";
import { genId } from "./utils";
import {
  apiGetAllTransactions,
  apiInsertTransaction,
  apiInsertManyTransactions,
  apiUpdateTransaction,
  apiDeleteTransaction,
  apiDeleteAllTransactions,
  apiGetTransactionCount,
  apiGetSettings,
  apiSaveSettings,
} from "./api";

const isWeb = Platform.OS === "web";

// ─── SQLite (native only) ───────────────────────────────────────────────────
let db: any = null;

async function getDB() {
  if (db) return db;
  const SQLite = require("expo-sqlite");
  db = await SQLite.openDatabaseAsync("budget.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      person TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'investment', 'savings')),
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_tx_person ON transactions(person);
  `);
  return db;
}

// ─── Transactions ───────────────────────────────────────────────────────────

export async function getAllTransactions(): Promise<Transaction[]> {
  if (isWeb) return apiGetAllTransactions();
  const database = await getDB();
  return database.getAllAsync(
    "SELECT * FROM transactions ORDER BY date DESC, created_at DESC"
  );
}

export async function insertTransaction(
  tx: Omit<Transaction, "id" | "created_at">
): Promise<string> {
  if (isWeb) return apiInsertTransaction(tx);
  const id = genId();
  const database = await getDB();
  await database.runAsync(
    "INSERT INTO transactions (id, date, amount, category, description, person, type) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, tx.date, tx.amount, tx.category, tx.description, tx.person, tx.type]
  );
  return id;
}

export async function insertManyTransactions(
  txns: Omit<Transaction, "id" | "created_at">[]
): Promise<void> {
  if (isWeb) return apiInsertManyTransactions(txns);
  const database = await getDB();
  for (const tx of txns) {
    const id = genId();
    await database.runAsync(
      "INSERT INTO transactions (id, date, amount, category, description, person, type) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, tx.date, tx.amount, tx.category, tx.description, tx.person, tx.type]
    );
  }
}

export async function updateTransaction(tx: Transaction): Promise<void> {
  if (isWeb) return apiUpdateTransaction(tx);
  const database = await getDB();
  await database.runAsync(
    "UPDATE transactions SET date=?, amount=?, category=?, description=?, person=?, type=? WHERE id=?",
    [tx.date, tx.amount, tx.category, tx.description, tx.person, tx.type, tx.id]
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  if (isWeb) return apiDeleteTransaction(id);
  const database = await getDB();
  await database.runAsync("DELETE FROM transactions WHERE id=?", [id]);
}

export async function deleteAllTransactions(): Promise<void> {
  if (isWeb) return apiDeleteAllTransactions();
  const database = await getDB();
  await database.runAsync("DELETE FROM transactions");
}

export async function getTransactionCount(): Promise<number> {
  if (isWeb) return apiGetTransactionCount();
  const database = await getDB();
  const result = await database.getFirstAsync(
    "SELECT COUNT(*) as count FROM transactions"
  );
  return (result as any)?.count ?? 0;
}

// ─── Settings ───────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  if (isWeb) return apiGetSettings();
  const database = await getDB();
  const rows = await database.getAllAsync("SELECT * FROM settings");
  const map = Object.fromEntries((rows as any[]).map((r: any) => [r.key, r.value]));
  return {
    person1: map.person1 ?? DEFAULT_SETTINGS.person1,
    person2: map.person2 ?? DEFAULT_SETTINGS.person2,
    savingsGoal: map.savingsGoal ? Number(map.savingsGoal) : DEFAULT_SETTINGS.savingsGoal,
    currency: map.currency ?? DEFAULT_SETTINGS.currency,
  };
}

export async function saveSetting(key: string, value: string): Promise<void> {
  if (isWeb) {
    await apiSaveSettings(await getSettings().then((s) => ({ ...s, [key]: value as any })));
    return;
  }
  const database = await getDB();
  await database.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [key, value]
  );
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (isWeb) return apiSaveSettings(settings);
  const database = await getDB();
  for (const [key, value] of Object.entries(settings)) {
    await database.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [key, String(value)]
    );
  }
}

// ─── Export / Import ────────────────────────────────────────────────────────

export async function exportAllData(): Promise<{
  transactions: Transaction[];
  settings: Settings;
}> {
  const [transactions, settings] = await Promise.all([
    getAllTransactions(),
    getSettings(),
  ]);
  return { transactions, settings };
}

export async function importAllData(data: {
  transactions: Transaction[];
  settings: Settings;
}): Promise<void> {
  await deleteAllTransactions();
  if (data.transactions?.length > 0) {
    if (isWeb) {
      await apiInsertManyTransactions(data.transactions);
    } else {
      const database = await getDB();
      for (const tx of data.transactions) {
        await database.runAsync(
          "INSERT OR REPLACE INTO transactions (id, date, amount, category, description, person, type) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [tx.id || genId(), tx.date, tx.amount, tx.category, tx.description, tx.person, tx.type]
        );
      }
    }
  }
  if (data.settings) await saveSettings(data.settings);
}
