export type TransactionType = "income" | "expense" | "investment" | "savings";

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  description: string;
  person: string;
  type: TransactionType;
  created_at?: string;
}

export interface Settings {
  person1: string;
  person2: string;
  savingsGoal: number;
  currency: string;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface MonthData {
  month: string;
  income: number;
  expense: number;
  savingsInvestment: number;
}

export interface CategoryBreakdown {
  id: string;
  label: string;
  icon: string;
  color: string;
  value: number;
}

export interface PersonData {
  name: string;
  income: number;
  expense: number;
}
