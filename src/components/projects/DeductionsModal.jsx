import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Percent } from 'lucide-react';

export default function DeductionsModal({ isOpen, onClose, onSave, currentDeductions = {} }) {
    const [deductions, setDeductions] = useState({
        deduction_insurance_percentage: currentDeductions.deduction_insurance_percentage || 0,
        deduction_retention_percentage: currentDeductions.deduction_retention_percentage || 0,
        deduction_lab_tests_percentage: currentDeductions.deduction_lab_tests_percentage || 0
    });

    const handleInputChange = (field, value) => {
        const numValue = parseFloat(value) || 0;
        if (numValue >= 0 && numValue <= 100) {
            setDeductions(prev => ({ ...prev, [field]: numValue }));
        }
    };

    const handleSave = () => {
        onSave(deductions);
    };

    const totalDeduction = Object.values(deductions).reduce((sum, val) => sum + val, 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg bg-[#1a1a2e]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#f0f0f0] text-right">
                        ניהול קיזוזים
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    <div className="bg-[rgba(96,165,250,0.1)] border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-[#60a5fa]" />
                            <h4 className="font-semibold text-blue-900">מה זה קיזוזים?</h4>
                        </div>
                        <p className="text-blue-800 text-sm">
                            קיזוזים הם אחוזים שמקוזזים מכל חשבון לפני תשלום. הם נפוצים בפרויקטי בנייה כביטחון ללקוח.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-[#e0e0e0] flex items-center gap-2">
                                    <Percent className="w-4 h-4" />
                                    קיזוז ביטוח
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={deductions.deduction_insurance_percentage}
                                        onChange={(e) => handleInputChange('deduction_insurance_percentage', e.target.value)}
                                        className="text-right"
                                    />
                                    <span className="text-[#a0a0b8]">%</span>
                                </div>
                                <p className="text-xs text-[#a0a0b8] mt-1">אחוז קיזוז עבור ביטוח חבות וכיסויים</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-[#e0e0e0] flex items-center gap-2">
                                    <Percent className="w-4 h-4" />
                                    קיזוז עיכבון
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={deductions.deduction_retention_percentage}
                                        onChange={(e) => handleInputChange('deduction_retention_percentage', e.target.value)}
                                        className="text-right"
                                    />
                                    <span className="text-[#a0a0b8]">%</span>
                                </div>
                                <p className="text-xs text-[#a0a0b8] mt-1">אחוז עיכבון לתקופת אחריות</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-[#e0e0e0] flex items-center gap-2">
                                    <Percent className="w-4 h-4" />
                                    קיזוז בדיקות מעבדה
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={deductions.deduction_lab_tests_percentage}
                                        onChange={(e) => handleInputChange('deduction_lab_tests_percentage', e.target.value)}
                                        className="text-right"
                                    />
                                    <span className="text-[#a0a0b8]">%</span>
                                </div>
                                <p className="text-xs text-[#a0a0b8] mt-1">אחוז קיזוז עבור בדיקות איכות ומעבדה</p>
                            </CardContent>
                        </Card>
                    </div>

                    {totalDeduction > 0 && (
                        <div className="bg-[rgba(251,191,36,0.1)] border border-yellow-200 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-yellow-800">סה"כ קיזוזים:</span>
                                <span className="text-xl font-bold text-yellow-900">{totalDeduction.toFixed(1)}%</span>
                            </div>
                            <p className="text-yellow-700 text-sm mt-1">
                                כל חשבון יקוזז ב-{totalDeduction.toFixed(1)}% לפני תשלום
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            ביטול
                        </Button>
                        <Button onClick={handleSave} className="bg-[#D4A843] hover:bg-[#B8922E]">
                            שמור הגדרות
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}