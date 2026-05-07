import React, { useState, useEffect, useMemo } from 'react';
import { PurchaseRecord, PurchaseOrder, Task, SubContractor } from '@/entities';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Plus, ShoppingCart, Info, ChevronDown, ChevronRight, Package, Trash2 } from 'lucide-react';
import SubContractorDialog from './SubContractorDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import PurchaseOrderPDF from './PurchaseOrderPDF';
import CreateOrderDialog from './CreateOrderDialog';

const statusConfig = {
    "יש להזמין": { color: "bg-[rgba(251,191,36,0.1)] text-yellow-800" },
    "הוזמן": { color: "bg-[rgba(96,165,250,0.1)] text-blue-800" },
    "סופק חלקית": { color: "bg-orange-100 text-orange-800" },
    "סופק מלא": { color: "bg-[rgba(74,222,128,0.1)] text-green-800" },
    "שולם": { color: "bg-purple-100 text-purple-800" },
};

const userOptions = [
    { value: 'חיה', label: 'חיה' },
    { value: 'יניר', label: 'יניר' },
    { value: 'דבורה', label: 'דבורה' },
    { value: 'יהודה', label: 'יהודה' },
    { value: 'רבקה', label: 'רבקה' },
    { value: 'שי', label: 'שי' },
];

const statusOptions = Object.entries(statusConfig).map(([status]) => ({ value: status, label: status }));

// Dialog להוספת רכש כללי
function AddManualPurchaseDialog({ projectId, onItemAdded }) {
    const [isOpen, setIsOpen] = useState(false);
    const [itemName, setItemName] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [clauseNumber, setClauseNumber] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!itemName) {
            toast.error("יש למלא שם פריט");
            return;
        }

        try {
            await PurchaseRecord.create({
                project_id: projectId,
                quantity_to_order: quantity,
                is_manual: true,
                is_grilles: false,
                manual_item_name: itemName,
                manual_item_description: description,
                clause_number: clauseNumber,
                status: 'יש להזמין',
                actual_total_cost: 0
            });
            
            onItemAdded();
            setIsOpen(false);
            setItemName('');
            setDescription('');
            setQuantity(1);
            setClauseNumber('');
            
            toast.success("פריט רכש כללי נוסף בהצלחה");
            
        } catch (error) {
            toast.error("שגיאה בהוספת פריט רכש כללי");
            console.error(error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="w-4 h-4 ml-2" />
                    פריט נוסף
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white shadow-xl rounded-lg" dir="rtl">
                 <div className="bg-white p-1 rounded-lg">
                    <DialogHeader className="bg-purple-50 p-4 rounded-t-lg border-b">
                        <DialogTitle className="text-slate-800 text-lg font-bold">הוספת פריט רכש נוסף</DialogTitle>
                    </DialogHeader>
                    
                    <div className="p-6 bg-white">
                        <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
                            <div>
                                <Label htmlFor="item-name" className="text-gray-700 font-semibold">שם הפריט *</Label>
                                <Input
                                    id="item-name"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    placeholder="שם הפריט לרכישה..."
                                    className="text-right bg-white border-gray-300"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="description" className="text-gray-700 font-semibold">תיאור</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="תיאור מפורט של הפריט..."
                                    rows={3}
                                    className="bg-white border-gray-300"
                                />
                            </div>

                            <div>
                                <Label htmlFor="quantity" className="text-gray-700 font-semibold">כמות מאושרת</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                                    className="text-right bg-white border-gray-300"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    ביטול
                                </Button>
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                                    הוסף פריט
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function EditableCell({ value, onUpdate, type = 'text', options = null, className = '' }) {
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleBlur = () => {
        if (currentValue !== value) {
            onUpdate(currentValue);
        }
    };

    const handleSelectChange = (newValue) => {
        setCurrentValue(newValue);
        onUpdate(newValue);
    };

    if (type === 'select' && options) {
        return (
            <Select value={currentValue || ''} onValueChange={handleSelectChange}>
                <SelectTrigger className={`h-8 text-xs ${className}`}>
                    <SelectValue placeholder="בחר..." />
                </SelectTrigger>
                <SelectContent>
                    {options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    return (
        <Input
            type={type}
            value={currentValue || ''}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur}
            className={`h-8 text-xs ${className}`}
        />
    );
}

export default function ProcurementManagement({ quoteLines, purchaseRecords, project, onUpdateQuoteLine }) {
    const [openCollapsibles, setOpenCollapsibles] = useState(new Set());
    const [selectedPoItems, setSelectedPoItems] = useState(new Set());
    const [isPoDialogOpen, setIsPoDialogOpen] = useState(false);
    const [poSupplierName, setPoSupplierName] = useState('');
    const [poSupplierPhone, setPoSupplierPhone] = useState('');
    const [poConfig, setPoConfig] = useState(null);
    const [subContractors, setSubContractors] = useState([]);
    const [savedOrders, setSavedOrders] = useState([]);
    const [editingOrder, setEditingOrder] = useState(null);
    const [editOrderData, setEditOrderData] = useState({});

    const refreshSavedOrders = async () => {
        try {
            const poData = await PurchaseOrder.filter({ project_id: project.id });
            setSavedOrders(poData.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (error) {
            console.error("Failed to load saved orders:", error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const scData = await SubContractor.filter({ project_id: project.id });
                setSubContractors(scData);
            } catch (error) {
                console.error("Failed to load subcontractors:", error);
            }
            await refreshSavedOrders();
        };
        loadData();
    }, [project.id, purchaseRecords]);

    const handleSubContractorUpdate = async (contractorId, field, value) => {
        try {
            await SubContractor.update(contractorId, { [field]: value });
            const updatedData = await SubContractor.filter({ project_id: project.id });
            setSubContractors(updatedData);
            toast.success("קבלן משנה עודכן");
            if (onUpdateQuoteLine) onUpdateQuoteLine();
        } catch (error) {
            console.error("Failed to update subcontractor:", error);
            toast.error("שגיאה בעדכון קבלן משנה");
        }
    };

    const handleDeleteSubContractor = async (contractorId) => {
        try {
            await SubContractor.delete(contractorId);
            const updatedData = await SubContractor.filter({ project_id: project.id });
            setSubContractors(updatedData);
            toast.success("קבלן משנה נמחק");
            if (onUpdateQuoteLine) onUpdateQuoteLine();
        } catch (error) {
            console.error("Failed to delete subcontractor:", error);
            toast.error("שגיאה במחיקת קבלן משנה");
        }
    };

    // Process data - one summary row per quote line + manual items
    const procurementData = useMemo(() => {
        const validQuoteLines = quoteLines.filter(line => line && line.id && !line.is_header);
        
        // Group manual items by name
        const manualItemsMap = new Map();
        const grillesItemsMap = new Map();
        
        purchaseRecords.forEach(record => {
            if (record.is_grilles) {
                const key = record.grille_location || 'ללא מיקום';
                if (!grillesItemsMap.has(key)) {
                    grillesItemsMap.set(key, []);
                }
                grillesItemsMap.get(key).push(record);
            } else if (record.is_manual && !record.is_grilles) {
                const key = record.manual_item_name;
                if (!manualItemsMap.has(key)) {
                    manualItemsMap.set(key, []);
                }
                manualItemsMap.get(key).push(record);
            }
        });

        const lineData = validQuoteLines.map(line => {
            const lineOrders = purchaseRecords.filter(r => r.quote_line_id === line.id && !r.is_manual);
            const totalOrdered = lineOrders.reduce((sum, order) => sum + (order.quantity_to_order || 0), 0);
            const actualCostForLine = lineOrders.reduce((sum, order) => sum + (parseFloat(order.actual_total_cost) || 0), 0);
            const approvedQuantity = line.quantity || 0;
            const remainingToOrder = Math.max(0, approvedQuantity - totalOrdered);
            
            return {
                ...line,
                orders: lineOrders,
                approvedQuantity,
                totalOrdered,
                actualCostForLine,
                remainingToOrder
            };
        });

        const manualItems = Array.from(manualItemsMap.entries()).map(([name, orders]) => ({
            id: `manual-${name}`,
            manual_item_name: name,
            orders: orders,
            approvedQuantity: orders[0]?.quantity_to_order || 0,
            totalOrdered: orders.reduce((sum, o) => sum + (o.quantity_to_order || 0), 0),
            actualCostForLine: orders.reduce((sum, o) => sum + (parseFloat(o.actual_total_cost) || 0), 0),
            remainingToOrder: 0
        }));

        const grillesItems = Array.from(grillesItemsMap.entries()).map(([location, orders]) => ({
            id: `grille-${location}`,
            grille_location: location,
            orders: orders,
            approvedQuantity: orders[0]?.quantity_to_order || 0,
            totalOrdered: orders.reduce((sum, o) => sum + (o.quantity_to_order || 0), 0),
            actualCostForLine: orders.reduce((sum, o) => sum + (parseFloat(o.actual_total_cost) || 0), 0),
            remainingToOrder: 0
        }));

        return { lineData, manualItems, grillesItems };
    }, [quoteLines, purchaseRecords]);

    const toggleCollapsible = (lineId) => {
        setOpenCollapsibles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(lineId)) {
                newSet.delete(lineId);
            } else {
                newSet.add(lineId);
            }
            return newSet;
        });
    };

    const handleOrderUpdate = async (orderId, field, value) => {
        try {
            const order = purchaseRecords.find(r => r.id === orderId);
            if (!order) return;

            const updateData = { [field]: value };

            // אם עדכנו כמות שהתקבלה — בדוק אם סופק מלא
            if (field === 'quantity_delivered') {
                const qty = Number(value) || 0;
                const ordered = Number(order.quantity_to_order) || 0;
                if (qty >= ordered && order.status === 'הוזמן') {
                    updateData.status = 'סופק מלא';
                    updateData.delivery_date = new Date().toISOString().split('T')[0];
                } else if (qty > 0 && qty < ordered) {
                    updateData.status = 'סופק חלקית';
                }
            }

            // אם הוזנה חשבונית ספק — יצירת רשומת הוצאה בגבייה
            if (field === 'supplier_invoice_number' && value && !order.supplier_invoice_number) {
                try {
                    const { CollectionTask } = await import('@/entities');
                    await CollectionTask.create({
                        project_id: order.project_id,
                        project_name: project?.name || '',
                        description: `חשבונית ספק ${value} — ${order.supplier_name || 'ספק'}`,
                        amount_to_collect: -(Number(order.actual_total_cost) || Number(order.planned_total_cost) || 0),
                        collection_status: 'הוצאה — חשבונית ספק',
                        invoice_number: value,
                        invoice_date: new Date().toISOString().split('T')[0],
                        responsible: order.ordering_responsible || '',
                        is_expense: true,
                        purchase_record_id: orderId,
                    });
                } catch (e) {
                    console.error('Failed to create expense record:', e);
                }
            }

            await PurchaseRecord.update(orderId, updateData);

            if ((field === 'status' || updateData.status) &&
                (value === 'סופק מלא' || value === 'שולם' || updateData.status === 'סופק מלא')) {
                const tasks = await Task.filter({ source_type: 'procurement_record', source_id: orderId });
                const openTask = tasks.find(t => t.status !== 'הושלם');
                if (openTask) {
                    await Task.update(openTask.id, { status: 'הושלם' });
                }
            }

            onUpdateQuoteLine();
            toast.success("עודכן בהצלחה");
        } catch (error) {
            console.error("Failed to update order:", error);
            toast.error("שגיאה בעדכון");
        }
    };

    const handleDeleteOrder = async (orderId) => {
        try {
            await PurchaseRecord.delete(orderId);
            onUpdateQuoteLine();
            toast.success("הזמנה נמחקה");
        } catch (error) {
            console.error("Failed to delete order:", error);
            toast.error("שגיאה במחיקה");
        }
    };
    
    const handleSelectPoItem = (recordId) => {
        setSelectedPoItems(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(recordId)) newSelection.delete(recordId);
            else newSelection.add(recordId);
            return newSelection;
        });
    };

    const handleGeneratePO = () => {
        if (selectedPoItems.size === 0) {
            toast.warning("יש לבחור לפחות פריט אחד להזמנה");
            return;
        }
        setIsPoDialogOpen(true);
    };

    const handleCreatePoPdf = async () => {
        if (!poSupplierName.trim()) {
            toast.warning("יש להזין שם ספק");
            return;
        }

        // מספר הזמנה אוטומטי
        const poNumber = Math.floor(10000 + Math.random() * 90000);
        const selectedRecords = purchaseRecords.filter(record => selectedPoItems.has(record.id));

        // עדכון סטטוס כל הפריטים ל"הוזמן" + שם ספק
        for (const record of selectedRecords) {
            try {
                await PurchaseRecord.update(record.id, {
                    status: 'הוזמן',
                    supplier_name: poSupplierName.trim(),
                    po_number: poNumber,
                    purchase_date: new Date().toISOString().split('T')[0],
                });
            } catch (e) {
                console.error('Failed to update record:', e);
            }
        }

        const itemsForPO = selectedRecords.map(record => {
                if (record.is_grilles) {
                    return {
                        name_snapshot: `גריל - ${record.grille_location || 'ללא מיקום'}`,
                        description_snapshot: `סוג מפזר: ${record.diffuser_type || '-'} | רגיסטר: ${record.register || '-'} | צוואר: ${record.neck_size_cm || '-'}ס"מ | פתח: ${record.opening_size_cm || '-'}ס"מ | צבע: ${record.color || '-'}`,
                        quantity_to_order: record.quantity_to_order,
                        unit_price: record.unit_price || 0
                    };
                } else if (record.is_manual) {
                    return {
                        name_snapshot: record.manual_item_name,
                        description_snapshot: record.manual_item_description,
                        quantity_to_order: record.quantity_to_order,
                        unit_price: record.unit_price || 0
                    };
                } else {
                    const quoteLine = quoteLines.find(l => l.id === record.quote_line_id);
                    return {
                        quantity_to_order: record.quantity_to_order,
                        name_snapshot: quoteLine?.name_snapshot,
                        description_snapshot: quoteLine?.description_snapshot,
                        unit_price: record.unit_price || quoteLine?.price_no_vat_snapshot || 0
                    };
                }
        });

        // שמירת הזמנת הרכש כרשומה ב-Firestore
        try {
            await PurchaseOrder.create({
                po_number: poNumber,
                project_id: project.id,
                project_name: project.name || '',
                supplier_name: poSupplierName.trim(),
                supplier_phone: poSupplierPhone.trim(),
                items: itemsForPO,
                record_ids: Array.from(selectedPoItems),
                status: 'הוזמן',
                total_amount: itemsForPO.reduce((sum, item) => sum + (item.quantity_to_order * item.unit_price), 0),
                date: new Date().toISOString().split('T')[0],
            });
        } catch (e) {
            console.error('Failed to save PO:', e);
        }

        setPoConfig({ items: itemsForPO, supplierName: poSupplierName.trim(), supplierPhone: poSupplierPhone.trim(), poNumber });
        setIsPoDialogOpen(false);
        toast.success(`הזמנת רכש ${poNumber} הופקה ונשמרה — ${selectedRecords.length} פריטים עודכנו ל"הוזמן"`);
        await refreshSavedOrders();
        onUpdateQuoteLine();
    };

    const onPoDone = () => {
        setPoConfig(null);
        setSelectedPoItems(new Set());
        setPoSupplierName('');
        setPoSupplierPhone('');
    };

    return (
        <div className="space-y-4" dir="rtl">
            {poConfig &&
                <PurchaseOrderPDF
                    project={project}
                    items={poConfig.items}
                    supplierName={poConfig.supplierName}
                    supplierPhone={poConfig.supplierPhone}
                    poNumber={poConfig.poNumber}
                    onDone={onPoDone}
                />
            }
            
            <Dialog open={isPoDialogOpen} onOpenChange={setIsPoDialogOpen}>
                <DialogContent className="bg-white" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-right text-xl font-bold">הפקת הזמנת רכש</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-gray-700">נבחרו {selectedPoItems.size} פריטים. הפקת ההזמנה תעדכן את הסטטוס ל"הוזמן" ותיצור PDF.</p>
                        <div className="space-y-2">
                            <Label htmlFor="supplier-name" className="font-semibold">שם הספק *</Label>
                            <Input
                                id="supplier-name"
                                placeholder='לדוגמה: ישומי בקרה בע"מ'
                                value={poSupplierName}
                                onChange={(e) => setPoSupplierName(e.target.value)}
                                className="text-right"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="supplier-phone" className="font-semibold">טלפון ספק</Label>
                            <Input
                                id="supplier-phone"
                                placeholder="טלפון הספק"
                                value={poSupplierPhone}
                                onChange={(e) => setPoSupplierPhone(e.target.value)}
                                className="text-right"
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsPoDialogOpen(false)}>ביטול</Button>
                        <Button onClick={handleCreatePoPdf} disabled={!poSupplierName.trim()} className="bg-[#D4A843] hover:bg-[#B8922E] text-white">הפק הזמנת רכש</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="shadow-lg border-0">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            ניהול רכש ופריטים
                        </CardTitle>
                        <div className="flex gap-2">
                            <AddManualPurchaseDialog projectId={project.id} onItemAdded={onUpdateQuoteLine} />
                            <SubContractorDialog 
                                projectId={project.id}
                                onSubContractorAdded={onUpdateQuoteLine}
                            />
                            <Button 
                                onClick={handleGeneratePO} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 shadow-lg"
                                disabled={selectedPoItems.size === 0}
                            >
                                <FileText className="w-4 h-4 ml-2" />
                                הפק הזמנת רכש ({selectedPoItems.size})
                            </Button>
                        </div>
                    </div>
                     <div className="bg-[rgba(96,165,250,0.1)] border border-blue-200 text-blue-800 text-sm p-3 rounded-lg mt-4 flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        <span>שורה אחת לכל פריט. לחץ "בצע הזמנה" כדי ליצור הזמנה חדשה.</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right w-10"></TableHead>
                                    <TableHead className="text-right w-56">תיאור הפריט</TableHead>
                                    <TableHead className="text-center w-32">כמות מאושרת</TableHead>
                                    <TableHead className="text-center w-32">כמות הוזמנה מצטבר</TableHead>
                                    <TableHead className="text-center w-32">נותר להזמנה</TableHead>
                                    <TableHead className="text-center w-40">סכום הזמנות מצטבר</TableHead>
                                    <TableHead className="text-center w-32">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Quote Line Items */}
                                {procurementData.lineData.map((line) => {
                                    const isOpen = openCollapsibles.has(line.id);
                                    const hasOrders = line.orders && line.orders.length > 0;

                                    return (
                                        <React.Fragment key={line.id}>
                                            <TableRow className="border-b-2 border-gray-200 hover:bg-gray-50">
                                                <TableCell>
                                                     <Button variant="ghost" size="sm" onClick={() => toggleCollapsible(line.id)}>
                                                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-slate-800">{line.name_snapshot}</TableCell>
                                                <TableCell className="text-center font-bold text-lg">{line.approvedQuantity}</TableCell>
                                                <TableCell className="text-center font-bold text-lg text-[#60a5fa]">{line.totalOrdered}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={line.remainingToOrder > 0 ? 'text-orange-600 font-bold text-lg' : 'text-[#4ade80] font-bold'}>
                                                        {line.remainingToOrder}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-[#4ade80] text-lg">
                                                    ₪{(line.actualCostForLine || 0).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <CreateOrderDialog
                                                        quoteLine={line}
                                                        project={project}
                                                        remainingQuantity={line.remainingToOrder}
                                                        onOrderCreated={onUpdateQuoteLine}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                            {isOpen && (
                                                 <TableRow>
                                                    <TableCell colSpan={7} className="p-0 bg-gray-50">
                                                        <div className="p-4 border-t border-slate-100">
                                                            <h4 className="text-sm font-semibold flex items-center gap-2 text-gray-700 mb-3">
                                                                <Package className="w-4 h-4 text-gray-400"/>
                                                                הזמנות עבור: {line.name_snapshot} ({line.orders.length})
                                                            </h4>
                                                            {hasOrders ? (
                                                                <Table className="bg-gray-50">
                                                                    <TableHeader>
                                                                        <TableRow className="bg-gray-100">
                                                                            <TableHead className="w-10"></TableHead>
                                                                            <TableHead className="w-12">#</TableHead>
                                                                            <TableHead>כמות הוזמנה</TableHead>
                                                                            <TableHead>סכום</TableHead>
                                                                            <TableHead>ספק</TableHead>
                                                                            <TableHead>סטטוס</TableHead>
                                                                            <TableHead>התקבל</TableHead>
                                                                            <TableHead>חשבונית ספק</TableHead>
                                                                            <TableHead>הערות</TableHead>
                                                                            <TableHead className="w-10"></TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {line.orders.map((order, index) => (
                                                                            <TableRow key={order.id} className="text-gray-800">
                                                                                <TableCell>
                                                                                    <Checkbox
                                                                                        checked={selectedPoItems.has(order.id)}
                                                                                        onCheckedChange={() => handleSelectPoItem(order.id)}
                                                                                    />
                                                                                </TableCell>
                                                                                <TableCell className="text-center font-medium text-gray-500">
                                                                                    {index + 1}
                                                                                </TableCell>
                                                                                <TableCell className="text-center font-semibold">
                                                                                    {order.quantity_to_order}
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <EditableCell value={order.actual_total_cost || 0} onUpdate={(val) => handleOrderUpdate(order.id, "actual_total_cost", Number(val))} type="number" className="font-bold text-green-700" />
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <EditableCell value={order.supplier_name} onUpdate={(val) => handleOrderUpdate(order.id, "supplier_name", val)} />
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <EditableCell value={order.status} onUpdate={(val) => handleOrderUpdate(order.id, "status", val)} type="select" options={statusOptions} className={statusConfig[order.status]?.color} />
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <EditableCell value={order.quantity_delivered || 0} onUpdate={(val) => handleOrderUpdate(order.id, "quantity_delivered", Number(val))} type="number" />
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <EditableCell value={order.supplier_invoice_number} onUpdate={(val) => handleOrderUpdate(order.id, "supplier_invoice_number", val)} />
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <EditableCell value={order.notes} onUpdate={(val) => handleOrderUpdate(order.id, "notes", val)} />
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteOrder(order.id)}>
                                                                                        <Trash2 className="w-4 h-4 text-red-500"/>
                                                                                    </Button>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            ) : (
                                                                <div className="text-center text-gray-500 py-4 border rounded-lg bg-gray-50">
                                                                    <p className="font-medium">אין עדיין הזמנות עבור פריט זה.</p>
                                                                    <p className="text-sm">לחץ על "בצע הזמנה" כדי לפתוח הזמנה חדשה.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                 </TableRow>
                                            )}
                                        </React.Fragment>
                                    );
                                })}

                                {/* Manual Purchase Items */}
                                {procurementData.manualItems.length > 0 && (
                                    <TableRow className="border-t-4 border-purple-300 bg-purple-50">
                                        <TableCell colSpan={7} className="text-center font-bold text-purple-800 py-4">
                                            פריטים נוספים
                                        </TableCell>
                                    </TableRow>
                                )}
                                
                                {procurementData.manualItems.map((item) => {
                                    const isOpenManual = openCollapsibles.has(item.id);
                                    
                                    return (
                                        <React.Fragment key={item.id}>
                                            <TableRow className="bg-purple-50/50 hover:bg-purple-100/50 border-b-2 border-purple-200">
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" onClick={() => toggleCollapsible(item.id)}>
                                                        {isOpenManual ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="font-bold text-purple-900">{item.manual_item_name}</TableCell>
                                                <TableCell className="text-center font-bold text-lg">{item.approvedQuantity}</TableCell>
                                                <TableCell className="text-center font-bold text-lg text-[#60a5fa]">{item.totalOrdered}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={item.remainingToOrder > 0 ? 'text-orange-600 font-bold text-lg' : 'text-[#4ade80] font-bold'}>
                                                        {item.remainingToOrder}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-[#4ade80] text-lg">
                                                    ₪{item.actualCostForLine.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <CreateOrderDialog
                                                        quoteLine={{
                                                          id: item.id,
                                                          name_snapshot: item.manual_item_name || 'פריט ידני',
                                                          price_no_vat_snapshot: item.orders[0]?.unit_price || 0,
                                                        }}
                                                        project={project}
                                                        remainingQuantity={item.remainingToOrder}
                                                        onOrderCreated={onUpdateQuoteLine}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                            {isOpenManual && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="p-0 bg-gray-50">
                                                        <div className="p-4 border-t border-slate-100">
                                                            <h4 className="text-sm font-semibold flex items-center gap-2 text-gray-700 mb-3">
                                                                <Package className="w-4 h-4 text-gray-400"/>
                                                                הזמנות עבור: {item.manual_item_name} ({item.orders.length})
                                                            </h4>
                                                            <Table className="bg-gray-50">
                                                                <TableHeader>
                                                                    <TableRow className="bg-gray-100">
                                                                        <TableHead className="w-10"></TableHead>
                                                                        <TableHead className="w-12">#</TableHead>
                                                                        <TableHead>כמות הוזמנה</TableHead>
                                                                        <TableHead>סכום הזמנה</TableHead>
                                                                        <TableHead>אחראי</TableHead>
                                                                        <TableHead>ספק</TableHead>
                                                                        <TableHead>סטטוס</TableHead>
                                                                        <TableHead>הערות</TableHead>
                                                                        <TableHead className="w-10"></TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {item.orders.map((order, index) => (
                                                                        <TableRow key={order.id} className="text-gray-800">
                                                                            <TableCell>
                                                                                <Checkbox
                                                                                    checked={selectedPoItems.has(order.id)}
                                                                                    onCheckedChange={() => handleSelectPoItem(order.id)}
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell className="text-center font-medium text-gray-500">
                                                                                {index + 1}
                                                                            </TableCell>
                                                                            <TableCell className="text-center font-semibold">
                                                                                {order.quantity_to_order}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <EditableCell value={order.actual_total_cost || 0} onUpdate={(val) => handleOrderUpdate(order.id, "actual_total_cost", Number(val))} type="number" className="font-bold text-green-700" />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <EditableCell value={order.ordering_responsible} onUpdate={(val) => handleOrderUpdate(order.id, "ordering_responsible", val)} type="select" options={userOptions} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <EditableCell value={order.supplier_name} onUpdate={(val) => handleOrderUpdate(order.id, "supplier_name", val)} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <EditableCell value={order.status} onUpdate={(val) => handleOrderUpdate(order.id, "status", val)} type="select" options={statusOptions} className={statusConfig[order.status]?.color} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <EditableCell value={order.notes} onUpdate={(val) => handleOrderUpdate(order.id, "notes", val)} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteOrder(order.id)}>
                                                                                    <Trash2 className="w-4 h-4 text-red-500"/>
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    );
                                })}

                                {/* Grilles Items */}
                                {procurementData.grillesItems.length > 0 && (
                                    <TableRow className="border-t-4 border-green-300 bg-[rgba(74,222,128,0.1)]">
                                        <TableCell colSpan={7} className="text-center font-bold text-green-800 py-4">
                                            גרילים
                                        </TableCell>
                                    </TableRow>
                                )}
                                
                                {procurementData.grillesItems.map((item) => {
                                    const isOpenGrille = openCollapsibles.has(item.id);
                                    
                                    return (
                                        <React.Fragment key={item.id}>
                                            <TableRow className="bg-[rgba(74,222,128,0.1)]/50 hover:bg-[rgba(74,222,128,0.1)]/50 border-b-2 border-green-200">
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" onClick={() => toggleCollapsible(item.id)}>
                                                        {isOpenGrille ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="font-bold text-green-900">
                                                    גריל - {item.grille_location}
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-lg">{item.approvedQuantity}</TableCell>
                                                <TableCell className="text-center font-bold text-lg text-[#60a5fa]">{item.totalOrdered}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={item.remainingToOrder > 0 ? 'text-orange-600 font-bold text-lg' : 'text-[#4ade80] font-bold'}>
                                                        {item.remainingToOrder}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-[#4ade80] text-lg">
                                                    ₪{item.actualCostForLine.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <CreateOrderDialog
                                                        quoteLine={{
                                                          id: item.id,
                                                          name_snapshot: `גריל - ${item.grille_location}`,
                                                          price_no_vat_snapshot: item.orders[0]?.unit_price || 0,
                                                        }}
                                                        project={project}
                                                        remainingQuantity={item.remainingToOrder}
                                                        onOrderCreated={onUpdateQuoteLine}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                            {isOpenGrille && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="p-0 bg-gray-50">
                                                        <div className="p-4 border-t border-slate-100">
                                                            <h4 className="text-sm font-semibold flex items-center gap-2 text-gray-700 mb-3">
                                                                <Package className="w-4 h-4 text-gray-400"/>
                                                                הזמנות עבור: גריל {item.grille_location} ({item.orders.length})
                                                            </h4>
                                                            <Table className="bg-gray-50">
                                                                <TableHeader>
                                                                    <TableRow className="bg-gray-100">
                                                                        <TableHead className="w-10"></TableHead>
                                                                        <TableHead className="w-12">#</TableHead>
                                                                        <TableHead>כמות הוזמנה</TableHead>
                                                                        <TableHead>סכום הזמנה</TableHead>
                                                                        <TableHead>אחראי</TableHead>
                                                                        <TableHead>ספק</TableHead>
                                                                        <TableHead>סטטוס</TableHead>
                                                                        <TableHead>הערות</TableHead>
                                                                        <TableHead className="w-10"></TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {item.orders.map((order, index) => (
                                                                        <TableRow key={order.id} className="text-gray-800">
                                                                            <TableCell>
                                                                                <Checkbox
                                                                                    checked={selectedPoItems.has(order.id)}
                                                                                    onCheckedChange={() => handleSelectPoItem(order.id)}
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell className="text-center font-medium text-gray-500">
                                                                                {index + 1}
                                                                            </TableCell>
                                                                            <TableCell className="text-center font-semibold">
                                                                                {order.quantity_to_order}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <EditableCell value={order.actual_total_cost || 0} onUpdate={(val) => handleOrderUpdate(order.id, "actual_total_cost", Number(val))} type="number" className="font-bold text-green-700" />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <EditableCell value={order.ordering_responsible} onUpdate={(val) => handleOrderUpdate(order.id, "ordering_responsible", val)} type="select" options={userOptions} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <EditableCell value={order.supplier_name} onUpdate={(val) => handleOrderUpdate(order.id, "supplier_name", val)} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <EditableCell value={order.status} onUpdate={(val) => handleOrderUpdate(order.id, "status", val)} type="select" options={statusOptions} className={statusConfig[order.status]?.color} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <EditableCell value={order.notes} onUpdate={(val) => handleOrderUpdate(order.id, "notes", val)} />
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteOrder(order.id)}>
                                                                                    <Trash2 className="w-4 h-4 text-red-500"/>
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    );
                                })}

                                {/* SubContractors Section */}
                                {subContractors.length > 0 && (
                                    <TableRow className="border-t-4 border-blue-300 bg-[rgba(96,165,250,0.1)]">
                                        <TableCell colSpan={7} className="text-center font-bold text-blue-800 py-4">
                                            קבלני משנה
                                        </TableCell>
                                    </TableRow>
                                )}
                                
                                {subContractors.map((contractor) => (
                                    <TableRow key={contractor.id} className="bg-[rgba(96,165,250,0.1)]/50 hover:bg-[rgba(96,165,250,0.1)]/50">
                                        <TableCell></TableCell>
                                        <TableCell className="font-bold text-blue-900">
                                            {contractor.contractor_name}
                                        </TableCell>
                                        <TableCell colSpan={5}>
                                            <div className="flex gap-4 items-center text-sm">
                                                <div><strong>תחום:</strong> {contractor.work_field}</div>
                                                <div><strong>סכום:</strong> ₪{(contractor.amount || 0).toLocaleString()}</div>
                                                <EditableCell 
                                                    value={contractor.payment_status} 
                                                    onUpdate={(val) => handleSubContractorUpdate(contractor.id, "payment_status", val)} 
                                                    type="select" 
                                                    options={[
                                                        { value: 'ממתין לאישור', label: 'ממתין לאישור' },
                                                        { value: 'מאושר לתשלום', label: 'מאושר לתשלום' },
                                                        { value: 'שולם', label: 'שולם' },
                                                        { value: 'שולם חלקית', label: 'שולם חלקית' }
                                                    ]} 
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteSubContractor(contractor.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* הזמנות רכש שמורות */}
            {savedOrders.length > 0 && (
                <Card className="shadow-lg border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            הזמנות רכש שמורות ({savedOrders.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">מס' הזמנה</TableHead>
                                        <TableHead className="text-right">תאריך</TableHead>
                                        <TableHead className="text-right">ספק</TableHead>
                                        <TableHead className="text-center">פריטים</TableHead>
                                        <TableHead className="text-center">סכום</TableHead>
                                        <TableHead className="text-center">סטטוס</TableHead>
                                        <TableHead className="text-center w-32">פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {savedOrders.map(order => {
                                        const isEditing = editingOrder === order.id;
                                        return (
                                            <React.Fragment key={order.id}>
                                                <TableRow className="hover:bg-gray-50">
                                                    <TableCell className="font-bold text-indigo-700">#{order.po_number}</TableCell>
                                                    <TableCell className="text-sm">{order.date ? new Date(order.date).toLocaleDateString('he-IL') : '-'}</TableCell>
                                                    <TableCell>
                                                        {isEditing ? (
                                                            <Input value={editOrderData.supplier_name || ''} onChange={e => setEditOrderData({...editOrderData, supplier_name: e.target.value})} className="h-8 text-sm" />
                                                        ) : order.supplier_name}
                                                    </TableCell>
                                                    <TableCell className="text-center">{order.items?.length || 0}</TableCell>
                                                    <TableCell className="text-center font-bold text-green-700">
                                                        {isEditing ? (
                                                            <Input type="number" value={editOrderData.total_amount || 0} onChange={e => setEditOrderData({...editOrderData, total_amount: Number(e.target.value)})} className="h-8 w-28 text-center" />
                                                        ) : `₪${(order.total_amount || 0).toLocaleString()}`}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {isEditing ? (
                                                            <Select value={editOrderData.status} onValueChange={v => setEditOrderData({...editOrderData, status: v})}>
                                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {Object.keys(statusConfig).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color || 'bg-gray-100'}`}>{order.status}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex gap-1 justify-center">
                                                            {isEditing ? (
                                                                <>
                                                                    <Button size="sm" variant="ghost" onClick={async () => {
                                                                        try {
                                                                            await PurchaseOrder.update(order.id, editOrderData);
                                                                            toast.success('הזמנה עודכנה');
                                                                            setEditingOrder(null);
                                                                            await refreshSavedOrders();
                                                                        } catch { toast.error('שגיאה בעדכון'); }
                                                                    }} className="text-green-600 h-8 px-2">שמור</Button>
                                                                    <Button size="sm" variant="ghost" onClick={() => setEditingOrder(null)} className="text-gray-500 h-8 px-2">ביטול</Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Button size="sm" variant="ghost" onClick={() => {
                                                                        setEditingOrder(order.id);
                                                                        setEditOrderData({ supplier_name: order.supplier_name, supplier_phone: order.supplier_phone, total_amount: order.total_amount, status: order.status });
                                                                    }} className="h-8 px-2"><Info className="w-4 h-4 text-blue-500" /></Button>
                                                                    <Button size="sm" variant="ghost" onClick={() => {
                                                                        setPoConfig({ items: order.items || [], supplierName: order.supplier_name, supplierPhone: order.supplier_phone || '', poNumber: order.po_number });
                                                                    }} className="h-8 px-2"><FileText className="w-4 h-4 text-indigo-500" /></Button>
                                                                    <Button size="sm" variant="ghost" onClick={async () => {
                                                                        await PurchaseOrder.delete(order.id);
                                                                        toast.success('הזמנה נמחקה');
                                                                        const poData = await PurchaseOrder.filter({ project_id: project.id });
                                                                        setSavedOrders(poData.sort((a, b) => new Date(b.date) - new Date(a.date)));
                                                                    }} className="h-8 px-2"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {isEditing && order.items && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="bg-gray-50 p-4">
                                                            <h4 className="text-sm font-semibold mb-2">פריטים בהזמנה:</h4>
                                                            <Table>
                                                                <TableHeader><TableRow className="bg-gray-100"><TableHead>פריט</TableHead><TableHead>כמות</TableHead><TableHead>מחיר יחידה</TableHead><TableHead>סה"כ</TableHead></TableRow></TableHeader>
                                                                <TableBody>
                                                                    {order.items.map((item, idx) => (
                                                                        <TableRow key={idx}>
                                                                            <TableCell className="text-sm">{item.name_snapshot}</TableCell>
                                                                            <TableCell className="text-center">{item.quantity_to_order}</TableCell>
                                                                            <TableCell className="text-center">₪{(item.unit_price || 0).toLocaleString()}</TableCell>
                                                                            <TableCell className="text-center font-bold">₪{((item.quantity_to_order || 0) * (item.unit_price || 0)).toLocaleString()}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}