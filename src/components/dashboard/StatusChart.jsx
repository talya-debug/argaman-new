import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3 } from "lucide-react";

const COLORS = ['#c42b2b', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16'];

export default function StatusChart({ data, isLoading }) {
  return (
    <div className="rounded-xl animate-in" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
      <div className="p-6 pb-4">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--argaman)' }}>
          <BarChart3 className="w-5 h-5" />
          לידים לפי סטטוס
        </h3>
      </div>
      <div className="px-6 pb-6">
        {isLoading || data.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div style={{ color: 'var(--text-secondary)' }}>טוען נתונים...</div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--dark-card)', border: '1px solid var(--dark-border)', color: 'var(--text-primary)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
