import React, { useEffect, useMemo } from 'react';
import { format } from 'date-fns';

export default function InvoicePDF({ project, quote, quoteLines, progressEntries, invoiceNumber, onDone }) {
    
    const invoiceData = useMemo(() => {
        const linesWithInvoiceData = quoteLines.map(line => {
            const entry = progressEntries.find(e => e.quote_line_id === line.id && e.invoice_number === `חשבון ${invoiceNumber}`);
            return {
                ...line,
                percentageForInvoice: entry ? entry.calculated_percentage || 0 : 0,
                amountForInvoice: entry ? entry.amount_to_invoice || 0 : 0,
            };
        }).filter(line => line.amountForInvoice > 0);

        const subtotal = linesWithInvoiceData.reduce((sum, line) => sum + line.amountForInvoice, 0);

        const vatPercentage = quote?.vat_percentage || 18;
        const {
            deduction_insurance_percentage = 0,
            deduction_retention_percentage = 0,
            deduction_lab_tests_percentage = 0
        } = project || {};

        const insuranceDeduction = subtotal * (deduction_insurance_percentage / 100);
        const retentionDeduction = subtotal * (deduction_retention_percentage / 100);
        const labTestsDeduction = subtotal * (deduction_lab_tests_percentage / 100);
        const totalDeductions = insuranceDeduction + retentionDeduction + labTestsDeduction;
        
        const totalAfterDeductions = subtotal - totalDeductions;
        const vatAmount = totalAfterDeductions * (vatPercentage / 100);
        const finalTotal = totalAfterDeductions + vatAmount;

        return {
            lines: linesWithInvoiceData,
            subtotal,
            insuranceDeduction,
            retentionDeduction,
            labTestsDeduction,
            totalAfterDeductions,
            vatAmount,
            finalTotal,
            deduction_insurance_percentage,
            deduction_retention_percentage,
            deduction_lab_tests_percentage,
            vatPercentage
        };
    }, [project, quote, quoteLines, progressEntries, invoiceNumber]);

    useEffect(() => {
        const handleAfterPrint = () => {
            if (onDone) onDone();
        };

        window.addEventListener('afterprint', handleAfterPrint);
        
        setTimeout(() => window.print(), 500);

        return () => {
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [onDone]);

    const renderValue = (value) => `₪${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const renderDeduction = (value) => `-₪${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="printable-content bg-white p-8" dir="rtl">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap');
                body { font-family: 'Assistant', sans-serif; }
                @media print {
                    body * { visibility: hidden; }
                    .printable-content, .printable-content * { visibility: visible; }
                    .printable-content { position: absolute; left: 0; top: 0; width: 100%; }
                    @page { size: A4; margin: 0; }
                }
            `}</style>
            
            <header className="text-center mb-10">
                <div className="flex justify-center items-center gap-4 mb-4">
                    <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b3dec209adbcb52b0ebf8a/7e2e3cf19_.png"
                        alt="Company Logo"
                        className="h-16 object-contain"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                </div>
                <h1 className="text-3xl font-bold text-gray-800">ארגמן מערכות מיזוג מתקדמות בע"מ</h1>
                <p className="text-sm text-gray-500">מיזוג אויר | חימום תת רצפתי | אוורור ופיזור עשן</p>
                <h2 className="text-2xl font-semibold text-gray-700 mt-6">כתב כמויות - חשבון {invoiceNumber}</h2>
            </header>

            <section className="flex justify-between text-xs mb-8 p-3 bg-gray-50 rounded-lg">
                <div>
                    <p><strong>פרויקט:</strong> {project?.name}</p>
                    <p><strong>לקוח:</strong> {project?.client_name}</p>
                </div>
                <div>
                    <p><strong>חשבון מספר:</strong> {invoiceNumber}</p>
                    <p><strong>תאריך:</strong> {format(new Date(), 'dd/MM/yyyy')}</p>
                </div>
            </section>

            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="bg-gray-200">
                        {['סעיף', 'תיאור', 'כמות כוללת', 'מחיר יחידה', 'סה"כ פריט', 'אחוז בחשבון', 'סכום לחיוב'].map(header => (
                            <th key={header} className="p-2 border border-gray-300 font-semibold text-gray-700 text-right">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {invoiceData.lines.map(line => (
                        <tr key={line.id} className="border-b">
                            <td className="p-2 border border-gray-300">{line.clause_number || ''}</td>
                            <td className="p-2 border border-gray-300">{line.name_snapshot}</td>
                            <td className="p-2 border border-gray-300">{line.quantity}</td>
                            <td className="p-2 border border-gray-300">{renderValue(line.line_total / line.quantity)}</td>
                            <td className="p-2 border border-gray-300">{renderValue(line.line_total)}</td>
                            <td className="p-2 border border-gray-300">{(line.percentageForInvoice).toFixed(1)}%</td>
                            <td className="p-2 border border-gray-300 font-semibold">{renderValue(line.amountForInvoice)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <footer className="pt-8 mt-8 border-t-2 border-gray-300">
                <div className="w-2/5 ml-auto text-xs text-right">
                    <div className="flex justify-between py-1">
                        <span>סכום ביניים:</span>
                        <strong>{renderValue(invoiceData.subtotal)}</strong>
                    </div>
                    {invoiceData.insuranceDeduction > 0 && 
                        <div className="flex justify-between py-1 text-red-600">
                            <span>קיזוז ביטוח ({invoiceData.deduction_insurance_percentage}%):</span>
                            <span>{renderDeduction(invoiceData.insuranceDeduction)}</span>
                        </div>
                    }
                    {invoiceData.retentionDeduction > 0 && 
                        <div className="flex justify-between py-1 text-red-600">
                            <span>קיזוז עיכבון ({invoiceData.deduction_retention_percentage}%):</span>
                            <span>{renderDeduction(invoiceData.retentionDeduction)}</span>
                        </div>
                    }
                    {invoiceData.labTestsDeduction > 0 && 
                        <div className="flex justify-between py-1 text-red-600">
                            <span>קיזוז מעבדה ({invoiceData.deduction_lab_tests_percentage}%):</span>
                            <span>{renderDeduction(invoiceData.labTestsDeduction)}</span>
                        </div>
                    }
                    <div className="flex justify-between py-1 border-t border-gray-400 mt-1">
                        <span>סה"כ לאחר קיזוז:</span>
                        <strong>{renderValue(invoiceData.totalAfterDeductions)}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                        <span>מע"מ ({invoiceData.vatPercentage}%):</span>
                        <strong>{renderValue(invoiceData.vatAmount)}</strong>
                    </div>
                    <div className="flex justify-between py-2 text-base font-bold bg-gray-200 px-2 rounded mt-1">
                        <span>סה"כ לתשלום:</span>
                        <span>{renderValue(invoiceData.finalTotal)}</span>
                    </div>
                </div>
                <div className="text-center text-xs text-gray-500 mt-12">
                    <p>חשבון זה כפוף לתנאי החוזה | תודה על שיתוף הפעולה</p>
                </div>
            </footer>
        </div>
    );
}