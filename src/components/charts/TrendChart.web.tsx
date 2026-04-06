import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { MonthData } from "../../lib/types";
import { Colors } from "../../lib/theme";
import { fmtMoney } from "../../lib/utils";

interface Props { data: MonthData[] }

const tooltipStyle = {
  background: Colors.surface2,
  border: `1px solid ${Colors.border}`,
  borderRadius: 8,
  fontSize: 12,
  color: Colors.text,
};

export default function TrendChart({ data }: Props) {
  const rechartData = data.map((d) => ({
    month: d.month,
    收入: d.income,
    支出: d.expense,
    储蓄投资: d.savingsInvestment,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={rechartData}>
        <defs>
          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={Colors.green} stopOpacity={0.35} />
            <stop offset="100%" stopColor={Colors.green} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={Colors.red} stopOpacity={0.35} />
            <stop offset="100%" stopColor={Colors.red} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gSav" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={Colors.blue} stopOpacity={0.35} />
            <stop offset="100%" stopColor={Colors.blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={Colors.border} />
        <XAxis dataKey="month" tick={{ fill: Colors.text3, fontSize: 11 }} />
        <YAxis
          tick={{ fill: Colors.text3, fontSize: 10 }}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => fmtMoney(v)}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: Colors.text2 }} />
        <Area type="monotone" dataKey="收入"    stroke={Colors.green} fill="url(#gIncome)"  strokeWidth={2} />
        <Area type="monotone" dataKey="支出"    stroke={Colors.red}   fill="url(#gExpense)" strokeWidth={2} />
        <Area type="monotone" dataKey="储蓄投资" stroke={Colors.blue}  fill="url(#gSav)"    strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
