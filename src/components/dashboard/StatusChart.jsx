import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3 } from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

export default function StatusChart({ data, isLoading }) {
  return (
    <Card className="shadow-lg border-0 bg-[#1a1d27]">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          לידים לפי סטטוס
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || data.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-slate-400">טוען נתונים...</div>
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
                  contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2d3348', color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
