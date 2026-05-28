# מפרט טיוב PDF הצעת מחיר — ארגמן

## מצב נוכחי

### איך זה עובד היום
המערכת מייצרת PDF של הצעת מחיר בשני שלבים:

1. **קומפוננטת QuotePreview** (`src/components/quotes/QuotePreview.jsx`) — מרנדרת HTML של ההצעה בדפדפן (מוסתרת מהמשתמש)
2. **API route** (`api/generate-pdf.js`) — מקבל HTML, מריץ Puppeteer עם @sparticuz/chromium, מחזיר PDF

הפלו בקוד:
```
QuoteDetails.jsx → handleGeneratePDF()
  → buildQuoteHTML() (src/lib/quoteHtml.js) → יוצר HTML string
  → POST /api/generate-pdf → Puppeteer → PDF
  → הורדה לדפדפן
  → אם נכשל → fallback ל-html2canvas + jsPDF (שיטה ישנה)
```

### שני סוגי הצעות

| סוג | quote_type | מה כולל |
|-----|-----------|---------|
| **מסחרי** | `מסחרי` | הדר חברה + פרטי לקוח + טבלת פריטים + סיכום + תנאים + פוטר |
| **פרטי** | `פרטי` | הכל כמו מסחרי + **דף אודות החברה** בעמוד נפרד בסוף |

הבחירה נעשית בדף QuoteDetails בשדה select — מסחרי/פרטי.

---

## הבעיה

ה-PDF נחתך ולא יציב:
- שורות טבלה נחתכות בין עמודים
- הדר (שם חברה) לא חוזר בעמוד 2+
- שוליים לא מספיקים
- פרטי לקוח עלולים להיחתך
- בהצעות ארוכות (20+ שורות) העמודים לא מתחלקים נכון

---

## מה צריך לתקן — לפי הסקיל (skill_pdf_stable.md)

### עקרונות מפתח

#### 1. הדר חוזר = thead בלבד
כל מה שצריך לחזור בראש כל עמוד — שם חברה, קו, כותרות עמודות — חייב להיות בתוך `<thead>`.
```css
thead { display: table-header-group; }
```
**אסור** לשים לוגו/הדר כ-div מחוץ לטבלה — הוא לא יחזור בעמודים הבאים.

#### 2. סיכום/תנאים = שורה אחרונה ב-tbody
```css
tr.summary { break-before: avoid; page-break-before: avoid; break-inside: avoid; }
```
**אסור** לשים סיכום כ-div מחוץ לטבלה — הוא ייקרע מהתוכן.

#### 3. שורות לא נחתכות
```css
tr { page-break-inside: avoid; break-inside: avoid; }
```

#### 4. עמוד חדש (לדף אודות בפרטי)
```css
.page-break { break-before: page; page-break-before: always; }
```

#### 5. גופן Heebo מוטמע
```html
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```
ב-Puppeteer: `waitUntil: 'networkidle0'` כדי לוודא שהגופן נטען.

---

## מבנה HTML נדרש

```html
<html lang="he" dir="rtl">
<head>
  <link href="...Heebo..." rel="stylesheet">
  <style>
    * { font-family: 'Heebo', sans-serif; }
    body { direction: rtl; }
    table { width: 100%; border-collapse: collapse; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    tr.summary { break-before: avoid; }
    .page-break { break-before: page; page-break-before: always; }
  </style>
</head>
<body>

<table>
  <thead>
    <!-- שורה 1: הדר חברה (חוזר בכל עמוד) -->
    <tr>
      <td colspan="6">
        שם חברה + לוגו + קו
      </td>
    </tr>
    <!-- שורה 2: כותרות עמודות (חוזר בכל עמוד) -->
    <tr>
      <th>סעיף</th>
      <th>קטגוריה</th>
      <th>תיאור</th>
      <th>תפוקה</th>
      <th>כמות</th>
      <th>סה"כ</th>
    </tr>
  </thead>
  <tbody>
    <!-- שורה ראשונה: פרטי לקוח + הצעה (מופיע רק בעמוד 1) -->
    <tr>
      <td colspan="6">לכבוד... | מספר הצעה...</td>
    </tr>

    <!-- שורות פריטים -->
    <tr>...</tr>
    <tr>...</tr>

    <!-- שורות כותרת (is_header) -->
    <tr class="header-row">
      <td colspan="6">שם קטגוריה</td>
    </tr>

    <!-- סיכום (break-inside: avoid) -->
    <tr class="summary">סכום ביניים...</tr>
    <tr class="summary">מע"מ...</tr>
    <tr class="summary">סה"כ לתשלום...</tr>

    <!-- תנאים -->
    <tr class="summary">
      <td colspan="6">תנאים והערות...</td>
    </tr>

    <!-- פוטר -->
    <tr class="summary">
      <td colspan="6">תודה + פרטי התקשרות</td>
    </tr>
  </tbody>
</table>

<!-- דף אודות — רק בפרטי -->
<div class="page-break"></div>
<div>תוכן אודות החברה...</div>

</body>
</html>
```

---

## קבצים רלוונטים

| קובץ | תפקיד |
|-------|--------|
| `src/lib/quoteHtml.js` | בונה HTML string להצעה — **זה מה שצריך לתקן** |
| `api/generate-pdf.js` | Puppeteer API route — ייתכן שצריך התאמות שוליים |
| `src/pages/QuoteDetails.jsx` | handleGeneratePDF — קורא ל-buildQuoteHTML ושולח ל-API |
| `src/components/quotes/QuotePreview.jsx` | תצוגה מקדימה בדפדפן (לא משפיע על PDF) |
| `skill_pdf_stable.md` | סקיל עם כל הכללים והדוגמאות |

---

## Puppeteer config (api/generate-pdf.js)

```javascript
const pdfBuffer = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
});
```

ייתכן שצריך לכוונן שוליים. לבדוק עם הצעה של 5 שורות, 15 שורות, ו-30+ שורות.

---

## בדיקות נדרשות

1. **הצעה קצרה (3-5 שורות)** — עמוד אחד, הכל נראה טוב
2. **הצעה בינונית (10-15 שורות)** — 2 עמודים, הדר חוזר בעמוד 2
3. **הצעה ארוכה (25+ שורות)** — 3+ עמודים, שום שורה לא נחתכת
4. **הצעה עם כותרות (is_header)** — כותרות קטגוריה מופיעות נכון
5. **הצעה פרטית** — דף אודות בעמוד נפרד בסוף
6. **הצעה עם הנחה** — שורת הנחה מופיעה בסיכום
7. **RTL** — כל הטקסט מימין לשמאל, מספרים תקינים

---

## נתוני חברה להדר

```
ארגמן מערכות מיזוג מתקדמות בע"מ
מיזוג אוויר | חימום תת רצפתי | אוורור ופינוי עשן
ח.פ: 516524287 | מספר קבלן: 37992
שבט בנימין 29/4, גבעת זאב
שי ארגמן: 050-9281254 | יניר ארזואן: 054-9734747
argaman.ac@gmail.com
```

---

## תוכן דף אודות (להצעה פרטית)

קיים בתוך `buildQuoteHTML` בקובץ `src/lib/quoteHtml.js` — משתנה `aboutPage`.
כולל: הדר, כותרת "אודות", 4 פסקאות על החברה, רשימת שירותים, פוטר עם פרטי התקשרות.
