
import React, { useState, useEffect } from "react";
import { Project, Task, CollectionTask, WorkLogEntry, Quote } from "@/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  AlertTriangle, DollarSign, FolderOpen, ClipboardList,
  Clock, FileText, CheckCircle, AlertCircle, TrendingUp,
  Receipt, Users, ArrowLeft, Bell, ChevronLeft
} from "lucide-react";

const fmt = (n) => new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 }).format(n || 0);

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
      const planningProjects = projects.filter(p => p.status === 'בתכנון');

      // משימות באיחור
      const overdueTasks = tasks.filter(t =>
        t.status !== 'הושלם' && t.status !== 'בוטל' && t.due_date && t.due_date < today
      );
      const openTasks = tasks.filter(t => t.status !== 'הושלם' && t.status !== 'בוטל');

      // גבייה — שדות מ-Base44: amount_to_collect, payment_due_date, collection_status
      const openCollections = collections.filter(c =>
        c.collection_status !== 'שולם ונשלחה חשבונית מס' &&
        c.collection_status !== 'בוטל / זיכוי' &&
        !c.is_closed
      );
      const openCollectionAmount = openCollections.reduce((s, c) => s + (Number(c.amount_to_collect) || Number(c.amount) || 0), 0);
      const overdueCollections = openCollections.filter(c => {
        const due = c.payment_due_date || c.due_date;
        return due && due < today;
      });
      const overdueAmount = overdueCollections.reduce((s, c) => s + (Number(c.amount_to_collect) || Number(c.amount) || 0), 0);
      const paidCollections = collections.filter(c => c.collection_status === 'שולם ונשלחה חשבונית מס');
      const paidAmount = paidCollections.reduce((s, c) => s + (Number(c.amount_to_collect) || Number(c.amount) || 0), 0);

      // הצעות
      const pendingQuotes = quotes.filter(q => ['טיוטה', 'מוכנה', 'נשלחה'].includes(q.status));
      const pendingQuotesTotal = pendingQuotes.reduce((s, q) => s + (Number(q.total) || Number(q.total_amount) || 0), 0);
      const approvedQuotes = quotes.filter(q => q.status === 'אושרה');
      const approvedTotal = approvedQuotes.reduce((s, q) => s + (Number(q.total) || Number(q.total_amount) || 0), 0);

      setData({
        activeProjects, planningProjects, overdueTasks, openTasks, openCollections,
        openCollectionAmount, overdueCollections, overdueAmount, paidAmount,
        pendingQuotes, pendingQuotesTotal, approvedTotal, projects, tasks, collections, quotes, workLogs
      });
    } catch (e) {
      console.error('Dashboard error:', e);
    }
    setLoading(false);
  };

  const Skeleton = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
      {[1,2,3,4].map(i => <div key={i} style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 14, height: 140 }} />)}
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: 32, minHeight: '100vh', background: 'var(--dark)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>לוח בקרה</h1>
          <Skeleton />
        </div>
      </div>
    );
  }

  const alerts = [];
  if (data.overdueCollections.length > 0)
    alerts.push({ icon: DollarSign, color: '#dc2626', bg: '#dc262612', border: '#dc262630', title: `${data.overdueCollections.length} תשלומים באיחור — ₪${fmt(data.overdueAmount)}`, items: data.overdueCollections.slice(0, 3).map(c => `${c.project_name || 'פרויקט'} — ₪${fmt(c.amount_to_collect || c.amount)}`), link: 'CollectionDashboard' });
  if (data.overdueTasks.length > 0)
    alerts.push({ icon: Clock, color: '#f59e0b', bg: '#f59e0b12', border: '#f59e0b30', title: `${data.overdueTasks.length} משימות עברו דדליין`, items: data.overdueTasks.slice(0, 3).map(t => t.title), link: 'Tasks' });
  if (data.openCollections.filter(c => c.collection_status === 'חשבון מאושר – יש לשלוח חשבון עסקה').length > 0) {
    const waiting = data.openCollections.filter(c => c.collection_status === 'חשבון מאושר – יש לשלוח חשבון עסקה');
    alerts.push({ icon: Receipt, color: '#f97316', bg: '#f9731612', border: '#f9731630', title: `${waiting.length} חשבוניות ממתינות לשליחה`, items: waiting.slice(0, 3).map(c => `${c.project_name || ''} — ₪${fmt(c.amount_to_collect || c.amount)}`), link: 'CollectionDashboard' });
  }

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'var(--dark)', fontFamily: 'Heebo, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* כותרת */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>שלום, ארגמן</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* התראות */}
        {alerts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {alerts.map((alert, i) => (
              <div key={i} onClick={() => navigate(createPageUrl(alert.link))} style={{
                background: alert.bg, border: `1px solid ${alert.border}`, borderRadius: 14,
                padding: '18px 24px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 16,
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${alert.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <alert.icon size={22} style={{ color: alert.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: alert.color }}>{alert.title}</p>
                  {alert.items.map((item, j) => (
                    <p key={j} style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>• {item}</p>
                  ))}
                </div>
                <ChevronLeft size={20} style={{ color: alert.color, marginTop: 10, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}

        {/* כרטיסים ראשיים */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            {
              label: 'גבייה פתוחה', value: `₪${fmt(data.openCollectionAmount)}`,
              sub: `${data.openCollections.length} חשבוניות`, icon: DollarSign,
              color: '#D4A843', link: 'CollectionDashboard'
            },
            {
              label: 'שולם', value: `₪${fmt(data.paidAmount)}`,
              sub: `${data.collections.filter(c => c.collection_status === 'שולם ונשלחה חשבונית מס').length} תשלומים`,
              icon: CheckCircle, color: '#22c55e', link: 'CollectionDashboard'
            },
            {
              label: 'פרויקטים פעילים', value: data.activeProjects.length,
              sub: `${data.planningProjects.length} בתכנון`, icon: FolderOpen,
              color: '#3b82f6', link: 'Projects'
            },
            {
              label: 'משימות פתוחות', value: data.openTasks.length,
              sub: data.overdueTasks.length > 0 ? `${data.overdueTasks.length} באיחור!` : 'הכל בזמן',
              icon: ClipboardList, color: data.overdueTasks.length > 0 ? '#f59e0b' : '#22c55e',
              link: 'Tasks'
            },
          ].map((card, i) => (
            <div key={i} onClick={() => navigate(createPageUrl(card.link))} style={{
              background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 14,
              padding: '22px 24px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = card.color + '60'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${card.color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--dark-border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ position: 'absolute', top: 0, right: 0, width: 4, height: '100%', background: card.color, borderRadius: '0 14px 14px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{card.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '8px 0 0' }}>{card.value}</p>
                  <p style={{ fontSize: 12, color: card.sub?.includes('!') ? card.color : 'var(--text-muted)', margin: '6px 0 0', fontWeight: card.sub?.includes('!') ? 600 : 400 }}>{card.sub}</p>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <card.icon size={22} style={{ color: card.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* שורה שנייה — הצעות + פרויקטים */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>

          {/* הצעות מחיר */}
          <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 14, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={20} style={{ color: '#3b82f6' }} /> הצעות מחיר
              </h3>
              <span onClick={() => navigate(createPageUrl('Quotes'))} style={{ fontSize: 13, color: 'var(--argaman)', cursor: 'pointer', fontWeight: 500 }}>הצג הכל</span>
            </div>

            {/* סיכום */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#3b82f60a', borderRadius: 12, padding: '16px 18px', border: '1px solid #3b82f620' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>בצנרת</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0' }}>₪{fmt(data.pendingQuotesTotal)}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{data.pendingQuotes.length} הצעות</p>
              </div>
              <div style={{ background: '#22c55e0a', borderRadius: 12, padding: '16px 18px', border: '1px solid #22c55e20' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>אושרו</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0' }}>₪{fmt(data.approvedTotal)}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{data.quotes.filter(q => q.status === 'אושרה').length} הצעות</p>
              </div>
            </div>

            {/* רשימת הצעות ממתינות */}
            {data.pendingQuotes.slice(0, 5).map((q, i) => (
              <div key={i} onClick={() => navigate(createPageUrl(`QuoteDetails?id=${q.id}`))} style={{
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: i < Math.min(data.pendingQuotes.length, 5) - 1 ? '1px solid var(--dark-border)' : 'none', transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--dark)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{q.title || q.client_name || `הצעה ${q.quote_number}`}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{q.status}</p>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--argaman)' }}>₪{fmt(Number(q.total) || Number(q.total_amount) || 0)}</span>
              </div>
            ))}
          </div>

          {/* פרויקטים פעילים */}
          <div style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 14, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <FolderOpen size={20} style={{ color: '#3b82f6' }} /> פרויקטים
              </h3>
              <span onClick={() => navigate(createPageUrl('Projects'))} style={{ fontSize: 13, color: 'var(--argaman)', cursor: 'pointer', fontWeight: 500 }}>הצג הכל</span>
            </div>

            {[...data.activeProjects, ...data.planningProjects].map((p, i) => {
              const statusColor = p.status === 'בביצוע' ? '#3b82f6' : '#f59e0b';
              const projectCollections = data.collections.filter(c => c.project_id === p.id);
              const projectPaid = projectCollections.filter(c => c.collection_status === 'שולם ונשלחה חשבונית מס').reduce((s, c) => s + (Number(c.amount_to_collect) || 0), 0);
              const projectOpen = projectCollections.filter(c => c.collection_status !== 'שולם ונשלחה חשבונית מס' && c.collection_status !== 'בוטל / זיכוי').reduce((s, c) => s + (Number(c.amount_to_collect) || 0), 0);
              const projectTasks = data.tasks.filter(t => t.project_id === p.id && t.status !== 'הושלם' && t.status !== 'בוטל');

              return (
                <div key={i} onClick={() => navigate(createPageUrl(`ProjectDetails?id=${p.id}`))} style={{
                  padding: '16px 18px', borderRadius: 12, border: '1px solid var(--dark-border)', marginBottom: 10, cursor: 'pointer', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--argaman-border)'; e.currentTarget.style.background = 'var(--dark)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--dark-border)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name?.replace('פרויקט - ', '')}</p>
                    <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: statusColor + '15', padding: '3px 10px', borderRadius: 20 }}>{p.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-muted)' }}>
                    {projectOpen > 0 && <span>גבייה פתוחה: ₪{fmt(projectOpen)}</span>}
                    {projectPaid > 0 && <span style={{ color: '#22c55e' }}>שולם: ₪{fmt(projectPaid)}</span>}
                    {projectTasks.length > 0 && <span>{projectTasks.length} משימות פתוחות</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
