import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors, BorderRadius } from "../lib/theme";

interface Props {
  percent: number;
  color: string;
  height?: number;
}

export default function ProgressBar({ percent, color, height = 8 }: Props) {
  return (
    <View style={[s.track, { height }]}>
      <View
        style={[
          s.fill,
          { width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: color, height },
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  track: {
    backgroundColor: Colors.surface3,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  fill: {
    borderRadius: BorderRadius.sm,
  },
});
