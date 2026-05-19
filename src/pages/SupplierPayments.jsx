import React, { useState, useEffect, useMemo } from 'react';
import { PurchaseRecord, PurchaseOrder, Project, SubContractor } from '@/entities';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Search, Filter, FileDown, Edit2, Check, X, FileText, HardHat } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// סטטוסים לרכש
const purchaseStatusConfig = {
    "יש להזמין": { color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
    "הוזמן": { color: "bg-blue-100 text-blue-800", icon: "📦" },
    "סופק חלקית": { color: "bg-orange-100 text-orange-800", icon: "📦" },
    "סופק מלא": { color: "bg-green-100 text-green-800", icon: "✅" },
    "שולם": { color: "bg-purple-100 text-purple-800", icon: "💰" },
};

// סטטוסים לקבלני משנה
const subStatusConfig = {
    "ממתין לאישור": { color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
    "מאושר לתשלום": { color: "bg-blue-100 text-blue-800", icon: "📋" },
    "שולם חלקית": { color: "bg-orange-100 text-orange-800", icon: "💳" },
    "שולם": { color: "bg-purple-100 text-purple-800", icon: "💰" },
};

const purchaseStatusOptions = Object.keys(purchaseStatusConfig).map(s => ({ value: s, label: s }));
const subStatusOptions = Object.keys(subStatusConfig).map(s => ({ value: s, label: s }));

export default function SupplierPayments() {
    const [records, setRecords] = useState([]);
    const [orders, setOrders] = useState([]);
    const [projects, setProjects] = useState([]);
    const [subContractors, setSubContractors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterProject, setFilterProject] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [activeView, setActiveView] = useState('records');

    const loadData = async () => {
        try {
            const [allRecords, allOrders, allProjects, allSubs] = await Promise.all([
                PurchaseRecord.list(),
                PurchaseOrder.list(),
                Project.list(),
                SubContractor.list()
            ]);
            setRecords(allRecords);
            setOrders(allOrders.sort((a, b) => new Date(b.date) - new Date(a.date)));
            setProjects(allProjects);
            setSubContractors(allSubs);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('שגיאה בטעינת נתונים');
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const projectMap = useMemo(() => {
        const map = {};
        projects.forEach(p => { map[p.id] = p; });
        return map;
    }, [projects]);

    const getItemName = (record) => {
        if (record.is_grilles) return `גריל - ${record.grille_location || 'ללא מיקום'}`;
        if (record.is_manual) return record.manual_item_name || 'פריט ידני';
        return record.name_snapshot || 'פריט';
    };

    const getItemDescription = (record) => {
        return record.description_snapshot || record.manual_item_description || '';
    };

    // סינון רכש
    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            if (filterStatus !== 'all' && r.status !== filterStatus) return false;
            if (filterProject !== 'all' && r.project_id !== filterProject) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const name = getItemName(r).toLowerCase();
                const supplier = (r.supplier_name || '').toLowerCase();
                const project = (projectMap[r.project_id]?.name || '').toLowerCase();
                if (!name.includes(term) && !supplier.includes(term) && !project.includes(term)) return false;
            }
            return true;
        });
    }, [records, filterStatus, filterProject, searchTerm, projectMap]);

    // סינון קבלני משנה
    const filteredSubs = useMemo(() => {
        return subContractors.filter(s => {
            if (filterStatus !== 'all' && s.payment_status !== filterStatus) return false;
            if (filterProject !== 'all' && s.project_id !== filterProject) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const name = (s.contractor_name || '').toLowerCase();
                const field = (s.work_field || '').toLowerCase();
                const project = (projectMap[s.project_id]?.name || '').toLowerCase();
                if (!name.includes(term) && !field.includes(term) && !project.includes(term)) return false;
            }
            return true;
        });
    }, [subContractors, filterStatus, filterProject, searchTerm, projectMap]);

    // סיכומים
    const totals = useMemo(() => {
        const purchaseTotal = filteredRecords.reduce((sum, r) => sum + (Number(r.actual_total_cost) || 0), 0);
        const purchasePaid = filteredRecords.filter(r => r.status === 'שולם').reduce((sum, r) => sum + (Number(r.actual_total_cost) || 0), 0);

        const subTotal = filteredSubs.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
        const subPaid = filteredSubs.filter(s => s.payment_status === 'שולם').reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

        const total = purchaseTotal + subTotal;
        const paid = purchasePaid + subPaid;
        const pending = total - paid;

        return { total, paid, pending, purchaseTotal, purchasePaid, subTotal, subPaid, recordCount: filteredRecords.length, subCount: filteredSubs.length };
    }, [filteredRecords, filteredSubs]);

    const startEdit = (record) => {
        setEditingId(record.id);
        setEditData({
            actual_total_cost: record.actual_total_cost || 0,
            supplier_name: record.supplier_name || '',
            status: record.status || 'יש להזמין',
            supplier_invoice_number: record.supplier_invoice_number || '',
            notes: record.notes || '',
            quantity_to_order: record.quantity_to_order || 0,
            unit_price: record.unit_price || 0,
        });
    };

    const saveEdit = async () => {
        try {
            await PurchaseRecord.update(editingId, editData);
            setEditingId(null);
            await loadData();
            toast.success('עודכן בהצלחה');
        } catch (error) {
            toast.error('שגיאה בעדכון');
        }
    };

    const startSubEdit = (sub) => {
        setEditingId(sub.id);
        setEditData({
            _type: 'sub',
            amount: sub.amount || 0,
            payment_status: sub.payment_status || 'ממתין לאישור',
            notes: sub.notes || '',
        });
    };

    const saveSubEdit = async () => {
        try {
            const { _type, ...data } = editData;
            await SubContractor.update(editingId, data);
            setEditingId(null);
            await loadData();
            toast.success('עודכן בהצלחה');
        } catch (error) {
            toast.error('שגיאה בעדכון');
        }
    };

    // סטטוסים לפילטר — משתנים לפי תצוגה
    const currentStatusOptions = activeView === 'subcontractors' ? subStatusOptions : purchaseStatusOptions;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">טוען נתונים...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6" dir="rtl">
            {/* כותרת */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
                    <CreditCard className="w-7 h-7 text-indigo-600" />
                    הוצאות לתשלום
                </h1>
            </div>

            {/* כרטיסי סיכום */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-md">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-500">סה"כ הוצאות</p>
                        <p className="text-2xl font-bold text-slate-800">₪{totals.total.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">רכש: ₪{totals.purchaseTotal.toLocaleString()} | קבלנים: ₪{totals.subTotal.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-500">שולם</p>
                        <p className="text-2xl font-bold text-green-600">₪{totals.paid.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-500">ממתין לתשלום</p>
                        <p className="text-2xl font-bold text-orange-600">₪{totals.pending.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-500">פריטים</p>
                        <p className="text-2xl font-bold text-blue-600">{totals.recordCount + totals.subCount}</p>
                        <p className="text-xs text-gray-400 mt-1">רכש: {totals.recordCount} | קבלנים: {totals.subCount}</p>
                    </CardContent>
                </Card>
            </div>

            {/* פילטרים */}
            <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <Search className="w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="חיפוש לפי פריט, ספק, קבלן או פרויקט..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); }}>
                                <SelectTrigger className="w-[160px] bg-white">
                                    <SelectValue placeholder="סטטוס" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">כל הסטטוסים</SelectItem>
                                    {currentStatusOptions.map(s => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Select value={filterProject} onValueChange={setFilterProject}>
                                <SelectTrigger className="w-[200px] bg-white">
                                    <SelectValue placeholder="פרויקט" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">כל הפרויקטים</SelectItem>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* מתגי תצוגה */}
            <div className="flex gap-2">
                <Button variant={activeView === 'records' ? 'default' : 'outline'} onClick={() => { setActiveView('records'); setFilterStatus('all'); setEditingId(null); }} className={activeView === 'records' ? 'bg-indigo-600' : ''}>
                    רכש ציוד ({filteredRecords.length})
                </Button>
                <Button variant={activeView === 'orders' ? 'default' : 'outline'} onClick={() => { setActiveView('orders'); setFilterStatus('all'); setEditingId(null); }} className={activeView === 'orders' ? 'bg-indigo-600' : ''}>
                    <FileText className="w-4 h-4 ml-2" />
                    הזמנות רכש ({orders.length})
                </Button>
                <Button variant={activeView === 'subcontractors' ? 'default' : 'outline'} onClick={() => { setActiveView('subcontractors'); setFilterStatus('all'); setEditingId(null); }} className={activeView === 'subcontractors' ? 'bg-amber-600' : ''}>
                    <HardHat className="w-4 h-4 ml-2" />
                    קבלני משנה ({filteredSubs.length})
                </Button>
            </div>

            {/* טבלת הזמנות רכש */}
            {activeView === 'orders' && (
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="text-right">מס' הזמנה</TableHead>
                                        <TableHead className="text-right">תאריך</TableHead>
                                        <TableHead className="text-right">פרויקט</TableHead>
                                        <TableHead className="text-right">ספק</TableHead>
                                        <TableHead className="text-center">פריטים</TableHead>
                                        <TableHead className="text-center">סכום</TableHead>
                                        <TableHead className="text-center">סטטוס</TableHead>
                                        <TableHead className="text-center w-20">פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">אין הזמנות רכש שמורות</TableCell></TableRow>
                                    ) : orders.map(order => {
                                        const project = projectMap[order.project_id];
                                        const isEditing = editingId === order.id;
                                        return (
                                            <TableRow key={order.id} className="hover:bg-slate-50">
                                                <TableCell className="font-bold text-indigo-700">#{order.po_number}</TableCell>
                                                <TableCell className="text-sm">{order.date ? new Date(order.date).toLocaleDateString('he-IL') : '-'}</TableCell>
                                                <TableCell>
                                                    <Link to={`/ProjectDetails?id=${order.project_id}&tab=procurement`} className="text-blue-600 hover:underline text-sm">
                                                        {project?.name || order.project_name || '-'}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing ? <Input value={editData.supplier_name || ''} onChange={e => setEditData({...editData, supplier_name: e.target.value})} className="h-8 text-sm" /> : order.supplier_name}
                                                </TableCell>
                                                <TableCell className="text-center">{order.items?.length || 0}</TableCell>
                                                <TableCell className="text-center font-bold text-green-700">
                                                    {isEditing ? <Input type="number" value={editData.total_amount} onChange={e => setEditData({...editData, total_amount: Number(e.target.value)})} className="h-8 w-24 text-center" /> : `₪${(order.total_amount || 0).toLocaleString()}`}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {isEditing ? (
                                                        <Select value={editData.status} onValueChange={v => setEditData({...editData, status: v})}>
                                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                            <SelectContent>{purchaseStatusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    ) : <span className={`px-2 py-1 rounded-full text-xs font-medium ${purchaseStatusConfig[order.status]?.color || 'bg-gray-100'}`}>{order.status || '-'}</span>}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {isEditing ? (
                                                        <div className="flex gap-1">
                                                            <Button size="icon" variant="ghost" onClick={async () => { await PurchaseOrder.update(order.id, editData); setEditingId(null); loadData(); toast.success('עודכן'); }} className="h-8 w-8"><Check className="w-4 h-4 text-green-600" /></Button>
                                                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8"><X className="w-4 h-4 text-red-500" /></Button>
                                                        </div>
                                                    ) : (
                                                        <Button size="icon" variant="ghost" onClick={() => { setEditingId(order.id); setEditData({ supplier_name: order.supplier_name, total_amount: order.total_amount, status: order.status }); }} className="h-8 w-8"><Edit2 className="w-4 h-4 text-gray-500" /></Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* טבלת פריטי רכש */}
            {activeView === 'records' && <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="text-right">פרויקט</TableHead>
                                    <TableHead className="text-right">פריט</TableHead>
                                    <TableHead className="text-center">כמות</TableHead>
                                    <TableHead className="text-center">מחיר יחידה</TableHead>
                                    <TableHead className="text-center">סכום</TableHead>
                                    <TableHead className="text-right">ספק</TableHead>
                                    <TableHead className="text-center">סטטוס</TableHead>
                                    <TableHead className="text-right">חשבונית</TableHead>
                                    <TableHead className="text-right">הערות</TableHead>
                                    <TableHead className="text-center w-20">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRecords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                            לא נמצאו הזמנות
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRecords.map((record) => {
                                    const project = projectMap[record.project_id];
                                    const isEditing = editingId === record.id;

                                    return (
                                        <TableRow key={record.id} className="hover:bg-slate-50">
                                            <TableCell>
                                                <Link
                                                    to={`/ProjectDetails?id=${record.project_id}&tab=procurement`}
                                                    className="text-blue-600 hover:underline font-medium text-sm"
                                                >
                                                    {project?.name || 'לא ידוע'}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div>
                                                    <p className="font-medium text-slate-800">{getItemName(record)}</p>
                                                    {getItemDescription(record) && (
                                                        <p className="text-xs text-gray-500 mt-0.5">{getItemDescription(record)}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isEditing ? (
                                                    <Input type="number" value={editData.quantity_to_order} onChange={(e) => setEditData({...editData, quantity_to_order: Number(e.target.value)})} className="h-8 w-20 text-center" />
                                                ) : record.quantity_to_order}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isEditing ? (
                                                    <Input type="number" value={editData.unit_price} onChange={(e) => setEditData({...editData, unit_price: Number(e.target.value)})} className="h-8 w-24 text-center" />
                                                ) : `₪${(record.unit_price || 0).toLocaleString()}`}
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-green-700">
                                                {isEditing ? (
                                                    <Input type="number" value={editData.actual_total_cost} onChange={(e) => setEditData({...editData, actual_total_cost: Number(e.target.value)})} className="h-8 w-24 text-center" />
                                                ) : `₪${(record.actual_total_cost || 0).toLocaleString()}`}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <Input value={editData.supplier_name} onChange={(e) => setEditData({...editData, supplier_name: e.target.value})} className="h-8 text-sm" />
                                                ) : <span className="text-sm">{record.supplier_name || '-'}</span>}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Select value={record.status || 'יש להזמין'} onValueChange={async (v) => { try { await PurchaseRecord.update(record.id, { status: v }); await loadData(); toast.success('סטטוס עודכן'); } catch(e) { toast.error('שגיאה'); } }}>
                                                    <SelectTrigger className="h-8 text-xs w-[130px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {purchaseStatusOptions.map(s => (
                                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <Input value={editData.supplier_invoice_number} onChange={(e) => setEditData({...editData, supplier_invoice_number: e.target.value})} className="h-8 text-sm" placeholder="מס' חשבונית" />
                                                ) : <span className="text-sm">{record.supplier_invoice_number || '-'}</span>}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <Input value={editData.notes} onChange={(e) => setEditData({...editData, notes: e.target.value})} className="h-8 text-sm" />
                                                ) : <span className="text-sm text-gray-600">{record.notes || '-'}</span>}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isEditing ? (
                                                    <div className="flex gap-1">
                                                        <Button size="icon" variant="ghost" onClick={saveEdit} className="h-8 w-8">
                                                            <Check className="w-4 h-4 text-green-600" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8">
                                                            <X className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button size="icon" variant="ghost" onClick={() => startEdit(record)} className="h-8 w-8">
                                                        <Edit2 className="w-4 h-4 text-gray-500" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {filteredRecords.length > 0 && (
                                    <TableRow className="bg-slate-100 font-bold">
                                        <TableCell colSpan={4} className="text-left font-bold text-slate-800">סה"כ</TableCell>
                                        <TableCell className="text-center font-bold text-green-700">₪{totals.purchaseTotal.toLocaleString()}</TableCell>
                                        <TableCell colSpan={5}></TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>}

            {/* טבלת קבלני משנה */}
            {activeView === 'subcontractors' && <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-amber-50">
                                    <TableHead className="text-right">פרויקט</TableHead>
                                    <TableHead className="text-right">קבלן משנה</TableHead>
                                    <TableHead className="text-right">תחום עבודה</TableHead>
                                    <TableHead className="text-center">סכום</TableHead>
                                    <TableHead className="text-center">סטטוס תשלום</TableHead>
                                    <TableHead className="text-right">הערות</TableHead>
                                    <TableHead className="text-center w-20">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                            לא נמצאו קבלני משנה
                                        </TableCell>
                                    </TableRow>
                                ) : filteredSubs.map((sub) => {
                                    const project = projectMap[sub.project_id];
                                    const isEditing = editingId === sub.id;

                                    return (
                                        <TableRow key={sub.id} className="hover:bg-amber-50/50">
                                            <TableCell>
                                                <Link
                                                    to={`/ProjectDetails?id=${sub.project_id}&tab=procurement`}
                                                    className="text-blue-600 hover:underline font-medium text-sm"
                                                >
                                                    {project?.name || 'לא ידוע'}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-800">{sub.contractor_name}</TableCell>
                                            <TableCell className="text-sm text-gray-600">{sub.work_field || '-'}</TableCell>
                                            <TableCell className="text-center font-bold text-green-700">
                                                {isEditing ? (
                                                    <Input type="number" value={editData.amount} onChange={(e) => setEditData({...editData, amount: Number(e.target.value)})} className="h-8 w-24 text-center" />
                                                ) : `₪${(sub.amount || 0).toLocaleString()}`}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Select value={sub.payment_status || 'ממתין לאישור'} onValueChange={async (v) => { try { await SubContractor.update(sub.id, { payment_status: v }); await loadData(); toast.success('סטטוס עודכן'); } catch(e) { toast.error('שגיאה'); } }}>
                                                    <SelectTrigger className="h-8 text-xs w-[140px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {subStatusOptions.map(s => (
                                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? (
                                                    <Input value={editData.notes} onChange={(e) => setEditData({...editData, notes: e.target.value})} className="h-8 text-sm" />
                                                ) : <span className="text-sm text-gray-600">{sub.notes || '-'}</span>}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isEditing ? (
                                                    <div className="flex gap-1">
                                                        <Button size="icon" variant="ghost" onClick={saveSubEdit} className="h-8 w-8">
                                                            <Check className="w-4 h-4 text-green-600" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8">
                                                            <X className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button size="icon" variant="ghost" onClick={() => startSubEdit(sub)} className="h-8 w-8">
                                                        <Edit2 className="w-4 h-4 text-gray-500" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {filteredSubs.length > 0 && (
                                    <TableRow className="bg-amber-100/50 font-bold">
                                        <TableCell colSpan={3} className="text-left font-bold text-slate-800">סה"כ</TableCell>
                                        <TableCell className="text-center font-bold text-green-700">₪{totals.subTotal.toLocaleString()}</TableCell>
                                        <TableCell colSpan={3}></TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>}
        </div>
    );
}
