import React, { useState, useEffect, useMemo } from "react";
import {
  Project, Quote, QuoteLine, CollectionTask,
  PurchaseRecord, SubContractor, WorkLogEntry, ProgressEntry
} from "@/entities";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { exportToCSV } from "@/lib/exportExcel";
import { Download, TrendingUp, TrendingDown, DollarSign, Percent, Clock, AlertTriangle, Layers, FileText } from "lucide-react";

const HOURLY_RATE = 3500 / 18;

const TABS = [
  { key: "pnl", label: "רווח/הפסד" },
  { key: "projects", label: "סטטוס פרויקטים" },
  { key: "forecast", label: "צפי הכנסות" },
  { key: "expenses", label: "הוצאות" },
  { key: "aging", label: "גיול חובות" },
];

const CHART_COLORS = ["#D4A843", "#60a5fa", "#4ade80", "#f87171", "#a78bfa", "#fbbf24"];

const tooltipStyle = {
  contentStyle: {
    background: '#1e1e36',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: '#f0f0f0',
    fontFamily: 'Heebo',
    fontSize: 13,
  },
  labelStyle: { color: '#a0a0b8' },
};

const fmt = (n) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n || 0);
const fmtNum = (n) => new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 }).format(n || 0);
const fmtPct = (n) => (n || 0).toFixed(1) + '%';

const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("pnl");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    projects: [], quotes: [], quoteLines: [], collections: [],
    purchases: [], subcontractors: [], workLogs: [], progress: []
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projects, quotes, quoteLines, collections, purchases, subcontractors, workLogs, progress] =
        await Promise.all([
          Project.list('-created_date', 500),
          Quote.list('-created_date', 500),
          QuoteLine.list('-created_date', 2000),
          CollectionTask.list('-created_date', 2000),
          PurchaseRecord.list('-created_date', 2000),
          SubContractor.list('-created_date', 2000),
          WorkLogEntry.list('-created_date', 2000),
          ProgressEntry.list('-created_date', 2000),
        ]);
      setData({ projects, quotes, quoteLines, collections, purchases, subcontractors, workLogs, progress });
    } catch (e) {
      console.error('Error loading report data:', e);
    }
    setLoading(false);
  };

  // ========== P&L חישובים ==========
  const pnlData = useMemo(() => {
    const paidCollections = data.collections.filter(c =>
      c.status === 'שולם ונשלחה חשבונית מס' || c.status === 'שולם'
    );

    const monthMap = {};

    paidCollections.forEach(c => {
      const d = c.payment_date || c.due_date || c.created_date;
      if (!d) return;
      const dt = new Date(d);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { income: 0, expenses: 0 };
      monthMap[key].income += Number(c.amount) || 0;
    });

    data.purchases.forEach(p => {
      const d = p.date || p.created_date;
      if (!d) return;
      const dt = new Date(d);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { income: 0, expenses: 0 };
      monthMap[key].expenses += Number(p.amount) || Number(p.total) || 0;
    });

    data.subcontractors.forEach(s => {
      const d = s.date || s.created_date;
      if (!d) return;
      const dt = new Date(d);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { income: 0, expenses: 0 };
      monthMap[key].expenses += Number(s.amount) || Number(s.total) || 0;
    });

    data.workLogs.forEach(w => {
      const d = w.date || w.created_date;
      if (!d) return;
      const dt = new Date(d);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { income: 0, expenses: 0 };
      monthMap[key].expenses += (Number(w.total_hours) || 0) * HOURLY_RATE;
    });

    const sorted = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]));
    const rows = sorted.map(([key, val]) => {
      const [y, m] = key.split('-');
      const profit = val.income - val.expenses;
      return {
        key,
        month: `${MONTHS_HE[parseInt(m) - 1]} ${y}`,
        income: val.income,
        expenses: val.expenses,
        profit,
        margin: val.income > 0 ? (profit / val.income) * 100 : 0,
      };
    });

    const totalIncome = rows.reduce((s, r) => s + r.income, 0);
    const totalExpenses = rows.reduce((s, r) => s + r.expenses, 0);
    const totalProfit = totalIncome - totalExpenses;
    const totalMargin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0;

    return { rows, totalIncome, totalExpenses, totalProfit, totalMargin };
  }, [data]);

  // ========== סטטוס פרויקטים ==========
  const projectStatus = useMemo(() => {
    const approvedQuotes = data.quotes.filter(q => q.status === 'אושרה');
    const quoteByProject = {};
    approvedQuotes.forEach(q => {
      if (q.project_id) {
        if (!quoteByProject[q.project_id]) quoteByProject[q.project_id] = 0;
        quoteByProject[q.project_id] += Number(q.total) || Number(q.total_amount) || 0;
      }
    });

    const invoicedByProject = {};
    data.progress.forEach(p => {
      if (p.project_id) {
        if (!invoicedByProject[p.project_id]) invoicedByProject[p.project_id] = 0;
        invoicedByProject[p.project_id] += Number(p.amount) || Number(p.total) || 0;
      }
    });

    const paidByProject = {};
    data.collections.filter(c => c.status === 'שולם ונשלחה חשבונית מס' || c.status === 'שולם').forEach(c => {
      if (c.project_id) {
        if (!paidByProject[c.project_id]) paidByProject[c.project_id] = 0;
        paidByProject[c.project_id] += Number(c.amount) || 0;
      }
    });

    const activeProjects = data.projects.filter(p => p.status !== 'בוטל');
    return activeProjects.map(p => {
      const approved = quoteByProject[p.id] || 0;
      const invoiced = invoicedByProject[p.id] || 0;
      const paid = paidByProject[p.id] || 0;
      const remaining = approved - paid;
      const paidPct = approved > 0 ? (paid / approved) * 100 : 0;
      return {
        id: p.id,
        name: p.name || p.project_name || '—',
        client: p.client_name || '',
        approved,
        invoiced,
        paid,
        remaining: remaining > 0 ? remaining : 0,
        paidPct,
        status: p.status,
      };
    }).filter(p => p.approved > 0 || p.invoiced > 0 || p.paid > 0);
  }, [data]);

  // ========== צפי הכנסות ==========
  const forecast = useMemo(() => {
    const openQuotes = data.quotes.filter(q => ['טיוטה', 'מוכנה', 'נשלחה'].includes(q.status));
    const approvedQuotes = data.quotes.filter(q => q.status === 'אושרה');
    const activeProjects = data.projects.filter(p => p.status === 'בביצוע');

    const openTotal = openQuotes.reduce((s, q) => s + (Number(q.total) || Number(q.total_amount) || 0), 0);
    const approvedTotal = approvedQuotes.reduce((s, q) => s + (Number(q.total) || Number(q.total_amount) || 0), 0);

    const paidByProject = {};
    data.collections.filter(c => c.status === 'שולם ונשלחה חשבונית מס' || c.status === 'שולם').forEach(c => {
      if (c.project_id) {
        if (!paidByProject[c.project_id]) paidByProject[c.project_id] = 0;
        paidByProject[c.project_id] += Number(c.amount) || 0;
      }
    });

    const quoteByProject = {};
    approvedQuotes.forEach(q => {
      if (q.project_id) {
        if (!quoteByProject[q.project_id]) quoteByProject[q.project_id] = 0;
        quoteByProject[q.project_id] += Number(q.total) || Number(q.total_amount) || 0;
      }
    });

    const activeRemaining = activeProjects.reduce((s, p) => {
      const approved = quoteByProject[p.id] || 0;
      const paid = paidByProject[p.id] || 0;
      return s + Math.max(0, approved - paid);
    }, 0);

    return {
      openQuotes: { count: openQuotes.length, total: openTotal },
      approvedQuotes: { count: approvedQuotes.length, total: approvedTotal },
      activeRemaining: { count: activeProjects.length, total: activeRemaining },
    };
  }, [data]);

  // ========== הוצאות ==========
  const expenseData = useMemo(() => {
    const purchaseTotal = data.purchases.reduce((s, p) => s + (Number(p.amount) || Number(p.total) || 0), 0);
    const subTotal = data.subcontractors.reduce((s, p) => s + (Number(p.amount) || Number(p.total) || 0), 0);
    const laborTotal = data.workLogs.reduce((s, w) => s + (Number(w.total_hours) || 0) * HOURLY_RATE, 0);

    const pieData = [
      { name: 'רכש', value: purchaseTotal },
      { name: 'קבלני משנה', value: subTotal },
      { name: 'עבודה', value: laborTotal },
    ].filter(d => d.value > 0);

    // לפי פרויקט
    const byProject = {};
    const addToProject = (pid, field, amount) => {
      if (!pid) return;
      if (!byProject[pid]) byProject[pid] = { procurement: 0, subcontractor: 0, labor: 0 };
      byProject[pid][field] += amount;
    };

    data.purchases.forEach(p => addToProject(p.project_id, 'procurement', Number(p.amount) || Number(p.total) || 0));
    data.subcontractors.forEach(s => addToProject(s.project_id, 'subcontractor', Number(s.amount) || Number(s.total) || 0));
    data.workLogs.forEach(w => addToProject(w.project_id, 'labor', (Number(w.total_hours) || 0) * HOURLY_RATE));

    const projectMap = {};
    data.projects.forEach(p => { projectMap[p.id] = p.name || p.project_name || '—'; });

    const projectRows = Object.entries(byProject).map(([pid, vals]) => ({
      projectName: projectMap[pid] || pid,
      procurement: vals.procurement,
      subcontractor: vals.subcontractor,
      labor: vals.labor,
      total: vals.procurement + vals.subcontractor + vals.labor,
    })).sort((a, b) => b.total - a.total);

    return { purchaseTotal, subTotal, laborTotal, grandTotal: purchaseTotal + subTotal + laborTotal, pieData, projectRows };
  }, [data]);

  // ========== גיול חובות ==========
  const agingData = useMemo(() => {
    const unpaid = data.collections.filter(c =>
      c.status !== 'שולם ונשלחה חשבונית מס' && c.status !== 'שולם' && c.status !== 'בוטל / זיכוי'
    );

    const now = new Date();
    const projectMap = {};
    data.projects.forEach(p => { projectMap[p.id] = p; });

    const rows = unpaid.map(c => {
      const dueDate = c.due_date || c.created_date;
      const dt = dueDate ? new Date(dueDate) : now;
      const daysOverdue = Math.max(0, Math.floor((now - dt) / (1000 * 60 * 60 * 24)));
      const proj = projectMap[c.project_id];
      return {
        id: c.id,
        client: proj?.client_name || c.client_name || '—',
        project: proj?.name || proj?.project_name || c.project_name || '—',
        amount: Number(c.amount) || 0,
        invoiceDate: dueDate || '',
        daysOverdue,
        status: c.status || '—',
        bucket: daysOverdue <= 30 ? '0-30' : daysOverdue <= 60 ? '31-60' : daysOverdue <= 90 ? '61-90' : '90+',
      };
    }).sort((a, b) => b.daysOverdue - a.daysOverdue);

    const buckets = {
      '0-30': rows.filter(r => r.bucket === '0-30').reduce((s, r) => s + r.amount, 0),
      '31-60': rows.filter(r => r.bucket === '31-60').reduce((s, r) => s + r.amount, 0),
      '61-90': rows.filter(r => r.bucket === '61-90').reduce((s, r) => s + r.amount, 0),
      '90+': rows.filter(r => r.bucket === '90+').reduce((s, r) => s + r.amount, 0),
    };

    return { rows, buckets, total: rows.reduce((s, r) => s + r.amount, 0) };
  }, [data]);

  // ========== ייצוא ==========
  const handleExport = () => {
    switch (activeTab) {
      case 'pnl':
        exportToCSV(pnlData.rows, [
          { key: 'month', label: 'חודש' },
          { key: 'income', label: 'הכנסות' },
          { key: 'expenses', label: 'הוצאות' },
          { key: 'profit', label: 'רווח' },
          { key: 'margin', label: 'אחוז רווח' },
        ], 'דוח-רווח-הפסד');
        break;
      case 'projects':
        exportToCSV(projectStatus, [
          { key: 'name', label: 'שם פרויקט' },
          { key: 'approved', label: 'סכום מאושר' },
          { key: 'invoiced', label: 'סכום שחויב' },
          { key: 'paid', label: 'סכום ששולם' },
          { key: 'remaining', label: 'יתרה לגבייה' },
        ], 'סטטוס-פרויקטים');
        break;
      case 'forecast':
        exportToCSV([
          { category: 'הצעות מחיר פתוחות', count: forecast.openQuotes.count, total: forecast.openQuotes.total },
          { category: 'הצעות שאושרו', count: forecast.approvedQuotes.count, total: forecast.approvedQuotes.total },
          { category: 'יתרה בפרויקטים פעילים', count: forecast.activeRemaining.count, total: forecast.activeRemaining.total },
        ], [
          { key: 'category', label: 'קטגוריה' },
          { key: 'count', label: 'כמות' },
          { key: 'total', label: 'סכום' },
        ], 'צפי-הכנסות');
        break;
      case 'expenses':
        exportToCSV(expenseData.projectRows, [
          { key: 'projectName', label: 'פרויקט' },
          { key: 'procurement', label: 'רכש' },
          { key: 'subcontractor', label: 'קבלני משנה' },
          { key: 'labor', label: 'עבודה' },
          { key: 'total', label: 'סה"כ' },
        ], 'דוח-הוצאות');
        break;
      case 'aging':
        exportToCSV(agingData.rows.map(r => ({
          ...r,
          invoiceDate: r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString('he-IL') : '',
        })), [
          { key: 'client', label: 'לקוח' },
          { key: 'project', label: 'פרויקט' },
          { key: 'amount', label: 'סכום' },
          { key: 'invoiceDate', label: 'תאריך חשבונית' },
          { key: 'daysOverdue', label: 'ימי איחור' },
          { key: 'status', label: 'סטטוס' },
        ], 'גיול-חובות');
        break;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 32, background: 'var(--dark)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 18 }}>טוען נתונים...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: 'var(--dark)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* כותרת */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>דוחות כספיים</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>ניתוח פיננסי מקיף של הפרויקטים</p>
          </div>
          <button className="btn btn-primary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} />
            ייצוא לאקסל
          </button>
        </div>

        {/* טאבים */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--dark-card)', borderRadius: 12, padding: 4, border: '1px solid var(--dark-border)' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Heebo',
                fontSize: 14,
                fontWeight: activeTab === tab.key ? 600 : 400,
                background: activeTab === tab.key ? 'linear-gradient(135deg, var(--argaman), var(--argaman-dark))' : 'transparent',
                color: activeTab === tab.key ? 'var(--dark)' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* תוכן */}
        {activeTab === 'pnl' && <PnLTab data={pnlData} />}
        {activeTab === 'projects' && <ProjectsTab data={projectStatus} />}
        {activeTab === 'forecast' && <ForecastTab data={forecast} />}
        {activeTab === 'expenses' && <ExpensesTab data={expenseData} />}
        {activeTab === 'aging' && <AgingTab data={agingData} />}
      </div>
    </div>
  );
}

// ========== רווח/הפסד ==========
function PnLTab({ data }) {
  return (
    <div>
      {/* כרטיסי סיכום */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <SummaryCard icon={<TrendingUp size={20} />} label="סה״כ הכנסות" value={fmt(data.totalIncome)} color="var(--success)" />
        <SummaryCard icon={<TrendingDown size={20} />} label="סה״כ הוצאות" value={fmt(data.totalExpenses)} color="var(--danger)" />
        <SummaryCard icon={<DollarSign size={20} />} label="סה״כ רווח" value={fmt(data.totalProfit)} color={data.totalProfit >= 0 ? 'var(--success)' : 'var(--danger)'} />
        <SummaryCard icon={<Percent size={20} />} label="אחוז רווח" value={fmtPct(data.totalMargin)} color="var(--argaman)" />
      </div>

      {/* גרף */}
      {data.rows.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>רווח/הפסד חודשי</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.rows} style={{ direction: 'ltr' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#a0a0b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#a0a0b8', fontSize: 12 }} tickFormatter={v => fmtNum(v)} />
              <Tooltip {...tooltipStyle} formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ color: '#a0a0b8', fontSize: 13 }} />
              <Bar dataKey="income" name="הכנסות" fill="#4ade80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="הוצאות" fill="#f87171" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="רווח" fill="#D4A843" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* טבלה */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>חודש</th>
                <th>הכנסות</th>
                <th>הוצאות</th>
                <th>רווח</th>
                <th>אחוז רווח</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map(r => (
                <tr key={r.key}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.month}</td>
                  <td style={{ color: 'var(--success)' }}>{fmt(r.income)}</td>
                  <td style={{ color: 'var(--danger)' }}>{fmt(r.expenses)}</td>
                  <td style={{ color: r.profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{fmt(r.profit)}</td>
                  <td>{fmtPct(r.margin)}</td>
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32 }}>אין נתונים להצגה</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ========== סטטוס פרויקטים ==========
function ProjectsTab({ data }) {
  const totals = useMemo(() => ({
    approved: data.reduce((s, r) => s + r.approved, 0),
    invoiced: data.reduce((s, r) => s + r.invoiced, 0),
    paid: data.reduce((s, r) => s + r.paid, 0),
    remaining: data.reduce((s, r) => s + r.remaining, 0),
  }), [data]);

  const getColor = (pct) => pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
  const getBadge = (pct) => pct >= 80 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger';

  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>שם פרויקט</th>
              <th>סכום מאושר</th>
              <th>סכום שחויב</th>
              <th>סכום ששולם</th>
              <th>יתרה לגבייה</th>
              <th>% תשלום</th>
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.id}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.name}</td>
                <td>{fmt(r.approved)}</td>
                <td>{fmt(r.invoiced)}</td>
                <td style={{ color: getColor(r.paidPct) }}>{fmt(r.paid)}</td>
                <td style={{ color: r.remaining > 0 ? 'var(--warning)' : 'var(--success)' }}>{fmt(r.remaining)}</td>
                <td><span className={`badge ${getBadge(r.paidPct)}`}>{fmtPct(r.paidPct)}</span></td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}>אין נתונים להצגה</td></tr>
            )}
            {data.length > 0 && (
              <tr style={{ background: 'var(--argaman-bg)' }}>
                <td style={{ color: 'var(--argaman)', fontWeight: 700 }}>סה״כ</td>
                <td style={{ color: 'var(--argaman)', fontWeight: 600 }}>{fmt(totals.approved)}</td>
                <td style={{ color: 'var(--argaman)', fontWeight: 600 }}>{fmt(totals.invoiced)}</td>
                <td style={{ color: 'var(--argaman)', fontWeight: 600 }}>{fmt(totals.paid)}</td>
                <td style={{ color: 'var(--argaman)', fontWeight: 600 }}>{fmt(totals.remaining)}</td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========== צפי הכנסות ==========
function ForecastTab({ data }) {
  const cards = [
    { label: 'הצעות מחיר פתוחות', icon: <FileText size={24} />, count: data.openQuotes.count, total: data.openQuotes.total, color: 'var(--info)' },
    { label: 'הצעות שאושרו', icon: <TrendingUp size={24} />, count: data.approvedQuotes.count, total: data.approvedQuotes.total, color: 'var(--success)' },
    { label: 'יתרה בפרויקטים פעילים', icon: <Layers size={24} />, count: data.activeRemaining.count, total: data.activeRemaining.total, color: 'var(--argaman)' },
  ];

  const totalPipeline = cards.reduce((s, c) => s + c.total, 0);

  return (
    <div>
      {/* כרטיסים */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map((c, i) => (
          <div key={i} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 4, height: '100%', background: c.color, borderRadius: '0 12px 12px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ color: c.color }}>{c.icon}</div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{c.label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{fmt(c.total)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.count} פריטים</div>
            {/* בר */}
            {totalPipeline > 0 && (
              <div style={{ marginTop: 12, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${(c.total / totalPipeline) * 100}%`, background: c.color, borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* סה"כ */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>סה״כ צפי הכנסות</div>
        <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--argaman)' }}>{fmt(totalPipeline)}</div>
      </div>
    </div>
  );
}

// ========== הוצאות ==========
function ExpensesTab({ data }) {
  return (
    <div>
      {/* כרטיסי סיכום */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <SummaryCard icon={<DollarSign size={20} />} label="רכש" value={fmt(data.purchaseTotal)} color="#60a5fa" />
        <SummaryCard icon={<DollarSign size={20} />} label="קבלני משנה" value={fmt(data.subTotal)} color="#a78bfa" />
        <SummaryCard icon={<Clock size={20} />} label="עבודה" value={fmt(data.laborTotal)} color="#4ade80" />
        <SummaryCard icon={<TrendingDown size={20} />} label="סה״כ הוצאות" value={fmt(data.grandTotal)} color="var(--danger)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: data.pieData.length > 0 ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 24 }}>
        {/* גרף עוגה */}
        {data.pieData.length > 0 && (
          <div className="card">
            <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>התפלגות הוצאות</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#a0a0b8' }}
                >
                  {data.pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* אגדה */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 600 }}>פירוט</h3>
          {data.pieData.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: CHART_COLORS[i] }} />
                <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
              </div>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{fmt(d.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* טבלה לפי פרויקט */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>פרויקט</th>
                <th>רכש</th>
                <th>קבלני משנה</th>
                <th>עבודה</th>
                <th>סה״כ</th>
              </tr>
            </thead>
            <tbody>
              {data.projectRows.map((r, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.projectName}</td>
                  <td>{fmt(r.procurement)}</td>
                  <td>{fmt(r.subcontractor)}</td>
                  <td>{fmt(r.labor)}</td>
                  <td style={{ color: 'var(--argaman)', fontWeight: 600 }}>{fmt(r.total)}</td>
                </tr>
              ))}
              {data.projectRows.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32 }}>אין נתונים להצגה</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ========== גיול חובות ==========
function AgingTab({ data }) {
  const bucketConfig = [
    { key: '0-30', label: '0-30 יום', color: 'var(--success)', bg: 'var(--success-bg)' },
    { key: '31-60', label: '31-60 יום', color: 'var(--warning)', bg: 'var(--warning-bg)' },
    { key: '61-90', label: '61-90 יום', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    { key: '90+', label: '90+ יום', color: 'var(--danger)', bg: 'var(--danger-bg)' },
  ];

  const getRowColor = (days) => days > 90 ? 'var(--danger)' : days > 60 ? '#f97316' : days > 30 ? 'var(--warning)' : 'var(--text-secondary)';

  return (
    <div>
      {/* כרטיסי באקט */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {bucketConfig.map(b => (
          <div key={b.key} className="card" style={{ borderTop: `3px solid ${b.color}` }}>
            <div style={{ color: b.color, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{b.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(data.buckets[b.key])}</div>
          </div>
        ))}
      </div>

      {/* סה"כ */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>סה״כ חובות פתוחים</span>
        </div>
        <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--danger)' }}>{fmt(data.total)}</span>
      </div>

      {/* טבלה */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>לקוח</th>
                <th>פרויקט</th>
                <th>סכום</th>
                <th>תאריך חשבונית</th>
                <th>ימי איחור</th>
                <th>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map(r => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.client}</td>
                  <td>{r.project}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(r.amount)}</td>
                  <td>{r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString('he-IL') : '—'}</td>
                  <td style={{ color: getRowColor(r.daysOverdue), fontWeight: 600 }}>{r.daysOverdue}</td>
                  <td><span className={`badge ${r.daysOverdue > 60 ? 'badge-danger' : r.daysOverdue > 30 ? 'badge-warning' : 'badge-info'}`}>{r.status}</span></td>
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}>אין חובות פתוחים</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ========== כרטיס סיכום ==========
function SummaryCard({ icon, label, value, color }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
