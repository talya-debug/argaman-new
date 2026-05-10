import React, { useState, useEffect, useMemo } from 'react';
import { SubContractor, Project } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Search, Filter, Edit2, Check, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const paymentStatusConfig = {
    'ממתין לאישור': 'bg-yellow-100 text-yellow-800',
    'מאושר לתשלום': 'bg-blue-100 text-blue-800',
    'שולם': 'bg-green-100 text-green-800',
    'שולם חלקית': 'bg-orange-100 text-orange-800',
};
const paymentStatuses = Object.keys(paymentStatusConfig);

const workFields = ['אינסטלציה', 'חשמל', 'אלומיניום', 'טייח', 'צבע', 'עבודות עץ', 'ריצוף', 'גבס', 'מיזוג', 'איטום', 'אחר'];

export default function SubContractors() {
    const [contractors, setContractors] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterProject, setFilterProject] = useState('all');
    const [filterField, setFilterField] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    const loadData = async () => {
        try {
            const [allContractors, allProjects] = await Promise.all([
                SubContractor.list(),
                Project.list()
            ]);
            setContractors(allContractors);
            setProjects(allProjects);
        } catch { toast.error('שגיאה בטעינת נתונים'); }
        setLoading(false);
    };
    useEffect(() => { loadData(); }, []);

    const projectMap = useMemo(() => {
        const map = {};
        projects.forEach(p => { map[p.id] = p; });
        return map;
    }, [projects]);

    const filtered = useMemo(() => {
        return contractors.filter(c => {
            if (filterStatus !== 'all' && c.payment_status !== filterStatus) return false;
            if (filterProject !== 'all' && c.project_id !== filterProject) return false;
            if (filterField !== 'all' && c.work_field !== filterField) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const name = (c.contractor_name || '').toLowerCase();
                const field = (c.work_field || '').toLowerCase();
                const project = (projectMap[c.project_id]?.name || '').toLowerCase();
                if (!name.includes(term) && !field.includes(term) && !project.includes(term)) return false;
            }
            return true;
        });
    }, [contractors, filterStatus, filterProject, filterField, searchTerm, projectMap]);

    const totals = useMemo(() => {
        const total = filtered.reduce((s, c) => s + (Number(c.amount) || 0), 0);
        const paid = filtered.filter(c => c.payment_status === 'שולם').reduce((s, c) => s + (Number(c.amount) || 0), 0);
        const pending = total - paid;
        return { total, paid, pending, count: filtered.length };
    }, [filtered]);

    // קיבוץ לפי קבלן
    const contractorGroups = useMemo(() => {
        const groups = {};
        filtered.forEach(c => {
            const name = c.contractor_name || 'לא ידוע';
            if (!groups[name]) groups[name] = { name, items: [], total: 0, projects: new Set() };
            groups[name].items.push(c);
            groups[name].total += Number(c.amount) || 0;
            groups[name].projects.add(projectMap[c.project_id]?.name || '');
        });
        return Object.values(groups).sort((a, b) => b.total - a.total);
    }, [filtered, projectMap]);

    const startEdit = (c) => {
        setEditingId(c.id);
        setEditData({ contractor_name: c.contractor_name, work_field: c.work_field, amount: c.amount, payment_status: c.payment_status, notes: c.notes || '' });
    };

    const saveEdit = async () => {
        try {
            await SubContractor.update(editingId, { ...editData, amount: Number(editData.amount) });
            setEditingId(null);
            await loadData();
            toast.success('עודכן');
        } catch { toast.error('שגיאה'); }
    };

    const handleDelete = async (id) => {
        try {
            await SubContractor.delete(id);
            await loadData();
            toast.success('נמחק');
        } catch { toast.error('שגיאה'); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">טוען...</p></div>;

    return (
        <div className="space-y-6 p-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
                    <UserCog className="w-7 h-7 text-purple-600" />
                    קבלני משנה
                </h1>
            </div>

            {/* כרטיסי סיכום */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-sm text-gray-500">קבלנים</p><p className="text-2xl font-bold text-slate-800">{contractorGroups.length}</p></CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-sm text-gray-500">סה"כ סכום</p><p className="text-2xl font-bold text-blue-600">₪{totals.total.toLocaleString()}</p></CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-sm text-gray-500">שולם</p><p className="text-2xl font-bold text-green-600">₪{totals.paid.toLocaleString()}</p></CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-sm text-gray-500">ממתין</p><p className="text-2xl font-bold text-orange-600">₪{totals.pending.toLocaleString()}</p></CardContent></Card>
            </div>

            {/* פילטרים */}
            <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <Search className="w-4 h-4 text-gray-400" />
                            <Input placeholder="חיפוש לפי שם קבלן, תחום או פרויקט..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white" />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[160px] bg-white"><SelectValue placeholder="סטטוס" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">כל הסטטוסים</SelectItem>{paymentStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={filterField} onValueChange={setFilterField}>
                            <SelectTrigger className="w-[150px] bg-white"><SelectValue placeholder="תחום" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">כל התחומים</SelectItem>{workFields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={filterProject} onValueChange={setFilterProject}>
                            <SelectTrigger className="w-[200px] bg-white"><SelectValue placeholder="פרויקט" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">כל הפרויקטים</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* טבלה */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="text-right">שם קבלן</TableHead>
                                    <TableHead className="text-right">פרויקט</TableHead>
                                    <TableHead className="text-right">תחום</TableHead>
                                    <TableHead className="text-right">סוג עבודה</TableHead>
                                    <TableHead className="text-center">סכום</TableHead>
                                    <TableHead className="text-center">סטטוס תשלום</TableHead>
                                    <TableHead className="text-right">הערות</TableHead>
                                    <TableHead className="text-center w-24">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">אין קבלני משנה</TableCell></TableRow>
                                ) : filtered.map(c => {
                                    const project = projectMap[c.project_id];
                                    const isEditing = editingId === c.id;
                                    return (
                                        <TableRow key={c.id} className="hover:bg-slate-50">
                                            <TableCell className="font-medium text-slate-800">
                                                {isEditing ? <Input value={editData.contractor_name} onChange={e => setEditData({...editData, contractor_name: e.target.value})} className="h-8 text-sm" /> : c.contractor_name}
                                            </TableCell>
                                            <TableCell>
                                                <Link to={`/ProjectDetails?id=${c.project_id}&tab=procurement`} className="text-blue-600 hover:underline text-sm">
                                                    {project?.name || '-'}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <Select value={editData.work_field} onValueChange={v => setEditData({...editData, work_field: v})}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>{workFields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                ) : <span className="text-sm">{c.work_field}</span>}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">{c.work_type || '-'}</TableCell>
                                            <TableCell className="text-center font-bold text-green-700">
                                                {isEditing ? <Input type="number" value={editData.amount} onChange={e => setEditData({...editData, amount: e.target.value})} className="h-8 w-24 text-center" /> : `₪${(Number(c.amount) || 0).toLocaleString()}`}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isEditing ? (
                                                    <Select value={editData.payment_status} onValueChange={v => setEditData({...editData, payment_status: v})}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>{paymentStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                ) : <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusConfig[c.payment_status] || 'bg-gray-100'}`}>{c.payment_status || '-'}</span>}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? <Input value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} className="h-8 text-sm" /> : <span className="text-sm text-gray-600">{c.notes || '-'}</span>}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isEditing ? (
                                                    <div className="flex gap-1 justify-center">
                                                        <Button size="icon" variant="ghost" onClick={saveEdit} className="h-8 w-8"><Check className="w-4 h-4 text-green-600" /></Button>
                                                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8"><X className="w-4 h-4 text-red-500" /></Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-1 justify-center">
                                                        <Button size="icon" variant="ghost" onClick={() => startEdit(c)} className="h-8 w-8"><Edit2 className="w-4 h-4 text-gray-500" /></Button>
                                                        <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)} className="h-8 w-8"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {filtered.length > 0 && (
                                    <TableRow className="bg-slate-100 font-bold">
                                        <TableCell colSpan={4} className="text-right font-bold text-slate-800">סה"כ</TableCell>
                                        <TableCell className="text-center font-bold text-green-700">₪{totals.total.toLocaleString()}</TableCell>
                                        <TableCell colSpan={3}></TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
