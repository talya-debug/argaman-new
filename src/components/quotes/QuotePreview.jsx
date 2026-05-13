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

    // צבעים קבועים
    const BLUE = '#1a3a7a';
    const GOLD = '#C9A84C';
    const LIGHT_BG = '#f8f9fc';
    const BORDER = '#e2e6ed';

    return (
        <div style={{
            width: '794px',
            maxWidth: '794px',
            margin: '0 auto',
            backgroundColor: '#fff',
            fontFamily: 'Arial, sans-serif',
            direction: 'rtl',
            color: '#333',
            fontSize: '13px',
            lineHeight: '1.5',
        }}>

            {/* ── כותרת עליונה ── */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px 32px',
                borderBottom: `3px solid ${BLUE}`,
            }}>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: BLUE, marginBottom: '4px' }}>
                        ארגמן מערכות מיזוג מתקדמות בע"מ
                    </div>
                    <div style={{ fontSize: '13px', color: GOLD, fontWeight: '600', marginBottom: '4px' }}>
                        מיזוג אוויר | חימום תת רצפתי | אוורור ופינוי עשן
                    </div>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                        ח.פ: 516524287 | מספר קבלן: 37992
                    </div>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                        שבט בנימין 29/4, גבעת זאב | 050-9281254 | argaman.ac@gmail.com
                    </div>
                </div>
                <img
                    src="/logo.jpg"
                    alt="Argaman Logo"
                    style={{ width: '130px', height: 'auto', objectFit: 'contain' }}
                />
            </div>

            {/* ── כותרת הצעת מחיר ── */}
            <div style={{
                textAlign: 'center',
                padding: '16px 0',
                backgroundColor: BLUE,
                color: '#fff',
            }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>
                    הצעת מחיר
                </div>
            </div>

            {/* ── פרטי לקוח + פרטי הצעה ── */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '20px 32px',
                gap: '24px',
                backgroundColor: LIGHT_BG,
                borderBottom: `1px solid ${BORDER}`,
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: BLUE, marginBottom: '8px', borderBottom: `2px solid ${GOLD}`, paddingBottom: '4px', display: 'inline-block' }}>
                        פרטי לקוח
                    </div>
                    <div style={{ marginTop: '6px' }}>
                        <div style={{ marginBottom: '4px' }}><strong>לכבוד:</strong> {lead?.name || quote?.client_name}</div>
                        {(lead?.phone || quote?.client_phone) && <div style={{ marginBottom: '4px' }}><strong>טלפון:</strong> {lead?.phone || quote?.client_phone}</div>}
                        {(lead?.address || quote?.client_address) && <div style={{ marginBottom: '4px' }}><strong>כתובת:</strong> {lead?.address || quote?.client_address}</div>}
                        {(lead?.email || quote?.client_email) && <div style={{ marginBottom: '4px' }}><strong>דוא"ל:</strong> {lead?.email || quote?.client_email}</div>}
                    </div>
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: BLUE, marginBottom: '8px', borderBottom: `2px solid ${GOLD}`, paddingBottom: '4px', display: 'inline-block' }}>
                        פרטי הצעה
                    </div>
                    <div style={{ marginTop: '6px' }}>
                        <div style={{ marginBottom: '4px' }}><strong>מספר הצעה:</strong> {quote?.quote_number || '-'}</div>
                        <div style={{ marginBottom: '4px' }}><strong>תאריך:</strong> {format(new Date(), 'dd/MM/yyyy', { locale: he })}</div>
                        <div style={{ marginBottom: '4px' }}><strong>תוקף:</strong> 30 יום</div>
                    </div>
                </div>
            </div>

            {/* ── טבלת פריטים ── */}
            <div style={{ padding: '20px 32px 0' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: BLUE, marginBottom: '12px', borderBottom: `2px solid ${GOLD}`, paddingBottom: '4px', display: 'inline-block' }}>
                    פירוט ההצעה
                </div>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                    tableLayout: 'fixed',
                }}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, width: '6%' }}>סעיף</th>
                            <th style={{ ...thStyle, width: '18%' }}>קטגוריה</th>
                            <th style={{ ...thStyle, width: '28%' }}>תיאור</th>
                            <th style={{ ...thStyle, width: '14%', textAlign: 'center' }}>תפוקה</th>
                            <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>כמות</th>
                            <th style={{ ...thStyle, width: '13%' }}>מחיר יחידה</th>
                            <th style={{ ...thStyle, width: '13%' }}>סה"כ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quoteLines.map((line, index) => {
                            if (line.is_header) {
                                return (
                                    <tr key={line.id || index}>
                                        <td colSpan={7} style={{
                                            padding: '8px 10px',
                                            fontWeight: 'bold',
                                            fontSize: '13px',
                                            color: BLUE,
                                            backgroundColor: '#eef2fa',
                                            borderBottom: `1px solid ${BORDER}`,
                                            borderRight: `3px solid ${GOLD}`,
                                            textAlign: 'right',
                                        }}>
                                            {line.clause_number && <span style={{ color: '#999', marginLeft: '8px' }}>{line.clause_number}</span>}
                                            {line.model_snapshot || line.name_snapshot}
                                        </td>
                                    </tr>
                                );
                            }
                            const isEven = index % 2 === 0;
                            return (
                                <tr key={line.id || index} style={{ backgroundColor: isEven ? '#fff' : LIGHT_BG }}>
                                    <td style={{ ...tdStyle }}>{line.clause_number || '-'}</td>
                                    <td style={{ ...tdStyle, fontSize: '11px', color: '#666' }}>{line.category_snapshot}</td>
                                    <td style={{ ...tdStyle, fontWeight: '600', color: '#222' }}>
                                        {line.model_snapshot || line.name_snapshot}
                                        {line.sub_category_snapshot && (
                                            <div style={{ fontSize: '10px', color: '#888', fontWeight: 'normal', marginTop: '2px' }}>{line.sub_category_snapshot}</div>
                                        )}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center', fontSize: '11px' }}>
                                        {line.btu_snapshot ? `${(line.btu_snapshot * (line.quantity || 1)).toLocaleString()} BTU` : '-'}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '600' }}>{line.quantity}</td>
                                    <td style={{ ...tdStyle }}>₪{line.price_no_vat_snapshot?.toLocaleString() || 0}</td>
                                    <td style={{ ...tdStyle, fontWeight: 'bold', color: GOLD }}>₪{line.line_total?.toLocaleString() || 0}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── סיכום מחירים ── */}
            <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                    width: '280px',
                    border: `1px solid ${BORDER}`,
                    borderRadius: '6px',
                    overflow: 'hidden',
                }}>
                    <div style={{ ...summaryRow }}>
                        <span>סכום ביניים:</span>
                        <span>₪{subtotal.toLocaleString()}</span>
                    </div>
                    {discountPercentage > 0 && (
                        <div style={{ ...summaryRow, color: '#d97706' }}>
                            <span>הנחה ({discountPercentage}%):</span>
                            <span>-₪{discountAmount.toLocaleString()}</span>
                        </div>
                    )}
                    {discountPercentage > 0 && (
                        <div style={{ ...summaryRow, fontWeight: '600', borderTop: `1px solid ${BORDER}` }}>
                            <span>סה"כ לאחר הנחה:</span>
                            <span>₪{subtotalAfterDiscount.toLocaleString()}</span>
                        </div>
                    )}
                    <div style={{ ...summaryRow }}>
                        <span>מע"מ ({vatRate}%):</span>
                        <span>₪{vat.toLocaleString()}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        backgroundColor: BLUE,
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '16px',
                    }}>
                        <span>סה"כ לתשלום:</span>
                        <span>₪{total.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* ── תנאים והערות ── */}
            <div style={{
                padding: '16px 32px',
                margin: '0 32px',
                backgroundColor: LIGHT_BG,
                border: `1px solid ${BORDER}`,
                borderRadius: '6px',
            }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: BLUE, marginBottom: '8px' }}>
                    תנאים והערות
                </div>
                {quote?.notes_to_client ? (
                    <div style={{ fontSize: '12px', color: '#555', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                        {quote.notes_to_client}
                    </div>
                ) : (
                    <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.8' }}>
                        <div>• ההצעה תקפה למשך 30 יום מתאריך ההצעה</div>
                        <div>• המחירים אינם כוללים עבודות בניין או חשמל</div>
                        <div>• ההצעה כוללת התקנה מקצועית ואחריות לשנה</div>
                        <div>• תנאי תשלום: 50% במתן צו התחלת עבודה, יתרה בסיום</div>
                    </div>
                )}
            </div>

            {/* ── פוטר ── */}
            <div style={{
                textAlign: 'center',
                padding: '16px 32px',
                marginTop: '20px',
                borderTop: `3px solid ${BLUE}`,
                fontSize: '12px',
                color: '#888',
            }}>
                <div style={{ fontWeight: '600', color: BLUE, marginBottom: '4px' }}>תודה על אמונכם בנו!</div>
                <div>לשירות מקצועי ואמין - ארגמן מערכות מיזוג מתקדמות בע"מ</div>
                <div style={{ marginTop: '4px' }}>050-9281254 | 054-9734747 | argaman.ac@gmail.com</div>
            </div>
        </div>
    );
}

// סגנונות לטבלה
const thStyle = {
    padding: '8px 10px',
    textAlign: 'right',
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#1a3a7a',
    borderBottom: '2px solid #C9A84C',
    fontSize: '12px',
};

const tdStyle = {
    padding: '7px 10px',
    textAlign: 'right',
    borderBottom: '1px solid #e2e6ed',
    verticalAlign: 'top',
    fontSize: '12px',
};

const summaryRow = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 16px',
    fontSize: '13px',
    color: '#555',
    borderBottom: '1px solid #e2e6ed',
};
