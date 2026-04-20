
import React, { useState, useEffect } from "react";
import { Lead, Quote, Project, Task, User } from "@/entities";
import DashboardStats from "../components/dashboard/DashboardStats";
import RecentActivity from "../components/dashboard/RecentActivity";
import StatusChart from "../components/dashboard/StatusChart";
import UpcomingTasks from "../components/dashboard/UpcomingTasks";

export default function Dashboard() {
  const [stats, setStats] = useState({
    leads: 0,
    quotes: 0,
    projects: 0,
    tasks: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentLeads, setRecentLeads] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [leadsByStatus, setLeadsByStatus] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await User.me();
      const [leads, quotes, projects, tasks] = await Promise.all([
        Lead.list('-created_date', 100),
        Quote.list('-created_date', 100),
        Project.list('-created_date', 100),
        Task.list('-created_date', 100)
      ]);

      setStats({
        leads: leads.length,
        quotes: quotes.length,
        projects: projects.length,
        tasks: tasks.length
      });

      setRecentLeads(leads.slice(0, 5));
      setUpcomingTasks(tasks.filter(task => task.due_date && new Date(task.due_date) > new Date()).slice(0, 5));

      // Calculate leads by status
      const statusCounts = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {});

      setLeadsByStatus(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className="p-4 md:p-8 bg-[#0f1117] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">לוח בקרה</h1>
          <p className="text-slate-400">סקירה כוללת של המכירות והפרויקטים</p>
        </div>

        <DashboardStats stats={stats} isLoading={isLoading} />

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <StatusChart data={leadsByStatus} isLoading={isLoading} />
          </div>

          <div className="space-y-6">
            <RecentActivity leads={recentLeads} isLoading={isLoading} />
            <UpcomingTasks tasks={upcomingTasks} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
