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
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
    navigateTo: "Leads"
  },
  {
    title: "הצעות מחיר",
    icon: FileText,
    key: "quotes",
    color: "bg-green-500",
    gradient: "from-green-500 to-green-600",
    navigateTo: "Quotes"
  },
  {
    title: "פרויקטים",
    icon: FolderOpen,
    key: "projects",
    color: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600",
    navigateTo: "Projects"
  },
  {
    title: "משימות",
    icon: CheckSquare,
    key: "tasks",
    color: "bg-orange-500",
    gradient: "from-orange-500 to-orange-600",
    navigateTo: "Tasks"
  }
];

export default function DashboardStats({ stats, isLoading }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <Card
          key={stat.key}
          className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
          onClick={() => navigate(createPageUrl(stat.navigateTo))}
        >
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.gradient}`} />
          <CardHeader className="p-6">
            <div className="flex justify-between items-start">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <CardTitle className="text-3xl font-bold text-slate-900">
                    {stats[stat.key]}
                  </CardTitle>
                )}
              </div>
              <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
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