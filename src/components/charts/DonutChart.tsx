import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { CategoryBreakdown } from "../../lib/types";
import { Colors } from "../../lib/theme";
import { fmtMoney } from "../../lib/utils";

interface Props {
  data: CategoryBreakdown[];
  total: number;
}

export default function DonutChart({ data, total }: Props) {
  const pieData = data.slice(0, 8).map((c) => ({
    value: c.value,
    color: c.color,
    text: "",
  }));

  return (
    <PieChart
      data={pieData}
      donut
      radius={75}
      innerRadius={45}
      innerCircleColor={Colors.surface}
      centerLabelComponent={() => (
        <View style={s.center}>
          <Text style={s.amt}>{fmtMoney(total)}</Text>
          <Text style={s.label}>总支出</Text>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  center: { alignItems: "center" },
  amt: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    fontVariant: ["tabular-nums"],
  },
  label: { fontSize: 10, color: Colors.text2 },
});
