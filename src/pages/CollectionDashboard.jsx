import React, { useState, useEffect, useMemo } from "react";
import { CollectionTask, Project, Quote } from "@/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertCircle, TrendingUp, Receipt, ClipboardList, ExternalLink, Briefcase } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const statusConfig = {
  "חשבון מאושר – יש לשלוח חשבון עסקה": { color: "bg-[rgba(96,165,250,0.1)]0", displayColor: "#3b82f6" },
  "נשלחה חשבונית – ממתין לתשלום": { color: "bg-orange-500", displayColor: "#f97316" },
  "עיכוב בתשלום – לטיפול יניר": { color: "bg-[rgba(251,191,36,0.1)]0", displayColor: "#eab308" },
  "שולם ונשלחה חשבונית מס": { color: "bg-[rgba(74,222,128,0.1)]0", displayColor: "#22c55e" },
  "בוטל / זיכוי": { color: "bg-gray-400", displayColor: "#9ca3af" }
};

const COLORS = ['#3b82f6', '#f97316', '#eab308', '#22c55e', '#9ca3af', '#8b5cf6', '#ec4899'];

export default function CollectionDashboard() {
  const [collectionTasks, setCollectionTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tasksData, projectsData, quotesData] = await Promise.all([
        CollectionTask.list('-created_date'),
        Project.list('-created_date'),
        Quote.list('-created_date')
      ]);
      setCollectionTasks(tasksData);
      setProjects(projectsData);
      setQuotes(quotesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setIsLoading(false);
  };

  const calculateDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const stats = useMemo(() => {
    if (!collectionTasks.length) return {
      totalInProgress: 0,
      totalOverdue: 0,
      paidThisWeek: 0,
      paidThisMonth: 0,
      overdueCount: 0
    };

    const openStatuses = [
      "חשבון מאושר – יש לשלוח חשבון עסקה",
      "נשלחה חשבונית – ממתין לתשלום",
      "עיכוב בתשלום – לטיפול יניר"
    ];

    const totalInProgress = collectionTasks
      .filter(t => openStatuses.includes(t.collection_status))
      .reduce((sum, t) => sum + (t.amount_to_collect || 0), 0);

    const overdueStatuses = [
      "נשלחה חשבונית – ממתין לתשלום",
      "עיכוב בתשלום – לטיפול יניר"
    ];

    const overdueTasks = collectionTasks.filter(t =>
      overdueStatuses.includes(t.collection_status) &&
      calculateDaysOverdue(t.payment_due_date) > 0
    );

    const totalOverdue = overdueTasks.reduce((sum, t) => sum + (t.amount_to_collect || 0), 0);
    const overdueCount = overdueTasks.length;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const paidTasks = collectionTasks.filter(t => t.collection_status === "שולם ונשלחה חשבונית מס");

    const paidThisWeek = paidTasks
      .filter(t => t.updated_date && new Date(t.updated_date) >= weekAgo)
      .reduce((sum, t) => sum + (t.amount_to_collect || 0), 0);

    const paidThisMonth = paidTasks
      .filter(t => t.updated_date && new Date(t.updated_date) >= monthAgo)
      .reduce((sum, t) => sum + (t.amount_to_collect || 0), 0);

    return { totalInProgress, totalOverdue, paidThisWeek, paidThisMonth, overdueCount };
  }, [collectionTasks]);

  const openTasks = useMemo(() => {
    return collectionTasks.filter(t =>
      t.collection_status !== "שולם ונשלחה חשבונית מס" &&
      t.collection_status !== "בוטל / זיכוי"
    ).map(t => ({
      ...t,
      daysOverdue: calculateDaysOverdue(t.payment_due_date)
    }));
  }, [collectionTasks]);

  const overdueTasks = useMemo(() => {
    return openTasks.filter(t => t.daysOverdue > 0);
  }, [openTasks]);

  const responsibleData = useMemo(() => {
    const grouped = {};
    openTasks.forEach(t => {
      const resp = t.responsible || 'לא משויך';
      if (!grouped[resp]) grouped[resp] = 0;
      grouped[resp] += t.amount_to_collect || 0;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [openTasks]);

  const statusDistribution = useMemo(() => {
    const grouped = {};
    collectionTasks.forEach(t => {
      const status = t.collection_status;
      if (!grouped[status]) grouped[status] = 0;
      grouped[status] += 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({
      name: name.length > 30 ? name.substring(0, 30) + '...' : name,
      value,
      fill: statusConfig[name]?.displayColor || '#9ca3af'
    }));
  }, [collectionTasks]);

  const activeProjects = useMemo(() => {
    const excludedStatuses = ['בוטל', 'הושלם'];

    return projects.filter(p =>
      !p.is_archived &&
      !excludedStatuses.includes(p.status)
    );
  }, [projects]);

  const totalActiveProjectsAmount = useMemo(() => {
    let total = 0;

    activeProjects.forEach(p => {
      if (p.quote_id) {
        const quote = quotes.find(q => q.id === p.quote_id);
        if (quote && quote.total) {
          total += quote.total;
        }
      }
    });

    return total;
  }, [activeProjects, quotes]);

  const avgCollectionTime = useMemo(() => {
    const paidTasks = collectionTasks.filter(t =>
      t.collection_status === "שולם ונשלחה חשבונית מס" &&
      t.invoice_date
    );

    if (paidTasks.length === 0) return { avg: 0, median: 0, max: 0 };

    const durations = paidTasks.map(t => {
      const invoice = new Date(t.invoice_date);
      const paid = new Date(t.updated_date || new Date());
      return Math.floor((paid - invoice) / (1000 * 60 * 60 * 24));
    }).filter(d => d >= 0);

    if (durations.length === 0) return { avg: 0, median: 0, max: 0 };

    const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const sorted = durations.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const max = Math.max(...durations);

    return { avg, median, max };
  }, [collectionTasks]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 bg-[#1a1a2e] min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-[#1a1a2e] min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#f0f0f0]">דאשבורד גבייה</h1>
            <p className="text-[#a0a0b8] mt-1">סקירה כללית של מצב הגבייה בזמן אמת</p>
          </div>
          <Link to={createPageUrl("CollectionTasks")}>
            <Badge className="bg-[#c42b2b] text-white px-4 py-2 text-sm cursor-pointer hover:bg-[#991b1b]">
              <ClipboardList className="w-4 h-4 ml-2" />
              לוח משימות גבייה
            </Badge>
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">כספים בתהליך גבייה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">₪{stats.totalInProgress.toLocaleString()}</div>
                <DollarSign className="w-8 h-8 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">כספים באיחור</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">₪{stats.totalOverdue.toLocaleString()}</div>
                  <div className="text-xs opacity-90 mt-1">{stats.overdueCount} משימות</div>
                </div>
                <AlertCircle className="w-8 h-8 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">שולם השבוע</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">₪{stats.paidThisWeek.toLocaleString()}</div>
                <TrendingUp className="w-8 h-8 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">שולם החודש</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">₪{stats.paidThisMonth.toLocaleString()}</div>
                <Receipt className="w-8 h-8 opacity-75" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">סכום פרויקטים פעילים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-2">
                <div className="text-lg font-bold break-words flex-1 leading-tight">
                  ₪{Math.round(totalActiveProjectsAmount).toLocaleString('he-IL')}
                </div>
                <Briefcase className="w-8 h-8 opacity-75 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">מספר פרויקטים פעילים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{activeProjects.length}</div>
                <ClipboardList className="w-8 h-8 opacity-75" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Tasks */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg text-[#f87171] flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                משימות באיחור ({overdueTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[rgba(248,113,113,0.1)]">
                      <TableHead className="text-right w-[180px]">פרויקט</TableHead>
                      <TableHead className="text-right w-[120px]">סכום</TableHead>
                      <TableHead className="text-right w-[100px]">יעד תשלום</TableHead>
                      <TableHead className="text-right w-[80px]">איחור</TableHead>
                      <TableHead className="text-right w-[200px]">סטטוס</TableHead>
                      <TableHead className="text-right w-[80px]">אחראי</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueTasks.slice(0, 8).map((task) => {
                      const statusInfo = statusConfig[task.collection_status];
                      return (
                        <TableRow key={task.id} className="h-12 bg-[rgba(248,113,113,0.1)]/50">
                          <TableCell className="text-right">
                            {task.project_id ? (
                              <Link
                                to={createPageUrl(`ProjectDetails?id=${task.project_id}`)}
                                className="flex items-center gap-1 text-[#60a5fa] hover:underline text-sm"
                              >
                                <span>{task.project_name}</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            ) : (
                              <span className="text-sm">{task.project_name}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm">
                            ₪{task.amount_to_collect?.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {task.payment_due_date ? new Date(task.payment_due_date).toLocaleDateString('he-IL') : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-red-600 text-white font-bold text-xs">{task.daysOverdue} ימים</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className={`${statusInfo?.color} text-white text-xs px-2 py-1`}>
                              {task.collection_status.substring(0, 25)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold">{task.responsible}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Responsible Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">פילוח לפי אחראי גבייה</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={responsibleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ₪${value.toLocaleString()}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {responsibleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₪${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">התפלגות סטטוסים</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6">
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Collection Time Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">זמן גבייה ממוצע</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-[rgba(96,165,250,0.1)] rounded-lg">
                  <span className="text-[#e0e0e0] font-medium">ממוצע</span>
                  <span className="text-2xl font-bold text-[#60a5fa]">{avgCollectionTime.avg} ימים</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[rgba(74,222,128,0.1)] rounded-lg">
                  <span className="text-[#e0e0e0] font-medium">חציון</span>
                  <span className="text-2xl font-bold text-[#4ade80]">{avgCollectionTime.median} ימים</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                  <span className="text-[#e0e0e0] font-medium">מקסימום</span>
                  <span className="text-2xl font-bold text-orange-600">{avgCollectionTime.max} ימים</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
