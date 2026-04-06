import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from "recharts";
import { CategoryBreakdown } from "../../lib/types";
import { Colors } from "../../lib/theme";
import { fmtMoney } from "../../lib/utils";

interface Props { data: CategoryBreakdown[] }

export default function CategoryChart({ data }: Props) {
  const chartData = data.slice(0, 8).map((c) => ({
    name: `${c.icon}${c.label}`,
    value: c.value,
    color: c.color,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke={Colors.border} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: Colors.text3, fontSize: 10 }}
          tickFormatter={(v) => `$${v}`}
        />
        <YAxis
          dataKey="name" type="category"
          tick={{ fill: Colors.text2, fontSize: 11 }}
          width={90}
        />
        <Tooltip
          contentStyle={{
            background: Colors.surface2,
            border: `1px solid ${Colors.border}`,
            borderRadius: 8, fontSize: 12, color: Colors.text,
          }}
          formatter={(v: number) => fmtMoney(v)}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((c, i) => <Cell key={i} fill={c.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
