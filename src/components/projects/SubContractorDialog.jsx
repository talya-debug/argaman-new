import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { SubContractor } from '@/entities';
import { toast } from 'sonner';
import { UserCog } from 'lucide-react';

const workFieldOptions = [
    'אינסטלציה',
    'חשמל',
    'אלומיניום',
    'טייח',
    'צבע',
    'עבודות עץ',
    'ריצוף',
    'גבס',
    'אחר'
];

const paymentStatusOptions = [
    'ממתין לאישור',
    'מאושר לתשלום',
    'שולם',
    'שולם חלקית'
];

export default function SubContractorDialog({ projectId, onSubContractorAdded }) {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        contractor_name: '',
        work_field: '',
        work_type: '',
        amount: '',
        payment_status: 'ממתין לאישור',
        notes: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.contractor_name || !formData.work_field || !formData.amount) {
            toast.error("יש למלא את כל השדות החובה");
            return;
        }

        try {
            await SubContractor.create({
                project_id: projectId,
                contractor_name: formData.contractor_name,
                work_field: formData.work_field,
                work_type: formData.work_type,
                amount: parseFloat(formData.amount),
                payment_status: formData.payment_status,
                notes: formData.notes
            });

            toast.success("קבלן משנה נוסף בהצלחה");
            if (onSubContractorAdded) onSubContractorAdded();
            setIsOpen(false);
            setFormData({
                contractor_name: '',
                work_field: '',
                work_type: '',
                amount: '',
                payment_status: 'ממתין לאישור',
                notes: ''
            });
        } catch (error) {
            console.error("Error adding subcontractor:", error);
            toast.error("שגיאה בהוספת קבלן משנה");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <UserCog className="w-4 h-4 ml-2" />
                    קבלן משנה
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white shadow-xl rounded-lg" dir="rtl">
                <div className="bg-white p-1 rounded-lg">
                    <DialogHeader className="bg-purple-50 p-4 rounded-t-lg border-b">
                        <DialogTitle className="text-slate-800 text-lg font-bold">הוספת קבלן משנה</DialogTitle>
                    </DialogHeader>
                    
                    <div className="p-6 bg-white">
                        <form onSubmit={handleSubmit} className="space-y-6 text-slate-800">
                            <div>
                                <Label htmlFor="contractor-name" className="text-slate-700 font-semibold">שם הקבלן *</Label>
                                <Input
                                    id="contractor-name"
                                    value={formData.contractor_name}
                                    onChange={(e) => setFormData({...formData, contractor_name: e.target.value})}
                                    placeholder="הזן שם קבלן..."
                                    className="text-right bg-white border-gray-300"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="work-field" className="text-slate-700 font-semibold">תחום עבודה *</Label>
                                <Select 
                                    value={formData.work_field} 
                                    onValueChange={(value) => setFormData({...formData, work_field: value})}
                                >
                                    <SelectTrigger className="bg-white border-gray-300">
                                        <SelectValue placeholder="בחר תחום עבודה" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {workFieldOptions.map(field => (
                                            <SelectItem key={field} value={field}>{field}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="work-type" className="text-slate-700 font-semibold">סוג העבודה</Label>
                                <Input
                                    id="work-type"
                                    value={formData.work_type}
                                    onChange={(e) => setFormData({...formData, work_type: e.target.value})}
                                    placeholder="פירוט סוג העבודה..."
                                    className="text-right bg-white border-gray-300"
                                />
                            </div>

                            <div>
                                <Label htmlFor="amount" className="text-slate-700 font-semibold">סכום לתשלום (₪) *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    placeholder="0.00"
                                    className="text-right bg-white border-gray-300"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="payment-status" className="text-slate-700 font-semibold">סטטוס תשלום</Label>
                                <Select 
                                    value={formData.payment_status} 
                                    onValueChange={(value) => setFormData({...formData, payment_status: value})}
                                >
                                    <SelectTrigger className="bg-white border-gray-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {paymentStatusOptions.map(status => (
                                            <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="notes" className="text-slate-700 font-semibold">הערות</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    placeholder="הערות נוספות..."
                                    rows={3}
                                    className="bg-white border-gray-300"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    ביטול
                                </Button>
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                                    שמור
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}