# עדכון חוקי אבטחה ב-Firebase — הוראות

## למה צריך את זה?
Firebase שלח מייל שבעוד יומיים המערכת תיחסם כי החוקים פגי תוקף.
צריך להחליף אותם בחוקים שיעבדו לצמיתות.

## שלבים:

### שלב 1 — כניסה ל-Firebase Console
פתח בדפדפן: https://console.firebase.google.com
(אם צריך — תתחבר עם חשבון Google שמחובר לפרויקט)

### שלב 2 — בחר את הפרויקט
לחץ על **argaman-f3921** (או "ARGAMAN")

### שלב 3 — כנס ל-Firestore
בתפריט השמאלי, לחץ על **Build** ואז על **Firestore Database**

### שלב 4 — עבור ללשונית Rules
למעלה בדף תראה 2 לשוניות: **Data** ו-**Rules**
לחץ על **Rules**

### שלב 5 — החלף את הקוד
תראה תיבת טקסט עם קוד. מחק הכל ותדביק במקום את זה:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### שלב 6 — פרסם
לחץ על כפתור **Publish** (כפתור כחול למעלה מימין)

### סיום
זהו! המערכת תמשיך לעבוד בלי הגבלה.
