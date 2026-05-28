# תיקון PDF הצעת מחיר — מסמך למתכנת

## לינק למערכת
https://argaman-new.vercel.app

## GitHub
https://github.com/talya-debug/argaman-new

## כניסה לבדיקה

| שם | שם משתמש | סיסמה |
|----|----------|-------|
| יניר | yanir | Argaman2026! |
| שי | shai | Argaman2026! |

---

## רקע — מה זה ומה הפלו

המערכת מנהלת הצעות מחיר לחברת מיזוג אוויר. הפלו:
1. נכנסים להצעת מחיר קיימת (דף הצעות מחיר → לחיצה על הצעה)
2. בדף ההצעה יש כפתור "הורד PDF"
3. המערכת בונה HTML, שולחת אותו ל-API שמריץ Puppeteer, ומחזירה PDF להורדה

## שני סוגי הצעות

| סוג | שדה במערכת | מה כולל ב-PDF |
|-----|-----------|---------------|
| **מסחרי** | `quote.quote_type = 'מסחרי'` | הדר חברה + פרטי לקוח + טבלת פריטים + סיכום כספי + תנאים + פוטר |
| **פרטי** | `quote.quote_type = 'פרטי'` | הכל כמו מסחרי + **דף אודות החברה** בעמוד נפרד אחרון |

הבחירה בין מסחרי לפרטי נעשית בדף ההצעה — יש dropdown למעלה.

---

## מה הבעיה

ה-PDF נחתך ולא יציב:
- **שורות טבלה נחתכות** בין עמודים — חצי שורה בתחתית עמוד אחד וחצי בראש הבא
- **הדר (שם חברה) לא חוזר** בעמוד 2+ — עמוד 2 מתחיל ישר עם שורות טבלה בלי שם חברה
- **שוליים** — תוכן צמוד לקצוות
- **פרטי לקוח** — עלולים להיחתך או להיות מוסתרים

---

## ניסיונות שנעשו ולא הצליחו

### ניסיון 1: html2canvas + jsPDF (השיטה המקורית)
- המערכת הישנה השתמשה ב-html2canvas שעושה "צילום מסך" של ה-HTML ומדביק כתמונה לתוך PDF
- **בעיה:** הלוגו מ-URL חיצוני (Supabase) התנפח, טקסט נחתך מצד ימין, Tailwind CSS לא תמיד רונדר נכון ב-html2canvas
- **קבצים:** `QuotePreview.jsx` (HTML), `QuoteDetails.jsx` (handleGeneratePDF)

### ניסיון 2: Puppeteer + HTML string (הנוכחי)
- נבנה API route ב-Vercel (`api/generate-pdf.js`) עם Puppeteer + @sparticuz/chromium
- נבנה `src/lib/quoteHtml.js` שמייצר HTML string עם גופן Heebo, thead חוזר, CSS לשבירת עמודים
- **בעיה:** ה-PDF עדיין נחתך. ככל הנראה ה-CSS של `thead { display: table-header-group }` לא עובד כמצופה ב-Puppeteer, או שהמבנה לא נכון. לא הצלחתי לבדוק את התוצאה מהממשק (אין לי גישה לדפדפן) ולכן לא הצלחתי לדבג

### מה קיים כ-fallback
אם ה-API של Puppeteer נכשל, המערכת חוזרת לשיטה הישנה (html2canvas). הקוד נמצא ב-`handleGeneratePDF` ב-`QuoteDetails.jsx`.

---

## הסקיל שצריך לעבוד לפיו

קובץ: `skill_pdf_stable.md` (מצורף למטה)

### 5 כללים מרכזיים:

**1. הדר חוזר = thead בלבד**
```css
thead { display: table-header-group; }
```
כל מה שצריך לחזור בכל עמוד (שם חברה, קו, כותרות עמודות) — חייב להיות בתוך `<thead>`. לא כ-div מחוץ לטבלה.

**2. סיכום = שורה אחרונה ב-tbody**
```css
tr.summary { break-before: avoid; page-break-before: avoid; break-inside: avoid; }
```
סה"כ, מע"מ, תנאים — הכל בתוך `<tr>` אחרון ב-tbody. לא כ-div נפרד.

**3. שורות לא נחתכות**
```css
tr { page-break-inside: avoid; break-inside: avoid; }
```

**4. עמוד חדש (לדף אודות)**
```css
.page-break { break-before: page; page-break-before: always; }
```

**5. גופן Heebo + waitUntil**
```html
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```
ב-Puppeteer: `waitUntil: 'networkidle0'`

---

## קבצים רלוונטיים

| קובץ | מה הוא עושה | מה צריך לתקן |
|-------|------------|-------------|
| `src/lib/quoteHtml.js` | בונה HTML string של ההצעה | **זה הקובץ העיקרי לתיקון** — המבנה, ה-CSS, ה-thead |
| `api/generate-pdf.js` | Puppeteer API — מקבל HTML ומחזיר PDF | ייתכן שצריך לכוונן margins או הגדרות |
| `src/pages/QuoteDetails.jsx` | handleGeneratePDF — קורא ל-buildQuoteHTML ושולח ל-API | לא צריך לשנות אלא אם משנים את הפלו |
| `src/components/quotes/QuotePreview.jsx` | תצוגה מקדימה בדפדפן (לא PDF) | לא צריך לגעת |

---

## Puppeteer config נוכחי

```javascript
// api/generate-pdf.js
const pdfBuffer = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
});
```

---

## מבנה HTML נוכחי (quoteHtml.js)

```
<html dir="rtl">
  <head>Heebo font + CSS</head>
  <body>
    <table>
      <thead>
        <tr>הדר חברה (שם + תת כותרת + ח.פ)</tr>
        <tr>כותרות עמודות (סעיף, קטגוריה, תיאור, תפוקה, כמות, סה"כ)</tr>
      </thead>
      <tbody>
        <tr>פרטי לקוח + פרטי הצעה (שורה ראשונה)</tr>
        <tr>שורות פריטים...</tr>
        <tr>שורות כותרת (is_header) — שם קטגוריה</tr>
        <tr class="summary">סכום ביניים</tr>
        <tr class="summary">הנחה (אם יש)</tr>
        <tr class="summary">מע"מ</tr>
        <tr class="summary">סה"כ לתשלום</tr>
        <tr class="summary">תנאים והערות</tr>
        <tr class="summary">פוטר</tr>
      </tbody>
    </table>

    <!-- רק בפרטי: -->
    <div class="page-break"></div>
    <div>דף אודות החברה</div>
  </body>
</html>
```

---

## נתוני חברה

```
ארגמן מערכות מיזוג מתקדמות בע"מ
מיזוג אוויר | חימום תת רצפתי | אוורור ופינוי עשן
ח.פ: 516524287 | מספר קבלן: 37992
שבט בנימין 29/4, גבעת זאב
שי ארגמן: 050-9281254 | יניר ארזואן: 054-9734747
argaman.ac@gmail.com | משרד: 077-5625046
```

---

## שדות QuoteLine (כל שורה בטבלה)

```javascript
{
  quote_id: string,          // מזהה ההצעה
  name_snapshot: string,     // שם פריט
  model_snapshot: string,    // דגם
  category_snapshot: string, // קטגוריה (מאייד, מעבה, אביזרים...)
  sub_category_snapshot: string,
  btu_snapshot: number,      // BTU
  price_no_vat_snapshot: number, // מחיר ליחידה ללא מע"מ
  quantity: number,
  line_total: number,        // מחיר × כמות
  clause_number: string,     // מספר סעיף
  order_index: number,       // סדר בטבלה
  is_header: boolean,        // שורת כותרת (שם קטגוריה בלבד, בלי מחיר)
}
```

---

## בדיקות שצריך לעשות

1. **הצעה קצרה (3-5 שורות)** — עמוד אחד, הכל מסודר
2. **הצעה בינונית (10-15 שורות)** — 2 עמודים, הדר חוזר בעמוד 2
3. **הצעה ארוכה (25+ שורות)** — 3+ עמודים, שום שורה לא נחתכת, הדר בכל עמוד
4. **הצעה עם כותרות (is_header)** — שורות כותרת מופיעות נכון
5. **הצעה פרטית** — דף אודות בעמוד נפרד בסוף
6. **הצעה עם הנחה** — שורת הנחה מופיעה בסיכום
7. **RTL** — עברית מימין לשמאל, סימן ₪ במקום הנכון, מספרים תקינים
8. **שוליים** — תוכן לא צמוד לקצוות, מרווח נקי מכל הצדדים

---

## סקיל PDF יציב — כללים מלאים

### CSS בסיסי
```css
* { font-family: 'Heebo', sans-serif; box-sizing: border-box; margin: 0; padding: 0; font-size: 14px; line-height: 1.5; }
body { direction: rtl; }
table { width: 100%; border-collapse: collapse; }
thead { display: table-header-group; }
tr { page-break-inside: avoid; break-inside: avoid; }
.page-break { break-before: page; page-break-before: always; }
```

### בעיות נפוצות ופתרונות

| בעיה | סיבה | פתרון |
|------|------|-------|
| לוגו/הדר לא חוזר בעמוד 2+ | לוגו מחוץ לטבלה | להעביר ל-thead |
| סיכום נקרע מהטבלה | סיכום כ-div נפרד | להעביר לשורה אחרונה ב-tbody |
| שורה נחתכת באמצע | חסר break-inside | להוסיף break-inside:avoid על tr |
| גופן לא נטען | Heebo לא מוטמע | לטעון מ-CDN עם waitUntil:'networkidle0' |
| RTL לא עובד | חסר dir | להוסיף dir="rtl" על html ו-body |

### מקור הסקיל
תיקון מוכח מפרויקט ישי יוסף (מאי 2026). קבצים לרפרנס:
- `src/utils/pdfEngine.js`
- `src/utils/generateQuotePDF.js`
(בפרויקט ישי, לא בארגמן)
