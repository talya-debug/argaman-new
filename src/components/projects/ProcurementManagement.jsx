import React, { useState, useEffect, useMemo } from 'react';
import { PurchaseRecord, Task, SubContractor } from '@/entities';
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
            <DialogContent className="max-w-lg bg-[#1a1a2e] shadow-xl rounded-lg" dir="rtl">
                 <div className="bg-[#1a1a2e] p-1 rounded-lg">
                    <DialogHeader className="bg-purple-50 p-4 rounded-t-lg border-b">
                        <DialogTitle className="text-slate-800 text-lg font-bold">הוספת פריט רכש נוסף</DialogTitle>
                    </DialogHeader>
                    
                    <div className="p-6 bg-[#1a1a2e]">
                        <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
                            <div>
                                <Label htmlFor="item-name" className="text-[#e0e0e0] font-semibold">שם הפריט *</Label>
                                <Input
                                    id="item-name"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    placeholder="שם הפריט לרכישה..."
                                    className="text-right bg-[#1a1a2e] border-gray-300"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="description" className="text-[#e0e0e0] font-semibold">תיאור</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="תיאור מפורט של הפריט..."
                                    rows={3}
                                    className="bg-[#1a1a2e] border-gray-300"
                                />
                            </div>

                            <div>
                                <Label htmlFor="quantity" className="text-[#e0e0e0] font-semibold">כמות מאושרת</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                                    className="text-right bg-[#1a1a2e] border-gray-300"
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
    const [poConfig, setPoConfig] = useState(null);
    const [subContractors, setSubContractors] = useState([]);

    useEffect(() => {
        const loadSubContractors = async () => {
            try {
                const data = await SubContractor.filter({ project_id: project.id });
                setSubContractors(data);
            } catch (error) {
                console.error("Failed to load subcontractors:", error);
            }
        };
        loadSubContractors();
    }, [project.id]);

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
            
            await PurchaseRecord.update(orderId, updateData);
            
            if (field === 'status' && (value === 'סופק מלא' || value === 'שולם')) {
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

    const handleCreatePoPdf = () => {
        if (!poSupplierName.trim()) {
            toast.warning("יש להזין שם ספק");
            return;
        }
        const itemsForPO = purchaseRecords
            .filter(record => selectedPoItems.has(record.id))
            .map(record => {
                if (record.is_grilles) {
                    return {
                        name_snapshot: `גריל - ${record.grille_location || 'ללא מיקום'}`,
                        description_snapshot: `סוג מפזר: ${record.diffuser_type || '-'} | רגיסטר: ${record.register || '-'} | צוואר: ${record.neck_size_cm || '-'}ס"מ | פתח: ${record.opening_size_cm || '-'}ס"מ | צבע: ${record.color || '-'}`,
                        sku_snapshot: '-',
                        quantity_to_order: record.quantity_to_order, 
                        list_price_snapshot: record.unit_price || 0
                    };
                } else if (record.is_manual) {
                    return {
                        name_snapshot: record.manual_item_name,
                        description_snapshot: record.manual_item_description,
                        sku_snapshot: record.clause_number || '-',
                        quantity_to_order: record.quantity_to_order,
                        list_price_snapshot: record.unit_price || 0
                    };
                } else {
                    const quoteLine = quoteLines.find(l => l.id === record.quote_line_id);
                    return { 
                        ...quoteLine,
                        quantity_to_order: record.quantity_to_order,
                        name_snapshot: quoteLine?.name_snapshot,
                        description_snapshot: quoteLine?.description_snapshot,
                        sku_snapshot: quoteLine?.model_snapshot,
                        list_price_snapshot: record.unit_price || quoteLine?.price_no_vat_snapshot
                    };
                }
        });

        setPoConfig({ items: itemsForPO, supplierName: poSupplierName.trim() });
        setIsPoDialogOpen(false);
    };

    const onPoDone = () => {
        setPoConfig(null);
        setSelectedPoItems(new Set());
        setPoSupplierName('');
    };

    return (
        <div className="space-y-4" dir="rtl">
            {poConfig && 
                <PurchaseOrderPDF
                    project={project}
                    items={poConfig.items}
                    supplierName={poConfig.supplierName}
                    onDone={onPoDone}
                />
            }
            
            <Dialog open={isPoDialogOpen} onOpenChange={setIsPoDialogOpen}>
                <DialogContent className="bg-[#1a1a2e]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-right text-xl font-bold">הפקת הזמנת רכש</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-[#e0e0e0]">נבחרו {selectedPoItems.size} פריטים. הזן שם ספק כדי להפיק עבורו הזמנת רכש.</p>
                        <div className="space-y-2">
                            <Label htmlFor="supplier-name" className="font-semibold">שם הספק</Label>
                            <Input 
                                id="supplier-name"
                                placeholder='לדוגמה: א.א. מיזוג כל יכול בעמ"'
                                value={poSupplierName}
                                onChange={(e) => setPoSupplierName(e.target.value)}
                                className="text-right"
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsPoDialogOpen(false)}>ביטול</Button>
                        <Button onClick={handleCreatePoPdf} disabled={!poSupplierName.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">הפק PDF</Button>
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
                                            <TableRow className="border-b-2 border-[rgba(255,255,255,0.08)] bg-[#1a1a2e] hover:bg-[#1e1e36]">
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
                                                    <TableCell colSpan={7} className="p-0 bg-[#1a1a2e]">
                                                        <div className="p-4 border-t border-slate-100">
                                                            <h4 className="text-sm font-semibold flex items-center gap-2 text-[#e0e0e0] mb-3">
                                                                <Package className="w-4 h-4 text-[#a0a0b8]"/>
                                                                הזמנות עבור: {line.name_snapshot} ({line.orders.length})
                                                            </h4>
                                                            {hasOrders ? (
                                                                <Table className="bg-[#1a1a2e]">
                                                                    <TableHeader>
                                                                        <TableRow className="bg-[#1a1a2e]">
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
                                                                        {line.orders.map((order, index) => (
                                                                            <TableRow key={order.id} className="text-[#e0e0e0]">
                                                                                <TableCell>
                                                                                    <Checkbox
                                                                                        checked={selectedPoItems.has(order.id)}
                                                                                        onCheckedChange={() => handleSelectPoItem(order.id)}
                                                                                    />
                                                                                </TableCell>
                                                                                <TableCell className="text-center font-medium text-[#a0a0b8]">
                                                                                    {index + 1}
                                                                                </TableCell>
                                                                                <TableCell className="text-center font-semibold">
                                                                                    {order.quantity_to_order}
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <EditableCell value={order.actual_total_cost || 0} onUpdate={(val) => handleOrderUpdate(order.id, "actual_total_cost", Number(val))} type="number" className="font-bold text-[#4ade80]" />
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
                                                            ) : (
                                                                <div className="text-center text-[#a0a0b8] py-4 border rounded-lg bg-[#1a1a2e]">
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
                                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" disabled>
                                                        <Plus className="w-4 h-4 ml-1" />
                                                        בצע הזמנה
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {isOpenManual && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="p-0 bg-[#1a1a2e]">
                                                        <div className="p-4 border-t border-slate-100">
                                                            <h4 className="text-sm font-semibold flex items-center gap-2 text-[#e0e0e0] mb-3">
                                                                <Package className="w-4 h-4 text-[#a0a0b8]"/>
                                                                הזמנות עבור: {item.manual_item_name} ({item.orders.length})
                                                            </h4>
                                                            <Table className="bg-[#1a1a2e]">
                                                                <TableHeader>
                                                                    <TableRow className="bg-[#1a1a2e]">
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
                                                                        <TableRow key={order.id} className="text-[#e0e0e0]">
                                                                            <TableCell>
                                                                                <Checkbox
                                                                                    checked={selectedPoItems.has(order.id)}
                                                                                    onCheckedChange={() => handleSelectPoItem(order.id)}
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell className="text-center font-medium text-[#a0a0b8]">
                                                                                {index + 1}
                                                                            </TableCell>
                                                                            <TableCell className="text-center font-semibold">
                                                                                {order.quantity_to_order}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <EditableCell value={order.actual_total_cost || 0} onUpdate={(val) => handleOrderUpdate(order.id, "actual_total_cost", Number(val))} type="number" className="font-bold text-[#4ade80]" />
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
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled>
                                                        <Plus className="w-4 h-4 ml-1" />
                                                        בצע הזמנה
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {isOpenGrille && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="p-0 bg-[#1a1a2e]">
                                                        <div className="p-4 border-t border-slate-100">
                                                            <h4 className="text-sm font-semibold flex items-center gap-2 text-[#e0e0e0] mb-3">
                                                                <Package className="w-4 h-4 text-[#a0a0b8]"/>
                                                                הזמנות עבור: גריל {item.grille_location} ({item.orders.length})
                                                            </h4>
                                                            <Table className="bg-[#1a1a2e]">
                                                                <TableHeader>
                                                                    <TableRow className="bg-[#1a1a2e]">
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
                                                                        <TableRow key={order.id} className="text-[#e0e0e0]">
                                                                            <TableCell>
                                                                                <Checkbox
                                                                                    checked={selectedPoItems.has(order.id)}
                                                                                    onCheckedChange={() => handleSelectPoItem(order.id)}
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell className="text-center font-medium text-[#a0a0b8]">
                                                                                {index + 1}
                                                                            </TableCell>
                                                                            <TableCell className="text-center font-semibold">
                                                                                {order.quantity_to_order}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <EditableCell value={order.actual_total_cost || 0} onUpdate={(val) => handleOrderUpdate(order.id, "actual_total_cost", Number(val))} type="number" className="font-bold text-[#4ade80]" />
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
        </div>
    );
}