import React from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, FolderOpen, CheckSquare, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statCards = [
  {
    title: "לידים פעילים",
    icon: Users,
    key: "leads",
    accentColor: "var(--argaman)",
    iconColor: "var(--argaman-light)",
    iconBg: "rgba(212, 168, 67, 0.1)",
    navigateTo: "Leads"
  },
  {
    title: "הצעות מחיר",
    icon: FileText,
    key: "quotes",
    accentColor: "var(--info)",
    iconColor: "#60a5fa",
    iconBg: "rgba(96, 165, 250, 0.1)",
    navigateTo: "Quotes"
  },
  {
    title: "פרויקטים",
    icon: FolderOpen,
    key: "projects",
    accentColor: "var(--success)",
    iconColor: "#4ade80",
    iconBg: "rgba(74, 222, 128, 0.1)",
    navigateTo: "Projects"
  },
  {
    title: "משימות",
    icon: CheckSquare,
    key: "tasks",
    accentColor: "var(--warning)",
    iconColor: "#fbbf24",
    iconBg: "rgba(251, 191, 36, 0.1)",
    navigateTo: "Tasks"
  }
];

export default function DashboardStats({ stats, isLoading }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statCards.map((stat) => (
        <div
          key={stat.key}
          className="relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: 'var(--dark-card)',
            border: '1px solid var(--dark-border)',
            borderLeft: `4px solid ${stat.accentColor}`,
          }}
          onClick={() => navigate(createPageUrl(stat.navigateTo))}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--argaman-border)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 168, 67, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--dark-border)';
            e.currentTarget.style.borderLeft = `4px solid ${stat.accentColor}`;
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div className="p-4 md:p-6">
            <div className="flex justify-between items-start">
              <div className="text-right">
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{stat.title}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" style={{ background: 'var(--dark-border)' }} />
                ) : (
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {stats[stat.key]}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-xl" style={{ background: stat.iconBg }}>
                <stat.icon className="w-6 h-6" style={{ color: stat.iconColor }} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 ml-1" style={{ color: 'var(--success)' }} />
              <span className="font-medium" style={{ color: 'var(--success)' }}>+12%</span>
              <span className="mr-2" style={{ color: 'var(--text-muted)' }}>מהחודש הקודם</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
