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
    borderColor: "border-l-red-500",
    iconColor: "text-red-500",
    iconBg: "bg-red-500/10",
    navigateTo: "Leads"
  },
  {
    title: "הצעות מחיר",
    icon: FileText,
    key: "quotes",
    borderColor: "border-l-blue-500",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    navigateTo: "Quotes"
  },
  {
    title: "פרויקטים",
    icon: FolderOpen,
    key: "projects",
    borderColor: "border-l-green-500",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    navigateTo: "Projects"
  },
  {
    title: "משימות",
    icon: CheckSquare,
    key: "tasks",
    borderColor: "border-l-yellow-500",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-500",
    navigateTo: "Tasks"
  }
];

export default function DashboardStats({ stats, isLoading }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statCards.map((stat) => (
        <Card
          key={stat.key}
          className={`relative overflow-hidden border-0 border-l-4 ${stat.borderColor} bg-[#1a1d27] shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer`}
          onClick={() => navigate(createPageUrl(stat.navigateTo))}
        >
          <CardHeader className="p-4 md:p-6">
            <div className="flex justify-between items-start">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-400 mb-1">{stat.title}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 bg-[#2d3348]" />
                ) : (
                  <CardTitle className="text-3xl font-bold text-slate-100">
                    {stats[stat.key]}
                  </CardTitle>
                )}
              </div>
              <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="w-4 h-4 ml-1 text-green-500" />
              <span className="text-green-500 font-medium">+12%</span>
              <span className="text-slate-500 mr-2">מהחודש הקודם</span>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
