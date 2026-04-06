import React, { createContext, useContext } from "react";
import { useBudgetData } from "../hooks/useBudgetData";

type BudgetContextType = ReturnType<typeof useBudgetData>;

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const data = useBudgetData();
  return <BudgetContext.Provider value={data}>{children}</BudgetContext.Provider>;
}

export function useBudget(): BudgetContextType {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
