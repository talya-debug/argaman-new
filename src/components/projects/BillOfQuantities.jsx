import React, { useState, useEffect, useCallback } from 'react';
import { QuoteLine, ProgressEntry, ChangeLog, User, Project, CollectionTask } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { FileSpreadsheet, Plus, Edit, Download, Trash2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import InvoicePDF from './InvoicePDF';
import DeductionsModal from './DeductionsModal';

const InvoiceEntryDialog = ({ quoteLine, projectId, invoiceNumber = 1, onInvoiceAdded, existingEntries = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [entryMethod, setEntryMethod] = useState('percentage');
    const [percentage, setPercentage] = useState(0);
    const [quantity, setQuantity] = useState(0);
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const totalInvoiced = existingEntries.reduce((sum, entry) => sum + (entry.calculated_percentage || 0), 0);
    const remainingPercentage = Math.max(0, 100 - totalInvoiced);
    const totalQuantity = quoteLine?.quantity || 1;
    const invoicedQuantity = existingEntries.reduce((sum, entry) => sum + (entry.quantity_completed || 0), 0);
    const remainingQuantity = Math.max(0, totalQuantity - invoicedQuantity);

    const calculateAmount = () => {
        const basePrice = quoteLine?.line_total || 0;
        if (entryMethod === 'percentage') {
            return (basePrice * percentage) / 100;
        } else {
            const unitPrice = totalQuantity > 0 ? basePrice / totalQuantity : 0;
            return unitPrice * quantity;
        }
    };

    const calculatePercentage = () => {
        if (entryMethod === 'quantity' && totalQuantity > 0) {
            return (quantity / totalQuantity) * 100;
        }
        return percentage;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const calculatedPercentage = calculatePercentage();

        if (calculatedPercentage < 0) {
            toast.error("יש להזין אחוז או כמות חיובית");
            return;
        }

        if (totalInvoiced + calculatedPercentage > 100.1) {
            toast.error("סך האחוזים לא יכול לעלות על 100%");
            return;
        }

        try {
            const entryData = {
                project_id: projectId,
                quote_line_id: quoteLine.id,
                invoice_number: `חשבון ${invoiceNumber}`,
                entry_date: entryDate,
                entry_method: entryMethod,
                calculated_percentage: calculatedPercentage,
                amount_to_invoice: calculateAmount(),
                notes: notes
            };

            if (entryMethod === 'percentage') {
                entryData.percentage = percentage;
            } else {
                entryData.quantity_completed = quantity;
            }

            await ProgressEntry.create(entryData);
            toast.success(`חשבון ${invoiceNumber} נוסף בהצלחה`);
            onInvoiceAdded(quoteLine.id);
            setIsOpen(false);

            // Reset form
            setPercentage(0);
            setQuantity(0);
            setNotes('');

        } catch (error) {
            toast.error("שגיאה בהוספת חשבון");
            console.error(error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 ml-1" />
                    חיוב {invoiceNumber}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white shadow-xl rounded-lg" dir="rtl">
                <div className="bg-white p-1 rounded-lg">
                    <DialogHeader className="bg-blue-50 p-4 rounded-t-lg border-b">
                        <DialogTitle className="text-slate-800 text-lg font-bold">
                            הוספת חיוב {invoiceNumber} - {quoteLine?.name_snapshot}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 bg-white">
                        <form onSubmit={handleSubmit} className="space-y-6 text-slate-800">
                           <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div>
                                    <Label className="text-sm font-semibold text-slate-700">כמות כוללת</Label>
                                    <p className="text-lg font-bold text-slate-800">{totalQuantity}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold text-slate-700">סכום כולל</Label>
                                    <p className="text-lg font-bold text-slate-800">₪{quoteLine?.line_total?.toLocaleString()}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold text-slate-700">נותר לביצוע</Label>
                                    <p className="text-sm text-slate-600">{remainingPercentage.toFixed(1)}% ({remainingQuantity.toFixed(2)} יח')</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold text-slate-700">חויב עד כה</Label>
                                    <p className="text-sm text-slate-600">{totalInvoiced.toFixed(1)}%</p>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="entry-method" className="text-slate-700 font-semibold">שיטת הזנה</Label>
                                <Select value={entryMethod} onValueChange={setEntryMethod}>
                                    <SelectTrigger className="bg-white border-gray-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="percentage">לפי אחוז ביצוע</SelectItem>
                                        <SelectItem value="quantity">לפי כמות שבוצעה</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {entryMethod === 'percentage' ? (
                                <div>
                                    <Label htmlFor="percentage" className="text-slate-700 font-semibold">אחוז ביצוע (%)</Label>
                                    <Input
                                        id="percentage"
                                        type="number"
                                        min="0"
                                        max={remainingPercentage}
                                        step="0.1"
                                        value={percentage}
                                        onChange={(e) => setPercentage(parseFloat(e.target.value) || 0)}
                                        className="text-right bg-white border-gray-300"
                                    />
                                    <p className="text-xs text-blue-600 mt-1 font-semibold">
                                        סכום לחיוב: ₪{calculateAmount().toLocaleString()}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <Label htmlFor="quantity" className="text-slate-700 font-semibold">כמות שבוצעה</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="0"
                                        max={remainingQuantity}
                                        step="0.01"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                                        className="text-right bg-white border-gray-300"
                                    />
                                    <p className="text-xs text-blue-600 mt-1 font-semibold">
                                        אחוז: {calculatePercentage().toFixed(1)}% | סכום: ₪{calculateAmount().toLocaleString()}
                                    </p>
                                </div>
                            )}

                            <div>
                                <Label htmlFor="entry-date" className="text-slate-700 font-semibold">תאריך</Label>
                                <Input id="entry-date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="bg-white border-gray-300" />
                            </div>

                            <div>
                                <Label htmlFor="notes" className="text-slate-700 font-semibold">הערות</Label>
                                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות נוספות..." rows={3} className="bg-white border-gray-300" />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>ביטול</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">הוסף חיוב</Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const EditInvoiceEntryDialog = ({ entry, quoteLine, projectId, onInvoiceUpdated, existingEntries = [], onEntryDeleted }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [entryMethod, setEntryMethod] = useState(entry?.entry_method || 'percentage');
    const [percentage, setPercentage] = useState(entry?.percentage || 0);
    const [quantity, setQuantity] = useState(entry?.quantity_completed || 0);
    const [entryDate, setEntryDate] = useState(entry?.entry_date ? new Date(entry.entry_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState(entry?.notes || '');

    const totalQuantity = quoteLine?.quantity || 1;
    const otherEntries = existingEntries.filter(e => e.id !== entry?.id);
    const totalInvoicedOthers = otherEntries.reduce((sum, e) => sum + (e.calculated_percentage || 0), 0);
    const remainingPercentageForOthers = Math.max(0, 100 - totalInvoicedOthers);
    const invoicedQuantityOthers = otherEntries.reduce((sum, e) => sum + (e.quantity_completed || 0), 0);
    const remainingQuantityForOthers = Math.max(0, totalQuantity - invoicedQuantityOthers);

    const calculateAmount = () => {
        const basePrice = quoteLine?.line_total || 0;
        if (entryMethod === 'percentage') { return (basePrice * percentage) / 100; }
        else { const unitPrice = totalQuantity > 0 ? basePrice / totalQuantity : 0; return unitPrice * quantity; }
    };

    const calculatePercentage = () => {
        if (entryMethod === 'quantity') { return totalQuantity > 0 ? (quantity / totalQuantity) * 100 : 0; }
        return percentage;
    };

    const handleDelete = async () => {
        try { await ProgressEntry.delete(entry.id); toast.success("החיוב נמחק בהצלחה"); onEntryDeleted(quoteLine.id); setIsOpen(false); }
        catch (error) { toast.error("שגיאה במחיקת החיוב"); console.error(error); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const calculatedPercentage = calculatePercentage();
        if (calculatedPercentage < 0) { toast.error("יש להזין אחוז או כמות חיובית או אפס"); return; }
        if (totalInvoicedOthers + calculatedPercentage > 100.1) { toast.error("סך האחוזים לא יכול לעלות על 100%"); return; }
        try {
            const entryData = { project_id: projectId, quote_line_id: quoteLine.id, invoice_number: entry.invoice_number, entry_date: entryDate, entry_method: entryMethod, calculated_percentage: calculatedPercentage, amount_to_invoice: calculateAmount(), notes: notes };
            if (entryMethod === 'percentage') { entryData.percentage = percentage; } else { entryData.quantity_completed = quantity; }
            await ProgressEntry.update(entry.id, entryData); toast.success("החיוב עודכן בהצלחה"); onInvoiceUpdated(quoteLine.id); setIsOpen(false);
        } catch (error) { toast.error("שגיאה בעדכון החיוב"); console.error(error); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700" onClick={() => setIsOpen(true)}><Edit className="w-4 h-4" /></Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white shadow-xl rounded-lg" dir="rtl">
                <div className="bg-white p-1 rounded-lg">
                    <DialogHeader className="bg-blue-50 p-4 rounded-t-lg border-b"><DialogTitle className="text-slate-800 text-lg font-bold">עריכת חיוב - {quoteLine?.name_snapshot}</DialogTitle></DialogHeader>
                    <div className="p-6 bg-white">
                        <form onSubmit={handleSubmit} className="space-y-6 text-slate-800">
                            <div><Label htmlFor="entry-method" className="text-slate-700 font-semibold">שיטת הזנה</Label><Select value={entryMethod} onValueChange={setEntryMethod}><SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger><SelectContent className="bg-white"><SelectItem value="percentage">לפי אחוז ביצוע</SelectItem><SelectItem value="quantity">לפי כמות שבוצעה</SelectItem></SelectContent></Select></div>
                            {entryMethod === 'percentage' ? (<div><Label htmlFor="percentage" className="text-slate-700 font-semibold">אחוז ביצוע (%) - 0 למחיקה</Label><Input id="percentage" type="number" min="0" max={remainingPercentageForOthers + (entry?.calculated_percentage || 0)} step="0.1" value={percentage} onChange={(e) => setPercentage(parseFloat(e.target.value) || 0)} className="text-right bg-white border-gray-300" /></div>) : (<div><Label htmlFor="quantity" className="text-slate-700 font-semibold">כמות שבוצעה - 0 למחיקה</Label><Input id="quantity" type="number" min="0" max={remainingQuantityForOthers + (entry?.quantity_completed || 0)} step="0.01" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} className="text-right bg-white border-gray-300" /></div>)}
                            <div><Label htmlFor="entry-date" className="text-slate-700 font-semibold">תאריך</Label><Input id="entry-date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="bg-white border-gray-300" /></div>
                            <div><Label htmlFor="notes" className="text-slate-700 font-semibold">הערות</Label><Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות נוספות..." rows={3} className="bg-white border-gray-300" /></div>
                            <div className="flex justify-between pt-4 border-t">
                                <Button type="button" variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700"><Trash2 className="w-4 h-4 ml-2" />מחק חיוב</Button>
                                <div className="flex gap-3"><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>ביטול</Button><Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">עדכן חיוב</Button></div>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const AddItemDialog = ({ projectId, quoteId, onItemAdded }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [itemName, setItemName] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState(0);
    const [reason, setReason] = useState('');
    const [clauseNumber, setClauseNumber] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!itemName || !reason) { toast.error("יש למלא שם פריט וסיבת ההוספה"); return; }
        if (quantity <= 0) { toast.error("כמות חייבת להיות גדולה מ-0"); return; }
        if (unitPrice < 0) { toast.error("מחיר יחידה לא יכול להיות שלילי"); return; }
        try {
            const user = await User.me();
            const lineTotal = quantity * unitPrice;
            const newQuoteLine = await QuoteLine.create({ quote_id: quoteId, price_item_id: 'manual-' + Date.now(), model_snapshot: itemName, name_snapshot: itemName, description_snapshot: `${description}\nסיבה: ${reason}`, price_no_vat_snapshot: unitPrice, quantity: quantity, line_total: lineTotal, clause_number: clauseNumber, completion_percentage: 0 });
            await ChangeLog.create({ project_id: projectId, quote_line_id: newQuoteLine.id, change_type: 'new_item_added', new_value: `${itemName} - ₪${unitPrice} x ${quantity}`, change_reason: reason, changed_by: user.email, change_date: new Date().toISOString().split('T')[0] });
            toast.success("פריט חדש נוסף בהצלחה"); onItemAdded(); setIsOpen(false);
            setItemName(''); setDescription(''); setQuantity(1); setUnitPrice(0); setReason(''); setClauseNumber('');
        } catch (error) { toast.error("שגיאה בהוספת פריט חדש"); console.error(error); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button className="bg-green-600 hover:bg-green-700 text-white"><Plus className="w-4 h-4 ml-2" />הוסף פריט ידני</Button></DialogTrigger>
            <DialogContent className="max-w-lg bg-white shadow-xl rounded-lg" dir="rtl">
                <div className="bg-white p-1 rounded-lg">
                    <DialogHeader className="bg-green-50 p-4 rounded-t-lg border-b"><DialogTitle className="text-slate-800 text-lg font-bold">הוספת פריט חדש ידני</DialogTitle></DialogHeader>
                    <div className="p-6 bg-white">
                        <form onSubmit={handleSubmit} className="space-y-6 text-slate-800">
                            <div><Label htmlFor="clause-number" className="text-slate-700 font-semibold">מספר סעיף</Label><Input id="clause-number" value={clauseNumber} onChange={(e) => setClauseNumber(e.target.value)} placeholder="לדוגמה: A1, 1.2.3..." className="text-right bg-white border-gray-300" /></div>
                            <div><Label htmlFor="item-name" className="text-slate-700 font-semibold">שם הפריט *</Label><Input id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="שם הפריט החדש..." className="text-right bg-white border-gray-300" required /></div>
                            <div><Label htmlFor="description" className="text-slate-700 font-semibold">תיאור</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="תיאור מפורט של הפריט..." rows={3} className="bg-white border-gray-300" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label htmlFor="quantity" className="text-slate-700 font-semibold">כמות *</Label><Input id="quantity" type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)} className="text-right bg-white border-gray-300" required /></div>
                                <div><Label htmlFor="unit-price" className="text-slate-700 font-semibold">מחיר יחידה (₪) *</Label><Input id="unit-price" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)} className="text-right bg-white border-gray-300" required /><p className="text-xs text-slate-500 mt-1">ניתן להזין 0 לפריטים ללא חיוב</p></div>
                            </div>
                            <div className={`p-3 rounded-lg border ${unitPrice === 0 ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                                <div className="flex justify-between items-center"><Label className="text-sm font-semibold text-slate-700">סכום כולל</Label>{unitPrice === 0 && (<Badge className="bg-blue-100 text-blue-700 text-xs">ללא חיוב</Badge>)}</div>
                                <p className="text-lg font-bold text-slate-800">₪{(quantity * unitPrice).toLocaleString()}</p>
                            </div>
                            <div><Label htmlFor="reason" className="text-slate-700 font-semibold">סיבת ההוספה *</Label><Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="מדוע נוסף פריט זה לפרויקט..." rows={2} className="bg-white border-gray-300" required /></div>
                            <div className="flex justify-end gap-3 pt-4 border-t"><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>ביטול</Button><Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">הוסף פריט</Button></div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function BillOfQuantities({ quoteLines, projectId, project, quote, quoteId, onUpdateQuoteLine, progressEntries }) {
    const [localQuoteLines, setLocalQuoteLines] = useState(quoteLines || []);
    const [invoicesData, setInvoicesData] = useState({});
    const [activeTab, setActiveTab] = useState('invoice-1');
    const [maxInvoiceNumber, setMaxInvoiceNumber] = useState(1);
    const [pdfData, setPdfData] = useState(null);
    const [showDeductionsModal, setShowDeductionsModal] = useState(false);
    const [sentInvoices, setSentInvoices] = useState(new Set());
    const [showPaymentTermsDialog, setShowPaymentTermsDialog] = useState(false);
    const [selectedPaymentTerms, setSelectedPaymentTerms] = useState(project?.payment_terms || 'מיידי');
    const [customDays, setCustomDays] = useState('');
    const [showCustomDays, setShowCustomDays] = useState(false);
    const [showDiscountDialog, setShowDiscountDialog] = useState(false);
    const [boqDiscountType, setBoqDiscountType] = useState(project?.boq_discount_type || 'percentage');
    const [boqDiscountPercentage, setBoqDiscountPercentage] = useState(project?.boq_discount_percentage || 0);
    const [boqDiscountAmount, setBoqDiscountAmount] = useState(project?.boq_discount_amount || 0);

    useEffect(() => {
        if (project?.payment_terms) setSelectedPaymentTerms(project.payment_terms);
        if (project?.boq_discount_type) setBoqDiscountType(project.boq_discount_type);
        if (project?.boq_discount_percentage !== undefined) setBoqDiscountPercentage(project.boq_discount_percentage);
        if (project?.boq_discount_amount !== undefined) setBoqDiscountAmount(project.boq_discount_amount);
    }, [project]);

    useEffect(() => {
        const sortedLines = (quoteLines || []).sort((a, b) => {
            const indexA = a.order_index !== undefined ? a.order_index : Infinity;
            const indexB = b.order_index !== undefined ? b.order_index : Infinity;
            return indexA - indexB;
        });
        setLocalQuoteLines(sortedLines);
    }, [quoteLines]);

    const refreshData = useCallback(async () => {
        if(onUpdateQuoteLine) onUpdateQuoteLine(null, true);
    }, [onUpdateQuoteLine]);

    useEffect(() => {
        if (!progressEntries || !localQuoteLines) return;
        const invoicesMap = localQuoteLines.reduce((acc, line) => { acc[line.id] = []; return acc; }, {});
        let highestInvoiceNum = 1;
        progressEntries.forEach(entry => {
            if (invoicesMap[entry.quote_line_id]) {
                invoicesMap[entry.quote_line_id].push(entry);
                const match = entry.invoice_number.match(/(\d+)/);
                if (match) { const num = parseInt(match[1]); if (!isNaN(num) && num > highestInvoiceNum) highestInvoiceNum = num; }
            }
        });
        setMaxInvoiceNumber(highestInvoiceNum);
        for (const lineId in invoicesMap) { invoicesMap[lineId].sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()); }
        setInvoicesData(invoicesMap);
    }, [progressEntries, localQuoteLines]);

    const handleClauseNumberChange = (lineId, newClauseNumber) => {
        setLocalQuoteLines(prevLines => prevLines.map(line => line.id === lineId ? { ...line, clause_number: newClauseNumber } : line));
    };

    const handleClauseNumberBlur = async (lineId, clauseNumber) => {
        try { await QuoteLine.update(lineId, { clause_number: clauseNumber }); toast.success("מספר סעיף עודכן"); }
        catch (error) { console.error("Failed to update clause number:", error); toast.error("שגיאה בעדכון מספר סעיף"); }
    };

    const handleInvoiceAction = (quoteLineId) => { if (onUpdateQuoteLine) onUpdateQuoteLine(quoteLineId, true); };

    const handleDeductionsUpdate = async (deductions) => {
        try { await Project.update(projectId, deductions); if (onUpdateQuoteLine) onUpdateQuoteLine(null, true); setShowDeductionsModal(false); }
        catch (error) { console.error('Error updating deductions:', error); }
    };

    const handlePaymentTermsUpdate = async () => {
        try {
            let termsToSave = selectedPaymentTerms;
            if (selectedPaymentTerms === 'אחר') {
                const days = parseInt(customDays);
                if (!customDays || isNaN(days) || days < 0) { toast.error("יש להזין מספר ימים תקין (0-365)"); return; }
                if (days > 365) { toast.error("מספר הימים חייב להיות עד 365"); return; }
                termsToSave = `שוטף ${days}`;
            }
            await Project.update(projectId, { payment_terms: termsToSave });
            toast.success("תנאי התשלום עודכנו בהצלחה"); if (onUpdateQuoteLine) onUpdateQuoteLine(null, true); setShowPaymentTermsDialog(false); setShowCustomDays(false); setCustomDays('');
        } catch (error) { console.error('Error updating payment terms:', error); toast.error("שגיאה בעדכון תנאי תשלום"); }
    };

    const calcInvoiceSummary = (invoiceNum) => {
        let rawSubtotal = 0;
        localQuoteLines.forEach(line => {
            if (line.is_header) return;
            const entries = invoicesData[line.id] || [];
            const invoiceEntries = entries.filter(e => e.invoice_number === `חשבון ${invoiceNum}`);
            rawSubtotal += invoiceEntries.reduce((sum, e) => sum + (e.amount_to_invoice || 0), 0);
        });
        const discountType = project?.boq_discount_type || 'percentage';
        const discountPct = project?.boq_discount_percentage || 0;
        const discountFixed = project?.boq_discount_amount || 0;
        const discountAmt = discountType === 'fixed_amount' ? Math.min(discountFixed, rawSubtotal) : rawSubtotal * (discountPct / 100);
        const afterDiscount = rawSubtotal - discountAmt;
        const insPct = project?.deduction_insurance_percentage || 0;
        const retPct = project?.deduction_retention_percentage || 0;
        const labPct = project?.deduction_lab_tests_percentage || 0;
        const insAmt = afterDiscount * (insPct / 100);
        const retAmt = afterDiscount * (retPct / 100);
        const labAmt = afterDiscount * (labPct / 100);
        const totalDeductions = insAmt + retAmt + labAmt;
        const afterDeductions = afterDiscount - totalDeductions;
        const vatAmt = afterDeductions * 0.18;
        const finalTotal = afterDeductions + vatAmt;
        return { rawSubtotal, discountAmt, discountType, discountPct, discountFixed, afterDiscount, insPct, retPct, labPct, insAmt, retAmt, labAmt, totalDeductions, afterDeductions, vatAmt, finalTotal };
    };

    const calculateInvoiceTotals = (invoiceNum) => { const { afterDiscount } = calcInvoiceSummary(invoiceNum); return afterDiscount; };

    const addNewInvoice = () => { const nextInvoiceNum = maxInvoiceNumber + 1; setMaxInvoiceNumber(nextInvoiceNum); setActiveTab(`invoice-${nextInvoiceNum}`); };

    const calculatePaymentDueDate = (baseDate, paymentTerms) => {
        const base = new Date(baseDate);
        if (paymentTerms === 'מיידי') return baseDate;
        if (paymentTerms === 'שוטף') { const lastDayOfMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0); return lastDayOfMonth.toISOString().split('T')[0]; }
        if (paymentTerms === 'שוטף 30' || paymentTerms === 'שוטף 60' || paymentTerms === 'שוטף 90') {
            const lastDayOfMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0);
            const daysToAdd = paymentTerms === 'שוטף 30' ? 30 : paymentTerms === 'שוטף 60' ? 60 : 90;
            const dueDate = new Date(lastDayOfMonth); dueDate.setDate(dueDate.getDate() + daysToAdd); return dueDate.toISOString().split('T')[0];
        }
        const customMatch = paymentTerms?.match(/^שוטף\s+(\d+)$/);
        if (customMatch) { const lastDayOfMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0); const daysToAdd = parseInt(customMatch[1]); const dueDate = new Date(lastDayOfMonth); dueDate.setDate(dueDate.getDate() + daysToAdd); return dueDate.toISOString().split('T')[0]; }
        return baseDate;
    };

    const handleMarkAsSent = async (invoiceNum) => {
        if (sentInvoices.has(invoiceNum)) { toast.info(`חשבון ${invoiceNum} כבר סומן כנשלח.`); return; }
        try {
            const invoiceTotal = calculateInvoiceTotals(invoiceNum);
            const today = new Date().toISOString().split('T')[0];
            const baseDate = project?.invoice_date || today;
            const paymentTerms = project?.payment_terms || 'מיידי';
            const paymentDueDate = calculatePaymentDueDate(baseDate, paymentTerms);
            await CollectionTask.create({ project_name: project.name, project_id: projectId, amount_to_collect: invoiceTotal, invoice_date: today, payment_due_date: paymentDueDate, collection_status: 'חשבון מאושר – יש לשלוח חשבון עסקה', responsible: 'רבקה', invoice_number: `חשבון ${invoiceNum}` });
            setSentInvoices(prev => new Set(prev).add(invoiceNum));
            toast.success(`חשבון ${invoiceNum} נשלח! נוצרה משימת גבייה.`);
        } catch (error) { console.error('Error creating collection task:', error); toast.error('שגיאה ביצירת משימת גבייה.'); }
    };

    const exportToCSV = async (includePrices = true) => {
        const invoiceNum = parseInt(activeTab.split('-')[1]);
        if (!invoiceNum || isNaN(invoiceNum)) return;
        if (!projectId) { toast.error("חסר מזהה פרויקט"); return; }

        const csvSafe = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
        toast.info("טוען נתונים...");

        // Fetch data directly from entities
        let allLines, freshEntries, freshProject;
        try {
            const [linesData, entriesData, projectData] = await Promise.all([
                QuoteLine.filter({ quote_id: quoteId }),
                ProgressEntry.filter({ project_id: projectId }),
                Project.get(projectId)
            ]);
            allLines = linesData;
            freshEntries = entriesData;
            freshProject = projectData;
            toast.info(`נטענו ${allLines.length} שורות`);
        } catch (e) {
            console.error('Fetch failed:', e);
            toast.error("שגיאה בטעינת נתונים - " + e.message);
            return;
        }

        allLines = allLines.slice().sort((a, b) => {
            const ia = a.order_index !== undefined ? a.order_index : Infinity;
            const ib = b.order_index !== undefined ? b.order_index : Infinity;
            return ia - ib;
        });

        const freshMap = {};
        allLines.forEach(line => { freshMap[line.id] = []; });
        freshEntries.forEach(entry => { if (freshMap[entry.quote_line_id] !== undefined) freshMap[entry.quote_line_id].push(entry); });

        let maxInvNum = 1;
        freshEntries.forEach(entry => { const match = entry.invoice_number?.match(/(\d+)/); if (match) { const num = parseInt(match[1]); if (!isNaN(num) && num > maxInvNum) maxInvNum = num; } });

        const p = freshProject || project;
        const calcSummary = (iNum) => {
            let rawSubtotal = 0;
            allLines.forEach(line => { if (line.is_header) return; const entries = (freshMap[line.id] || []).filter(e => e.invoice_number === `חשבון ${iNum}`); rawSubtotal += entries.reduce((sum, e) => sum + (e.amount_to_invoice || 0), 0); });
            const discountType = p?.boq_discount_type || 'percentage'; const discountPct = p?.boq_discount_percentage || 0; const discountFixed = p?.boq_discount_amount || 0;
            const discountAmt = discountType === 'fixed_amount' ? Math.min(discountFixed, rawSubtotal) : rawSubtotal * (discountPct / 100);
            const afterDiscount = rawSubtotal - discountAmt;
            const insPct = p?.deduction_insurance_percentage || 0; const retPct = p?.deduction_retention_percentage || 0; const labPct = p?.deduction_lab_tests_percentage || 0;
            const insAmt = afterDiscount * (insPct / 100); const retAmt = afterDiscount * (retPct / 100); const labAmt = afterDiscount * (labPct / 100);
            const totalDeductions = insAmt + retAmt + labAmt; const afterDeductions = afterDiscount - totalDeductions; const vatAmt = afterDeductions * 0.18; const finalTotal = afterDeductions + vatAmt;
            return { rawSubtotal, discountAmt, discountType, discountPct, discountFixed, afterDiscount, insPct, retPct, labPct, insAmt, retAmt, labAmt, totalDeductions, afterDeductions, vatAmt, finalTotal };
        };

        let csvContent = "\uFEFF";
        const projectName = p?.name || 'פרויקט'; const clientName = p?.client_name || ''; const currentDate = new Date().toLocaleDateString('he-IL');
        csvContent += `${csvSafe('ארגמן מערכות מיזוג מתקדמות בע״מ')}\n`;
        csvContent += `${csvSafe(`כתב כמויות מצטבר${!includePrices ? ' (ללא מחירים)' : ''}`)}\n`;
        csvContent += `${csvSafe(`פרויקט: ${projectName}`)},${csvSafe(`תאריך: ${currentDate}`)}\n`;
        csvContent += `${csvSafe(`לקוח: ${clientName}`)}\n\n`;

        let headerRow = ["סעיף", "תיאור פריט", "הערות", "כמות"];
        if (includePrices) headerRow.push("מחיר יחידה", 'סה"כ מאושר');
        for (let i = 1; i <= maxInvNum; i++) headerRow.push(`חשבון ${i}`);
        headerRow.push("מצטבר עד כה", "יתרה לחיוב");
        csvContent += headerRow.map(h => csvSafe(h)).join(',') + "\n";

        let subtotalForCurrentInvoice = 0; let rowsWritten = 0;

        allLines.forEach(line => {
            if (line.is_header) {
                const headerLabel = [line.clause_number, line.name_snapshot || line.model_snapshot].filter(Boolean).join(' - ');
                let hRow = [csvSafe(line.clause_number || ''), csvSafe(`*** ${headerLabel} ***`), csvSafe(''), csvSafe('')];
                if (includePrices) hRow.push(csvSafe(''), csvSafe(''));
                for (let i = 1; i <= maxInvNum; i++) hRow.push(csvSafe(''));
                hRow.push(csvSafe(''), csvSafe(''));
                csvContent += hRow.join(',') + "\n"; rowsWritten++; return;
            }
            const allEntriesForLine = freshMap[line.id] || [];
            const currentInvoiceEntry = allEntriesForLine.find(e => e.invoice_number === `חשבון ${invoiceNum}`);
            subtotalForCurrentInvoice += currentInvoiceEntry?.amount_to_invoice || 0;
            let allNotes = (line.description_snapshot && line.description_snapshot.includes("סיבה:")) ? line.description_snapshot : '';
            if (currentInvoiceEntry?.notes) allNotes += (allNotes ? ' | ' : '') + `הערות: ${currentInvoiceEntry.notes}`;
            let row = [csvSafe(line.clause_number || ''), csvSafe(line.name_snapshot || ''), csvSafe(allNotes), line.quantity || 0];
            if (includePrices) { row.push(((line.line_total || 0) / (line.quantity || 1)).toFixed(2)); row.push((line.line_total || 0).toFixed(2)); }
            let cumulativeTotal = 0;
            for (let i = 1; i <= maxInvNum; i++) { const entry = allEntriesForLine.find(e => e.invoice_number === `חשבון ${i}`); const amount = entry?.amount_to_invoice || 0; row.push(amount > 0 ? amount.toFixed(2) : '0'); cumulativeTotal += amount; }
            row.push(cumulativeTotal.toFixed(2)); row.push(Math.max(0, (line.line_total || 0) - cumulativeTotal).toFixed(2));
            csvContent += row.join(',') + "\n"; rowsWritten++;
        });

        if (includePrices) {
            const discountType = p?.boq_discount_type || 'percentage';
            const boqDiscPct = p?.boq_discount_percentage || 0; const boqDiscFixed = p?.boq_discount_amount || 0;
            const boqDiscAmt = discountType === 'fixed_amount' ? Math.min(boqDiscFixed, subtotalForCurrentInvoice) : subtotalForCurrentInvoice * (boqDiscPct / 100);
            if (boqDiscAmt > 0) {
                const discountDesc = discountType === 'percentage' ? `${boqDiscPct}% הנחה` : 'הנחה קבועה';
                let discountRow = [csvSafe(''), csvSafe('הנחה כללית'), csvSafe(discountDesc), '1', `${(-boqDiscAmt).toFixed(2)}`, `${(-boqDiscAmt).toFixed(2)}`];
                for (let i = 1; i <= maxInvNum; i++) discountRow.push(csvSafe(''));
                discountRow.push(`${(-boqDiscAmt).toFixed(2)}`, csvSafe(''));
                csvContent += discountRow.join(',') + "\n";
            }
        }

        if (includePrices) {
            const s = calcSummary(invoiceNum);
            const summaryPrefix = ','.repeat(6 + maxInvNum);
            csvContent += "\n";
            csvContent += `${summaryPrefix}${csvSafe(`סכום ביניים חשבון ${invoiceNum}`)},${s.rawSubtotal.toFixed(2)}\n`;
            if (s.discountAmt > 0) {
                const dDesc = s.discountType === 'percentage' ? `${s.discountPct}% הנחה` : 'הנחה קבועה';
                csvContent += `${summaryPrefix}${csvSafe(`הנחה כללית (${dDesc})`)},${(-s.discountAmt).toFixed(2)}\n`;
                csvContent += `${summaryPrefix}${csvSafe('סה"כ אחרי הנחה')},${s.afterDiscount.toFixed(2)}\n`;
            }
            if (s.insAmt > 0) csvContent += `${summaryPrefix}${csvSafe(`קיזוז ביטוח (${s.insPct}%)`)},${(-s.insAmt).toFixed(2)}\n`;
            if (s.retAmt > 0) csvContent += `${summaryPrefix}${csvSafe(`קיזוז עיכבון (${s.retPct}%)`)},${(-s.retAmt).toFixed(2)}\n`;
            if (s.labAmt > 0) csvContent += `${summaryPrefix}${csvSafe(`קיזוז מעבדה (${s.labPct}%)`)},${(-s.labAmt).toFixed(2)}\n`;
            if (s.totalDeductions > 0) csvContent += `${summaryPrefix}${csvSafe('סה"כ לאחר קיזוז')},${s.afterDeductions.toFixed(2)}\n`;
            csvContent += `${summaryPrefix}${csvSafe('מע"מ (18%)')},${s.vatAmt.toFixed(2)}\n`;
            csvContent += `${summaryPrefix}${csvSafe(`סה"כ לתשלום חשבון ${invoiceNum}`)},${s.finalTotal.toFixed(2)}\n`;
        }

        const cleanProjectName = projectName.replace(/[^a-zA-Z0-9א-ת]/g, '_');
        const pricesSuffix = !includePrices ? '_ללא_מחירים' : '';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `כתב_כמויות_חשבון_${invoiceNum}_${cleanProjectName}${pricesSuffix}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
        toast.success(`הקובץ יוצא בהצלחה - ${allLines.length} שורות, ${rowsWritten} שורות נכתבו`);
    };

    const handlePrint = () => { const invoiceNum = activeTab.split('-')[1]; if (!invoiceNum || isNaN(invoiceNum)) return; setPdfData({ invoiceNum }); };

    const invoiceNumbers = Array.from({ length: maxInvoiceNumber }, (_, i) => i + 1);

    const renderInvoiceTotals = (invoiceNum) => {
        const s = calcInvoiceSummary(invoiceNum);
        if (s.rawSubtotal === 0) return null;
        return (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border flex justify-end" dir="rtl">
                <div className="w-full md:w-1/3 text-right">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">סיכום חשבון {invoiceNum}</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center"><span>סכום ביניים</span><span className="font-semibold">₪{s.rawSubtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                        {s.discountAmt > 0 && (<><div className="flex justify-between items-center text-green-700"><span>הנחה ({s.discountType === 'percentage' ? `${s.discountPct}%` : 'קבועה'})</span><span>-₪{s.discountAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div><div className="flex justify-between items-center font-semibold pt-1 border-t"><span>סה"כ אחרי הנחה</span><span>₪{s.afterDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div></>)}
                        {s.totalDeductions > 0 && (<div className="pr-4 border-r-2 border-red-200 py-2 space-y-1 text-red-600">{s.insAmt > 0 && <div className="flex justify-between items-center"><span>קיזוז ביטוח ({s.insPct}%)</span><span>-&nbsp;₪{s.insAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>}{s.retAmt > 0 && <div className="flex justify-between items-center"><span>קיזוז עיכבון ({s.retPct}%)</span><span>-&nbsp;₪{s.retAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>}{s.labAmt > 0 && <div className="flex justify-between items-center"><span>קיזוז מעבדה ({s.labPct}%)</span><span>-&nbsp;₪{s.labAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>}</div>)}
                        {s.totalDeductions > 0 && <div className="flex justify-between items-center font-semibold pt-2 border-t"><span>סה"כ לאחר קיזוז</span><span>₪{s.afterDeductions.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>}
                        <div className="flex justify-between items-center"><span>מע״מ (18%)</span><span>₪{s.vatAmt.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                        <div className="flex justify-between items-center text-lg font-bold text-blue-600 pt-2 border-t bg-blue-50 p-2 rounded"><span>סה״כ לתשלום</span><span>₪{s.finalTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                    </div>
                    <Button onClick={() => handleMarkAsSent(invoiceNum)} disabled={sentInvoices.has(invoiceNum)} className="mt-4 bg-teal-500 hover:bg-teal-600 text-white">{sentInvoices.has(invoiceNum) ? 'נשלח ✓' : 'חשבון אושר – צור משימת גבייה'}</Button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6" dir="rtl">
            {pdfData && <InvoicePDF project={project} quote={quote} quoteLines={localQuoteLines} progressEntries={progressEntries} invoiceNumber={pdfData.invoiceNum} onDone={() => setPdfData(null)} />}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" />כתב כמויות וניהול חיובים</CardTitle>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => setShowDiscountDialog(true)} className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"><Settings className="w-4 h-4 ml-2" />הנחה כללית: {project?.boq_discount_type === 'fixed_amount' ? `₪${(project?.boq_discount_amount || 0).toLocaleString()}` : `${project?.boq_discount_percentage || 0}%`}</Button>
                            <Button variant="outline" onClick={() => setShowPaymentTermsDialog(true)} className="bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700"><Settings className="w-4 h-4 ml-2" />תנאי תשלום: {project?.payment_terms || 'מיידי'}</Button>
                            <Button variant="outline" onClick={() => setShowDeductionsModal(true)} className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"><Settings className="w-4 h-4 ml-2" />ניהול קיזוזים</Button>
                            <AddItemDialog projectId={projectId} quoteId={quoteId} onItemAdded={refreshData} />
                            <Button onClick={addNewInvoice} className="bg-green-600 hover:bg-green-700 text-white"><Plus className="w-4 h-4 ml-2" />הוסף חשבון</Button>
                            <Button onClick={() => exportToCSV(true)} variant="outline" disabled={!activeTab.startsWith('invoice-')}><Download className="w-4 h-4 ml-2" />ייצוא Excel עם מחירים</Button>
                            <Button onClick={() => exportToCSV(false)} variant="outline" disabled={!activeTab.startsWith('invoice-')} className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"><Download className="w-4 h-4 ml-2" />ייצוא Excel ללא מחירים</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full bg-slate-200 overflow-x-auto" style={{gridTemplateColumns: `repeat(${invoiceNumbers.length + 1}, minmax(120px, 1fr))`}}>
                            {invoiceNumbers.map(num => (<TabsTrigger key={num} value={`invoice-${num}`}>חשבון {num} (₪{calculateInvoiceTotals(num).toLocaleString()})</TabsTrigger>))}
                            <TabsTrigger key="summary" value="summary">סיכום כללי</TabsTrigger>
                        </TabsList>
                        {invoiceNumbers.map(invoiceNum => (
                            <TabsContent key={invoiceNum} value={`invoice-${invoiceNum}`}>
                                <div className="overflow-x-auto" dir="rtl">
                                    <Table>
                                        <TableHeader><TableRow><TableHead className="text-right w-20">סעיף</TableHead><TableHead className="text-right w-64">תיאור הפריט</TableHead><TableHead className="text-right w-28">כמות</TableHead><TableHead className="text-right w-32">מחיר יחידה</TableHead><TableHead className="text-right w-32">סה״כ</TableHead><TableHead className="text-right w-32">ביצוע מצטבר</TableHead><TableHead className="text-right">חיוב {invoiceNum}</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {localQuoteLines && localQuoteLines.map((line) => {
                                                if (line.is_header) {
                                                    return (<TableRow key={line.id} className="bg-blue-50"><TableCell colSpan={7} className="text-right font-bold text-blue-900 text-lg py-3">{line.clause_number && <span className="text-slate-600 ml-2">{line.clause_number}</span>}{line.name_snapshot || line.model_snapshot}</TableCell></TableRow>);
                                                }
                                                const entries = invoicesData[line.id] || [];
                                                const invoiceEntries = entries.filter(entry => entry.invoice_number === `חשבון ${invoiceNum}`);
                                                const totalInvoiced = entries.reduce((sum, entry) => sum + (entry.calculated_percentage || 0), 0);
                                                const invoiceAmount = invoiceEntries.reduce((sum, entry) => sum + (entry.amount_to_invoice || 0), 0);
                                                const canAddMore = invoiceEntries.length < 1 && totalInvoiced < 100;
                                                return (
                                                    <TableRow key={line.id}>
                                                        <TableCell className="text-right"><Input type="text" value={line.clause_number || ''} onChange={(e) => handleClauseNumberChange(line.id, e.target.value)} onBlur={(e) => handleClauseNumberBlur(line.id, e.target.value)} className="w-20 text-center bg-white border-gray-300" /></TableCell>
                                                        <TableCell className="text-right"><div><p className="font-medium text-slate-800">{line.name_snapshot}</p>{line.description_snapshot && (<p className="text-sm text-slate-500">{line.description_snapshot}</p>)}</div></TableCell>
                                                        <TableCell className="text-right"><Input type="number" min="0" step="0.01" value={line.quantity || 0} onChange={(e) => { const newQuantity = parseFloat(e.target.value) || 0; const newLineTotal = newQuantity * (line.price_no_vat_snapshot || 0); setLocalQuoteLines(prev => prev.map(l => l.id === line.id ? { ...l, quantity: newQuantity, line_total: newLineTotal } : l)); }} onBlur={async () => { try { const newLineTotal = line.quantity * (line.price_no_vat_snapshot || 0); await QuoteLine.update(line.id, { quantity: line.quantity, line_total: newLineTotal }); toast.success("כמות עודכנה"); if (onUpdateQuoteLine) onUpdateQuoteLine(line.id, true); } catch (error) { console.error("Failed to update quantity:", error); toast.error("שגיאה בעדכון כמות"); } }} className="w-24 text-center bg-white border-gray-300" /></TableCell>
                                                        <TableCell className="text-right"><Input type="number" min="0" step="0.01" value={line.price_no_vat_snapshot || 0} onChange={(e) => { const newPrice = parseFloat(e.target.value) || 0; const newLineTotal = (line.quantity || 0) * newPrice; setLocalQuoteLines(prev => prev.map(l => l.id === line.id ? { ...l, price_no_vat_snapshot: newPrice, line_total: newLineTotal } : l)); }} onBlur={async () => { try { const newLineTotal = (line.quantity || 0) * (line.price_no_vat_snapshot || 0); await QuoteLine.update(line.id, { price_no_vat_snapshot: line.price_no_vat_snapshot, line_total: newLineTotal }); toast.success("מחיר יחידה עודכן"); if (onUpdateQuoteLine) onUpdateQuoteLine(line.id, true); } catch (error) { console.error("Failed to update price:", error); toast.error("שגיאה בעדכון מחיר"); } }} className="w-28 text-center bg-white border-gray-300" /></TableCell>
                                                        <TableCell className="text-right font-semibold">₪{(line.line_total || 0).toLocaleString()}</TableCell>
                                                        <TableCell className="text-right"><Badge className={`${totalInvoiced >= 100 ? "bg-green-100 text-green-800" : totalInvoiced >= 75 ? "bg-orange-100 text-orange-800" : totalInvoiced >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{totalInvoiced.toFixed(1)}%</Badge></TableCell>
                                                        <TableCell className="text-right space-x-1">
                                                            {invoiceEntries.length > 0 ? (invoiceEntries.map(entry => (<div key={entry.id} className="flex items-center justify-end gap-2"><EditInvoiceEntryDialog entry={entry} quoteLine={line} projectId={projectId} onInvoiceUpdated={() => handleInvoiceAction(line.id)} onEntryDeleted={() => handleInvoiceAction(line.id)} existingEntries={entries} /><div className="text-right"><p className="font-medium">₪{invoiceAmount.toLocaleString()}</p><p className="text-xs text-slate-500">{entry.calculated_percentage?.toFixed(1)}% - {new Date(entry.entry_date).toLocaleDateString('he-IL')}</p></div></div>))) : canAddMore ? (<InvoiceEntryDialog quoteLine={line} projectId={projectId} invoiceNumber={invoiceNum} onInvoiceAdded={() => handleInvoiceAction(line.id)} existingEntries={entries} />) : (<span className="text-slate-400">-</span>)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {(() => {
                                                const discountType = project?.boq_discount_type || 'percentage';
                                                let rawSubtotal = 0;
                                                localQuoteLines.forEach(line => { if (line.is_header) return; const entries = invoicesData[line.id] || []; const invEntries = entries.filter(entry => entry.invoice_number === `חשבון ${invoiceNum}`); rawSubtotal += invEntries.reduce((sum, entry) => sum + (entry.amount_to_invoice || 0), 0); });
                                                const boqDiscPct = project?.boq_discount_percentage || 0; const boqDiscAmtFixed = project?.boq_discount_amount || 0;
                                                const boqDiscAmt = discountType === 'fixed_amount' ? Math.min(boqDiscAmtFixed, rawSubtotal) : (rawSubtotal * (boqDiscPct / 100));
                                                if (boqDiscAmt > 0 && rawSubtotal > 0) {
                                                    return (<TableRow className="bg-green-50 border-t-2 border-green-200"><TableCell className="text-right"></TableCell><TableCell className="text-right"><p className="font-bold text-green-700">הנחה כללית</p><p className="text-sm text-slate-500">{discountType === 'percentage' ? `${boqDiscPct}% הנחה` : 'הנחה קבועה'}</p></TableCell><TableCell className="text-right text-center">1</TableCell><TableCell className="text-right text-center font-semibold text-red-600">-₪{boqDiscAmt.toLocaleString()}</TableCell><TableCell className="text-right font-bold text-red-600">-₪{boqDiscAmt.toLocaleString()}</TableCell><TableCell className="text-right"></TableCell><TableCell className="text-right"></TableCell></TableRow>);
                                                }
                                                return null;
                                            })()}
                                        </TableBody>
                                    </Table>
                                </div>
                                {renderInvoiceTotals(invoiceNum)}
                            </TabsContent>
                        ))}
                        <TabsContent key="summary-content" value="summary">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {invoiceNumbers.map(num => {
                                    const subtotal = calculateInvoiceTotals(num); const vatPercentage = 18;
                                    const { deduction_insurance_percentage = 0, deduction_retention_percentage = 0, deduction_lab_tests_percentage = 0 } = project || {};
                                    const insuranceDeduction = subtotal * (deduction_insurance_percentage / 100); const retentionDeduction = subtotal * (deduction_retention_percentage / 100); const labTestsDeduction = subtotal * (deduction_lab_tests_percentage / 100);
                                    const totalDeductions = insuranceDeduction + retentionDeduction + labTestsDeduction; const totalAfterDeductions = subtotal - totalDeductions; const finalTotalForCard = totalAfterDeductions * (1 + vatPercentage / 100);
                                    return (<Card key={num} className="p-4 bg-white shadow-sm"><h4 className="font-semibold mb-2 text-slate-700">חשבון {num}</h4><p className="text-2xl font-bold text-blue-600">₪{finalTotalForCard.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p><p className="text-sm text-slate-500">כולל מע״מ</p></Card>);
                                })}
                            </div>
                            <Card className="mt-6 p-6 bg-white shadow-md">
                                <h3 className="text-xl font-bold mb-4 text-slate-800">סיכום כללי</h3>
                                <div className="grid grid-cols-3 gap-6 text-center">
                                    <div><p className="text-sm text-slate-500">סך הכל חויב</p><p className="text-3xl font-bold text-green-600">₪{invoiceNumbers.reduce((sum, num) => { const subtotal = calculateInvoiceTotals(num); const { deduction_insurance_percentage = 0, deduction_retention_percentage = 0, deduction_lab_tests_percentage = 0 } = project || {}; const ins = subtotal * (deduction_insurance_percentage / 100); const ret = subtotal * (deduction_retention_percentage / 100); const lab = subtotal * (deduction_lab_tests_percentage / 100); const td = ins + ret + lab; const tad = subtotal - td; return sum + (tad * 1.18); }, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p></div>
                                    <div><p className="text-sm text-slate-500">סך הכל פרויקט</p><p className="text-3xl font-bold text-slate-800">₪{(quote?.total || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p></div>
                                    <div><p className="text-sm text-slate-500">נותר לחיוב</p><p className="text-3xl font-bold text-orange-600">₪{((quote?.total || 0) - invoiceNumbers.reduce((sum, num) => { const subtotal = calculateInvoiceTotals(num); const { deduction_insurance_percentage = 0, deduction_retention_percentage = 0, deduction_lab_tests_percentage = 0 } = project || {}; const ins = subtotal * (deduction_insurance_percentage / 100); const ret = subtotal * (deduction_retention_percentage / 100); const lab = subtotal * (deduction_lab_tests_percentage / 100); const td = ins + ret + lab; const tad = subtotal - td; return sum + (tad * 1.18); }, 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p></div>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
            <DeductionsModal isOpen={showDeductionsModal} onClose={() => setShowDeductionsModal(false)} onSave={handleDeductionsUpdate} currentDeductions={project || {}} />
            <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
                <DialogContent className="max-w-md bg-white shadow-xl rounded-lg" dir="rtl">
                    <DialogHeader className="bg-green-50 p-4 rounded-t-lg border-b"><DialogTitle className="text-slate-800 text-lg font-bold">הנחה כללית על כתב הכמויות</DialogTitle></DialogHeader>
                    <div className="p-6 bg-white space-y-4">
                        <div><Label className="text-slate-700 font-semibold mb-2 block">סוג הנחה</Label><Select value={boqDiscountType} onValueChange={setBoqDiscountType}><SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">אחוז (%)</SelectItem><SelectItem value="fixed_amount">סכום קבוע (₪)</SelectItem></SelectContent></Select></div>
                        <div><Label className="text-slate-700 font-semibold mb-2 block">{boqDiscountType === 'percentage' ? 'אחוז הנחה' : 'סכום הנחה'}</Label><Input type="number" min="0" max={boqDiscountType === 'percentage' ? 100 : undefined} step={boqDiscountType === 'percentage' ? '0.1' : '0.01'} value={boqDiscountType === 'percentage' ? boqDiscountPercentage : boqDiscountAmount} onChange={(e) => { const value = parseFloat(e.target.value) || 0; if (boqDiscountType === 'percentage') setBoqDiscountPercentage(Math.max(0, Math.min(100, value))); else setBoqDiscountAmount(Math.max(0, value)); }} className="text-center bg-white border-gray-300" /><p className="text-xs text-slate-500 mt-2">ההנחה תחושב על סה"כ כל החשבונות לפני קיזוזים ומע"מ{boqDiscountType === 'fixed_amount' && ' (אם הסכום גבוה מהחיוב, ההנחה תוגבל לסכום החיוב)'}</p></div>
                        <div className="flex justify-end gap-3 pt-4 border-t"><Button type="button" variant="outline" onClick={() => setShowDiscountDialog(false)}>ביטול</Button><Button onClick={async () => { try { await Project.update(projectId, { boq_discount_type: boqDiscountType, boq_discount_percentage: boqDiscountPercentage, boq_discount_amount: boqDiscountAmount }); toast.success("הנחה כללית עודכנה"); if (onUpdateQuoteLine) onUpdateQuoteLine(null, true); setShowDiscountDialog(false); } catch (error) { console.error('Error updating BOQ discount:', error); toast.error("שגיאה בעדכון הנחה"); } }} className="bg-green-600 hover:bg-green-700 text-white">שמור</Button></div>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={showPaymentTermsDialog} onOpenChange={(open) => { setShowPaymentTermsDialog(open); if (!open) { setShowCustomDays(false); setCustomDays(''); } }}>
                <DialogContent className="max-w-md bg-white shadow-xl rounded-lg" dir="rtl">
                    <DialogHeader className="bg-teal-50 p-4 rounded-t-lg border-b"><DialogTitle className="text-slate-800 text-lg font-bold">עריכת תנאי תשלום</DialogTitle></DialogHeader>
                    <div className="p-6 bg-white space-y-4">
                        <div><Label className="text-slate-700 font-semibold mb-2 block">בחר תנאי תשלום</Label><Select value={selectedPaymentTerms} onValueChange={(value) => { setSelectedPaymentTerms(value); setShowCustomDays(value === 'אחר'); }}><SelectTrigger className="bg-white border-gray-300"><SelectValue /></SelectTrigger><SelectContent className="bg-white"><SelectItem value="מיידי"><div className="text-right"><div className="font-semibold">מיידי</div><div className="text-xs text-slate-500">תשלום במועד החשבונית</div></div></SelectItem><SelectItem value="שוטף"><div className="text-right"><div className="font-semibold">שוטף</div><div className="text-xs text-slate-500">תשלום בסוף החודש</div></div></SelectItem><SelectItem value="שוטף 30"><div className="text-right"><div className="font-semibold">שוטף 30</div><div className="text-xs text-slate-500">סוף חודש + 30 יום</div></div></SelectItem><SelectItem value="שוטף 60"><div className="text-right"><div className="font-semibold">שוטף 60</div><div className="text-xs text-slate-500">סוף חודש + 60 יום</div></div></SelectItem><SelectItem value="שוטף 90"><div className="text-right"><div className="font-semibold">שוטף 90</div><div className="text-xs text-slate-500">סוף חודש + 90 יום</div></div></SelectItem><SelectItem value="אחר"><div className="text-right"><div className="font-semibold">אחר (הזנת ימים)</div><div className="text-xs text-slate-500">שוטף + מספר ימים לבחירתך</div></div></SelectItem></SelectContent></Select></div>
                        {showCustomDays && (<div className="bg-teal-50 p-4 rounded-lg border border-teal-200"><Label htmlFor="custom-days" className="text-slate-700 font-semibold mb-2 block">מספר ימים (N)</Label><Input id="custom-days" type="number" min="0" max="365" step="1" value={customDays} onChange={(e) => setCustomDays(e.target.value)} placeholder="הזן מספר ימים (0-365)" className="bg-white border-gray-300 text-center" /><p className="text-xs text-slate-600 mt-2">תאריך היעד יחושב: סוף החודש + {customDays || 'N'} ימים</p></div>)}
                        <div className="flex justify-end gap-3 pt-4 border-t"><Button type="button" variant="outline" onClick={() => { setShowPaymentTermsDialog(false); setShowCustomDays(false); setCustomDays(''); }}>ביטול</Button><Button onClick={handlePaymentTermsUpdate} className="bg-teal-600 hover:bg-teal-700 text-white">שמור</Button></div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}