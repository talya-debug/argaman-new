import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PurchaseRecord, Task } from '@/entities';

const userOptions = [
    { value: 'חיה', label: 'חיה' },
    { value: 'יניר', label: 'יניר' },
    { value: 'דבורה', label: 'דבורה' },
    { value: 'יהודה', label: 'יהודה' },
    { value: 'רבקה', label: 'רבקה' },
    { value: 'שי', label: 'שי' },
];

export default function CreateOrderDialog({ quoteLine, project, remainingQuantity, onOrderCreated }) {
    const [isOpen, setIsOpen] = useState(false);
    const [quantityToOrder, setQuantityToOrder] = useState(0);
    const [supplierName, setSupplierName] = useState('');
    const [orderingResponsible, setOrderingResponsible] = useState('חיה');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setQuantityToOrder(0);
            setSupplierName('');
            setOrderingResponsible('חיה');
            setDueDate('');
            setNotes('');
        } else {
            // Pre-fill with remaining quantity
            setQuantityToOrder(remainingQuantity || 0);
        }
    }, [isOpen, remainingQuantity]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!quantityToOrder || quantityToOrder <= 0) {
            toast.error("יש להזין כמות גדולה מ-0");
            return;
        }

        if (quantityToOrder > remainingQuantity) {
            toast.error(`לא ניתן להזמין יותר מהכמות הנותרת (${remainingQuantity})`);
            return;
        }

        if (!orderingResponsible) {
            toast.error("יש לבחור אחראי הזמנה");
            return;
        }

        try {
            // Create new order record
            const unitPrice = quoteLine.price_no_vat_snapshot || 0;
            const newOrder = await PurchaseRecord.create({
                project_id: project.id,
                quote_line_id: quoteLine.id,
                quantity_to_order: quantityToOrder,
                supplier_name: supplierName,
                ordering_responsible: orderingResponsible,
                due_date: dueDate || null,
                notes: notes,
                status: 'יש להזמין',
                unit_price: unitPrice,
                planned_total_cost: quantityToOrder * unitPrice,
                actual_unit_price: unitPrice,
                quantity_delivered: 0,
                actual_total_cost: 0,
                is_manual: false,
                is_grilles: false
            });

            // Create task for this order
            await Task.create({
                title: `הזמנת רכש: ${quoteLine.name_snapshot}`,
                description: `יש להזמין ${quantityToOrder} יחידות של "${quoteLine.name_snapshot}" עבור פרויקט ${project.name}${supplierName ? `\nספק: ${supplierName}` : ''}`,
                source_type: "procurement_record",
                source_id: newOrder.id,
                project_id: project.id,
                client_name: project.name,
                creator: "מערכת",
                status: "חדש",
                priority: "בינונית",
                assigned_to: orderingResponsible,
                due_date: dueDate || null,
                auto_created: true
            });

            toast.success("הזמנה נוצרה ומשימה נפתחה");
            onOrderCreated();
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to create order:", error);
            toast.error("שגיאה ביצירת הזמנה");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 ml-1" />
                    צור הזמנה
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white shadow-xl rounded-lg" dir="rtl">
                <div className="bg-white p-1 rounded-lg">
                    <DialogHeader className="bg-blue-50 p-4 rounded-t-lg border-b">
                        <DialogTitle className="text-slate-800 text-lg font-bold">
                            הזמנה חדשה - {quoteLine.name_snapshot}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="p-6 bg-white">
                        <form onSubmit={handleSubmit} className="space-y-4 text-slate-800">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <p className="text-sm text-slate-700">כמות נותרת להזמנה: <span className="font-bold text-blue-700">{remainingQuantity}</span></p>
                            </div>

                            <div>
                                <Label htmlFor="quantity" className="text-slate-700 font-semibold">כמות להזמנה *</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="0.01"
                                    max={remainingQuantity}
                                    step="0.01"
                                    value={quantityToOrder}
                                    onChange={(e) => setQuantityToOrder(parseFloat(e.target.value) || 0)}
                                    className="text-right bg-white border-gray-300"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="supplier" className="text-slate-700 font-semibold">ספק</Label>
                                <Input
                                    id="supplier"
                                    value={supplierName}
                                    onChange={(e) => setSupplierName(e.target.value)}
                                    placeholder="שם הספק..."
                                    className="text-right bg-white border-gray-300"
                                />
                            </div>

                            <div>
                                <Label htmlFor="responsible" className="text-slate-700 font-semibold">אחראי הזמנה *</Label>
                                <Select value={orderingResponsible} onValueChange={setOrderingResponsible}>
                                    <SelectTrigger className="bg-white border-gray-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {userOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="due-date" className="text-slate-700 font-semibold">תאריך יעד</Label>
                                <Input
                                    id="due-date"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="bg-white border-gray-300"
                                />
                            </div>

                            <div>
                                <Label htmlFor="notes" className="text-slate-700 font-semibold">הערות</Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="הערות נוספות..."
                                    rows={3}
                                    className="bg-white border-gray-300"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    ביטול
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                                    צור הזמנה ומשימה
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}