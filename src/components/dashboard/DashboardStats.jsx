
import React from 'react';
import { Users, FileText, FolderOpen, CheckSquare, TrendingUp } from "lucide-react";
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
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 16
    }}>
      {statCards.map((stat) => (
        <div
          key={stat.key}
          style={{
            background: 'var(--dark-card)',
            border: '1px solid var(--dark-border)',
            borderRight: `4px solid ${stat.accentColor}`,
            borderRadius: 12,
            padding: 24,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            position: 'relative'
          }}
          onClick={() => navigate(createPageUrl(stat.navigateTo))}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--argaman-border)';
            e.currentTarget.style.borderRight = `4px solid ${stat.accentColor}`;
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 168, 67, 0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--dark-border)';
            e.currentTarget.style.borderRight = `4px solid ${stat.accentColor}`;
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                margin: 0,
                marginBottom: 8
              }}>{stat.title}</p>
              {isLoading ? (
                <div style={{
                  width: 60,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--dark-border)'
                }} />
              ) : (
                <p style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  {stats[stat.key]}
                </p>
              )}
            </div>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: stat.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <stat.icon style={{ width: 20, height: 20, color: stat.iconColor }} />
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 16,
            fontSize: 13
          }}>
            <TrendingUp style={{ width: 14, height: 14, marginLeft: 4, color: 'var(--success)' }} />
            <span style={{ fontWeight: 500, color: 'var(--success)' }}>+12%</span>
            <span style={{ marginRight: 8, color: 'var(--text-muted)' }}>מהחודש הקודם</span>
          </div>
        </div>
      ))}
    </div>
  );
}
