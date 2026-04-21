
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3 } from "lucide-react";

const COLORS = ['#D4A843', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16'];

export default function StatusChart({ data, isLoading }) {
  return (
    <div style={{
      background: 'var(--dark-card)',
      border: '1px solid var(--dark-border)',
      borderRadius: 12,
      overflow: 'hidden'
    }}>
      <div style={{ padding: '24px 24px 16px' }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--argaman)',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <BarChart3 style={{ width: 18, height: 18 }} />
          לידים לפי סטטוס
        </h3>
      </div>
      <div style={{ padding: '0 24px 24px' }}>
        {isLoading || data.length === 0 ? (
          <div style={{
            height: 256,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            fontSize: 14
          }}>
            טוען נתונים...
          </div>
        ) : (
          <div style={{ height: 256 }}>
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
                  contentStyle={{
                    background: 'var(--dark-card)',
                    border: '1px solid var(--dark-border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
