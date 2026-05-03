
import React, { useState, useEffect, useMemo } from "react";
import { Project, Task, CollectionTask, WorkLogEntry, Quote, PurchaseRecord, ProgressEntry } from "@/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  AlertTriangle, DollarSign, FolderOpen, ClipboardList,
  Clock, FileText, CheckCircle, AlertCircle, ChevronLeft,
  Receipt, Package, HardHat, TrendingUp, Calendar
} from "lucide-react";

const fmt = (n) => '₪' + new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 }).format(n || 0);
const fmtNum = (n) => new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 }).format(n || 0);
const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#dc2626', '#8b5cf6', '#06b6d4'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [d, setD] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [projects, tasks, collections, workLogs, quotes, purchases, progress] = await Promise.all([
        Project.list('-created_date', 200), Task.list('-created_date', 500),
        CollectionTask.list('-created_date', 500), WorkLogEntry.list('-created_date', 200),
        Quote.list('-created_date', 500), PurchaseRecord.list('-created_date', 2000),
        ProgressEntry.list('-created_date', 1000),
      ]);
      setD({ projects, tasks, collections, workLogs, quotes, purchases, progress });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const computed = useMemo(() => {
    if (!d) return null;
    const today = new Date().toISOString().split('T')[0];
    const active = d.projects.filter(p => p.status === 'בביצוע');
    const planning = d.projects.filter(p => p.status === 'בתכנון');

    // גבייה
    const openColl = d.collections.filter(c => c.collection_status !== 'שולם ונשלחה חשבונית מס' && c.collection_status !== 'בוטל / זיכוי' && !c.is_closed);
    const openAmount = openColl.reduce((s, c) => s + (Number(c.amount_to_collect) || Number(c.amount) || 0), 0);
    const overdueColl = openColl.filter(c => (c.payment_due_date || c.due_date) && (c.payment_due_date || c.due_date) < today);
    const overdueAmount = overdueColl.reduce((s, c) => s + (Number(c.amount_to_collect) || Number(c.amount) || 0), 0);
    const paidColl = d.collections.filter(c => c.collection_status === 'שולם ונשלחה חשבונית מס');
    const paidAmount = paidColl.reduce((s, c) => s + (Number(c.amount_to_collect) || Number(c.amount) || 0), 0);

    // משימות
    const overdueTasks = d.tasks.filter(t => t.status !== 'הושלם' && t.status !== 'בוטל' && t.due_date && t.due_date < today);
    const openTasks = d.tasks.filter(t => t.status !== 'הושלם' && t.status !== 'בוטל');

    // הצעות
    const pendingQ = d.quotes.filter(q => ['טיוטה', 'מוכנה', 'נשלחה'].includes(q.status));
    const pendingTotal = pendingQ.reduce((s, q) => s + (Number(q.total) || 0), 0);
    const approvedQ = d.quotes.filter(q => q.status === 'אושרה');
    const approvedTotal = approvedQ.reduce((s, q) => s + (Number(q.total) || 0), 0);

    // רכש
    const toOrder = d.purchases.filter(p => p.status === 'יש להזמין' || p.status === 'טרם הוזמן');
    const ordered = d.purchases.filter(p => p.status === 'הוזמן');
    const delivered = d.purchases.filter(p => p.status === 'סופק מלא' || p.status === 'סופק');
    const purchaseSpent = d.purchases.reduce((s, p) => s + (Number(p.actual_total_cost) || 0), 0);

    // יומני עבודה — 30 יום
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogs = d.workLogs.filter(w => new Date(w.date || w.created_date) > thirtyDaysAgo);
    const totalHours = recentLogs.reduce((s, w) => s + (Number(w.total_hours) || 0), 0);
    const totalWorkers = recentLogs.reduce((s, w) => s + (Number(w.number_of_workers) || 0), 0);

    // פרויקטים עם נתונים
    const projectData = [...active, ...planning].map(p => {
      const pColl = d.collections.filter(c => c.project_id === p.id);
      const paid = pColl.filter(c => c.collection_status === 'שולם ונשלחה חשבונית מס').reduce((s, c) => s + (Number(c.amount_to_collect) || 0), 0);
      const open = pColl.filter(c => c.collection_status !== 'שולם ונשלחה חשבונית מס' && c.collection_status !== 'בוטל / זיכוי').reduce((s, c) => s + (Number(c.amount_to_collect) || 0), 0);
      const pProgress = d.progress.filter(pe => pe.project_id === p.id);
      const invoiced = pProgress.reduce((s, pe) => s + (Number(pe.amount_to_invoice) || 0), 0);
      const pQuote = approvedQ.find(q => q.lead_id === p.lead_id);
      const budget = Number(pQuote?.total) || 0;
      const pct = budget > 0 ? Math.min((invoiced / budget) * 100, 100) : 0;
      const pTasks = d.tasks.filter(t => t.project_id === p.id && t.status !== 'הושלם' && t.status !== 'בוטל');
      const pPurchases = d.purchases.filter(pr => pr.project_id === p.id);
      const purchaseTotal = pPurchases.reduce((s, pr) => s + (Number(pr.actual_total_cost) || 0), 0);
      return { ...p, paid, open, invoiced, budget, pct, openTasks: pTasks.length, purchaseTotal, purchaseCount: pPurchases.length };
    });

    // גרף גבייה לפי פרויקט
    const collectionChart = projectData.filter(p => p.paid > 0 || p.open > 0).map(p => ({
      name: p.name?.replace('פרויקט - ', '').substring(0, 15), paid: p.paid, open: p.open,
    }));

    // גרף רכש לפי סטטוס
    const purchaseChart = [
      { name: 'ממתין להזמנה', value: toOrder.length, color: '#f59e0b' },
      { name: 'הוזמן', value: ordered.length, color: '#3b82f6' },
      { name: 'סופק', value: delivered.length, color: '#22c55e' },
    ].filter(x => x.value > 0);

    return {
      active, planning, openColl, openAmount, overdueColl, overdueAmount, paidAmount,
      overdueTasks, openTasks, pendingQ, pendingTotal, approvedTotal,
      toOrder, ordered, delivered, purchaseSpent, recentLogs, totalHours, totalWorkers,
      projectData, collectionChart, purchaseChart,
    };
  }, [d]);

  if (loading || !computed) {
    return (
      <div style={{ padding: 32, minHeight: '100vh', background: 'var(--dark)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ height: 32, width: 200, background: 'var(--dark-border)', borderRadius: 8, marginBottom: 24 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 14, height: 130, animation: 'pulse 1.5s infinite' }} />)}
          </div>
        </div>
      </div>
    );
  }

  const Card = ({ children, style, onClick, ...p }) => (
    <div onClick={onClick} style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 14, padding: 24, cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s', ...style }}
      onMouseEnter={onClick ? e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; } : undefined}
      onMouseLeave={onClick ? e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; } : undefined}
      {...p}>{children}</div>
  );

  const alerts = [];
  if (computed.overdueColl.length > 0) alerts.push({ icon: DollarSign, color: '#dc2626', title: `${computed.overdueColl.length} תשלומים באיחור — ${fmt(computed.overdueAmount)}`, sub: computed.overdueColl.slice(0,2).map(c => c.project_name || 'פרויקט').join(', '), link: 'CollectionDashboard' });
  if (computed.overdueTasks.length > 0) alerts.push({ icon: Clock, color: '#f59e0b', title: `${computed.overdueTasks.length} משימות עברו דדליין`, sub: computed.overdueTasks.slice(0,2).map(t => t.title).join(', '), link: 'Tasks' });
  if (computed.toOrder.filter(p => p.status === 'יש להזמין').length > 0) alerts.push({ icon: Package, color: '#f97316', title: `${computed.toOrder.filter(p => p.status === 'יש להזמין').length} פריטי רכש ממתינים להזמנה`, sub: 'יש ליצור הזמנות רכש', link: 'Projects' });

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh', background: 'var(--dark)', fontFamily: 'Heebo, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* כותרת */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>שלום, ארגמן</h1>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: 14 }}>
              {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ background: 'var(--argaman)', color: '#fff', padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
              {computed.active.length} פרויקטים פעילים
            </div>
          </div>
        </div>

        {/* התראות */}
        {alerts.length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {alerts.map((a, i) => (
              <div key={i} onClick={() => navigate(createPageUrl(a.link))} style={{
                flex: '1 1 300px', background: `${a.color}08`, border: `1px solid ${a.color}25`, borderRadius: 12,
                padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'transform 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <a.icon size={20} style={{ color: a.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: a.color }}>{a.title}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.sub}</p>
                </div>
                <ChevronLeft size={18} style={{ color: a.color, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}

        {/* כרטיסים ראשיים */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'גבייה פתוחה', val: fmt(computed.openAmount), sub: `${computed.openColl.length} חשבוניות`, icon: DollarSign, color: '#D4A843', link: 'CollectionDashboard' },
            { label: 'שולם', val: fmt(computed.paidAmount), sub: 'נגבה', icon: CheckCircle, color: '#22c55e', link: 'CollectionDashboard' },
            { label: 'הצעות בצנרת', val: fmt(computed.pendingTotal), sub: `${computed.pendingQ.length} הצעות`, icon: FileText, color: '#3b82f6', link: 'Quotes' },
            { label: 'רכש', val: fmt(computed.purchaseSpent), sub: `${computed.ordered.length} הזמנות פתוחות`, icon: Package, color: '#8b5cf6', link: 'Projects' },
            { label: 'שעות עבודה', val: fmtNum(computed.totalHours), sub: `${computed.recentLogs.length} יומנים (30 יום)`, icon: HardHat, color: '#06b6d4', link: 'Projects' },
          ].map((c, i) => (
            <Card key={i} onClick={() => navigate(createPageUrl(c.link))} style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 3, height: '100%', background: c.color }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>{c.label}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0 0' }}>{c.val}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>{c.sub}</p>
                </div>
                <c.icon size={20} style={{ color: c.color, opacity: 0.5 }} />
              </div>
            </Card>
          ))}
        </div>

        {/* גרפים */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* גבייה לפי פרויקט */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>גבייה לפי פרויקט</h3>
            {computed.collectionChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={computed.collectionChart} layout="vertical" margin={{ right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--dark-border)" />
                  <XAxis type="number" tickFormatter={v => `₪${fmtNum(v)}`} style={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} style={{ fontSize: 12 }} tick={{ fill: 'var(--text-secondary)' }} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="paid" name="שולם" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="open" name="פתוח" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 40 }}>אין נתוני גבייה</p>}
          </Card>

          {/* רכש לפי סטטוס */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>רכש לפי סטטוס</h3>
            {computed.purchaseChart.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={computed.purchaseChart} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                      {computed.purchaseChart.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, name) => [`${v} פריטים`, name]} contentStyle={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
                  {computed.purchaseChart.map((entry, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: entry.color }} />
                      {entry.name} ({entry.value})
                    </div>
                  ))}
                </div>
              </>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 40 }}>אין נתוני רכש</p>}
          </Card>
        </div>

        {/* פרויקטים — כרטיסי התקדמות */}
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>התקדמות פרויקטים</h3>
            <span onClick={() => navigate(createPageUrl('Projects'))} style={{ fontSize: 13, color: 'var(--argaman)', cursor: 'pointer', fontWeight: 500 }}>הצג הכל</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {computed.projectData.map((p, i) => {
              const statusColor = p.status === 'בביצוע' ? '#3b82f6' : '#f59e0b';
              return (
                <div key={i} onClick={() => navigate(createPageUrl(`ProjectDetails?id=${p.id}`))} style={{
                  padding: '16px 20px', borderRadius: 12, border: '1px solid var(--dark-border)', cursor: 'pointer', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--argaman-border)'; e.currentTarget.style.background = 'var(--dark)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--dark-border)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name?.replace('פרויקט - ', '')}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: statusColor + '12', padding: '2px 10px', borderRadius: 20 }}>{p.status}</span>
                    </div>
                    {p.budget > 0 && <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(p.budget)}</span>}
                  </div>

                  {/* בר התקדמות */}
                  {p.budget > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ height: 8, background: 'var(--dark)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(p.pct, 100)}%`, background: p.pct > 80 ? '#22c55e' : p.pct > 40 ? '#3b82f6' : '#f59e0b', borderRadius: 4, transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>חויב: {fmt(p.invoiced)}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: p.pct > 80 ? '#22c55e' : 'var(--text-secondary)' }}>{p.pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  )}

                  {/* מטריקות */}
                  <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
                    {p.open > 0 && <span style={{ color: '#D4A843', fontWeight: 500 }}>גבייה פתוחה: {fmt(p.open)}</span>}
                    {p.paid > 0 && <span style={{ color: '#22c55e' }}>שולם: {fmt(p.paid)}</span>}
                    {p.openTasks > 0 && <span style={{ color: 'var(--text-muted)' }}>{p.openTasks} משימות</span>}
                    {p.purchaseCount > 0 && <span style={{ color: '#8b5cf6' }}>{p.purchaseCount} פריטי רכש</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* שורה תחתונה — יומני עבודה + הצעות */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>

          {/* יומני עבודה אחרונים */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} style={{ color: '#06b6d4' }} /> יומני עבודה אחרונים
            </h3>
            {d.workLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 20 }}>אין יומני עבודה</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {d.workLogs.slice(0, 6).map((w, i) => {
                  const proj = d.projects.find(p => p.id === w.project_id);
                  return (
                    <div key={i} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--dark-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{proj?.name?.replace('פרויקט - ', '') || 'פרויקט'}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)', maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.work_description?.substring(0, 60)}</p>
                      </div>
                      <div style={{ textAlign: 'left', flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#06b6d4' }}>{w.total_hours || w.working_hours || 0} שעות</p>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{w.number_of_workers || 0} עובדים</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* הצעות מחיר */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} style={{ color: '#3b82f6' }} /> הצעות מחיר
              </h3>
              <span onClick={() => navigate(createPageUrl('Quotes'))} style={{ fontSize: 13, color: 'var(--argaman)', cursor: 'pointer', fontWeight: 500 }}>הצג הכל</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: '#3b82f608', borderRadius: 10, padding: '14px 16px', border: '1px solid #3b82f618' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>בצנרת</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0' }}>{fmt(computed.pendingTotal)}</p>
              </div>
              <div style={{ background: '#22c55e08', borderRadius: 10, padding: '14px 16px', border: '1px solid #22c55e18' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>אושרו</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0' }}>{fmt(computed.approvedTotal)}</p>
              </div>
            </div>
            {computed.pendingQ.slice(0, 4).map((q, i) => (
              <div key={i} onClick={() => navigate(createPageUrl(`QuoteDetails?id=${q.id}`))} style={{
                padding: '10px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid var(--dark-border)', transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--dark)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{q.title || q.client_name || `הצעה ${q.quote_number}`}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{q.status}</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--argaman)' }}>{fmt(Number(q.total) || 0)}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
