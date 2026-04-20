import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function QuotePreview({ quote, quoteLines, lead }) {
    const subtotal = quoteLines
        .filter(line => !line.is_header)
        .reduce((sum, line) => sum + (line.line_total || 0), 0);

    const discountPercentage = quote?.discount_percentage || 0;
    const discountAmount = subtotal * (discountPercentage / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const vatRate = quote?.vat_percentage || 18;
    const vat = subtotalAfterDiscount * (vatRate / 100);
    const total = subtotalAfterDiscount + vat;

    return (
        <div className="bg-[#1a1a2e]" style={{ width: '794px', maxWidth: '794px', margin: '0 auto' }} dir="rtl">

            {/* ── Section 1: Company Header ── */}
            <div id="pdf-sect-header" className="p-8 border-b-2 border-blue-600 flex justify-between items-center">
                <div className="text-right">
                    <h1 className="text-3xl font-bold text-blue-900 mb-2">ארגמן מערכות מתקדמות</h1>
                    <p className="text-[#60a5fa] font-medium">מיזוג אוויר | חימום תת רצפתי | אוורור ופינוי עשן</p>
                    <p className="text-[#a0a0b8] text-sm mt-2">ח.פ: 516524287 | מספר קבלן: 37992</p>
                </div>
                <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b3dec209adbcb52b0ebf8a/7e2e3cf19_.png"
                    alt="Argaman Logo"
                    className="w-40 h-auto"
                />
            </div>

            {/* ── Section 2: Client & Quote Details ── */}
            <div id="pdf-sect-details" className="p-6 grid grid-cols-2 gap-4 bg-[#1a1a2e]">
                <div className="text-right">
                    <h3 className="font-bold text-lg mb-3 text-blue-900">פרטי לקוח</h3>
                    <p><strong>לכבוד:</strong> {lead?.name || quote?.client_name}</p>
                    {lead?.phone && <p><strong>טלפון:</strong> {lead.phone}</p>}
                    {lead?.address && <p><strong>כתובת:</strong> {lead.address}</p>}
                    {lead?.email && <p><strong>דוא"ל:</strong> {lead.email}</p>}
                </div>
                <div className="text-left">
                    <h2 className="text-2xl font-bold text-[#f0f0f0] mb-2">הצעת מחיר</h2>
                    <p className="text-[#a0a0b8]">תאריך: {format(new Date(), 'dd/MM/yyyy', { locale: he })}</p>
                    <p className="text-[#a0a0b8]">מספר הצעה: {quote?.quote_number || `Q-${Date.now().toString().slice(-8)}`}</p>
                    <p className="text-[#a0a0b8] mt-2">תוקף: 30 יום</p>
                </div>
            </div>

            {/* ── Section 3: Items Table (may span pages — sliced) ── */}
            <div id="pdf-sect-table" className="px-6 pt-6 pb-0">
                <h3 className="font-bold text-lg mb-4 text-blue-900">פירוט ההצעה</h3>
                <div className="overflow-hidden border border-[rgba(255,255,255,0.12)] rounded-lg">
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead className="bg-[#D4A843] text-white" style={{ display: 'table-header-group' }}>
                            <tr>
                                <th className="p-3 text-right font-semibold">סעיף</th>
                                <th className="p-3 text-right font-semibold">קטגוריה</th>
                                <th className="p-3 text-right font-semibold">תיאור</th>
                                <th className="p-3 text-center font-semibold">תפוקה</th>
                                <th className="p-3 text-center font-semibold">כמות</th>
                                <th className="p-3 text-right font-semibold">מחיר יחידה</th>
                                <th className="p-3 text-right font-semibold">סה"כ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quoteLines.map((line, index) => {
                                if (line.is_header) {
                                    return (
                                        <tr key={line.id || index} className="bg-[rgba(96,165,250,0.1)]"
                                            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                            <td colSpan={7} className="p-3 text-right font-bold text-blue-900 text-lg">
                                                {line.clause_number && <span className="text-[#a0a0b8] ml-2">{line.clause_number}</span>}
                                                {line.model_snapshot || line.name_snapshot}
                                            </td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr key={line.id || index} className={index % 2 === 0 ? 'bg-[#1a1a2e]' : 'bg-[#1a1a2e]'}
                                        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                        <td className="p-3 text-right text-sm font-medium text-[#e0e0e0]">{line.clause_number || '-'}</td>
                                        <td className="p-3 text-right text-sm text-[#a0a0b8]">{line.category_snapshot}</td>
                                        <td className="p-3 text-right font-medium text-blue-900">
                                            {line.model_snapshot || line.name_snapshot}
                                            {line.sub_category_snapshot && (
                                                <span className="block text-xs text-[#a0a0b8] font-normal">{line.sub_category_snapshot}</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center text-sm font-medium text-[#e0e0e0]">
                                            {line.btu_snapshot ? `${(line.btu_snapshot * (line.quantity || 1)).toLocaleString()} BTU` : '-'}
                                        </td>
                                        <td className="p-3 text-center font-medium">{line.quantity}</td>
                                        <td className="p-3 text-right">₪{line.price_no_vat_snapshot?.toLocaleString() || 0}</td>
                                        <td className="p-3 text-right font-bold text-[#60a5fa]">₪{line.line_total?.toLocaleString() || 0}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Section 4: Totals / Summary (never split) ── */}
            <div id="pdf-sect-summary" className="px-6 py-6 flex justify-end"
                style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div className="w-80 bg-[#1a1a2e] border rounded-lg p-4">
                    <div className="space-y-3">
                        <div className="flex justify-between py-2 text-[#e0e0e0]">
                            <span>סכום ביניים:</span>
                            <span>₪{subtotal.toLocaleString()}</span>
                        </div>
                        {discountPercentage > 0 && (
                            <div className="flex justify-between py-2 text-orange-600">
                                <span>הנחה ({discountPercentage}%):</span>
                                <span>-₪{discountAmount.toLocaleString()}</span>
                            </div>
                        )}
                        {discountPercentage > 0 && (
                            <div className="flex justify-between py-2 text-[#e0e0e0] font-semibold border-t">
                                <span>סה"כ לאחר הנחה:</span>
                                <span>₪{subtotalAfterDiscount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-2 text-[#e0e0e0]">
                            <span>מע"מ ({vatRate}%):</span>
                            <span>₪{vat.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-3 border-t-2 border-blue-600 text-xl font-bold text-blue-900">
                            <span>סה"כ לתשלום:</span>
                            <span>₪{total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Section 5: Terms & Notes (never split) ── */}
            <div id="pdf-sect-terms" className="p-6 bg-[#1a1a2e] border-t"
                style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h3 className="font-bold mb-4 text-blue-900">תנאים והערות</h3>
                {quote?.notes_to_client ? (
                    <div className="text-sm text-[#e0e0e0] whitespace-pre-wrap leading-relaxed">
                        {quote.notes_to_client}
                    </div>
                ) : (
                    <div className="text-sm text-[#e0e0e0] space-y-2">
                        <p>• ההצעה תקפה למשך 30 יום מתאריך ההצעה</p>
                        <p>• המחירים אינם כוללים עבודות בניין או חשמל</p>
                        <p>• ההצעה כוללת התקנה מקצועית ואחריות לשנה</p>
                        <p>• תנאי תשלום: 50% במתן צו התחלת עבודה, יתרה בסיום</p>
                    </div>
                )}
                {quote?.notes && (
                    <div className="mt-4 p-4 bg-[rgba(251,191,36,0.1)] border-r-4 border-yellow-400">
                        <h4 className="font-semibold text-yellow-900 mb-2">הערות פנימיות:</h4>
                        <p className="text-sm text-yellow-800 whitespace-pre-wrap">{quote.notes}</p>
                    </div>
                )}
            </div>

            {/* ── Section 6: Footer (never split) ── */}
            <div id="pdf-sect-footer" className="p-6 border-t bg-[#D4A843] text-white text-center"
                style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <p className="font-medium">תודה על אמונכם בנו!</p>
                <p className="text-sm mt-1">לשירות מקצועי ואמין - ארגמן מערכות מתקדמות</p>
            </div>
        </div>
    );
}