import React from "react";
import { View, Dimensions } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { Colors } from "../../lib/theme";

interface Props {
  data: { name: string; income: number; expense: number }[];
}

const W = Dimensions.get("window").width - 80;

export default function PersonChart({ data }: Props) {
  const barData = data.flatMap((p) => [
    { value: p.income,  label: p.name, frontColor: Colors.green, spacing: 4 },
    { value: p.expense, frontColor: Colors.red, spacing: 20 },
  ]);

  return (
    <View style={{ alignItems: "center" }}>
      <BarChart
        data={barData}
        width={W} height={200}
        barWidth={32} spacing={4}
        noOfSections={4}
        yAxisColor={Colors.border} xAxisColor={Colors.border}
        yAxisTextStyle={{ color: Colors.text3, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: Colors.text3, fontSize: 11 }}
        rulesColor={Colors.border} rulesType="dashed"
        barBorderRadius={4}
        backgroundColor={Colors.surface}
      />
    </View>
  );
}
