/**
 * Web 端 REST API 客户端
 * 对接 backend/server.js，让 Web 预览的数据永久保存到 data.db
 */
import { Transaction, Settings } from "./types";
import { DEFAULT_SETTINGS } from "./constants";
import { genId } from "./utils";

const BASE = "http://localhost:3001/api";

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Transactions ───────────────────────────────────────────────────────────

export async function apiGetAllTransactions(): Promise<Transaction[]> {
  return req<Transaction[]>("GET", "/transactions");
}

export async function apiInsertTransaction(
  tx: Omit<Transaction, "id" | "created_at">
): Promise<string> {
  const id = genId();
  await req("POST", "/transactions", { ...tx, id });
  return id;
}

export async function apiInsertManyTransactions(
  txns: Omit<Transaction, "id" | "created_at">[]
): Promise<void> {
  const items = txns.map((tx) => ({ ...tx, id: genId() }));
  await req("POST", "/transactions/batch", items);
}

export async function apiUpdateTransaction(tx: Transaction): Promise<void> {
  await req("PUT", `/transactions/${tx.id}`, tx);
}

export async function apiDeleteTransaction(id: string): Promise<void> {
  await req("DELETE", `/transactions/${id}`);
}

export async function apiDeleteAllTransactions(): Promise<void> {
  await req("DELETE", "/transactions");
}

export async function apiGetTransactionCount(): Promise<number> {
  const all = await apiGetAllTransactions();
  return all.length;
}

// ─── Settings ───────────────────────────────────────────────────────────────

export async function apiGetSettings(): Promise<Settings> {
  const map = await req<Record<string, string>>("GET", "/settings");
  return {
    person1: map.person1 ?? DEFAULT_SETTINGS.person1,
    person2: map.person2 ?? DEFAULT_SETTINGS.person2,
    savingsGoal: map.savingsGoal ? Number(map.savingsGoal) : DEFAULT_SETTINGS.savingsGoal,
    currency: map.currency ?? DEFAULT_SETTINGS.currency,
  };
}

export async function apiSaveSettings(settings: Settings): Promise<void> {
  await req("PUT", "/settings", {
    person1: settings.person1,
    person2: settings.person2,
    savingsGoal: String(settings.savingsGoal),
    currency: settings.currency,
  });
}
