
import React, { useState, useEffect } from "react";
import { Project, Task, CollectionTask, WorkLogEntry, Quote } from "@/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  AlertTriangle, DollarSign, FolderOpen, ClipboardList,
  Clock, TrendingUp, FileText, CheckCircle, AlertCircle
} from "lucide-react";

const fmt = (n) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n || 0);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projects, tasks, collections, workLogs, quotes] = await Promise.all([
        Project.list('-created_date', 200),
        Task.list('-created_date', 200),
        CollectionTask.list('-created_date', 500),
        WorkLogEntry.list('-created_date', 100),
        Quote.list('-created_date', 200),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const activeProjects = projects.filter(p => p.status === 'בביצוע');
      const overdueTasks = tasks.filter(t => t.status !== 'הושלם' && t.status !== 'בוטל' && t.due_date && t.due_date < today);
      const pendingCollections = collections.filter(c => c.collection_status !== 'שולם ונשלחה חשבונית מס' && c.collection_status !== 'שולם');
      const openCollectionAmount = pendingCollections.reduce((s, c) => s + (Number(c.amount) || 0), 0);
      const overdueCollections = pendingCollections.filter(c => c.due_date && c.due_date < today);
      const overdueAmount = overdueCollections.reduce((s, c) => s + (Number(c.amount) || 0), 0);
      const pendingQuotes = quotes.filter(q => ['טיוטה', 'מוכנה', 'נשלחה'].includes(q.status));
      const pendingQuotesTotal = pendingQuotes.reduce((s, q) => s + (Number(q.total) || Number(q.total_amount) || 0), 0);

      // יומני עבודה — 7 ימים אחרונים
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const recentLogs = workLogs.filter(w => new Date(w.created_date || w.createdAt) > weekAgo);

      setData({
        activeProjects, overdueTasks, pendingCollections, openCollectionAmount,
        overdueCollections, overdueAmount, pendingQuotes, pendingQuotesTotal,
        recentLogs, projects, tasks, collections, quotes
      });
    } catch (e) {
      console.error('Dashboard error:', e);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ padding: 32, minHeight: '100vh', background: 'var(--dark)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>לוח בקרה</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 12, padding: 24, height: 120 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'גבייה פתוחה',
      value: fmt(data.openCollectionAmount),
      subtitle: `${data.pendingCollections.length} חשבוניות ממתינות`,
      icon: DollarSign,
      color: '#D4A843',
      onClick: () => navigate(createPageUrl('CollectionDashboard')),
    },
    {
      title: 'חריגות גבייה',
      value: fmt(data.overdueAmount),
      subtitle: `${data.overdueCollections.length} באיחור`,
      icon: AlertTriangle,
      color: data.overdueCollections.length > 0 ? '#dc2626' : '#22c55e',
      onClick: () => navigate(createPageUrl('CollectionDashboard')),
    },
    {
      title: 'פרויקטים פעילים',
      value: data.activeProjects.length,
      subtitle: `מתוך ${data.projects.length} סה"כ`,
      icon: FolderOpen,
      color: '#3b82f6',
      onClick: () => navigate(createPageUrl('Projects')),
    },
    {
      title: 'משימות באיחור',
      value: data.overdueTasks.length,
      subtitle: data.overdueTasks.length > 0 ? 'דורשות טיפול!' : 'הכל בזמן',
      icon: ClipboardList,
      color: data.overdueTasks.length > 0 ? '#f59e0b' : '#22c55e',
      onClick: () => navigate(createPageUrl('Tasks')),
    },
  ];

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: 'var(--dark)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 4 }}>לוח בקרה</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>סקירת מצב עסקי — {new Date().toLocaleDateString('he-IL')}</p>
        </div>

        {/* כרטיסי סטטיסטיקה */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {statCards.map((card, i) => (
            <div key={i} onClick={card.onClick} style={{
              background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
              borderRight: `4px solid ${card.color}`, borderRadius: 12, padding: 24,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, marginBottom: 8 }}>{card.title}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{card.value}</p>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <card.icon style={{ width: 20, height: 20, color: card.color }} />
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 12 }}>{card.subtitle}</p>
            </div>
          ))}
        </div>

        {/* שורה שנייה — התראות + הצעות ממתינות */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, marginTop: 24 }}>

          {/* התראות וחריגות */}
          <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} style={{ color: '#f59e0b' }} /> התראות
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.overdueCollections.length > 0 && (
                <div onClick={() => navigate(createPageUrl('CollectionDashboard'))} style={{ padding: 14, borderRadius: 10, background: '#dc262610', border: '1px solid #dc262630', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <DollarSign size={18} style={{ color: '#dc2626' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#dc2626' }}>{data.overdueCollections.length} תשלומים באיחור</p>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>סה"כ {fmt(data.overdueAmount)}</p>
                  </div>
                </div>
              )}
              {data.overdueTasks.length > 0 && (
                <div onClick={() => navigate(createPageUrl('Tasks'))} style={{ padding: 14, borderRadius: 10, background: '#f59e0b10', border: '1px solid #f59e0b30', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Clock size={18} style={{ color: '#f59e0b' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f59e0b' }}>{data.overdueTasks.length} משימות באיחור</p>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                      {data.overdueTasks.slice(0, 2).map(t => t.title).join(', ')}
                      {data.overdueTasks.length > 2 ? ` ועוד ${data.overdueTasks.length - 2}` : ''}
                    </p>
                  </div>
                </div>
              )}
              {data.recentLogs.length === 0 && (
                <div style={{ padding: 14, borderRadius: 10, background: '#f9731610', border: '1px solid #f9731630', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileText size={18} style={{ color: '#f97316' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f97316' }}>אין יומני עבודה השבוע</p>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>לא דווחו יומני עבודה ב-7 ימים אחרונים</p>
                  </div>
                </div>
              )}
              {data.overdueCollections.length === 0 && data.overdueTasks.length === 0 && data.recentLogs.length > 0 && (
                <div style={{ padding: 14, borderRadius: 10, background: '#22c55e10', border: '1px solid #22c55e30', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircle size={18} style={{ color: '#22c55e' }} />
                  <p style={{ margin: 0, fontSize: 14, color: '#22c55e', fontWeight: 500 }}>הכל תקין — אין חריגות</p>
                </div>
              )}
            </div>
          </div>

          {/* הצעות מחיר ממתינות */}
          <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} style={{ color: '#3b82f6' }} /> הצעות מחיר ממתינות
            </h3>
            {data.pendingQuotes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>אין הצעות ממתינות</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ padding: 14, borderRadius: 10, background: '#3b82f610', border: '1px solid #3b82f630', marginBottom: 8 }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(data.pendingQuotesTotal)}</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{data.pendingQuotes.length} הצעות בצנרת</p>
                </div>
                {data.pendingQuotes.slice(0, 4).map((q, i) => (
                  <div key={i} onClick={() => navigate(createPageUrl(`QuoteDetails?id=${q.id}`))} style={{
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    border: '1px solid var(--dark-border)', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--dark)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{q.title || q.quote_number || `הצעה #${q.id?.slice(-4)}`}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--argaman)' }}>{fmt(Number(q.total) || Number(q.total_amount) || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* פרויקטים פעילים */}
        {data.activeProjects.length > 0 && (
          <div style={{ marginTop: 24, background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderOpen size={18} style={{ color: '#3b82f6' }} /> פרויקטים פעילים
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {data.activeProjects.map((p, i) => (
                <div key={i} onClick={() => navigate(createPageUrl(`ProjectDetails?id=${p.id}`))} style={{
                  padding: 16, borderRadius: 10, border: '1px solid var(--dark-border)', cursor: 'pointer', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--argaman-border)'; e.currentTarget.style.background = 'var(--dark)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--dark-border)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{p.client_name || ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
