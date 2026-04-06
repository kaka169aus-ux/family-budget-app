import React from "react";
import { View, Dimensions } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { CategoryBreakdown } from "../../lib/types";
import { Colors } from "../../lib/theme";
import { fmtMoney } from "../../lib/utils";

interface Props { data: CategoryBreakdown[] }

const W = Dimensions.get("window").width - 80;

export default function CategoryChart({ data }: Props) {
  const barData = data.slice(0, 6).map((c) => ({
    value: c.value,
    label: c.icon,
    frontColor: c.color,
    topLabelComponent: () => null,
  }));

  return (
    <View style={{ alignItems: "center" }}>
      <BarChart
        data={barData}
        width={W} height={200}
        barWidth={28} spacing={16}
        noOfSections={4}
        yAxisColor={Colors.border} xAxisColor={Colors.border}
        yAxisTextStyle={{ color: Colors.text3, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: Colors.text3, fontSize: 12 }}
        rulesColor={Colors.border} rulesType="dashed"
        barBorderRadius={4}
        backgroundColor={Colors.surface}
      />
    </View>
  );
}
