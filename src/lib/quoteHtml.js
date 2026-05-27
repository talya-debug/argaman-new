// יוצר HTML נקי להצעת מחיר — לשימוש עם Puppeteer PDF
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export function buildQuoteHTML({ quote, quoteLines, lead, isPrivate }) {
  const subtotal = quoteLines
    .filter(l => !l.is_header)
    .reduce((sum, l) => sum + (l.line_total || 0), 0);

  const discountPct = quote?.discount_percentage || 0;
  const discountAmt = subtotal * (discountPct / 100);
  const afterDiscount = subtotal - discountAmt;
  const vatRate = quote?.vat_percentage || 18;
  const vat = afterDiscount * (vatRate / 100);
  const total = afterDiscount + vat;
  const dateStr = format(new Date(), 'dd/MM/yyyy', { locale: he });

  const clientName = lead?.name || quote?.client_name || '';
  const clientPhone = lead?.phone || quote?.client_phone || '';
  const clientAddress = lead?.address || quote?.client_address || '';
  const clientEmail = lead?.email || quote?.client_email || '';

  const fmt = (n) => '₪' + Number(n || 0).toLocaleString('he-IL', { maximumFractionDigits: 0 });

  // שורות טבלה
  const rowsHTML = quoteLines.map((line, i) => {
    if (line.is_header) {
      return `<tr class="header-row">
        <td colspan="6" style="font-weight:700; font-size:14px; color:#1a3a7a; background:#eef2fa; padding:8px 10px; border-right:3px solid #C9A84C;">
          ${line.clause_number ? `<span style="color:#999; margin-left:8px;">${line.clause_number}</span>` : ''}
          ${line.model_snapshot || line.name_snapshot || ''}
        </td>
      </tr>`;
    }
    const bg = i % 2 === 0 ? '#fff' : '#f8f9fc';
    return `<tr style="background:${bg};">
      <td style="padding:6px 8px; font-size:12px; color:#666;">${line.clause_number || '-'}</td>
      <td style="padding:6px 8px; font-size:12px; color:#666;">${line.category_snapshot || '-'}</td>
      <td style="padding:6px 8px; font-weight:600; color:#222;">
        ${line.model_snapshot || line.name_snapshot || ''}
        ${line.sub_category_snapshot ? `<div style="font-size:10px; color:#888; font-weight:normal;">${line.sub_category_snapshot}</div>` : ''}
      </td>
      <td style="padding:6px 8px; text-align:center; font-size:11px;">${line.btu_snapshot ? `${(line.btu_snapshot * (line.quantity || 1)).toLocaleString()} BTU` : '-'}</td>
      <td style="padding:6px 8px; text-align:center; font-weight:600;">${line.quantity || 1}</td>
      <td style="padding:6px 8px; text-align:center; font-weight:700; color:#C9A84C;">${fmt(line.line_total)}</td>
    </tr>`;
  }).join('');

  // שורת סיכום בתוך tbody
  let summaryRows = `
    <tr class="summary"><td colspan="6" style="padding:0; border:none;"><div style="height:12px;"></div></td></tr>
    <tr class="summary" style="background:#f8f9fc;">
      <td colspan="4"></td>
      <td style="padding:8px; text-align:left; font-weight:500;">סכום ביניים:</td>
      <td style="padding:8px; text-align:center;">${fmt(subtotal)}</td>
    </tr>`;

  if (discountPct > 0) {
    summaryRows += `
    <tr class="summary" style="background:#f8f9fc;">
      <td colspan="4"></td>
      <td style="padding:8px; text-align:left; color:#d97706;">הנחה (${discountPct}%):</td>
      <td style="padding:8px; text-align:center; color:#d97706;">-${fmt(discountAmt)}</td>
    </tr>`;
  }

  summaryRows += `
    <tr class="summary" style="background:#f8f9fc;">
      <td colspan="4"></td>
      <td style="padding:8px; text-align:left;">מע"מ (${vatRate}%):</td>
      <td style="padding:8px; text-align:center;">${fmt(vat)}</td>
    </tr>
    <tr class="summary" style="background:#1a3a7a; color:#fff;">
      <td colspan="4"></td>
      <td style="padding:10px; text-align:left; font-weight:700; font-size:15px;">סה"כ לתשלום:</td>
      <td style="padding:10px; text-align:center; font-weight:700; font-size:15px;">${fmt(total)}</td>
    </tr>`;

  // תנאים
  const terms = quote?.notes_to_client ||
    '• ההצעה תקפה למשך 30 יום מתאריך ההצעה\n• המחירים אינם כוללים עבודות בניין או חשמל\n• ההצעה כוללת התקנה מקצועית ואחריות לשנה\n• תנאי תשלום: 50% במתן צו התחלת עבודה, יתרה בסיום';

  // דף אודות (פרטי בלבד)
  const aboutPage = isPrivate ? `
    <div class="page-break"></div>
    <div style="padding:20px 0;">
      <div style="text-align:center; border-bottom:3px solid #1a3a7a; padding-bottom:16px; margin-bottom:24px;">
        <div style="font-size:22px; font-weight:700; color:#1a3a7a;">ארגמן מערכות מיזוג מתקדמות בע"מ</div>
        <div style="font-size:13px; color:#C9A84C; margin-top:4px;">מיזוג אוויר | חימום תת רצפתי | אוורור ופינוי עשן</div>
        <div style="font-size:11px; color:#888; margin-top:4px;">ח.פ: 516524287 | מספר קבלן: 37992</div>
      </div>
      <h2 style="text-align:center; font-size:20px; color:#1a3a7a; margin-bottom:20px;">אודות</h2>
      <p style="margin-bottom:12px;"><strong style="font-size:15px; color:#1a3a7a;">ארגמן מערכות מיזוג</strong></p>
      <p style="margin-bottom:16px; line-height:1.8;">הינה חברה קבלנית הרשומה מס 37992 ומבוססת על ניסיון רב שנים של מייסדיה הפועלים בענף המיזוג משנת 1999 ובעלי הסמכה ממשרד העבודה. דרג 3 הגבוה בענף והינה קבלן רשום מספר 37992</p>
      <p style="margin-bottom:12px;"><strong style="font-size:15px; color:#1a3a7a;">ארגמן מערכות מיזוג</strong></p>
      <p style="margin-bottom:16px; line-height:1.8;">מציעה לקהל לקוחותיה מגוון פתרונות מיזוג בהתאמה אישית. וברמה מקצועית גבוהה ובתוך עמידה בסטנדרט עבודה מהמובילים בענף המיזוג. אנו שמים דגש מרכזי על תכנון מערכות גמישות ואיכותיות המותאמות באופן אישי לצורכי הלקוח, ומקפידים על מקצועיות בהתקנה תחזוקה קלה ושוטפת, ושומרים על שירות ברמה גבוהה ומקצועית.</p>
      <p style="margin-bottom:8px;"><strong style="font-size:15px; color:#1a3a7a;">ארגמן מערכות מיזוג</strong></p>
      <p style="margin-bottom:8px;">מספקת מגוון רחב של שירותים תחת קורת גג אחת:</p>
      <ul style="margin-bottom:16px; padding-right:20px; line-height:2;">
        <li>מיזוג אוויר ביתי</li>
        <li>מערכות VRF ומולטי ביתיות ותעשייתיות</li>
        <li>מערכות חימום תת רצפתי מבוססות מים</li>
        <li>מערכות חימום מים</li>
        <li>מערכות צ'ילרים</li>
        <li>מיזוג אוויר תעשייתי</li>
        <li>מערכות אוורור ופינוי עשן</li>
        <li>טיפול ואחזקה של מערכות מיזוג אוויר ביתי ותעשייתי</li>
      </ul>
      <p><strong style="font-size:15px; color:#1a3a7a;">ארגמן מערכות מיזוג</strong></p>
      <p style="line-height:1.8;">נוסדה מתוך חזון לתת מענה מקצועי, אמין, אכפתי והוגן. בין לקוחותנו ניתן למצוא: חברות מוסדות ולקוחות פרטיים רבים</p>
      <div style="margin-top:40px; padding-top:12px; border-top:2px solid #1a3a7a; text-align:center;">
        <p style="font-weight:700; color:#1a3a7a;">ארגמן מערכות מיזוג מתקדמות בע"מ</p>
        <p style="font-size:12px; color:#666;">משרד: 077-5625046 | שי ארגמן: 0509281254 | יניר ארזואן: 0549734747</p>
        <p style="font-size:12px; color:#666;">argaman.ac@gmail.com</p>
      </div>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
* { font-family: 'Heebo', sans-serif; box-sizing: border-box; margin: 0; padding: 0; font-size: 13px; line-height: 1.5; }
body { direction: rtl; color: #333; }
table { width: 100%; border-collapse: collapse; }
thead { display: table-header-group; }
tr { page-break-inside: avoid; break-inside: avoid; }
tr.summary { break-before: avoid; page-break-before: avoid; break-inside: avoid; }
.page-break { break-before: page; page-break-before: always; }

/* הדר חוזר */
.repeat-header td { padding: 0; border: none; }
.header-content { display: flex; justify-content: space-between; align-items: center; padding: 0 0 12px 0; border-bottom: 3px solid #1a3a7a; margin-bottom: 8px; }
.header-content .company { text-align: right; }
.header-content .company h1 { font-size: 20px; font-weight: 700; color: #1a3a7a; margin-bottom: 2px; }
.header-content .company .sub { font-size: 12px; color: #C9A84C; font-weight: 600; }
.header-content .company .info { font-size: 10px; color: #888; margin-top: 2px; }
.header-content img { width: 110px; height: auto; }

/* כותרות טבלה */
th { padding: 8px 8px; text-align: right; font-weight: 700; color: #fff; background: #1a3a7a; font-size: 12px; border-bottom: 2px solid #C9A84C; }

td { border-bottom: 1px solid #e5e7eb; vertical-align: top; }

.header-row td { border: none; }
</style>
</head>
<body>

<!-- פרטי לקוח — עמוד 1 בלבד, position absolute -->
<div style="position:absolute; top:85px; right:0; left:0; display:flex; justify-content:space-between; padding:0 0 16px 0;">
  <div>
    <div style="font-size:13px; font-weight:700; color:#1a3a7a; border-bottom:2px solid #C9A84C; display:inline-block; padding-bottom:3px; margin-bottom:6px;">פרטי לקוח</div>
    <div style="margin-top:6px;">
      <div><strong>לכבוד:</strong> ${clientName}</div>
      ${clientPhone ? `<div><strong>טלפון:</strong> ${clientPhone}</div>` : ''}
      ${clientAddress ? `<div><strong>כתובת:</strong> ${clientAddress}</div>` : ''}
      ${clientEmail ? `<div><strong>דוא"ל:</strong> ${clientEmail}</div>` : ''}
    </div>
  </div>
  <div style="text-align:left;">
    <div style="font-size:13px; font-weight:700; color:#1a3a7a; border-bottom:2px solid #C9A84C; display:inline-block; padding-bottom:3px; margin-bottom:6px;">פרטי הצעה</div>
    <div style="margin-top:6px;">
      <div><strong>מספר הצעה:</strong> ${quote?.quote_number || '-'}</div>
      <div><strong>תאריך:</strong> ${dateStr}</div>
      <div><strong>תוקף:</strong> 30 יום</div>
    </div>
  </div>
</div>

<table>
  <thead>
    <tr class="repeat-header">
      <td colspan="6">
        <div class="header-content">
          <div class="company">
            <h1>ארגמן מערכות מיזוג מתקדמות בע"מ</h1>
            <div class="sub">מיזוג אוויר | חימום תת רצפתי | אוורור ופינוי עשן</div>
            <div class="info">ח.פ: 516524287 | מספר קבלן: 37992 | שבט בנימין 29/4, גבעת זאב</div>
          </div>
        </div>
      </td>
    </tr>
    <tr>
      <th style="width:7%;">סעיף</th>
      <th style="width:15%;">קטגוריה</th>
      <th style="width:33%;">תיאור</th>
      <th style="width:15%; text-align:center;">תפוקה</th>
      <th style="width:10%; text-align:center;">כמות</th>
      <th style="width:15%; text-align:center;">סה"כ</th>
    </tr>
  </thead>
  <tbody>
    <!-- ריווח לפרטי לקוח בעמוד 1 -->
    <tr><td colspan="6" style="height:110px; border:none;"></td></tr>
    ${rowsHTML}
    ${summaryRows}
    <!-- תנאים -->
    <tr class="summary"><td colspan="6" style="padding:16px 0 0; border:none;">
      <div style="background:#f8f9fc; border:1px solid #e5e7eb; border-radius:6px; padding:12px 16px;">
        <div style="font-weight:700; color:#1a3a7a; margin-bottom:6px;">תנאים והערות</div>
        <div style="font-size:12px; color:#555; white-space:pre-line; line-height:1.8;">${terms}</div>
      </div>
    </td></tr>
    <!-- פוטר -->
    <tr class="summary"><td colspan="6" style="padding:16px 0 0; border:none; text-align:center;">
      <div style="border-top:3px solid #1a3a7a; padding-top:10px;">
        <div style="font-weight:600; color:#1a3a7a;">תודה על אמונכם בנו!</div>
        <div style="font-size:11px; color:#888; margin-top:2px;">050-9281254 | 054-9734747 | argaman.ac@gmail.com</div>
      </div>
    </td></tr>
  </tbody>
</table>

${aboutPage}

</body>
</html>`;
}
