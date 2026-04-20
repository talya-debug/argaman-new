import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function QuotePDF({ quote, quoteLines, onDone }) {
    useEffect(() => {
        // Generate PDF after component mounts
        const timer = setTimeout(() => {
            window.print();
            onDone();
        }, 500);

        return () => clearTimeout(timer);
    }, [onDone]);

    const subtotal = quoteLines.reduce((sum, item) => sum + (item.line_total || 0), 0);
    const discountAmount = subtotal * ((quote.discount_percentage || 0) / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const vatAmount = subtotalAfterDiscount * ((quote.vat_percentage || 18) / 100);
    const total = subtotalAfterDiscount + vatAmount;

    return (
        <div className="print:block hidden">
            <style>{`
                @media print {
                    html, body { 
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 210mm;
                        height: 297mm;
                    }
                    * {
                        max-width: none !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print-container {
                        font-family: 'Arial', sans-serif;
                        font-size: 11px;
                        line-height: 1.3;
                        direction: rtl;
                        color: #000;
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 20mm 20mm;
                        box-sizing: border-box;
                        transform: scale(1);
                        transform-origin: top right;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 3px solid #1e3a8a;
                        padding-bottom: 10px;
                        margin-bottom: 15px;
                        width: 100%;
                    }
                    .company-name {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 3px;
                        color: #1e3a8a;
                    }
                    .company-subtitle {
                        font-size: 11px;
                        margin-bottom: 5px;
                        color: #555;
                    }
                    .quote-title {
                        font-size: 16px;
                        font-weight: bold;
                        margin: 10px 0 5px 0;
                        color: #1e3a8a;
                    }
                    .details-section {
                        display: flex;
                        justify-content: space-between;
                        width: 100%;
                        margin-bottom: 15px;
                        font-size: 11px;
                        gap: 20px;
                    }
                    .details-section > div {
                        flex: 1;
                    }
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 15px;
                        font-size: 11px;
                        table-layout: fixed;
                    }
                    .items-table th,
                    .items-table td {
                        border: 1px solid #333;
                        padding: 6px 8px;
                        text-align: right;
                        vertical-align: top;
                    }
                    .items-table th {
                        background-color: #e8f0fe;
                        font-weight: bold;
                        color: #1e3a8a;
                    }
                    .totals-section {
                        margin-top: 15px;
                        width: 100%;
                        font-size: 12px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        width: 100%;
                        margin-bottom: 4px;
                        padding: 4px 8px;
                        background-color: #f9fafb;
                    }
                    .final-total {
                        font-weight: bold;
                        font-size: 14px;
                        border-top: 3px solid #1e3a8a;
                        padding: 8px;
                        margin-top: 6px;
                        background-color: #e8f0fe;
                    }
                    .footer {
                        margin-top: 20px;
                        font-size: 10px;
                        text-align: center;
                        border-top: 2px solid #ccc;
                        padding-top: 10px;
                        width: 100%;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                }
            `}</style>
            
            <div className="print-container">
                <div className="header">
                    <div className="company-name">ארגמן מערכות מיזוג מתקדמות בע״מ</div>
                    <div className="company-subtitle">מיזוג אויר | חימום תת רצפתי | אוורור ופיזור עשן</div>
                    <div style={{fontSize: '10px', marginTop: '3px', color: '#555'}}>ח.פ: 516524287 | מספר קבלן: 37992</div>
                    <div className="quote-title">הצעת מחיר</div>
                </div>

                <div className="details-section">
                    <div>
                        <strong>לכבוד:</strong> {quote.client_name}<br/>
                        {quote.client_address && <><strong>כתובת:</strong> {quote.client_address}<br/></>}
                        {quote.client_phone && <><strong>טלפון:</strong> {quote.client_phone}<br/></>}
                        {quote.client_email && <><strong>אימייל:</strong> {quote.client_email}</>}
                    </div>
                    <div>
                        <strong>מספר הצעה:</strong> {quote.quote_number || 'לא הוגדר'}<br/>
                        <strong>תאריך:</strong> {format(new Date(), 'dd/MM/yyyy', { locale: he })}<br/>
                        {quote.valid_until && <><strong>בתוקף עד:</strong> {format(new Date(quote.valid_until), 'dd/MM/yyyy', { locale: he })}</>}
                    </div>
                </div>

                <table className="items-table">
                    <thead>
                        <tr>
                            <th style={{width: '10%'}}>מק"ט</th>
                            <th style={{width: '30%'}}>תיאור</th>
                            <th style={{width: '12%'}}>תפוקה</th>
                            <th style={{width: '8%'}}>כמות</th>
                            <th style={{width: '15%'}}>מחיר יחידה</th>
                            <th style={{width: '15%'}}>סה"כ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quoteLines.map((item, index) => (
                            <tr key={index}>
                                <td style={{fontSize: '9px'}}>{item.sku_snapshot}</td>
                                <td>
                                    <div style={{fontWeight: 'bold'}}>{item.name_snapshot}</div>
                                    {item.description_snapshot && (
                                        <div style={{fontSize: '9px', color: '#666', marginTop: '1px'}}>
                                            {item.description_snapshot}
                                        </div>
                                    )}
                                </td>
                                <td>{item.btu_snapshot ? `${(item.btu_snapshot * (item.quantity || 1)).toLocaleString()} BTU` : '-'}</td>
                                <td>{item.quantity}</td>
                                <td>₪{item.list_price_snapshot?.toLocaleString()}</td>
                                <td>₪{item.line_total?.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="totals-section">
                    <div className="total-row">
                        <span>סכום ביניים:</span>
                        <span>₪{subtotal.toLocaleString()}</span>
                    </div>
                    {(quote.discount_percentage || 0) > 0 && (
                        <div className="total-row">
                            <span>הנחה ({quote.discount_percentage}%):</span>
                            <span>-₪{discountAmount.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="total-row">
                        <span>לפני מע"מ:</span>
                        <span>₪{subtotalAfterDiscount.toLocaleString()}</span>
                    </div>
                    <div className="total-row">
                        <span>מע"מ ({quote.vat_percentage || 18}%):</span>
                        <span>₪{vatAmount.toLocaleString()}</span>
                    </div>
                    <div className="total-row final-total">
                        <span>סה"כ לתשלום:</span>
                        <span>₪{total.toLocaleString()}</span>
                    </div>
                </div>

                <div style={{marginTop: '15px', fontSize: '10px', padding: '8px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px'}}>
                    <strong style={{fontSize: '11px', color: '#1e3a8a'}}>תנאים והערות:</strong>
                    <div style={{marginTop: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>
                        {quote.notes_to_client || 
                            '• ההצעה תקפה למשך 30 יום מתאריך ההצעה\n• המחירים אינם כוללים עבודות בניין או חשמל\n• ההצעה כוללת התקנה מקצועית ואחריות לשנה\n• תנאי תשלום: 50% במתן צו התחלת עבודה, יתרה בסיום'}
                    </div>
                </div>

                <div className="footer">
                    תודה על אמונכם | הצעה זו בתוקף למשך 30 יום | לפרטים נוספים אנא צרו קשר
                </div>
            </div>
        </div>
    );
}