import React, { useState, useEffect, useMemo } from 'react';
import { Vehicle, VehicleExpense, VehicleDocument } from '@/entities';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Plus, Edit2, Trash2, AlertTriangle, Check, Fuel, Wrench, FileText, Upload, Download, X, Eye } from 'lucide-react';
import { toast } from 'sonner';

const VEHICLE_TYPES = ['משאית', 'טנדר', 'רכב', 'קטנוע', 'אחר'];
const EXPENSE_TYPES = ['דלק', 'טיפול', 'ביטוח', 'טסט', 'קנס', 'שמן', 'צמיגים', 'אחר'];
const DOC_TYPES = ['רישיון רכב', 'ביטוח', 'טסט', 'חוזה ליסינג', 'אחר'];
const VEHICLE_STATUSES = ['פעיל', 'בטיפול', 'לא פעיל'];

const userOptions = ['חיה', 'יניר', 'דבורה', 'יהודה', 'רבקה', 'שי'];

function daysUntil(dateStr) {
    if (!dateStr) return null;
    const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
}

function ExpiryBadge({ dateStr, label }) {
    const days = daysUntil(dateStr);
    if (days === null) return <span className="text-gray-400 text-sm">לא הוזן</span>;
    if (days < 0) return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">פג תוקף!</span>;
    if (days <= 30) return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold">עוד {days} יום</span>;
    return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">{new Date(dateStr).toLocaleDateString('he-IL')}</span>;
}

// דיאלוג הוספה/עריכת רכב
function VehicleFormDialog({ vehicle, onSave, onClose }) {
    const isEdit = !!vehicle;
    const [form, setForm] = useState({
        license_plate: '', vehicle_type: 'רכב', brand: '', model: '', year: new Date().getFullYear(),
        color: '', assigned_to: '', current_km: 0, test_expiry: '', insurance_expiry: '',
        next_oil_change_km: 0, next_service_date: '', status: 'פעיל', notes: '',
        ...(vehicle || {})
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.license_plate) { toast.error('יש להזין מספר רכב'); return; }
        try {
            if (isEdit) {
                await Vehicle.update(vehicle.id, form);
                toast.success('רכב עודכן');
            } else {
                await Vehicle.create(form);
                toast.success('רכב נוסף');
            }
            onSave();
        } catch { toast.error('שגיאה בשמירה'); }
    };

    const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

    return (
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader><DialogTitle>{isEdit ? 'עריכת רכב' : 'הוספת רכב חדש'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><Label>מספר רכב *</Label><Input value={form.license_plate} onChange={e => set('license_plate', e.target.value)} required dir="ltr" className="text-left" /></div>
                    <div><Label>סוג רכב</Label><Select value={form.vehicle_type} onValueChange={v => set('vehicle_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VEHICLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>יצרן</Label><Input value={form.brand} onChange={e => set('brand', e.target.value)} /></div>
                    <div><Label>דגם</Label><Input value={form.model} onChange={e => set('model', e.target.value)} /></div>
                    <div><Label>שנה</Label><Input type="number" value={form.year} onChange={e => set('year', Number(e.target.value))} /></div>
                    <div><Label>צבע</Label><Input value={form.color} onChange={e => set('color', e.target.value)} /></div>
                    <div><Label>שיוך לעובד</Label><Select value={form.assigned_to || '_none'} onValueChange={v => set('assigned_to', v === '_none' ? '' : v)}><SelectTrigger><SelectValue placeholder="בחר עובד" /></SelectTrigger><SelectContent><SelectItem value="_none">ללא</SelectItem>{userOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>סטטוס</Label><Select value={form.status} onValueChange={v => set('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VEHICLE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>קילומטראז' נוכחי</Label><Input type="number" value={form.current_km} onChange={e => set('current_km', Number(e.target.value))} /></div>
                    <div><Label>ק"מ להחלפת שמן הבאה</Label><Input type="number" value={form.next_oil_change_km} onChange={e => set('next_oil_change_km', Number(e.target.value))} /></div>
                    <div><Label>תוקף טסט</Label><Input type="date" value={form.test_expiry} onChange={e => set('test_expiry', e.target.value)} /></div>
                    <div><Label>תוקף ביטוח</Label><Input type="date" value={form.insurance_expiry} onChange={e => set('insurance_expiry', e.target.value)} /></div>
                    <div><Label>טיפול תקופתי הבא</Label><Input type="date" value={form.next_service_date} onChange={e => set('next_service_date', e.target.value)} /></div>
                </div>
                <div><Label>הערות</Label><Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} /></div>
                <DialogFooter className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">{isEdit ? 'שמור' : 'הוסף רכב'}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

// דיאלוג הוצאה
function ExpenseFormDialog({ vehicleId, onSave }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ expense_type: 'דלק', amount: 0, date: new Date().toISOString().split('T')[0], km_at_expense: 0, description: '' });
    const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await VehicleExpense.create({ ...form, vehicle_id: vehicleId, amount: Number(form.amount), km_at_expense: Number(form.km_at_expense) });
            if (form.km_at_expense > 0) await Vehicle.update(vehicleId, { current_km: Number(form.km_at_expense) });
            toast.success('הוצאה נוספה');
            setOpen(false);
            setForm({ expense_type: 'דלק', amount: 0, date: new Date().toISOString().split('T')[0], km_at_expense: 0, description: '' });
            onSave();
        } catch { toast.error('שגיאה'); }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"><Plus className="w-4 h-4 ml-1" />הוצאה</Button></DialogTrigger>
            <DialogContent className="max-w-md bg-white" dir="rtl">
                <DialogHeader><DialogTitle>הוספת הוצאה</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><Label>סוג</Label><Select value={form.expense_type} onValueChange={v => set('expense_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXPENSE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>סכום (₪)</Label><Input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} /></div>
                    <div><Label>תאריך</Label><Input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
                    <div><Label>קילומטראז'</Label><Input type="number" value={form.km_at_expense} onChange={e => set('km_at_expense', e.target.value)} /></div>
                    <div><Label>תיאור</Label><Input value={form.description} onChange={e => set('description', e.target.value)} /></div>
                    <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>ביטול</Button><Button type="submit" className="bg-green-600 text-white">הוסף</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// דיאלוג העלאת מסמך
function DocUploadDialog({ vehicleId, onSave }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ doc_type: 'רישיון רכב', title: '', expiry_date: '', notes: '' });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { toast.error('יש לבחור קובץ'); return; }
        setUploading(true);
        try {
            const fileRef = ref(storage, `vehicles/${vehicleId}/docs/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            await VehicleDocument.create({ ...form, vehicle_id: vehicleId, file_url: url, file_name: file.name, upload_date: new Date().toISOString().split('T')[0] });
            toast.success('מסמך הועלה');
            setOpen(false);
            setFile(null);
            setForm({ doc_type: 'רישיון רכב', title: '', expiry_date: '', notes: '' });
            onSave();
        } catch (err) { console.error(err); toast.error('שגיאה בהעלאה'); }
        setUploading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline" className="border-blue-300 text-blue-700"><Upload className="w-4 h-4 ml-1" />מסמך</Button></DialogTrigger>
            <DialogContent className="max-w-md bg-white" dir="rtl">
                <DialogHeader><DialogTitle>העלאת מסמך</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><Label>סוג מסמך</Label><Select value={form.doc_type} onValueChange={v => set('doc_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>שם המסמך</Label><Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="למשל: ביטוח 2026" /></div>
                    <div><Label>תאריך תפוגה</Label><Input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)} /></div>
                    <div><Label>קובץ *</Label><Input type="file" onChange={e => setFile(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" /></div>
                    <div><Label>הערות</Label><Input value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
                    <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>ביטול</Button><Button type="submit" disabled={uploading} className="bg-blue-600 text-white">{uploading ? 'מעלה...' : 'העלה'}</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// פרטי רכב — הוצאות + מסמכים
function VehicleDetails({ vehicle, onClose, onRefresh }) {
    const [expenses, setExpenses] = useState([]);
    const [docs, setDocs] = useState([]);
    const [tab, setTab] = useState('expenses');

    const load = async () => {
        const [exp, dc] = await Promise.all([
            VehicleExpense.filter({ vehicle_id: vehicle.id }),
            VehicleDocument.filter({ vehicle_id: vehicle.id })
        ]);
        setExpenses(exp.sort((a, b) => new Date(b.date) - new Date(a.date)));
        setDocs(dc.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date)));
    };
    useEffect(() => { load(); }, [vehicle.id]);

    const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const fuelExpenses = expenses.filter(e => e.expense_type === 'דלק').reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const handleDeleteExpense = async (id) => {
        await VehicleExpense.delete(id);
        toast.success('הוצאה נמחקה');
        load();
    };

    const handleDeleteDoc = async (id) => {
        await VehicleDocument.delete(id);
        toast.success('מסמך נמחק');
        load();
    };

    return (
        <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                    <Car className="w-6 h-6 text-indigo-600" />
                    {vehicle.brand} {vehicle.model} — {vehicle.license_plate}
                </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-3 mb-4">
                <Card className="border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-xs text-gray-500">סה"כ הוצאות</p><p className="text-xl font-bold text-slate-800">₪{totalExpenses.toLocaleString()}</p></CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-xs text-gray-500">דלק</p><p className="text-xl font-bold text-orange-600">₪{fuelExpenses.toLocaleString()}</p></CardContent></Card>
                <Card className="border-0 shadow-sm"><CardContent className="p-3 text-center"><p className="text-xs text-gray-500">מסמכים</p><p className="text-xl font-bold text-blue-600">{docs.length}</p></CardContent></Card>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="expenses"><Fuel className="w-4 h-4 ml-1" />הוצאות ({expenses.length})</TabsTrigger>
                    <TabsTrigger value="docs"><FileText className="w-4 h-4 ml-1" />מסמכים ({docs.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="expenses">
                    <div className="flex justify-end mb-3">
                        <ExpenseFormDialog vehicleId={vehicle.id} onSave={() => { load(); onRefresh(); }} />
                    </div>
                    <Table>
                        <TableHeader><TableRow><TableHead>תאריך</TableHead><TableHead>סוג</TableHead><TableHead>סכום</TableHead><TableHead>ק"מ</TableHead><TableHead>תיאור</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {expenses.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-400">אין הוצאות</TableCell></TableRow>
                            ) : expenses.map(exp => (
                                <TableRow key={exp.id}>
                                    <TableCell className="text-sm">{new Date(exp.date).toLocaleDateString('he-IL')}</TableCell>
                                    <TableCell><span className="bg-gray-100 px-2 py-1 rounded text-xs">{exp.expense_type}</span></TableCell>
                                    <TableCell className="font-bold">₪{(Number(exp.amount) || 0).toLocaleString()}</TableCell>
                                    <TableCell className="text-sm text-gray-600">{exp.km_at_expense || '-'}</TableCell>
                                    <TableCell className="text-sm text-gray-600">{exp.description || '-'}</TableCell>
                                    <TableCell><Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(exp.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TabsContent>

                <TabsContent value="docs">
                    <div className="flex justify-end mb-3">
                        <DocUploadDialog vehicleId={vehicle.id} onSave={load} />
                    </div>
                    <Table>
                        <TableHeader><TableRow><TableHead>סוג</TableHead><TableHead>שם</TableHead><TableHead>תפוגה</TableHead><TableHead>הועלה</TableHead><TableHead>הערות</TableHead><TableHead className="w-20"></TableHead></TableRow></TableHeader>
                        <TableBody>
                            {docs.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-400">אין מסמכים</TableCell></TableRow>
                            ) : docs.map(doc => (
                                <TableRow key={doc.id}>
                                    <TableCell><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{doc.doc_type}</span></TableCell>
                                    <TableCell className="font-medium text-sm">{doc.title || doc.file_name}</TableCell>
                                    <TableCell>{doc.expiry_date ? <ExpiryBadge dateStr={doc.expiry_date} /> : '-'}</TableCell>
                                    <TableCell className="text-sm text-gray-500">{doc.upload_date ? new Date(doc.upload_date).toLocaleDateString('he-IL') : '-'}</TableCell>
                                    <TableCell className="text-sm text-gray-500">{doc.notes || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <a href={doc.file_url} target="_blank" rel="noreferrer"><Button variant="ghost" size="icon"><Eye className="w-4 h-4 text-blue-500" /></Button></a>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(doc.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TabsContent>
            </Tabs>
        </DialogContent>
    );
}

// דף ראשי
export default function Vehicles() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editVehicle, setEditVehicle] = useState(null);
    const [detailsVehicle, setDetailsVehicle] = useState(null);

    const load = async () => {
        const data = await Vehicle.list();
        setVehicles(data);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const handleDelete = async (id) => {
        await Vehicle.delete(id);
        toast.success('רכב נמחק');
        load();
    };

    // התראות
    const alerts = useMemo(() => {
        const list = [];
        vehicles.forEach(v => {
            const testDays = daysUntil(v.test_expiry);
            const insDays = daysUntil(v.insurance_expiry);
            const svcDays = daysUntil(v.next_service_date);
            if (testDays !== null && testDays < 0) list.push({ type: 'error', msg: `${v.license_plate} — טסט פג תוקף!`, vehicle: v });
            else if (testDays !== null && testDays <= 30) list.push({ type: 'warning', msg: `${v.license_plate} — טסט יפוג בעוד ${testDays} יום`, vehicle: v });
            if (insDays !== null && insDays < 0) list.push({ type: 'error', msg: `${v.license_plate} — ביטוח פג תוקף!`, vehicle: v });
            else if (insDays !== null && insDays <= 30) list.push({ type: 'warning', msg: `${v.license_plate} — ביטוח יפוג בעוד ${insDays} יום`, vehicle: v });
            if (svcDays !== null && svcDays <= 7 && svcDays >= 0) list.push({ type: 'warning', msg: `${v.license_plate} — טיפול תקופתי בעוד ${svcDays} יום`, vehicle: v });
            if (v.next_oil_change_km && v.current_km && v.current_km >= v.next_oil_change_km) list.push({ type: 'warning', msg: `${v.license_plate} — הגיע זמן החלפת שמן (${v.current_km.toLocaleString()} ק"מ)`, vehicle: v });
        });
        return list;
    }, [vehicles]);

    const activeCount = vehicles.filter(v => v.status === 'פעיל').length;
    const expiredTest = vehicles.filter(v => daysUntil(v.test_expiry) !== null && daysUntil(v.test_expiry) < 0).length;
    const expiredIns = vehicles.filter(v => daysUntil(v.insurance_expiry) !== null && daysUntil(v.insurance_expiry) < 0).length;

    if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">טוען...</p></div>;

    return (
        <div className="space-y-6 p-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800"><Car className="w-7 h-7 text-indigo-600" />רכבים</h1>
                <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditVehicle(null); }}>
                    <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700 text-white"><Plus className="w-4 h-4 ml-2" />הוסף רכב</Button></DialogTrigger>
                    <VehicleFormDialog vehicle={editVehicle} onSave={() => { setFormOpen(false); setEditVehicle(null); load(); }} onClose={() => { setFormOpen(false); setEditVehicle(null); }} />
                </Dialog>
            </div>

            {/* כרטיסי סיכום */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-sm text-gray-500">סה"כ רכבים</p><p className="text-2xl font-bold text-slate-800">{vehicles.length}</p></CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-sm text-gray-500">פעילים</p><p className="text-2xl font-bold text-green-600">{activeCount}</p></CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-sm text-gray-500">טסט פג</p><p className="text-2xl font-bold text-red-600">{expiredTest}</p></CardContent></Card>
                <Card className="border-0 shadow-md"><CardContent className="p-4 text-center"><p className="text-sm text-gray-500">ביטוח פג</p><p className="text-2xl font-bold text-red-600">{expiredIns}</p></CardContent></Card>
            </div>

            {/* התראות */}
            {alerts.length > 0 && (
                <Card className="border-0 shadow-md border-r-4 border-r-orange-400">
                    <CardContent className="p-4">
                        <h3 className="font-bold text-orange-700 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" />התראות ({alerts.length})</h3>
                        <div className="space-y-1">
                            {alerts.map((a, i) => (
                                <div key={i} className={`text-sm p-2 rounded ${a.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                                    {a.msg}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* טבלת רכבים */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="text-right">מספר רכב</TableHead>
                                <TableHead className="text-right">סוג</TableHead>
                                <TableHead className="text-right">יצרן / דגם</TableHead>
                                <TableHead className="text-right">עובד</TableHead>
                                <TableHead className="text-center">ק"מ</TableHead>
                                <TableHead className="text-center">טסט</TableHead>
                                <TableHead className="text-center">ביטוח</TableHead>
                                <TableHead className="text-center">סטטוס</TableHead>
                                <TableHead className="text-center w-32">פעולות</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vehicles.length === 0 ? (
                                <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-400">אין רכבים — לחץ "הוסף רכב"</TableCell></TableRow>
                            ) : vehicles.map(v => (
                                <TableRow key={v.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setDetailsVehicle(v)}>
                                    <TableCell className="font-bold text-slate-800" dir="ltr">{v.license_plate}</TableCell>
                                    <TableCell className="text-sm">{v.vehicle_type}</TableCell>
                                    <TableCell className="text-sm">{[v.brand, v.model].filter(Boolean).join(' ') || '-'}</TableCell>
                                    <TableCell className="text-sm">{v.assigned_to || '-'}</TableCell>
                                    <TableCell className="text-center text-sm">{v.current_km ? v.current_km.toLocaleString() : '-'}</TableCell>
                                    <TableCell className="text-center"><ExpiryBadge dateStr={v.test_expiry} /></TableCell>
                                    <TableCell className="text-center"><ExpiryBadge dateStr={v.insurance_expiry} /></TableCell>
                                    <TableCell className="text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${v.status === 'פעיל' ? 'bg-green-100 text-green-700' : v.status === 'בטיפול' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{v.status}</span>
                                    </TableCell>
                                    <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                                        <div className="flex gap-1 justify-center">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditVehicle(v); setFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-500" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* דיאלוג פרטי רכב */}
            <Dialog open={!!detailsVehicle} onOpenChange={(o) => { if (!o) setDetailsVehicle(null); }}>
                {detailsVehicle && <VehicleDetails vehicle={detailsVehicle} onClose={() => setDetailsVehicle(null)} onRefresh={load} />}
            </Dialog>
        </div>
    );
}
