
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

      // חישוב לידים לפי סטטוס
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
    <div style={{
      padding: '32px',
      minHeight: '100vh',
      background: 'var(--dark)'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 4
          }}>לוח בקרה</h1>
          <p style={{
            color: 'var(--text-secondary)',
            margin: 0,
            fontSize: 14
          }}>סקירה כוללת של המכירות והפרויקטים</p>
        </div>

        <DashboardStats stats={stats} isLoading={isLoading} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: 16,
          marginTop: 24
        }}>
          <StatusChart data={leadsByStatus} isLoading={isLoading} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <RecentActivity leads={recentLeads} isLoading={isLoading} />
            <UpcomingTasks tasks={upcomingTasks} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
