import React from "react";
import { View, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { MonthData } from "../../lib/types";
import { Colors, Spacing } from "../../lib/theme";

interface Props { data: MonthData[] }

const W = Dimensions.get("window").width - 80;

export default function TrendChart({ data }: Props) {
  const income  = data.map((d) => ({ value: d.income,           label: d.month }));
  const expense = data.map((d) => ({ value: d.expense }));
  const sav     = data.map((d) => ({ value: d.savingsInvestment }));

  return (
    <View style={{ alignItems: "center" }}>
      <LineChart
        data={income} data2={expense} data3={sav}
        width={W} height={200}
        spacing={W / Math.max(data.length - 1, 1)}
        color1={Colors.green} color2={Colors.red} color3={Colors.blue}
        thickness={2}
        dataPointsColor1={Colors.green}
        dataPointsColor2={Colors.red}
        dataPointsColor3={Colors.blue}
        dataPointsRadius={4}
        curved
        noOfSections={4}
        yAxisColor={Colors.border} xAxisColor={Colors.border}
        yAxisTextStyle={{ color: Colors.text3, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: Colors.text3, fontSize: 10 }}
        rulesColor={Colors.border} rulesType="dashed"
        formatYLabel={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
        backgroundColor={Colors.surface}
      />
    </View>
  );
}
