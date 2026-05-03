import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const VAT_RATE = 0.18;

export default function PurchaseOrderPDF({ project, items, supplierName, supplierPhone, poNumber, onDone }) {
  const ref = useRef(null);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (!ref.current) return;
      try {
        const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 297));
        pdf.save(`הזמנת_רכש_${poNumber || 'ארגמן'}.pdf`);
      } catch (e) {
        console.error('PDF error:', e);
        window.print();
      }
      if (onDone) onDone();
    }, 800);
    return () => clearTimeout(timer);
  }, [onDone, poNumber]);

  const subtotal = items.reduce((s, item) => s + (Number(item.quantity_to_order) || 0) * (Number(item.unit_price) || Number(item.list_price_snapshot) || 0), 0);
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;
  const today = new Date().toLocaleDateString('he-IL');
  const fmt = (n) => Number(n || 0).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      {/* גרסה מוסתרת להדפסה */}
      <div style={{ position: 'fixed', top: -9999, left: -9999 }}>
        <div ref={ref} style={{
          width: 794, minHeight: 1123, padding: '60px 60px 40px', background: '#fff',
          fontFamily: "'Heebo', 'Segoe UI', sans-serif", direction: 'rtl', color: '#1a1d2e',
          display: 'flex', flexDirection: 'column',
        }}>

          {/* כותרת עליונה */}
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <img src="/logo.jpg" alt="ארגמן" style={{ height: 80, margin: '0 auto 10px' }}
              onError={(e) => { e.target.style.display = 'none'; }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0066cc', margin: 0 }}>
              ארגמן מערכות מיזוג מתקדמות בע"מ
            </h1>
            <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
              מיזוג אוויר | חימום תת רצפתי | אוורור | פינוי עשן
            </p>
          </div>

          {/* פרטי חברה + ספק */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 13 }}>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: 700 }}>ארגמן מערכות מיזוג מתקדמות בע"מ</p>
              <p style={{ margin: '0 0 2px' }}>שי ארגמן: 050-9281254 | יניר ארזואן: 054-9734747</p>
              <p style={{ margin: '0 0 2px' }}>עוסק מורשה (ח.פ): 516524287</p>
              <p style={{ margin: '0 0 2px' }}>שבט בנימין 29/4, גבעת זאב</p>
              <p style={{ margin: 0 }}>argaman.ac@gmail.com</p>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: '0 0 2px', fontWeight: 700 }}>לכבוד: {supplierName || '—'}</p>
              {supplierPhone && <p style={{ margin: 0 }}>טלפון: {supplierPhone}</p>}
            </div>
          </div>

          {/* מספר הזמנה + תאריך + פרויקט */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>הזמנת רכש {poNumber || ''}</h2>
            </div>
            <div style={{ fontSize: 14 }}>{today}</div>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 20px', color: '#333' }}>
            {project?.name?.replace('פרויקט - ', '') || project?.client_name || ''}
          </p>

          {/* טבלת פריטים */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700 }}>כמות</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700 }}>פירוט</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700 }}>מחיר</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700 }}>סה"כ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const price = Number(item.unit_price) || Number(item.list_price_snapshot) || 0;
                const qty = Number(item.quantity_to_order) || 0;
                const lineTotal = qty * price;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>{qty}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <span style={{ fontWeight: 500 }}>{item.name_snapshot || item.manual_item_name || ''}</span>
                      {item.description_snapshot && <br />}
                      {item.description_snapshot && <span style={{ fontSize: 11, color: '#888' }}>{item.description_snapshot}</span>}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>₪{fmt(price)}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>₪{fmt(lineTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* סיכום */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 30 }}>
            <table style={{ fontSize: 14, borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 20px 6px 8px', fontWeight: 500 }}>סה"כ</td>
                  <td style={{ padding: '6px 8px', textAlign: 'left' }}>₪{fmt(subtotal)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 20px 6px 8px', fontWeight: 500 }}>מע"מ 18%</td>
                  <td style={{ padding: '6px 8px', textAlign: 'left' }}>₪{fmt(vat)}</td>
                </tr>
                <tr style={{ borderTop: '2px solid #333' }}>
                  <td style={{ padding: '8px 20px 8px 8px', fontWeight: 800, fontSize: 16 }}>סה"כ לתשלום</td>
                  <td style={{ padding: '8px 8px', textAlign: 'left', fontWeight: 800, fontSize: 16 }}>₪{fmt(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* טקסט שיווקי */}
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: 'center', fontSize: 13, color: '#555', lineHeight: 1.8, marginBottom: 30 }}>
            <p style={{ margin: 0, fontWeight: 700 }}>בונים מערכות. יוצרים קשרים.</p>
            <p style={{ margin: 0 }}>אצלנו בארגמן, כל פרויקט הוא הזדמנות ליחסים ארוכי טווח.</p>
            <p style={{ margin: 0 }}>הבנו שמיזוג אוויר איכותי מתחיל מהקשבה – לצרכים, לחלל, ולעיצוב.</p>
          </div>

          {/* חתימה */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>חתימה:</p>
            <div style={{ width: 200, height: 60, borderBottom: '1px solid #ccc' }} />
          </div>

          {/* תנאי תשלום */}
          <div style={{ borderTop: '1px solid #eee', paddingTop: 16, fontSize: 12, color: '#666' }}>
            <p style={{ margin: '0 0 4px', fontWeight: 600 }}>תנאי תשלום</p>
            <p style={{ margin: '0 0 8px' }}>30% בהזמנת עבודה | 65% בהזמנת ציוד | 5% בגמר התקנה</p>
            <p style={{ margin: '0 0 4px', fontWeight: 600 }}>הערות</p>
            <p style={{ margin: '0 0 12px' }}>ההצעה בתוקף ל-10 יום. יתכנו שינויים במחיר לאחר תכנון סופי.</p>
            <p style={{ margin: 0, textAlign: 'center', fontSize: 11 }}>
              ארגמן מערכות מיזוג מתקדמות בע"מ | שי ארגמן: 050-9281254 | יניר ארזואן: 054-9734747
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
