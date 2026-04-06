import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BudgetProvider } from "../src/context/BudgetContext";

export default function RootLayout() {
  return (
    <BudgetProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </BudgetProvider>
  );
}
