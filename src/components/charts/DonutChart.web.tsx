import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CategoryBreakdown } from "../../lib/types";
import { Colors } from "../../lib/theme";
import { fmtMoney } from "../../lib/utils";

interface Props {
  data: CategoryBreakdown[];
  total: number;
}

export default function DonutChart({ data, total }: Props) {
  const chartData = data.slice(0, 8).map((c) => ({
    name: `${c.icon} ${c.label}`,
    value: c.value,
    color: c.color,
  }));

  return (
    <div style={{ width: 240, height: 220, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((c, i) => (
              <Cell key={i} fill={c.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: Colors.surface2,
              border: `1px solid ${Colors.border}`,
              borderRadius: 8,
              fontSize: 12,
              color: Colors.text,
            }}
            formatter={(v: number) => fmtMoney(v)}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
