import React from "react";
import { Text, StyleSheet } from "react-native";
import { Colors, Spacing } from "../lib/theme";

interface Props {
  children: React.ReactNode;
}

export default function SectionTitle({ children }: Props) {
  return <Text style={s.title}>{children}</Text>;
}

const s = StyleSheet.create({
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
});
