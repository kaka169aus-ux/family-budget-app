import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius, Spacing } from "../lib/theme";
import { monthLabel } from "../lib/utils";

interface Props {
  monthKey: string;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthNavigator({ monthKey, onPrev, onNext }: Props) {
  return (
    <View style={s.container}>
      <TouchableOpacity style={s.btn} onPress={onPrev}>
        <Ionicons name="chevron-back" size={18} color={Colors.text2} />
      </TouchableOpacity>
      <Text style={s.label}>{monthLabel(monthKey)}</Text>
      <TouchableOpacity style={s.btn} onPress={onNext}>
        <Ionicons name="chevron-forward" size={18} color={Colors.text2} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
});
