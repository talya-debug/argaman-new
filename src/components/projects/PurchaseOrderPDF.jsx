import React from 'react';

export default function PurchaseOrderPDF({ project, items, supplierName, onDone }) {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
            if (onDone) onDone();
        }, 500);
        return () => clearTimeout(timer);
    }, [onDone]);

    return (
        <div className="print:block hidden">
            <div className="a4-page-container" dir="rtl">
                <style>{`
                    @media print {
                        @page { size: A4; margin: 0; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                    .a4-page-container {
                        width: 210mm;
                        min-height: 297mm;
                        padding: 2cm;
                        margin: 0 auto;
                        background: white;
                        font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                    }
                `}</style>

                {/* Header */}
                <header className="flex justify-between items-start pb-6 border-b-2 border-[rgba(255,255,255,0.08)]">
                    <div className="text-right">
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b3dec209adbcb52b0ebf8a/a8f3efb05_.png" 
                            alt="ארגמן לוגו" 
                            className="h-20 mb-4"
                        />
                        <h1 className="text-xl font-bold text-slate-800">ארגמן מערכות מיזוג מתקדמות בע״מ</h1>
                        <p className="text-sm text-[#a0a0b8]">מיזוג אויר | חימום תת רצפתי | אוורור ופיזור עשן</p>
                    </div>
                    <div className="text-left">
                        <h2 className="text-3xl font-bold text-slate-800">הזמנת רכש</h2>
                        <p className="text-[#a0a0b8] mt-2">תאריך: {new Date().toLocaleDateString('he-IL')}</p>
                    </div>
                </header>

                {/* Details */}
                <section className="grid grid-cols-2 gap-8 my-8">
                     <div>
                        <h3 className="text-sm font-semibold text-[#a0a0b8] uppercase tracking-wider mb-2">אל:</h3>
                        <div className="text-[#e0e0e0]">
                            <p className="font-bold">{supplierName}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[#a0a0b8] uppercase tracking-wider mb-2">עבור פרויקט:</h3>
                        <p className="text-[#e0e0e0] font-bold">{project?.name}</p>
                        <p className="text-[#e0e0e0]">{project?.client_name}</p>
                    </div>
                </section>

                {/* Table */}
                <section>
                    <p className="mb-4">שלום רב, נא לספק את הפריטים הבאים:</p>
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-[#1e1e36] border-b-2 border-[rgba(255,255,255,0.08)]">
                                <th className="p-3 font-semibold text-[#e0e0e0]">תיאור הפריט</th>
                                <th className="p-3 font-semibold text-[#e0e0e0] text-center">מק״ט</th>
                                <th className="p-3 font-semibold text-[#e0e0e0] text-center">כמות</th>
                                <th className="p-3 font-semibold text-[#e0e0e0] text-center">מחיר יח'</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id} className="border-b border-slate-100">
                                    <td className="p-3">
                                        <p className="font-medium text-slate-800">{item.name_snapshot}</p>
                                        <p className="text-sm text-[#a0a0b8]">{item.description_snapshot}</p>
                                    </td>
                                    <td className="p-3 text-center text-[#a0a0b8]">{item.sku_snapshot}</td>
                                    <td className="p-3 text-center text-slate-800 font-bold">{item.quantity_to_order}</td>
                                    <td className="p-3 text-center text-[#a0a0b8]">₪{item.list_price_snapshot?.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Footer */}
                <footer className="mt-auto pt-8 text-center text-xs text-[#6b6b80] border-t-2 border-[rgba(255,255,255,0.08)]">
                    <p>בברכה, צוות ארגמן מערכות מיזוג</p>
                    <p>תודה על שיתוף הפעולה</p>
                </footer>
            </div>
        </div>
    );
}