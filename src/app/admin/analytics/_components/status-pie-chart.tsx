"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Props = {
  data: { status: string; count: number }[];
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(210, 80%, 50%)",
  "hsl(160, 60%, 40%)",
  "hsl(40, 90%, 50%)",
  "hsl(0, 70%, 50%)",
  "hsl(280, 60%, 50%)",
  "hsl(330, 60%, 50%)",
  "hsl(190, 70%, 40%)",
];

export function StatusPieChart({ data }: Props) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium">Commandes par statut</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) =>
              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 8 }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
