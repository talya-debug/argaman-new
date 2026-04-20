import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, UserCheck, ShoppingCart, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

const LABOR_COST_PER_HOUR = 3500 / 18;

const StatCard = ({ title, value, icon, colorClass }) => {
    const Icon = icon;
    return (
        <div className={`p-4 rounded-lg shadow-md ${colorClass}`}>
            <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium">{title}</p>
                <Icon className="h-5 w-5 opacity-80" />
            </div>
            <p className="text-2xl font-bold">
                ₪{value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
        </div>
    );
};

export default function ProjectDashboard({ quoteLines, progressEntries, workLogEntries, purchaseRecords, quote, subContractors, collectionTasks }) {
    const approvedProjectAmount = quote?.total || quoteLines.reduce((sum, line) => sum + (line.line_total || 0), 0);
    const vatPercentage = quote?.vat_percentage || 18;
    const totalRevenueBeforeVAT = progressEntries.reduce((sum, entry) => sum + (entry.amount_to_invoice || 0), 0);
    const totalRevenue = totalRevenueBeforeVAT * (1 + vatPercentage / 100);
    
    // Calculate total procurement cost from actual purchase records
    // הוצאות רכש - סכום כל העלות בפועל מכל ההזמנות בפרויקט
    const totalProcurementCost = purchaseRecords.reduce((sum, record) => {
        const cost = parseFloat(record.actual_total_cost) || 0;
        return sum + cost;
    }, 0);

    // עלות רכש מתוכננת
    const plannedProcurementCost = purchaseRecords.reduce((sum, record) => {
        const planned = (record.quantity_to_order || 0) * (record.unit_price || 0);
        return sum + planned;
    }, 0);
    
    const totalLaborCost = workLogEntries.reduce((sum, entry) => sum + ((entry.total_hours || 0) * LABOR_COST_PER_HOUR), 0);
    
    const subContractorCosts = (subContractors || []).reduce((sum, contractor) => sum + (contractor.amount || 0), 0);
    
    const totalExpenses = totalLaborCost + totalProcurementCost + subContractorCosts;
    const remainingToBill = approvedProjectAmount - totalRevenue;
    const projectProfit = totalRevenue - totalExpenses;

    let completionPercentage = 0;
    if (approvedProjectAmount > 0) {
        completionPercentage = (totalRevenue / approvedProjectAmount) * 100;
    }
    const validPercentage = Math.max(0, Math.min(100, completionPercentage || 0));

    // חישוב נתוני קצב ההתקדמות
    const P = approvedProjectAmount; // סכום פרויקט שאושר
    const A = totalRevenueBeforeVAT * (1 + vatPercentage / 100); // חשבוניות מאושרות כולל מע"מ
    const R = (collectionTasks || [])
        .filter(task => task.collection_status === "שולם ונשלחה חשבונית מס")
        .reduce((sum, task) => sum + (task.amount_to_collect || 0), 0); // תשלומים שהתקבלו

    const remaining = Math.max(0, P - A); // יתרה לחיוב

    // אחוזים מתוך סכום הפרויקט
    const remainingPercentage = P > 0 ? (remaining / P) * 100 : 0;
    const invoicesPercentage = P > 0 ? (A / P) * 100 : 0;
    const paymentsPercentage = P > 0 ? (R / P) * 100 : 0;

    // אחוז תשלומים מתוך חשבוניות
    const paymentsFromInvoicesPercentage = A > 0 ? (R / A) * 100 : 0;

    return (
        <div className="mb-6 space-y-6" dir="rtl">
            {/* קצב התקדמות פרויקט */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-slate-50 to-blue-50/30">
                <CardContent className="pt-8 pb-8 space-y-8">
                    {/* סכום פרויקט שאושר */}
                    <div className="text-center pb-6 border-b-2 border-blue-200">
                        <p className="text-sm text-[#a0a0b8] mb-1 font-bold">סכום פרויקט שאושר</p>
                        <p className="text-[32px] font-bold text-[#60a5fa]">
                            {Math.round(P).toLocaleString('he-IL')} ₪
                        </p>
                    </div>

                    {/* כותרת */}
                    <div className="text-right">
                        <h3 className="text-xl font-bold text-slate-800">קצב התקדמות פרויקט (חיובים ותשלומים)</h3>
                    </div>

                    {/* Stacked Progress Bar */}
                    <div className="space-y-6">
                        <div className="relative w-full h-16 rounded-xl overflow-hidden" style={{ backgroundColor: '#EF4444' }}>
                            {/* שכבה 2: חשבוניות מאושרות (כתום) */}
                            <div 
                                className="absolute top-0 right-0 h-full rounded-xl transition-all duration-500"
                                style={{ 
                                    width: `${Math.min(100, invoicesPercentage)}%`,
                                    backgroundColor: '#FB923C'
                                }}
                            >
                                {/* שכבה 3: תשלומים שהתקבלו (ירוק) - בתוך הכתום */}
                                <div 
                                    className="absolute top-0 right-0 h-full rounded-xl transition-all duration-500"
                                    style={{ 
                                        width: `${A > 0 ? Math.min(100, (R / A) * 100) : 0}%`,
                                        backgroundColor: '#22C55E'
                                    }}
                                />
                            </div>
                        </div>

                        {/* אגדת צבעים */}
                        <div className="space-y-3 bg-[#1a1a2e] p-6 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.3)]" dir="rtl" style={{ lineHeight: '1.8' }}>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded flex-shrink-0" style={{ backgroundColor: '#EF4444' }}></div>
                                <span className="font-bold text-lg" style={{ color: '#EF4444' }}>{Math.round(remaining).toLocaleString('he-IL')} ₪</span>
                                <span className="font-medium text-slate-800">נותר לחיוב</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded flex-shrink-0" style={{ backgroundColor: '#FB923C' }}></div>
                                <span className="font-bold text-orange-600 text-lg">{Math.round(A).toLocaleString('he-IL')} ₪</span>
                                <span className="font-medium text-slate-800">חשבוניות מאושרות</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded flex-shrink-0" style={{ backgroundColor: '#22C55E' }}></div>
                                <span className="font-bold text-[#4ade80] text-lg">{Math.round(R).toLocaleString('he-IL')} ₪</span>
                                <span className="font-medium text-slate-800">תשלומים שהתקבלו</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-[#1a1a2e]">
                <CardHeader>
                    <CardTitle className="text-center text-xl font-bold text-slate-800">התקדמות ביצוע</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                     <div className="w-2/3 mx-auto mt-4 relative">
                        <Progress value={validPercentage} className="h-4 bg-slate-200 [&>*]:bg-[rgba(96,165,250,0.1)]0" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-800">
                                {validPercentage.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income Section */}
                <Card className="shadow-lg border-0 bg-[rgba(74,222,128,0.1)]">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-green-800 flex items-center gap-2">
                           <TrendingUp className="w-5 h-5"/> הכנסות
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <StatCard 
                            title="הכנסות שאושרו (חיובים)" 
                            value={totalRevenue} 
                            icon={DollarSign}
                            colorClass="bg-[rgba(74,222,128,0.1)] text-green-900"
                        />
                         <StatCard 
                            title="נותר לחיוב" 
                            value={remainingToBill} 
                            icon={FileText}
                            colorClass="bg-[rgba(74,222,128,0.1)] text-green-900"
                        />
                    </CardContent>
                </Card>

                {/* Expenses Section */}
                <Card className="shadow-lg border-0 bg-[rgba(248,113,113,0.1)]">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-red-800 flex items-center gap-2">
                            <TrendingDown className="w-5 h-5"/> הוצאות
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <StatCard 
                            title="הוצאות רכש" 
                            value={totalProcurementCost} 
                            icon={ShoppingCart} 
                            colorClass="bg-[rgba(248,113,113,0.1)] text-red-900"
                        />
                        <StatCard 
                            title="הוצאות כח אדם" 
                            value={totalLaborCost} 
                            icon={UserCheck}
                            colorClass="bg-[rgba(248,113,113,0.1)] text-red-900"
                        />
                        <StatCard 
                            title="הוצאות קבלני משנה" 
                            value={subContractorCosts} 
                            icon={UserCheck}
                            colorClass="bg-[rgba(248,113,113,0.1)] text-red-900"
                        />
                    </CardContent>
                </Card>
            </div>
            
            {/* Summary Section */}
            <Card className="shadow-xl border-2 border-[rgba(255,255,255,0.08)] bg-[#1a1a2e]">
                 <CardHeader>
                        <CardTitle className="text-center text-xl font-bold text-slate-800">סיכום כללי</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-[rgba(74,222,128,0.1)] rounded-lg">
                        <p className="text-sm text-[#4ade80]">סה"כ הכנסות</p>
                        <p className="text-2xl font-bold text-[#4ade80]">₪{totalRevenue.toLocaleString()}</p>
                    </div>
                     <div className="p-4 bg-[rgba(248,113,113,0.1)] rounded-lg">
                        <p className="text-sm text-[#f87171]">סה"כ הוצאות</p>
                        <p className="text-2xl font-bold text-[#f87171]">₪{totalExpenses.toLocaleString()}</p>
                    </div>
                     <div className="p-4 bg-[rgba(96,165,250,0.1)] rounded-lg">
                        <p className="text-sm text-[#60a5fa]">רווח פרויקט</p>
                        <p className={`text-2xl font-bold ${projectProfit >= 0 ? 'text-[#60a5fa]' : 'text-pink-600'}`}>
                           ₪{projectProfit.toLocaleString()}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}