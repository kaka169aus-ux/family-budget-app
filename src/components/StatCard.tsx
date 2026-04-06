import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, BorderRadius } from "../lib/theme";

interface Props {
  label: string;
  icon: string;
  value: string;
  valueColor?: string;
  sub?: string;
  subColor?: string;
}

export default function StatCard({ label, icon, value, valueColor = Colors.text, sub, subColor }: Props) {
  return (
    <View style={s.card}>
      <Text style={s.label}>
        {icon} {label}
      </Text>
      <Text style={[s.value, { color: valueColor }]}>{value}</Text>
      {sub ? <Text style={[s.sub, subColor ? { color: subColor } : null]}>{sub}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    flex: 1,
    minWidth: 150,
  },
  label: {
    fontSize: 11,
    color: Colors.text2,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 11,
    color: Colors.text2,
    marginTop: 4,
  },
});
