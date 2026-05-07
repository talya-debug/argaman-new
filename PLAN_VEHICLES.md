# מודול רכבים — ארכיטקטורה

## ישות: Vehicle (Firestore collection: vehicles)

| שדה | סוג | הסבר |
|------|------|-------|
| license_plate | string | מספר רכב |
| vehicle_type | string | סוג (משאית/טנדר/רכב/קטנוע) |
| brand | string | יצרן (טויוטה, פורד וכו') |
| model | string | דגם |
| year | number | שנת ייצור |
| color | string | צבע |
| assigned_to | string | שם העובד האחראי |
| current_km | number | קילומטראז' נוכחי |
| test_expiry | date | תוקף טסט |
| insurance_expiry | date | תוקף ביטוח |
| next_oil_change_km | number | קילומטראז' להחלפת שמן הבאה |
| next_service_date | date | תאריך טיפול תקופתי הבא |
| status | string | פעיל / בטיפול / לא פעיל |
| notes | string | הערות |
| image_url | string | תמונה (אופציונלי) |

## ישות: VehicleExpense (Firestore collection: vehicle_expenses)

| שדה | סוג | הסבר |
|------|------|-------|
| vehicle_id | string | מזהה רכב |
| expense_type | string | דלק / טיפול / ביטוח / טסט / קנס / אחר |
| amount | number | סכום |
| date | date | תאריך |
| km_at_expense | number | קילומטראז' ברגע ההוצאה |
| description | string | תיאור |
| receipt_url | string | קובץ קבלה (אופציונלי) |

## ישות: VehicleDocument (Firestore collection: vehicle_documents)

| שדה | סוג | הסבר |
|------|------|-------|
| vehicle_id | string | מזהה רכב |
| doc_type | string | רישיון רכב / ביטוח / טסט / חוזה ליסינג / אחר |
| title | string | שם המסמך |
| file_url | string | קישור לקובץ ב-Storage |
| file_name | string | שם הקובץ המקורי |
| expiry_date | date | תאריך תפוגה (אם רלוונטי) |
| upload_date | date | תאריך העלאה |
| notes | string | הערות |

## מסכים

### 1. דף ראשי — רשימת רכבים
- כרטיסי סיכום: סה"כ רכבים, טסט שפג/עומד לפוג, ביטוח שפג/עומד לפוג
- טבלה: מספר רכב, סוג, שיוך עובד, קילומטראז', סטטוס טסט, סטטוס ביטוח
- התראות: רכבים שטסט/ביטוח פג או יפוג ב-30 יום הקרובים
- כפתור הוספת רכב

### 2. דיאלוג הוספה/עריכה
- כל השדות של Vehicle
- שמירה ישירה ל-Firestore

### 3. הוצאות רכב (בתוך כל רכב)
- לחיצה על רכב → רואים היסטוריית הוצאות
- הוספת הוצאה (דלק, טיפול, ביטוח, טסט, קנס)
- סיכום הוצאות חודשי

## ניווט
- כפתור חדש בסיידבר: "רכבים" עם אייקון Car

## התראות
- טסט פג → התראה אדומה
- טסט יפוג ב-30 יום → התראה כתומה
- ביטוח פג → התראה אדומה
- ביטוח יפוג ב-30 יום → התראה כתומה
- הגיע זמן החלפת שמן (לפי ק"מ) → התראה
