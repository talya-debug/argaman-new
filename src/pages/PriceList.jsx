import React, { useState, useEffect, useMemo } from 'react';
import { PriceItem } from '@/entities';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit2, Trash2, Check, X, Package, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function PriceList() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [showAdd, setShowAdd] = useState(false);
    const [newItem, setNewItem] = useState({
        supplier_name: '', model: '', item_description: '', description: '',
        category: '', sub_category: '', btu: '', price_no_vat: '', tipe_item: ''
    });

    const loadData = async () => {
        try {
            const all = await PriceItem.list();
            setItems(all);
        } catch (error) {
            console.error('Failed to load price items:', error);
            toast.error('שגיאה בטעינת מחירון');
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    // ערכים ייחודיים לפילטרים
    const suppliers = useMemo(() => [...new Set(items.map(i => i.supplier_name).filter(Boolean))].sort(), [items]);
    const categories = useMemo(() => [...new Set(items.map(i => i.category).filter(Boolean))].sort(), [items]);

    // סינון
    const filtered = useMemo(() => {
        return items.filter(item => {
            if (filterSupplier !== 'all' && item.supplier_name !== filterSupplier) return false;
            if (filterCategory !== 'all' && item.category !== filterCategory) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const name = (item.item_description || item.name || '').toLowerCase();
                const model = (item.model || '').toLowerCase();
                const desc = (item.description || '').toLowerCase();
                if (!name.includes(term) && !model.includes(term) && !desc.includes(term)) return false;
            }
            return true;
        });
    }, [items, filterSupplier, filterCategory, searchTerm]);

    // סיכומים
    const stats = useMemo(() => ({
        total: items.length,
        filtered: filtered.length,
        suppliers: suppliers.length,
        categories: categories.length,
    }), [items, filtered, suppliers, categories]);

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditData({
            supplier_name: item.supplier_name || '',
            model: item.model || '',
            item_description: item.item_description || item.name || '',
            description: item.description || '',
            category: item.category || '',
            sub_category: item.sub_category || '',
            btu: item.btu || '',
            price_no_vat: item.price_no_vat || item.unit_price || 0,
            tipe_item: item.tipe_item || '',
        });
    };

    const saveEdit = async () => {
        try {
            await PriceItem.update(editingId, editData);
            setEditingId(null);
            await loadData();
            toast.success('פריט עודכן');
        } catch (error) {
            toast.error('שגיאה בעדכון');
        }
    };

    const deleteItem = async (id) => {
        try {
            await PriceItem.delete(id);
            await loadData();
            toast.success('פריט נמחק');
        } catch (error) {
            toast.error('שגיאה במחיקה');
        }
    };

    const addItem = async () => {
        if (!newItem.item_description || !newItem.price_no_vat) {
            toast.error('חובה למלא שם פריט ומחיר');
            return;
        }
        try {
            await PriceItem.create({
                ...newItem,
                price_no_vat: Number(newItem.price_no_vat),
                btu: newItem.btu ? Number(newItem.btu) : null,
                unit_price: Number(newItem.price_no_vat),
            });
            setShowAdd(false);
            setNewItem({ supplier_name: '', model: '', item_description: '', description: '', category: '', sub_category: '', btu: '', price_no_vat: '', tipe_item: '' });
            await loadData();
            toast.success('פריט נוסף למחירון');
        } catch (error) {
            toast.error('שגיאה בהוספה');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><p className="text-gray-500">טוען מחירון...</p></div>;
    }

    return (
        <div className="space-y-6 p-6" dir="rtl">
            {/* כותרת */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
                    <Package className="w-7 h-7 text-emerald-600" />
                    ניהול מחירון
                </h1>
                <Button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף פריט
                </Button>
            </div>

            {/* כרטיסי סיכום */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-md">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-500">סה"כ פריטים</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-500">מוצגים</p>
                        <p className="text-2xl font-bold text-emerald-600">{stats.filtered}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-500">ספקים</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.suppliers}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-gray-500">קטגוריות</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.categories}</p>
                    </CardContent>
                </Card>
            </div>

            {/* טופס הוספה */}
            {showAdd && (
                <Card className="border-2 border-emerald-200 shadow-md">
                    <CardContent className="p-4">
                        <h3 className="font-bold text-lg mb-4 text-emerald-800">הוספת פריט חדש</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Input placeholder="ספק *" value={newItem.supplier_name} onChange={e => setNewItem({...newItem, supplier_name: e.target.value})} />
                            <Input placeholder="דגם / מודל" value={newItem.model} onChange={e => setNewItem({...newItem, model: e.target.value})} />
                            <Input placeholder="שם פריט *" value={newItem.item_description} onChange={e => setNewItem({...newItem, item_description: e.target.value})} />
                            <Input placeholder="תיאור" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                            <Input placeholder="קטגוריה" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} />
                            <Input placeholder="תת-קטגוריה" value={newItem.sub_category} onChange={e => setNewItem({...newItem, sub_category: e.target.value})} />
                            <Input placeholder="BTU" type="number" value={newItem.btu} onChange={e => setNewItem({...newItem, btu: e.target.value})} />
                            <Input placeholder="מחיר ללא מע״מ *" type="number" value={newItem.price_no_vat} onChange={e => setNewItem({...newItem, price_no_vat: e.target.value})} />
                            <Input placeholder="סוג פריט" value={newItem.tipe_item} onChange={e => setNewItem({...newItem, tipe_item: e.target.value})} />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button onClick={addItem} className="bg-emerald-600 hover:bg-emerald-700">
                                <Check className="w-4 h-4 ml-2" />
                                שמור
                            </Button>
                            <Button variant="outline" onClick={() => setShowAdd(false)}>
                                <X className="w-4 h-4 ml-2" />
                                ביטול
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* פילטרים */}
            <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <Search className="w-4 h-4 text-gray-400" />
                            <Input placeholder="חיפוש לפי שם, דגם או תיאור..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                                <SelectTrigger className="w-[160px] bg-white"><SelectValue placeholder="ספק" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">כל הספקים</SelectItem>
                                    {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="w-[160px] bg-white"><SelectValue placeholder="קטגוריה" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">כל הקטגוריות</SelectItem>
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
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
                                    <TableHead className="text-right">ספק</TableHead>
                                    <TableHead className="text-right">דגם</TableHead>
                                    <TableHead className="text-right">שם פריט</TableHead>
                                    <TableHead className="text-right">קטגוריה</TableHead>
                                    <TableHead className="text-right">תת-קטגוריה</TableHead>
                                    <TableHead className="text-center">BTU</TableHead>
                                    <TableHead className="text-center">מחיר</TableHead>
                                    <TableHead className="text-center">סוג</TableHead>
                                    <TableHead className="text-center w-24">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">לא נמצאו פריטים</TableCell></TableRow>
                                ) : filtered.map((item) => {
                                    const isEditing = editingId === item.id;
                                    return (
                                        <TableRow key={item.id} className="hover:bg-slate-50">
                                            <TableCell>
                                                {isEditing ? <Input value={editData.supplier_name} onChange={e => setEditData({...editData, supplier_name: e.target.value})} className="h-8 text-sm w-24" />
                                                : <span className="text-sm font-medium">{item.supplier_name || '-'}</span>}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? <Input value={editData.model} onChange={e => setEditData({...editData, model: e.target.value})} className="h-8 text-sm w-24" />
                                                : <span className="text-sm text-gray-600">{item.model || '-'}</span>}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? <Input value={editData.item_description} onChange={e => setEditData({...editData, item_description: e.target.value})} className="h-8 text-sm" />
                                                : <span className="text-sm font-medium text-slate-800">{item.item_description || item.name || '-'}</span>}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? <Input value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})} className="h-8 text-sm w-20" />
                                                : <span className="text-xs text-gray-500">{item.category || '-'}</span>}
                                            </TableCell>
                                            <TableCell>
                                                {isEditing ? <Input value={editData.sub_category} onChange={e => setEditData({...editData, sub_category: e.target.value})} className="h-8 text-sm w-20" />
                                                : <span className="text-xs text-gray-500">{item.sub_category || '-'}</span>}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isEditing ? <Input type="number" value={editData.btu} onChange={e => setEditData({...editData, btu: e.target.value})} className="h-8 text-sm w-20 text-center" />
                                                : <span className="text-sm">{item.btu ? item.btu.toLocaleString() : '-'}</span>}
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-emerald-700">
                                                {isEditing ? <Input type="number" value={editData.price_no_vat} onChange={e => setEditData({...editData, price_no_vat: Number(e.target.value)})} className="h-8 text-sm w-24 text-center" />
                                                : `₪${(item.price_no_vat || item.unit_price || 0).toLocaleString()}`}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isEditing ? <Input value={editData.tipe_item} onChange={e => setEditData({...editData, tipe_item: e.target.value})} className="h-8 text-sm w-20" />
                                                : <span className="text-xs text-gray-500">{item.tipe_item || '-'}</span>}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {isEditing ? (
                                                    <div className="flex gap-1 justify-center">
                                                        <Button size="icon" variant="ghost" onClick={saveEdit} className="h-8 w-8"><Check className="w-4 h-4 text-green-600" /></Button>
                                                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8"><X className="w-4 h-4 text-red-500" /></Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-1 justify-center">
                                                        <Button size="icon" variant="ghost" onClick={() => startEdit(item)} className="h-8 w-8"><Edit2 className="w-4 h-4 text-gray-500" /></Button>
                                                        <Button size="icon" variant="ghost" onClick={() => deleteItem(item.id)} className="h-8 w-8"><Trash2 className="w-4 h-4 text-red-400" /></Button>
                                                    </div>
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
        </div>
    );
}
