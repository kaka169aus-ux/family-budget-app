import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Colors } from "../../lib/theme";
import { fmtMoney } from "../../lib/utils";

interface Props {
  data: { name: string; income: number; expense: number }[];
}

export default function PersonChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={Colors.border} />
        <XAxis dataKey="name" tick={{ fill: Colors.text2, fontSize: 12 }} />
        <YAxis
          tick={{ fill: Colors.text3, fontSize: 10 }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            background: Colors.surface2,
            border: `1px solid ${Colors.border}`,
            borderRadius: 8, fontSize: 12, color: Colors.text,
          }}
          formatter={(v: number) => fmtMoney(v)}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: Colors.text2 }} />
        <Bar dataKey="income"  name="收入" fill={Colors.green}  radius={[4,4,0,0]} />
        <Bar dataKey="expense" name="支出" fill={Colors.red}    radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
