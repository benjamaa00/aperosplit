import React from "react";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#10b981", "#f43f5e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export function ExpensesByCategory({ expenses }: { expenses: any[] }) {
  const data = expenses.reduce((acc: any, exp: any) => {
    const existing = acc.find((e: any) => e.category === exp.category);
    if (existing) {
      existing.amount += parseFloat(exp.amount);
    } else {
      acc.push({ category: exp.category, amount: parseFloat(exp.amount) });
    }
    return acc;
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <h3 className="font-semibold text-sm mb-4">Dépenses par catégorie</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} label>
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpensesByMember({ expenses, members }: { expenses: any[]; members: any[] }) {
  const data = members.map((member: any) => {
    const total = expenses.filter((e: any) => e.payerId === member.id).reduce((s: number, e: any) => s + parseFloat(e.amount), 0);
    return { name: member.name, amount: total };
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <h3 className="font-semibold text-sm mb-4">Dépenses par membre</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
          <Bar dataKey="amount" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpensesTrend({ expenses }: { expenses: any[] }) {
  const data = expenses
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc: any, exp: any) => {
      const date = new Date(exp.date).toLocaleDateString();
      const existing = acc.find((e: any) => e.date === date);
      if (existing) {
        existing.cumulative += parseFloat(exp.amount);
      } else {
        acc.push({ date, cumulative: parseFloat(exp.amount) });
      }
      return acc;
    }, [])
    .slice(-30);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <h3 className="font-semibold text-sm mb-4">Tendance des dépenses</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
          <Line type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
