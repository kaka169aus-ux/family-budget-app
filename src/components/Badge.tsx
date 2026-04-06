import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, BorderRadius } from "../lib/theme";

type Variant = "green" | "red" | "blue" | "amber";

const variants: Record<Variant, { bg: string; color: string }> = {
  green: { bg: Colors.greenBg, color: Colors.green },
  red: { bg: Colors.redBg, color: Colors.red },
  blue: { bg: Colors.blueBg, color: Colors.blue },
  amber: { bg: Colors.amberBg, color: Colors.amber },
};

interface Props {
  text: string;
  variant: Variant;
}

export default function Badge({ text, variant }: Props) {
  const v = variants[variant];
  return (
    <View style={[s.badge, { backgroundColor: v.bg }]}>
      <Text style={[s.text, { color: v.color }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
});
